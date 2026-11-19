from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_action, authorize_object
from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.core.pagination import PageMeta, PageResponse, decode_time_id_cursor, encode_time_id_cursor
from app.core.redaction import redact_audit_value
from app.core.security import current_claims
from app.db.session import engine
from app.services.contract_entitlement_service import assert_membership_entitlement_capacity, user_session
from app.services.tenant_structure_service import ensure_tenant_owner_retained
from app.services.tenant_structure_service import (
    set_organization_unit_status as set_organization_unit_status_service,
)
from app.services.tenant_structure_service import (
    update_organization_unit as update_organization_unit_service,
)

router = APIRouter()


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None) or request.headers.get("x-request-id")


claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


class HierarchyOrganizationRead(BaseModel):
    id: UUID
    tenant_id: UUID
    parent_id: UUID | None
    name: str
    slug: str
    organization_type: str
    status: str


class HierarchyUnitRead(BaseModel):
    id: UUID
    tenant_id: UUID
    organization_id: UUID
    parent_unit_id: UUID | None
    name: str
    code: str
    unit_type: str
    status: str


class HierarchyBranchRead(BaseModel):
    id: UUID
    tenant_id: UUID
    organization_id: UUID
    organization_unit_id: UUID | None
    name: str
    code: str
    status: str


class HierarchyDepartmentRead(BaseModel):
    id: UUID
    tenant_id: UUID
    organization_id: UUID
    branch_id: UUID | None
    parent_department_id: UUID | None
    name: str
    code: str
    status: str


class WorkforceTenantContextRead(BaseModel):
    tenant_id: UUID
    membership_id: UUID | None
    organization_id: UUID | None
    organization_unit_id: UUID | None
    branch_id: UUID | None
    department_id: UUID | None
    role_keys: list[str]
    permissions: list[str]
    organizations: list[HierarchyOrganizationRead]
    organization_units: list[HierarchyUnitRead]
    branches: list[HierarchyBranchRead]
    departments: list[HierarchyDepartmentRead]


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=80,
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    status: str | None = Field(default=None, pattern="^(active|inactive|archived)$")
    organization_type: str | None = Field(
        default=None, pattern="^(company|division|department|branch|team)$"
    )


class OrganizationUnitCreate(BaseModel):
    organization_id: UUID
    parent_unit_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")
    unit_type: str = Field(pattern="^(division|unit|team|cost_center)$")


class OrganizationUnitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=40,
        pattern="^[A-Z0-9][A-Z0-9_-]*$",
    )
    parent_unit_id: UUID | None = None
    unit_type: str | None = Field(default=None, pattern="^(division|unit|team|cost_center)$")
    status: str | None = Field(default=None, pattern="^(active|inactive)$")


class BranchCreate(BaseModel):
    organization_id: UUID
    organization_unit_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")


class DepartmentCreate(BaseModel):
    organization_id: UUID
    branch_id: UUID | None = None
    parent_department_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$")


class MembershipAssignmentUpdate(BaseModel):
    organization_id: UUID | None
    organization_unit_id: UUID | None
    branch_id: UUID | None
    department_id: UUID | None


class MembershipAssignmentRead(BaseModel):
    id: UUID
    tenant_id: UUID
    user_id: UUID
    organization_id: UUID | None
    organization_unit_id: UUID | None
    branch_id: UUID | None
    department_id: UUID | None
    status: str


class MembershipRoleAssign(BaseModel):
    role_key: str = Field(min_length=2, max_length=80)
    scope_type: str = Field(
        default="tenant",
        pattern="^(tenant|organization|organization_unit|branch|department)$",
    )
    scope_id: UUID | None = None
    valid_until: datetime | None = None


async def _authorize(
    session: AsyncSession,
    claims: dict,
    tenant_id: UUID,
    permission: str,
    platform_permission: str,
):
    resource_type, action = permission.rsplit(".", 1)
    context, _ = await authorize_action(
        session,
        user_id=UUID(claims["sub"]),
        tenant_id=tenant_id,
        permission_key=permission,
        platform_permission=platform_permission,
        aal=claims.get("aal"),
        resource_type=resource_type,
        action=action,
        resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
    )
    return context


async def _reserve_command(
    connection,
    request: Request,
    actor: UUID,
    tenant_id: UUID,
    command_key: str,
    payload: dict,
):
    reservation = await reserve_idempotency(
        connection,
        actor_user_id=actor,
        tenant_id=tenant_id,
        command_key=command_key,
        idempotency_key=request.headers.get("idempotency-key"),
        payload=payload,
    )
    if reservation.replay:
        return JSONResponse(
            status_code=reservation.replay_status or 200,
            content=reservation.replay_body or {},
        )
    return reservation


async def _audit(
    connection,
    request: Request,
    actor: UUID,
    tenant_id: UUID,
    action: str,
    resource_type: str,
    resource_id: UUID,
    metadata: dict | None = None,
):
    import json

    await connection.execute(
        text("""
            insert into public.audit_logs(
              tenant_id,actor_user_id,action,resource_type,resource_id,request_id,
              ip_address,user_agent,metadata
            ) values (
              :tenant_id,:actor,:action,:resource_type,:resource_id,:request_id,
              :ip,:user_agent,cast(:metadata as jsonb)
            )
        """),
        {
            "tenant_id": tenant_id,
            "actor": actor,
            "action": action,
            "resource_type": resource_type,
            "resource_id": str(resource_id),
            "request_id": _request_id(request),
            "ip": None,
            "user_agent": None,
            "metadata": json.dumps(
                redact_audit_value(
                    {
                        **(metadata or {}),
                        "correlation_id": getattr(request.state, "correlation_id", None),
                        "trace_id": getattr(request.state, "trace_id", None),
                    }
                ),
                default=str,
            ),
        },
    )


