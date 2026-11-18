from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_action
from app.core.pagination import PageMeta, PageResponse, decode_time_id_cursor, encode_time_id_cursor
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter()
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None) or request.headers.get("x-request-id")


@router.get("", response_model=PageResponse)
async def list_tenants(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    params = {"user_id": UUID(claims["sub"]), "limit": limit + 1}
    cursor_clause = ""
    if cursor:
        created_at, tenant_id = decode_time_id_cursor(cursor)
        cursor_clause = "and (t.created_at,t.id) < (:cursor_created_at,:cursor_id)"
        params.update({"cursor_created_at": created_at, "cursor_id": tenant_id})
    result = await session.execute(
        text(f"""
            select t.id,t.name,t.slug,t.status,'active'::text as membership_status,t.created_at
            from public.tenants t
            where t.status='active'
              and exists (
                select 1 from public.memberships m
                where m.tenant_id=t.id and m.user_id=:user_id and m.status='active'
              )
              {cursor_clause}
            order by t.created_at desc,t.id desc
            limit :limit
        """),
        params,
    )
    rows = [dict(row) for row in result.mappings().all()]
    has_more = len(rows) > limit
    rows = rows[:limit]
    return PageResponse(
        data=rows,
        meta=PageMeta(
            has_more=has_more,
            next_cursor=encode_time_id_cursor(rows[-1]["created_at"], rows[-1]["id"])
            if has_more and rows
            else None,
            request_id=_request_id(request),
        ),
    )


@router.get("/{tenant_id}/organizations", response_model=PageResponse)
async def list_organizations(
    tenant_id: UUID,
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    context, _ = await authorize_action(
        session,
        user_id=UUID(claims["sub"]),
        tenant_id=tenant_id,
        permission_key="corporate.organization.read",
        platform_permission="platform.tenants.read",
        aal=claims.get("aal"),
        resource_type="corporate.organization",
        action="read",
        resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
    )
    params = {
        "tenant_id": tenant_id,
        "organization_id": context.organization_id if context else None,
        "limit": limit + 1,
    }
    cursor_clause = ""
    if cursor:
        created_at, organization_id = decode_time_id_cursor(cursor)
        cursor_clause = "and (created_at,id) < (:cursor_created_at,:cursor_id)"
        params.update({"cursor_created_at": created_at, "cursor_id": organization_id})
    query = text(f"""
        select id,tenant_id,parent_id,name,slug,organization_type,status,created_at
        from public.organizations
        where tenant_id=:tenant_id and status='active'
          and (:organization_id is null or id=:organization_id)
          {cursor_clause}
        order by created_at desc,id desc
        limit :limit
    """)
    if context is None:
        async with engine.connect() as connection:
            result = await connection.execute(query, params)
    else:
        result = await session.execute(query, params)
    rows = [dict(row) for row in result.mappings().all()]
    has_more = len(rows) > limit
    rows = rows[:limit]
    return PageResponse(
        data=rows,
        meta=PageMeta(
            has_more=has_more,
            next_cursor=encode_time_id_cursor(rows[-1]["created_at"], rows[-1]["id"])
            if has_more and rows
            else None,
            request_id=_request_id(request),
        ),
    )
