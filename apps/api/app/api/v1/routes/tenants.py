from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_tenant
from app.core.security import current_claims
from app.db.session import engine, user_session
from app.schemas.identity import OrganizationRead, TenantRead

router = APIRouter()
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


@router.get("", response_model=list[TenantRead])
async def list_tenants(
    claims: dict = claims_dependency, session: AsyncSession = session_dependency
) -> list[TenantRead]:
    result = await session.execute(
        text("""
            select t.id,t.name,t.slug,t.status,m.status as membership_status
            from public.tenants t join public.memberships m on m.tenant_id=t.id
            where m.user_id=:user_id and m.status='active' and t.status='active'
            order by t.name
        """),
        {"user_id": UUID(claims["sub"])},
    )
    return [TenantRead(**dict(row)) for row in result.mappings().all()]


@router.get("/{tenant_id}/organizations", response_model=list[OrganizationRead])
async def list_organizations(
    tenant_id: UUID, claims: dict = claims_dependency, session: AsyncSession = session_dependency
) -> list[OrganizationRead]:
    context = await authorize_tenant(
        session, user_id=UUID(claims["sub"]), tenant_id=tenant_id,
        permission_key="corporate.organization.read",
        platform_permission="platform.tenants.read", aal=claims.get("aal"),
    )
    query = text("""
        select id,tenant_id,parent_id,name,slug,organization_type,status
        from public.organizations
        where tenant_id=:tenant_id and status='active'
          and (:organization_id is null or id=:organization_id)
        order by name
    """)
    params = {
        "tenant_id": tenant_id,
        "organization_id": context.organization_id if context else None,
    }
    if context is None:
        async with engine.connect() as connection:
            result = await connection.execute(query, params)
    else:
        result = await session.execute(query, params)
    return [OrganizationRead(**dict(row)) for row in result.mappings().all()]