@router.get("/{tenant_id}", tags=["Tenants"])
async def read_tenant(
    tenant_id: UUID, claims: dict = claims_dependency, session: AsyncSession = session_dependency
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    query = text("""
        select id,name,slug,tenant_type,status,default_timezone,default_currency,
               created_at,updated_at
        from public.tenants where id=:tenant_id
    """)
    if context is None:
        async with engine.connect() as connection:
            result = await connection.execute(query, {"tenant_id": tenant_id})
    else:
        result = await session.execute(query, {"tenant_id": tenant_id})
    row = result.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
    return dict(row)


@router.patch("/{tenant_id}/organizations/{organization_id}", tags=["Organization"])
async def update_organization(
    tenant_id: UUID,
    organization_id: UUID,
    payload: OrganizationUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="Tidak ada perubahan yang dikirim.")
    if values.get("slug") and not values["slug"].islower():
        raise HTTPException(status_code=422, detail="Slug organisasi harus huruf kecil.")
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            f"organization.update:{organization_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        current = await connection.execute(
            text("""
                select id,tenant_id,parent_id from public.organizations
                where id=:organization_id and tenant_id=:tenant_id for update
            """),
            {"organization_id": organization_id, "tenant_id": tenant_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Organization tidak ditemukan.")
        if context is not None:
            authorize_object(context, resource_tenant_id=tenant_id, organization_id=organization_id)
        if "parent_id" in values and values["parent_id"] is not None:
            parent_check = await connection.execute(
                text("""
                    with recursive ancestors(id,parent_id) as (
                      select id,parent_id from public.organizations
                      where id=:parent_id and tenant_id=:tenant_id and status='active'
                      union
                      select o.id,o.parent_id from public.organizations o
                      join ancestors a on o.id=a.parent_id
                      where o.tenant_id=:tenant_id
                    )
                    select
                      exists(select 1 from ancestors where id=:organization_id) as cycle,
                      exists(select 1 from ancestors where id=:parent_id) as parent_exists
                """),
                {
                    "parent_id": values["parent_id"],
                    "tenant_id": tenant_id,
                    "organization_id": organization_id,
                },
            )
            parent_state = parent_check.mappings().one()
            if not parent_state["parent_exists"]:
                raise HTTPException(status_code=404, detail="Active parent organization not found.")
            if parent_state["cycle"]:
                raise HTTPException(
                    status_code=409,
                    detail="Organization parent change would create a hierarchy cycle.",
                )
        if values.get("status") == "archived":
            dependencies = await connection.execute(
                text("""
                    select
                      exists(select 1 from public.organization_units
                        where tenant_id=:tenant_id and organization_id=:organization_id
                          and status='active')
                      or exists(select 1 from public.branches
                        where tenant_id=:tenant_id and organization_id=:organization_id
                          and status='active')
                      or exists(select 1 from public.departments
                        where tenant_id=:tenant_id and organization_id=:organization_id
                          and status='active')
                      or exists(select 1 from public.memberships
                        where tenant_id=:tenant_id and organization_id=:organization_id
                          and status in ('active','invited','suspended'))
                """),
                {"tenant_id": tenant_id, "organization_id": organization_id},
            )
            if dependencies.scalar_one():
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Archive active organization units, branches, departments and "
                        "memberships before archiving this organization."
                    ),
                )
        assignments = ", ".join(f"{key}=:{key}" for key in values)
        result = await connection.execute(
            text(f"""
                update public.organizations
                set {assignments},updated_at=now()
                where id=:organization_id and tenant_id=:tenant_id
                returning id,tenant_id,parent_id,name,slug,organization_type,status,updated_at
            """),
            {**values, "organization_id": organization_id, "tenant_id": tenant_id},
        )
        updated = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            "organization.updated",
            "organization",
            organization_id,
            values,
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=updated,
        )
    return updated


@router.get("/{tenant_id}/organization-units", tags=["Organization"], response_model=PageResponse)
async def list_organization_units(
    tenant_id: UUID,
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    include_archived: bool = Query(default=False),
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    if include_archived:
        await _authorize(
            session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
        )
    params = {
        "tenant_id": tenant_id,
        "include_archived": include_archived,
        "organization_id": context.organization_id if context else None,
        "organization_unit_id": context.organization_unit_id if context else None,
        "branch_id": context.branch_id if context else None,
        "limit": limit + 1,
    }
    cursor_clause = ""
    if cursor:
        created_at, row_id = decode_time_id_cursor(cursor)
        cursor_clause = "and (created_at,id) < (:cursor_created_at,:cursor_id)"
        params.update({"cursor_created_at": created_at, "cursor_id": row_id})
    query = text(f"""
        select id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status,
               created_at,updated_at
        from public.organization_units
        where tenant_id=:tenant_id and (:include_archived or status='active')
          and (:organization_id is null or organization_id=:organization_id)
          and (:organization_unit_id is null or id=:organization_unit_id)
          and (:branch_id is null or id in (
            select organization_unit_id from public.branches
            where tenant_id=:tenant_id and id=:branch_id
              and organization_unit_id is not null
          ))
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


@router.post(
    "/{tenant_id}/organization-units",
    status_code=status.HTTP_201_CREATED,
    tags=["Organization"],
)
async def create_organization_unit(
    tenant_id: UUID,
    payload: OrganizationUnitCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        organization = await connection.execute(
            text("""
                select 1 from public.organizations
                where id=:organization_id and tenant_id=:tenant_id and status='active'
            """),
            {"organization_id": payload.organization_id, "tenant_id": tenant_id},
        )
        if organization.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=409,
                detail="Organization harus aktif sebelum membuat organization unit.",
            )
        if payload.parent_unit_id is not None:
            parent = await connection.execute(
                text("""
                    select 1 from public.organization_units
                    where id=:parent_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "parent_id": payload.parent_unit_id,
                    "tenant_id": tenant_id,
                    "organization_id": payload.organization_id,
                },
            )
            if parent.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Parent organization unit tidak aktif atau berada di luar organisasi.",
                )
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=payload.organization_id,
                organization_unit_id=payload.parent_unit_id,
            )
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"organization_unit.create:{tenant_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        result = await connection.execute(
            text("""
                insert into public.organization_units(
                  tenant_id,organization_id,parent_unit_id,name,code,unit_type,created_by,updated_by
                ) values (
                  :tenant_id,:organization_id,:parent_unit_id,:name,:code,:unit_type,:actor,:actor
                )
                returning id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status,
                          created_at,updated_at
            """),
            {"tenant_id": tenant_id, **payload.model_dump(), "actor": actor},
        )
        row = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "organization_unit.created",
            "organization_unit",
            row["id"],
            {"code": payload.code},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=row,
        )
    return row


@router.get("/{tenant_id}/branches", tags=["Organization"], response_model=PageResponse)
async def list_branches(
    tenant_id: UUID,
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    include_archived: bool = Query(default=False),
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    if include_archived:
        await _authorize(
            session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
        )
    params = {
        "tenant_id": tenant_id,
        "include_archived": include_archived,
        "organization_id": context.organization_id if context else None,
        "organization_unit_id": context.organization_unit_id if context else None,
        "branch_id": context.branch_id if context else None,
        "limit": limit + 1,
    }
    cursor_clause = ""
    if cursor:
        created_at, row_id = decode_time_id_cursor(cursor)
        cursor_clause = "and (created_at,id) < (:cursor_created_at,:cursor_id)"
        params.update({"cursor_created_at": created_at, "cursor_id": row_id})
    query = text(f"""
        select id,tenant_id,organization_id,organization_unit_id,name,code,status,
               created_at,updated_at
        from public.branches where tenant_id=:tenant_id and (:include_archived or status='active')
          and (:organization_id is null or organization_id=:organization_id)
          and (:organization_unit_id is null or organization_unit_id=:organization_unit_id)
          and (:branch_id is null or id=:branch_id)
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


@router.post("/{tenant_id}/branches", status_code=status.HTTP_201_CREATED, tags=["Organization"])
async def create_branch(
    tenant_id: UUID,
    payload: BranchCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    if context is not None:
        authorize_object(
            context,
            resource_tenant_id=tenant_id,
            organization_id=payload.organization_id,
            organization_unit_id=payload.organization_unit_id,
        )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        if payload.organization_unit_id is not None:
            unit = await connection.execute(
                text("""
                    select 1 from public.organization_units
                    where id=:unit_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "unit_id": payload.organization_unit_id,
                    "tenant_id": tenant_id,
                    "organization_id": payload.organization_id,
                },
            )
            if unit.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Active organization unit not found in this branch scope.",
                )
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"branch.create:{tenant_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        result = await connection.execute(
            text("""
                insert into public.branches(
                  tenant_id,organization_id,organization_unit_id,name,code,created_by,updated_by
                ) values (
                  :tenant_id,:organization_id,:organization_unit_id,:name,:code,:actor,:actor
                )
                returning id,tenant_id,organization_id,organization_unit_id,name,code,status,
                          created_at,updated_at
            """),
            {"tenant_id": tenant_id, **payload.model_dump(), "actor": actor},
        )
        row = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "branch.created",
            "branch",
            row["id"],
            {"code": payload.code},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=row,
        )
    return row


@router.get("/{tenant_id}/departments", tags=["Organization"], response_model=PageResponse)
async def list_departments(
    tenant_id: UUID,
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    include_archived: bool = Query(default=False),
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.read", "platform.tenants.read"
    )
    if include_archived:
        await _authorize(
            session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
        )
    params = {
        "tenant_id": tenant_id,
        "include_archived": include_archived,
        "organization_id": context.organization_id if context else None,
        "organization_unit_id": context.organization_unit_id if context else None,
        "branch_id": context.branch_id if context else None,
        "department_id": context.department_id if context else None,
        "limit": limit + 1,
    }
    cursor_clause = ""
    if cursor:
        created_at, row_id = decode_time_id_cursor(cursor)
        cursor_clause = "and (created_at,id) < (:cursor_created_at,:cursor_id)"
        params.update({"cursor_created_at": created_at, "cursor_id": row_id})
    query = text(f"""
        select id,tenant_id,organization_id,branch_id,parent_department_id,name,code,status,
               created_at,updated_at
        from public.departments
        where tenant_id=:tenant_id and (:include_archived or status='active')
          and (:organization_id is null or organization_id=:organization_id)
          and (
            :organization_unit_id is null
            or exists (
              select 1 from public.branches b
              where b.id=departments.branch_id and b.tenant_id=:tenant_id
                and b.organization_unit_id=:organization_unit_id
            )
          )
          and (:branch_id is null or branch_id=:branch_id)
          and (:department_id is null or id=:department_id)
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


@router.post("/{tenant_id}/departments", status_code=status.HTTP_201_CREATED, tags=["Organization"])
async def create_department(
    tenant_id: UUID,
    payload: DepartmentCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        branch_organization_unit_id = None
        if payload.branch_id is not None:
            branch = await connection.execute(
                text("""
                    select organization_unit_id from public.branches
                    where id=:branch_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "branch_id": payload.branch_id,
                    "tenant_id": tenant_id,
                    "organization_id": payload.organization_id,
                },
            )
            branch_row = branch.mappings().first()
            if branch_row is None:
                raise HTTPException(
                    status_code=404,
                    detail="Active branch not found in this organization.",
                )
            branch_organization_unit_id = branch_row["organization_unit_id"]
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=payload.organization_id,
                organization_unit_id=branch_organization_unit_id,
                branch_id=payload.branch_id,
            )
        if payload.parent_department_id is not None:
            parent = await connection.execute(
                text("""
                    select branch_id from public.departments
                    where id=:parent_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "parent_id": payload.parent_department_id,
                    "tenant_id": tenant_id,
                    "organization_id": payload.organization_id,
                },
            )
            parent_row = parent.mappings().first()
            if parent_row is None or parent_row["branch_id"] != payload.branch_id:
                raise HTTPException(
                    status_code=404,
                    detail="Parent department is outside the active branch hierarchy.",
                )
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"department.create:{tenant_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        result = await connection.execute(
            text("""
                insert into public.departments(
                  tenant_id,organization_id,branch_id,parent_department_id,
                  name,code,created_by,updated_by
                ) values (
                  :tenant_id,:organization_id,:branch_id,:parent_department_id,
                  :name,:code,:actor,:actor
                )
                returning id,tenant_id,organization_id,branch_id,parent_department_id,
                          name,code,status,
                          created_at,updated_at
            """),
            {"tenant_id": tenant_id, **payload.model_dump(), "actor": actor},
        )
        row = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "department.created",
            "department",
            row["id"],
            {"code": payload.code},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=row,
        )
    return row


@router.post(
    "/{tenant_id}/memberships/{membership_id}/accept",
    status_code=status.HTTP_200_OK,
    tags=["Membership"],
)
async def accept_membership(
    tenant_id: UUID,
    membership_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
):
    user_id = UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            user_id,
            tenant_id,
            f"membership.accept:{membership_id}",
            {},
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        result = await connection.execute(
            text("""
                select m.id,m.status,m.invitation_expires_at,t.status as tenant_status,
                       u.email_confirmed_at
                from public.memberships m
                join public.tenants t on t.id=m.tenant_id
                join auth.users u on u.id=m.user_id
                where m.id=:membership_id and m.tenant_id=:tenant_id and m.user_id=:user_id
                for update of m
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id, "user_id": user_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Undangan tidak ditemukan.")
        if row["status"] != "invited" or row["tenant_status"] != "active":
            raise HTTPException(status_code=409, detail="Undangan tidak dapat diaktifkan.")
        if row["email_confirmed_at"] is None:
            raise HTTPException(status_code=403, detail="Verifikasi email wajib diselesaikan.")
        if row["invitation_expires_at"] and row["invitation_expires_at"] <= datetime.now(UTC):
            raise HTTPException(status_code=410, detail="Undangan telah kedaluwarsa.")
        hierarchy = await connection.execute(
            text("""
                select
                  (m.organization_id is null or exists(
                    select 1 from public.organizations o
                    where o.id=m.organization_id and o.tenant_id=m.tenant_id
                      and o.status='active'
                  )) as organization_active,
                  (m.organization_unit_id is null or exists(
                    select 1 from public.organization_units u
                    where u.id=m.organization_unit_id and u.tenant_id=m.tenant_id
                      and u.organization_id=m.organization_id and u.status='active'
                  )) as unit_active,
                  (m.branch_id is null or exists(
                    select 1 from public.branches b
                    where b.id=m.branch_id and b.tenant_id=m.tenant_id
                      and b.organization_id=m.organization_id and b.status='active'
                  )) as branch_active,
                  (m.department_id is null or exists(
                    select 1 from public.departments d
                    where d.id=m.department_id and d.tenant_id=m.tenant_id
                      and d.organization_id=m.organization_id and d.branch_id=m.branch_id
                      and d.status='active'
                  )) as department_active
                from public.memberships m
                where m.id=:membership_id and m.tenant_id=:tenant_id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        hierarchy_state = hierarchy.mappings().one()
        if not all(hierarchy_state.values()):
            raise HTTPException(
                status_code=409,
                detail="Membership hierarchy scope is inactive; request a new invitation.",
            )
        updated = await connection.execute(
            text("""
                update public.memberships
                set status='active',joined_at=coalesce(joined_at,now()),
                    accepted_at=now(),updated_at=now()
                where id=:membership_id
                returning id,tenant_id,user_id,status,joined_at,accepted_at
            """),
            {"membership_id": membership_id},
        )
        accepted = dict(updated.mappings().one())
        await _audit(
            connection,
            request,
            user_id,
            tenant_id,
            "membership.accepted",
            "membership",
            membership_id,
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=accepted,
        )
    return accepted


@router.post(
    "/{tenant_id}/memberships/{membership_id}/suspend",
    status_code=status.HTTP_200_OK,
    tags=["Membership"],
)
async def suspend_membership(
    tenant_id: UUID,
    membership_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"membership.suspend:{membership_id}",
            {},
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        target_result = await connection.execute(
            text("""
                select organization_id,organization_unit_id,branch_id,department_id
                from public.memberships where id=:membership_id and tenant_id=:tenant_id
                for update
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = target_result.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        await ensure_tenant_owner_retained(
            connection, tenant_id=tenant_id, membership_id=membership_id
        )
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        result = await connection.execute(
            text("""
                update public.memberships set status='suspended',updated_at=now()
                where id=:membership_id and tenant_id=:tenant_id and status='active'
                returning id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Membership aktif tidak ditemukan.")
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "membership.suspended",
            "membership",
            membership_id,
        )
        response_body = {"id": str(membership_id), "status": "suspended"}
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.post(
    "/{tenant_id}/memberships/{membership_id}/revoke",
    status_code=status.HTTP_200_OK,
    tags=["Membership"],
)
async def revoke_membership(
    tenant_id: UUID,
    membership_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"membership.revoke:{membership_id}",
            {},
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        target_result = await connection.execute(
            text("""
                select organization_id,organization_unit_id,branch_id,department_id
                from public.memberships where id=:membership_id and tenant_id=:tenant_id
                for update
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = target_result.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        await ensure_tenant_owner_retained(
            connection, tenant_id=tenant_id, membership_id=membership_id
        )
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        result = await connection.execute(
            text("""
                update public.memberships
                set status='revoked',ended_at=now(),updated_at=now()
                where id=:membership_id and tenant_id=:tenant_id
                  and status in ('active','invited','suspended')
                returning id,user_id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        revoked = result.mappings().first()
        if revoked is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        await _audit(
            connection, request, actor, tenant_id, "membership.revoked", "membership", membership_id
        )
        response_body = {"id": str(membership_id), "status": "revoked"}
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.patch(
    "/{tenant_id}/memberships/{membership_id}/assignment",
    response_model=MembershipAssignmentRead,
    tags=["Membership"],
)
async def reassign_membership_hierarchy(
    tenant_id: UUID,
    membership_id: UUID,
    payload: MembershipAssignmentUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    actor = UUID(claims["sub"])
    organization_id = payload.organization_id
    organization_unit_id = payload.organization_unit_id
    branch_id = payload.branch_id
    department_id = payload.department_id

    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"membership.assignment.reassign:{membership_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        current_result = await connection.execute(
            text("""
                select id,user_id,status,organization_id,organization_unit_id,
                       branch_id,department_id
                from public.memberships
                where id=:membership_id and tenant_id=:tenant_id
                for update
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        current = current_result.mappings().first()
        if current is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        if current["status"] == "revoked":
            raise HTTPException(
                status_code=409, detail="Membership revoked tidak dapat dipindahkan."
            )
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=current["organization_id"],
                organization_unit_id=current["organization_unit_id"],
                branch_id=current["branch_id"],
                department_id=current["department_id"],
            )

        if organization_id is not None:
            organization = await connection.execute(
                text("""
                    select id from public.organizations
                    where id=:id and tenant_id=:tenant_id and status='active'
                """),
                {"id": organization_id, "tenant_id": tenant_id},
            )
            if organization.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Organization aktif tidak ditemukan.")
        if organization_unit_id is not None:
            if organization_id is None:
                raise HTTPException(status_code=422, detail="Organization diperlukan untuk unit.")
            unit = await connection.execute(
                text("""
                    select id from public.organization_units
                    where id=:id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "id": organization_unit_id,
                    "tenant_id": tenant_id,
                    "organization_id": organization_id,
                },
            )
            if unit.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Organization unit di luar tenant.")
        if branch_id is not None:
            if organization_id is None:
                raise HTTPException(status_code=422, detail="Organization diperlukan untuk branch.")
            branch = await connection.execute(
                text("""
                    select organization_unit_id from public.branches
                    where id=:id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {"id": branch_id, "tenant_id": tenant_id, "organization_id": organization_id},
            )
            branch_row = branch.mappings().first()
            if branch_row is None:
                raise HTTPException(status_code=404, detail="Branch aktif tidak ditemukan.")
            if branch_row["organization_unit_id"] is not None:
                if organization_unit_id != branch_row["organization_unit_id"]:
                    raise HTTPException(
                        status_code=422,
                        detail="Branch harus berada pada organization unit yang dipilih.",
                    )
        if department_id is not None:
            if organization_id is None:
                raise HTTPException(
                    status_code=422, detail="Organization diperlukan untuk department."
                )
            department = await connection.execute(
                text("""
                    select id from public.departments
                    where id=:id and tenant_id=:tenant_id
                      and organization_id=:organization_id
                      and branch_id is not distinct from :branch_id
                      and status='active'
                """),
                {
                    "id": department_id,
                    "tenant_id": tenant_id,
                    "organization_id": organization_id,
                    "branch_id": branch_id,
                },
            )
            if department.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Department di luar branch terpilih.")

        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=organization_id,
                organization_unit_id=organization_unit_id,
                branch_id=branch_id,
                department_id=department_id,
            )

        scoped_roles = await connection.execute(
            text("""
                select scope_type,scope_id from public.membership_roles
                where membership_id=:membership_id
            """),
            {"membership_id": membership_id},
        )
        new_scopes = {
            "tenant": None,
            "organization": organization_id,
            "organization_unit": organization_unit_id,
            "branch": branch_id,
            "department": department_id,
        }
        for role_scope in scoped_roles.mappings().all():
            scope_type = role_scope["scope_type"]
            if scope_type not in new_scopes:
                raise HTTPException(
                    status_code=409,
                    detail="Membership memiliki role dengan scope yang tidak dikenal.",
                )
            if scope_type != "tenant" and new_scopes[scope_type] is None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"Role scope {scope_type} harus dihapus atau diganti sebelum reassignment."
                    ),
                )

        await connection.execute(
            text("""
                update public.memberships
                set organization_id=:organization_id,
                    organization_unit_id=:organization_unit_id,
                    branch_id=:branch_id,
                    department_id=:department_id,
                    updated_at=now()
                where id=:membership_id and tenant_id=:tenant_id
            """),
            {
                "organization_id": organization_id,
                "organization_unit_id": organization_unit_id,
                "branch_id": branch_id,
                "department_id": department_id,
                "membership_id": membership_id,
                "tenant_id": tenant_id,
            },
        )
        await connection.execute(
            text("""
                update public.membership_roles
                set scope_id=case scope_type
                    when 'tenant' then null
                    when 'organization' then :organization_id
                    when 'organization_unit' then :organization_unit_id
                    when 'branch' then :branch_id
                    when 'department' then :department_id
                    else scope_id
                end,
                assigned_by=:actor,
                assigned_at=now()
                where membership_id=:membership_id
            """),
            {
                "organization_id": organization_id,
                "organization_unit_id": organization_unit_id,
                "branch_id": branch_id,
                "department_id": department_id,
                "membership_id": membership_id,
                "actor": actor,
            },
        )
        response = {
            "id": str(membership_id),
            "tenant_id": str(tenant_id),
            "user_id": str(current["user_id"]),
            "organization_id": str(organization_id) if organization_id else None,
            "organization_unit_id": str(organization_unit_id) if organization_unit_id else None,
            "branch_id": str(branch_id) if branch_id else None,
            "department_id": str(department_id) if department_id else None,
            "status": current["status"],
        }
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "membership.assignment.reassigned",
            "membership",
            membership_id,
            {
                "previous": {
                    "organization_id": (
                        str(current["organization_id"]) if current["organization_id"] else None
                    ),
                    "organization_unit_id": (
                        str(current["organization_unit_id"])
                        if current["organization_unit_id"]
                        else None
                    ),
                    "branch_id": str(current["branch_id"]) if current["branch_id"] else None,
                    "department_id": (
                        str(current["department_id"]) if current["department_id"] else None
                    ),
                },
                "current": {
                    "organization_id": response["organization_id"],
                    "organization_unit_id": response["organization_unit_id"],
                    "branch_id": response["branch_id"],
                    "department_id": response["department_id"],
                },
            },
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response,
        )
    return MembershipAssignmentRead(**response)


@router.post(
    "/{tenant_id}/memberships/{membership_id}/activate",
    status_code=status.HTTP_200_OK,
    tags=["Membership"],
)
async def activate_membership(
    tenant_id: UUID,
    membership_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection, request, actor, tenant_id, f"membership.activate:{membership_id}", {}
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        target_result = await connection.execute(
            text("""
                select m.id,m.user_id,m.organization_id,m.organization_unit_id,
                       m.branch_id,m.department_id,m.status,u.deleted_at,u.banned_until
                from public.memberships m
                join auth.users u on u.id=m.user_id
                where m.id=:membership_id and m.tenant_id=:tenant_id
                for update of m
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = target_result.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        if target["status"] != "suspended":
            raise HTTPException(
                status_code=409, detail="Hanya membership suspended yang dapat diaktifkan kembali."
            )
        if target["deleted_at"] is not None or (
            target["banned_until"] is not None and target["banned_until"] > datetime.now(UTC)
        ):
            raise HTTPException(
                status_code=409, detail="Akun Auth target tidak aktif dan tidak dapat diaktifkan."
            )
        tenant = await connection.execute(
            text("select status from public.tenants where id=:tenant_id"),
            {"tenant_id": tenant_id},
        )
        if tenant.scalar_one_or_none() != "active":
            raise HTTPException(status_code=409, detail="Tenant tidak aktif.")
        hierarchy = await connection.execute(
            text("""
                select
                  (m.organization_id is null or exists(
                    select 1 from public.organizations o
                    where o.id=m.organization_id and o.tenant_id=m.tenant_id and o.status='active'
                  )) and
                  (m.organization_unit_id is null or exists(
                    select 1 from public.organization_units u
                    where u.id=m.organization_unit_id and u.tenant_id=m.tenant_id
                      and u.organization_id=m.organization_id and u.status='active'
                  )) and
                  (m.branch_id is null or exists(
                    select 1 from public.branches b
                    where b.id=m.branch_id and b.tenant_id=m.tenant_id
                      and b.organization_id=m.organization_id and b.status='active'
                  )) and
                  (m.department_id is null or exists(
                    select 1 from public.departments d
                    where d.id=m.department_id and d.tenant_id=m.tenant_id
                      and d.organization_id=m.organization_id and d.branch_id=m.branch_id
                      and d.status='active'
                  )) as hierarchy_active
                from public.memberships m
                where m.id=:membership_id and m.tenant_id=:tenant_id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        if not hierarchy.scalar_one():
            raise HTTPException(status_code=409, detail="Hierarchy membership tidak aktif.")
        await connection.execute(
            text("""
                update public.memberships
                set status='active',joined_at=coalesce(joined_at,now()),
                    ended_at=null,updated_at=now()
                where id=:membership_id and tenant_id=:tenant_id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        response_body = {"id": str(membership_id), "status": "active"}
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "membership.activated",
            "membership",
            membership_id,
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.post(
    "/{tenant_id}/memberships/{membership_id}/roles",
    status_code=status.HTTP_200_OK,
    tags=["Access Control"],
)
async def assign_membership_role(
    tenant_id: UUID,
    membership_id: UUID,
    payload: MembershipRoleAssign,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    role_key = payload.role_key.strip().lower()
    if role_key.startswith("platform_"):
        raise HTTPException(
            status_code=422, detail="Platform role tidak dapat diberikan pada tenant."
        )
    if role_key in (
        "corporate_owner",
        "corporate_admin",
        "corporate_ai_manager",
        "ai_workforce_admin",
    ):
        owner = await session.execute(
            text("""
                select exists (
                  select 1 from public.memberships m
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.roles r on r.id=mr.role_id
                  where m.user_id=:actor and m.tenant_id=:tenant_id
                    and m.status='active' and mr.scope_type='tenant'
                    and r.key='corporate_owner'
                    and (r.tenant_id is null or r.tenant_id=:tenant_id)
                    and (mr.valid_from is null or mr.valid_from<=now())
                    and (mr.valid_until is null or mr.valid_until>now())
                )
            """),
            {"actor": UUID(claims["sub"]), "tenant_id": tenant_id},
        )
        platform_manager = await session.execute(
            text("""
                select exists (
                  select 1 from public.memberships m
                  join public.tenants t on t.id=m.tenant_id and t.status='active'
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.roles r on r.id=mr.role_id and r.tenant_id is null
                  join public.role_permissions rp on rp.role_id=r.id
                  where m.user_id=:actor and m.status='active'
                    and mr.scope_type='platform'
                    and (mr.valid_from is null or mr.valid_from<=now())
                    and (mr.valid_until is null or mr.valid_until>now())
                    and rp.permission_key='platform.memberships.manage'
                )
            """),
            {"actor": UUID(claims["sub"])},
        )
        if not bool(owner.scalar_one()) and not (
            claims.get("aal") == "aal2" and bool(platform_manager.scalar_one())
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Role elevated hanya dapat diberikan oleh tenant owner atau "
                    "platform membership admin dengan MFA."
                ),
            )
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            f"membership.role.assign:{membership_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        membership = await connection.execute(
            text("""
                select id,organization_id,organization_unit_id,branch_id,department_id
                from public.memberships where id=:membership_id and tenant_id=:tenant_id
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = membership.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        await assert_membership_entitlement_capacity(
            session, tenant_id, role_key, exclude_membership_id=membership_id
        )
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        role = await connection.execute(
            text("""
                select id,scope_type,tenant_id from public.roles
                where key=:role_key and (tenant_id is null or tenant_id=:tenant_id)
                order by tenant_id nulls first
                limit 1
            """),
            {"role_key": role_key, "tenant_id": tenant_id},
        )
        role_row = role.mappings().first()
        if role_row is None:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan.")
        if role_row["scope_type"] != "tenant":
            raise HTTPException(
                status_code=422, detail="Platform-scoped role tidak dapat diberikan ke tenant."
            )
        role_id = role_row["id"]
        scope_columns = {
            "organization": "organization_id",
            "organization_unit": "organization_unit_id",
            "branch": "branch_id",
            "department": "department_id",
        }
        if payload.scope_type == "tenant" and payload.scope_id is not None:
            raise HTTPException(status_code=422, detail="Tenant scope tidak memerlukan scope_id.")
        if payload.scope_type != "tenant":
            column = scope_columns[payload.scope_type]
            if payload.scope_id is None or target[column] != payload.scope_id:
                raise HTTPException(
                    status_code=404, detail="Scope tidak tersedia untuk membership."
                )
        await connection.execute(
            text("""
                insert into public.membership_roles(
                  membership_id,role_id,assigned_by,scope_type,scope_id,valid_from,valid_until
                ) values (
                  :membership_id,:role_id,:actor,:scope_type,:scope_id,now(),:valid_until
                )
                on conflict(membership_id,role_id) do update set
                  assigned_by=excluded.assigned_by,scope_type=excluded.scope_type,
                  scope_id=excluded.scope_id,valid_from=excluded.valid_from,
                  valid_until=excluded.valid_until,assigned_at=now()
            """),
            {
                "membership_id": membership_id,
                "role_id": role_id,
                "actor": UUID(claims["sub"]),
                "scope_type": payload.scope_type,
                "scope_id": payload.scope_id,
                "valid_until": payload.valid_until,
            },
        )
        response_body = {
            "membership_id": str(membership_id),
            "role_key": role_key,
            "scope_type": payload.scope_type,
            "scope_id": payload.scope_id,
        }
        await _audit(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            "membership.role.assigned",
            "membership",
            membership_id,
            {"role_key": role_key, "scope_type": payload.scope_type},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.put(
    "/{tenant_id}/memberships/{membership_id}/roles",
    status_code=status.HTTP_200_OK,
    tags=["Access Control"],
)
async def replace_membership_role(
    tenant_id: UUID,
    membership_id: UUID,
    payload: MembershipRoleAssign,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.memberships.manage"
    )
    actor = UUID(claims["sub"])
    role_key = payload.role_key.strip().lower()
    if role_key.startswith("platform_"):
        raise HTTPException(
            status_code=422, detail="Platform role tidak dapat diberikan pada tenant."
        )
    if payload.valid_until is not None and payload.valid_until <= datetime.now(UTC):
        raise HTTPException(status_code=422, detail="Masa berlaku role harus berada di masa depan.")
    elevated_roles = {
        "corporate_owner",
        "corporate_admin",
        "corporate_ai_manager",
        "ai_workforce_admin",
    }
    if role_key in elevated_roles and context is not None:
        owner = await session.execute(
            text("""
                select exists(
                  select 1 from public.memberships m
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.roles r on r.id=mr.role_id
                  where m.user_id=:actor and m.tenant_id=:tenant_id and m.status='active'
                    and mr.scope_type='tenant' and r.key='corporate_owner'
                    and (r.tenant_id is null or r.tenant_id=:tenant_id)
                    and (mr.valid_from is null or mr.valid_from<=now())
                    and (mr.valid_until is null or mr.valid_until>now())
                )
            """),
            {"actor": actor, "tenant_id": tenant_id},
        )
        if not owner.scalar_one():
            raise HTTPException(
                status_code=403,
                detail=(
                    "Hanya tenant owner atau platform membership admin "
                    "dapat menetapkan role elevated."
                ),
            )
    scope_columns = {
        "organization": "organization_id",
        "organization_unit": "organization_unit_id",
        "branch": "branch_id",
        "department": "department_id",
    }
    await assert_membership_entitlement_capacity(
        session, tenant_id, role_key, exclude_membership_id=membership_id
    )
    if payload.scope_type == "tenant" and payload.scope_id is not None:
        raise HTTPException(status_code=422, detail="Tenant scope tidak memerlukan scope_id.")
    if payload.scope_type != "tenant" and payload.scope_id is None:
        raise HTTPException(status_code=422, detail="Scope ID wajib diisi untuk role scoped.")
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"membership.role.replace:{membership_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        membership_result = await connection.execute(
            text("""
                select id,user_id,status,organization_id,organization_unit_id,
                       branch_id,department_id
                from public.memberships
                where id=:membership_id and tenant_id=:tenant_id
                for update
            """),
            {"membership_id": membership_id, "tenant_id": tenant_id},
        )
        target = membership_result.mappings().first()
        if target is None:
            raise HTTPException(status_code=404, detail="Membership tidak ditemukan.")
        if target["status"] not in ("active", "invited", "suspended"):
            raise HTTPException(status_code=409, detail="Membership tidak dapat diubah.")
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=target["organization_id"],
                organization_unit_id=target["organization_unit_id"],
                branch_id=target["branch_id"],
                department_id=target["department_id"],
            )
        role_result = await connection.execute(
            text("""
                select id,key,tenant_id,scope_type from public.roles
                where key=:role_key and (tenant_id is null or tenant_id=:tenant_id)
                order by tenant_id nulls first limit 1
            """),
            {"role_key": role_key, "tenant_id": tenant_id},
        )
        role = role_result.mappings().first()
        if role is None:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan.")
        if role["scope_type"] != "tenant":
            raise HTTPException(
                status_code=422, detail="Platform-scoped role tidak dapat diberikan ke tenant."
            )
        if payload.scope_type != "tenant":
            column = scope_columns[payload.scope_type]
            if target[column] != payload.scope_id:
                raise HTTPException(
                    status_code=404, detail="Scope tidak tersedia untuk membership."
                )
        if role_key != "corporate_owner":
            await ensure_tenant_owner_retained(
                connection, tenant_id=tenant_id, membership_id=membership_id
            )
        previous = await connection.execute(
            text("""
                select coalesce(array_agg(r.key order by r.key), '{}') as role_keys
                from public.membership_roles mr join public.roles r on r.id=mr.role_id
                where mr.membership_id=:membership_id
            """),
            {"membership_id": membership_id},
        )
        previous_role_keys = previous.scalar_one()
        await connection.execute(
            text("delete from public.membership_roles where membership_id=:membership_id"),
            {"membership_id": membership_id},
        )
        await connection.execute(
            text("""
                insert into public.membership_roles(
                  membership_id,role_id,assigned_by,scope_type,scope_id,valid_from,valid_until
                ) values (
                  :membership_id,:role_id,:actor,:scope_type,:scope_id,now(),:valid_until
                )
            """),
            {
                "membership_id": membership_id,
                "role_id": role["id"],
                "actor": actor,
                "scope_type": payload.scope_type,
                "scope_id": payload.scope_id,
                "valid_until": payload.valid_until,
            },
        )
        response_body = {
            "membership_id": str(membership_id),
            "role_key": role_key,
            "previous_role_keys": previous_role_keys,
            "scope_type": payload.scope_type,
            "scope_id": str(payload.scope_id) if payload.scope_id else None,
            "valid_until": payload.valid_until.isoformat() if payload.valid_until else None,
        }
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "membership.role.replaced",
            "membership",
            membership_id,
            {
                "previous_role_keys": previous_role_keys,
                "role_key": role_key,
                "scope_type": payload.scope_type,
            },
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


class BranchUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    code: str | None = Field(
        default=None, min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$"
    )
    organization_unit_id: UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive|archived)$")


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    code: str | None = Field(
        default=None, min_length=2, max_length=40, pattern="^[A-Z0-9][A-Z0-9_-]*$"
    )
    branch_id: UUID | None = None
    parent_department_id: UUID | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive|archived)$")


@router.get(
    "/{tenant_id}/workforce-context",
    response_model=WorkforceTenantContextRead,
    tags=["Workforce Identity"],
)
async def read_workforce_tenant_context(
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    context = None
    candidates = (
        ("workforce.profile.read", "workforce.profile", "read"),
        ("workforce.assignments.read", "workforce.assignments", "read"),
        ("corporate.sales.read", "corporate.sales", "read"),
        ("sales.leads.read", "sales.leads", "read"),
        ("affiliate.profile.read", "affiliate.profile", "read"),
        ("technical.work_orders.read", "technical.work_orders", "read"),
        ("support.cases.read", "support.cases", "read"),
        ("ai.workers.read", "ai.workers", "read"),
        ("corporate.organization.read", "corporate.organization", "read"),
    )
    last_error: HTTPException | None = None
    for permission, resource_type, action in candidates:
        try:
            context, _ = await authorize_action(
                session,
                user_id=actor,
                tenant_id=tenant_id,
                permission_key=permission,
                platform_permission="platform.tenants.read",
                aal=claims.get("aal"),
                resource_type=resource_type,
                action=action,
                resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
                request_id=_request_id(request),
            )
            break
        except HTTPException as exc:
            last_error = exc
            if exc.status_code not in (403, 404):
                raise
    else:
        raise last_error or HTTPException(status_code=403, detail="Workforce tenant access denied.")

    params = {
        "tenant_id": tenant_id,
        "organization_id": context.organization_id if context else None,
        "organization_unit_id": context.organization_unit_id if context else None,
        "branch_id": context.branch_id if context else None,
        "department_id": context.department_id if context else None,
    }
    async with engine.connect() as connection:
        organizations = await connection.execute(
            text("""
                select id,tenant_id,parent_id,name,slug,organization_type,status
                from public.organizations
                where tenant_id=:tenant_id and status='active'
                  and (:organization_id is null or id=:organization_id)
                order by name
            """),
            params,
        )
        units = await connection.execute(
            text("""
                select id,tenant_id,organization_id,parent_unit_id,name,code,unit_type,status
                from public.organization_units
                where tenant_id=:tenant_id and status='active'
                  and (:organization_id is null or organization_id=:organization_id)
                  and (:organization_unit_id is null or id=:organization_unit_id)
                  and (:branch_id is null or id in (
                    select organization_unit_id from public.branches
                    where tenant_id=:tenant_id and id=:branch_id
                      and organization_unit_id is not null
                  ))
                order by name
            """),
            params,
        )
        branches = await connection.execute(
            text("""
                select id,tenant_id,organization_id,organization_unit_id,name,code,status
                from public.branches
                where tenant_id=:tenant_id and status='active'
                  and (:organization_id is null or organization_id=:organization_id)
                  and (:organization_unit_id is null or organization_unit_id=:organization_unit_id)
                  and (:branch_id is null or id=:branch_id)
                order by name
            """),
            params,
        )
        departments = await connection.execute(
            text("""
                select id,tenant_id,organization_id,branch_id,parent_department_id,name,code,status
                from public.departments
                where tenant_id=:tenant_id and status='active'
                  and (:organization_id is null or organization_id=:organization_id)
                  and (:branch_id is null or branch_id=:branch_id)
                  and (:department_id is null or id=:department_id)
                order by name
            """),
            params,
        )
    return WorkforceTenantContextRead(
        tenant_id=tenant_id,
        membership_id=context.membership_id if context else None,
        organization_id=context.organization_id if context else None,
        organization_unit_id=context.organization_unit_id if context else None,
        branch_id=context.branch_id if context else None,
        department_id=context.department_id if context else None,
        role_keys=sorted(context.role_keys) if context else ["platform"],
        permissions=sorted(context.permissions) if context else ["platform.tenants.read"],
        organizations=[
            HierarchyOrganizationRead(**dict(row)) for row in organizations.mappings().all()
        ],
        organization_units=[HierarchyUnitRead(**dict(row)) for row in units.mappings().all()],
        branches=[HierarchyBranchRead(**dict(row)) for row in branches.mappings().all()],
        departments=[HierarchyDepartmentRead(**dict(row)) for row in departments.mappings().all()],
    )


@router.patch("/{tenant_id}/branches/{branch_id}", tags=["Organization"])
async def update_branch(
    tenant_id: UUID,
    branch_id: UUID,
    payload: BranchUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    values = {key: value for key, value in payload.model_dump(exclude_unset=True).items()}
    if not values:
        raise HTTPException(status_code=422, detail="No branch changes supplied.")
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            f"branch.update:{branch_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        current = await connection.execute(
            text("""
                select id,tenant_id,organization_id,organization_unit_id,status
                from public.branches
                where id=:id and tenant_id=:tenant_id
                for update
            """),
            {"id": branch_id, "tenant_id": tenant_id},
        )
        branch = current.mappings().first()
        if branch is None:
            raise HTTPException(status_code=404, detail="Branch not found.")
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=branch["organization_id"],
                organization_unit_id=branch["organization_unit_id"],
                branch_id=branch_id,
            )
        target_organization_unit_id = values.get(
            "organization_unit_id", branch["organization_unit_id"]
        )
        if target_organization_unit_id is not None:
            unit = await connection.execute(
                text("""
                    select 1 from public.organization_units
                    where id=:unit_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "unit_id": target_organization_unit_id,
                    "tenant_id": tenant_id,
                    "organization_id": branch["organization_id"],
                },
            )
            if unit.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Active organization unit not found in this branch scope.",
                )
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=branch["organization_id"],
                organization_unit_id=target_organization_unit_id,
                branch_id=branch_id,
            )
        if (
            "organization_unit_id" in values
            and values["organization_unit_id"] != branch["organization_unit_id"]
        ):
            scoped_memberships = await connection.execute(
                text("""
                    select exists(
                      select 1 from public.memberships
                      where tenant_id=:tenant_id and branch_id=:branch_id
                        and status in ('active','invited','suspended')
                    )
                """),
                {"tenant_id": tenant_id, "branch_id": branch_id},
            )
            if scoped_memberships.scalar_one():
                raise HTTPException(
                    status_code=409,
                    detail="Reassign membership organization-unit scope before moving this branch.",
                )
        if values.get("status") == "archived":
            dependencies = await connection.execute(
                text("""
                    select
                      exists(select 1 from public.departments
                        where tenant_id=:tenant_id and branch_id=:branch_id and status='active')
                      or exists(select 1 from public.memberships
                        where tenant_id=:tenant_id and branch_id=:branch_id
                          and status in ('active','invited','suspended'))
                """),
                {"tenant_id": tenant_id, "branch_id": branch_id},
            )
            if dependencies.scalar_one():
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Archive active departments and memberships before archiving this branch."
                    ),
                )
        assignments = ", ".join(f"{key}=:{key}" for key in values)
        result = await connection.execute(
            text(f"""
                update public.branches set {assignments},updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant_id
                returning id,tenant_id,organization_id,organization_unit_id,
                          name,code,status,updated_at
            """),
            {**values, "actor": UUID(claims["sub"]), "id": branch_id, "tenant_id": tenant_id},
        )
        updated = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            "branch.updated",
            "branch",
            branch_id,
            values,
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=updated,
        )
    return updated


@router.patch("/{tenant_id}/departments/{department_id}", tags=["Organization"])
async def update_department(
    tenant_id: UUID,
    department_id: UUID,
    payload: DepartmentUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    values = {key: value for key, value in payload.model_dump(exclude_unset=True).items()}
    if not values:
        raise HTTPException(status_code=422, detail="No department changes supplied.")
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            f"department.update:{department_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        current = await connection.execute(
            text("""
                select d.id,d.tenant_id,d.organization_id,d.branch_id,
                       d.parent_department_id,d.status,b.organization_unit_id
                from public.departments d
                left join public.branches b
                  on b.id=d.branch_id and b.tenant_id=d.tenant_id
                where d.id=:id and d.tenant_id=:tenant_id
                for update of d
            """),
            {"id": department_id, "tenant_id": tenant_id},
        )
        department = current.mappings().first()
        if department is None:
            raise HTTPException(status_code=404, detail="Department not found.")
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=department["organization_id"],
                organization_unit_id=department["organization_unit_id"],
                branch_id=department["branch_id"],
                department_id=department_id,
            )
        target_branch = values.get("branch_id", department["branch_id"])
        target_organization_unit_id = None
        if target_branch is not None:
            branch = await connection.execute(
                text("""
                    select organization_unit_id from public.branches
                    where id=:branch_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "branch_id": target_branch,
                    "tenant_id": tenant_id,
                    "organization_id": department["organization_id"],
                },
            )
            branch_row = branch.mappings().first()
            if branch_row is None:
                raise HTTPException(
                    status_code=404,
                    detail="Active branch not found in this organization.",
                )
            target_organization_unit_id = branch_row["organization_unit_id"]
        if context is not None:
            authorize_object(
                context,
                resource_tenant_id=tenant_id,
                organization_id=department["organization_id"],
                organization_unit_id=target_organization_unit_id,
                branch_id=target_branch,
                department_id=department_id,
            )
        if "parent_department_id" in values and values["parent_department_id"] is not None:
            parent_id = values["parent_department_id"]
            parent = await connection.execute(
                text("""
                    select id,branch_id from public.departments
                    where id=:parent_id and tenant_id=:tenant_id
                      and organization_id=:organization_id and status='active'
                """),
                {
                    "parent_id": parent_id,
                    "tenant_id": tenant_id,
                    "organization_id": department["organization_id"],
                },
            )
            parent_row = parent.mappings().first()
            if parent_row is None or parent_row["branch_id"] != target_branch:
                raise HTTPException(
                    status_code=404,
                    detail="Parent department is outside the active hierarchy.",
                )
            descendants = await connection.execute(
                text("""
                    with recursive descendants(id) as (
                      select id from public.departments
                      where id=:department_id and tenant_id=:tenant_id
                      union all
                      select d.id from public.departments d
                      join descendants x on d.parent_department_id=x.id
                      where d.tenant_id=:tenant_id
                    )
                    select exists(select 1 from descendants where id=:parent_id)
                """),
                {"department_id": department_id, "tenant_id": tenant_id, "parent_id": parent_id},
            )
            if descendants.scalar_one():
                raise HTTPException(
                    status_code=409,
                    detail="Department parent change would create a hierarchy cycle.",
                )
        if "branch_id" in values and target_branch != department["branch_id"]:
            scoped_memberships = await connection.execute(
                text("""
                    select exists(
                      select 1 from public.memberships
                      where tenant_id=:tenant_id and department_id=:department_id
                        and status in ('active','invited','suspended')
                    )
                """),
                {"tenant_id": tenant_id, "department_id": department_id},
            )
            if scoped_memberships.scalar_one():
                raise HTTPException(
                    status_code=409,
                    detail="Reassign memberships before moving this department to another branch.",
                )
        if values.get("status") == "archived":
            dependencies = await connection.execute(
                text("""
                    select
                      exists(select 1 from public.departments
                        where tenant_id=:tenant_id
                          and parent_department_id=:department_id and status='active')
                      or exists(select 1 from public.memberships
                        where tenant_id=:tenant_id
                          and department_id=:department_id and status='active')
                """),
                {"tenant_id": tenant_id, "department_id": department_id},
            )
            if dependencies.scalar_one():
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Archive child departments and memberships before archiving "
                        "this department."
                    ),
                )
        assignments = ", ".join(f"{key}=:{key}" for key in values)
        result = await connection.execute(
            text(f"""
                update public.departments set {assignments},updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant_id
                returning id,tenant_id,organization_id,branch_id,parent_department_id,
                          name,code,status,updated_at
            """),
            {**values, "actor": UUID(claims["sub"]), "id": department_id, "tenant_id": tenant_id},
        )
        updated = dict(result.mappings().one())
        await _audit(
            connection,
            request,
            UUID(claims["sub"]),
            tenant_id,
            "department.updated",
            "department",
            department_id,
            values,
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=updated,
        )
    return updated


@router.post("/{tenant_id}/branches/{branch_id}/archive", tags=["Organization"])
async def archive_branch(
    tenant_id: UUID,
    branch_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await update_branch(
        tenant_id, branch_id, BranchUpdate(status="archived"), request, claims, session
    )


@router.post("/{tenant_id}/branches/{branch_id}/restore", tags=["Organization"])
async def restore_branch(
    tenant_id: UUID,
    branch_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await update_branch(
        tenant_id, branch_id, BranchUpdate(status="active"), request, claims, session
    )


@router.post("/{tenant_id}/departments/{department_id}/archive", tags=["Organization"])
async def archive_department(
    tenant_id: UUID,
    department_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await update_department(
        tenant_id, department_id, DepartmentUpdate(status="archived"), request, claims, session
    )


@router.post("/{tenant_id}/departments/{department_id}/restore", tags=["Organization"])
async def restore_department(
    tenant_id: UUID,
    department_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await update_department(
        tenant_id, department_id, DepartmentUpdate(status="active"), request, claims, session
    )


@router.patch(
    "/{tenant_id}/organization-units/{unit_id}",
    response_model=HierarchyUnitRead,
    tags=["Organization"],
)
async def update_organization_unit(
    tenant_id: UUID,
    unit_id: UUID,
    payload: OrganizationUnitUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    if not payload.model_fields_set:
        raise HTTPException(status_code=422, detail="Minimal satu perubahan harus dikirim.")
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"organization_unit.update:{unit_id}",
            payload.model_dump(mode="json"),
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        row = await update_organization_unit_service(
            connection,
            tenant_id=tenant_id,
            unit_id=unit_id,
            actor_id=actor,
            changes=payload.model_dump(exclude_unset=True),
            authorization_context=context,
        )
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            "organization_unit.updated",
            "organization_unit",
            unit_id,
            {"fields": sorted(payload.model_fields_set)},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=row,
        )
    return row


async def _set_organization_unit_status(
    tenant_id: UUID,
    unit_id: UUID,
    request: Request,
    claims: dict,
    session: AsyncSession,
    *,
    status_value: str,
):
    context = await _authorize(
        session, claims, tenant_id, "corporate.organization.manage", "platform.tenants.manage"
    )
    actor = UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation = await _reserve_command(
            connection,
            request,
            actor,
            tenant_id,
            f"organization_unit.{status_value}:{unit_id}",
            {"status": status_value},
        )
        if isinstance(reservation, JSONResponse):
            return reservation
        row, previous_status = await set_organization_unit_status_service(
            connection,
            tenant_id=tenant_id,
            unit_id=unit_id,
            actor_id=actor,
            status=status_value,
            authorization_context=context,
        )
        await _audit(
            connection,
            request,
            actor,
            tenant_id,
            f"organization_unit.{status_value}",
            "organization_unit",
            unit_id,
            {"previous_status": previous_status},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=row,
        )
    return row


@router.post(
    "/{tenant_id}/organization-units/{unit_id}/archive",
    response_model=HierarchyUnitRead,
    tags=["Organization"],
)
async def archive_organization_unit(
    tenant_id: UUID,
    unit_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await _set_organization_unit_status(
        tenant_id, unit_id, request, claims, session, status_value="archived"
    )


@router.post(
    "/{tenant_id}/organization-units/{unit_id}/restore",
    response_model=HierarchyUnitRead,
    tags=["Organization"],
)
async def restore_organization_unit(
    tenant_id: UUID,
    unit_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await _set_organization_unit_status(
        tenant_id, unit_id, request, claims, session, status_value="active"
    )
