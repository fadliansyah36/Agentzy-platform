import json
import re
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_action, authorize_object, authorize_platform_action
from app.core.config import get_settings
from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.core.pagination import (
    PageMeta,
    PageResponse,
    decode_key_cursor,
    decode_time_id_cursor,
    encode_key_cursor,
    encode_time_id_cursor,
)
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter()


def _audit_metadata(request: Request, metadata: dict | None = None) -> str:
    return json.dumps(
        {
            **(metadata or {}),
            "correlation_id": getattr(request.state, "correlation_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
        default=str,
    )


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None) or request.headers.get("x-request-id")


claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


def _require_aal2(claims: dict) -> None:
    if claims.get("aal") != "aal2":
        raise HTTPException(
            status_code=403,
            detail="Platform privileged actions require Supabase MFA assurance level aal2.",
        )


class TenantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=80)
    tenant_type: str = Field(pattern="^(corporate|provider|internal|other)$")


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=80)
    organization_type: str = Field(
        default="company", pattern="^(company|division|department|branch|team)$"
    )
    parent_id: UUID | None = None


class RolePermissionUpdate(BaseModel):
    permission_keys: list[str] = Field(max_length=200)


class RoleCreate(BaseModel):
    key: str = Field(min_length=3, max_length=80, pattern="^[a-z][a-z0-9_.-]+$")
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    scope_type: str = Field(pattern="^(platform|tenant)$")

    @model_validator(mode="after")
    def validate_scope_key(self):
        if self.scope_type == "platform" and not self.key.startswith("platform_"):
            raise ValueError("Platform role keys must use the platform_ prefix")
        if self.scope_type == "tenant" and self.key.startswith("platform_"):
            raise ValueError("Tenant role keys cannot use the platform_ prefix")
        return self


class RolePatch(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class MembershipInvite(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    full_name: str = Field(min_length=1, max_length=120)
    role_key: str = Field(min_length=2, max_length=80)
    organization_id: UUID | None = None
    organization_unit_id: UUID | None = None
    branch_id: UUID | None = None
    department_id: UUID | None = None

    @model_validator(mode="after")
    def validate_scope_hierarchy(self):
        if any((self.organization_unit_id, self.branch_id, self.department_id)) and not (
            self.organization_id
        ):
            raise ValueError(
                "organization_id wajib diisi untuk scope unit, branch, atau department."
            )
        if self.department_id and not self.branch_id:
            raise ValueError("department_id memerlukan branch_id untuk assignment membership.")
        return self

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Alamat email tidak valid.")
        return normalized


async def _has_platform_permission(session: AsyncSession, user_id: UUID, permission: str) -> bool:
    resource, action = permission.rsplit(".", 1)
    try:
        await authorize_platform_action(
            session,
            user_id=user_id,
            permission_key=permission,
            resource_type=resource,
            action=action,
            resource={"id": permission},
        )
        return True
    except HTTPException as exc:
        if exc.status_code in (403, 404):
            return False
        raise


async def _authorize_platform_resource(
    session: AsyncSession,
    *,
    user_id: UUID,
    permission: str,
    resource: dict,
    request_id: str | None = None,
) -> None:
    """Apply the platform permission and ABAC policy to the actual target object."""
    resource_type, action = permission.rsplit(".", 1)
    await authorize_platform_action(
        session,
        user_id=user_id,
        permission_key=permission,
        resource_type=resource_type,
        action=action,
        resource=resource,
        request_id=request_id,
    )


async def _has_tenant_role(
    session: AsyncSession, user_id: UUID, tenant_id: UUID, role_key: str
) -> bool:
    result = await session.execute(
        text("""
        select exists (
          select 1 from public.memberships m
          join public.tenants t on t.id=m.tenant_id and t.status='active'
          join public.membership_roles mr on mr.membership_id=m.id
          join public.roles r on r.id=mr.role_id
          where m.user_id=:user_id and m.tenant_id=:tenant_id
            and m.status='active' and mr.scope_type='tenant' and r.key=:role_key
            and (mr.valid_from is null or mr.valid_from<=now())
            and (mr.valid_until is null or mr.valid_until>now())
            and (r.tenant_id is null or r.tenant_id=:tenant_id)
        )
    """),
        {"user_id": user_id, "tenant_id": tenant_id, "role_key": role_key},
    )
    return bool(result.scalar_one())


async def _has_tenant_permission(
    session: AsyncSession, user_id: UUID, tenant_id: UUID, permissions: tuple[str, ...]
) -> bool:
    for permission in permissions:
        resource, action = permission.rsplit(".", 1)
        try:
            await authorize_action(
                session,
                user_id=user_id,
                tenant_id=tenant_id,
                permission_key=permission,
                platform_permission="",
                aal=None,
                resource_type=resource,
                action=action,
                resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
            )
            return True
        except HTTPException as exc:
            if exc.status_code in (403, 404):
                continue
            raise
    return False


@router.post("/tenants", status_code=status.HTTP_201_CREATED, tags=["Tenant Administration"])
async def create_tenant(
    payload: TenantCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    _require_aal2(claims)
    user_id = UUID(claims["sub"])
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", payload.slug):
        raise HTTPException(
            status_code=422, detail="Slug hanya boleh berisi huruf kecil, angka dan tanda hubung."
        )
    if not await _has_platform_permission(session, user_id, "platform.tenants.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.manage permission.")
    await _authorize_platform_resource(
        session,
        user_id=user_id,
        permission="platform.tenants.manage",
        resource={
            "id": payload.slug,
            "slug": payload.slug,
            "name": payload.name,
            "tenant_type": payload.tenant_type,
            "status": "pending",
        },
        request_id=_request_id(request),
    )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=user_id,
            tenant_id=None,
            command_key="tenant.create",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 201,
                content=reservation.replay_body or {},
            )
        result = await connection.execute(
            text("""
            insert into public.tenants(name,slug,tenant_type,status,created_by)
            values(:name,:slug,:tenant_type,'pending',:actor)
            returning id,name,slug,tenant_type,status,created_at
        """),
            {
                "name": payload.name,
                "slug": payload.slug,
                "tenant_type": payload.tenant_type,
                "actor": user_id,
            },
        )
        row = dict(result.mappings().one())
        owner_membership = await connection.execute(
            text("""
                insert into public.memberships(
                  tenant_id,user_id,status,joined_at,accepted_at
                ) values (:tenant_id,:actor,'active',now(),now())
                on conflict(tenant_id,user_id) do update
                  set status='active',joined_at=coalesce(public.memberships.joined_at,now()),
                      accepted_at=coalesce(public.memberships.accepted_at,now()),
                      updated_at=now()
                returning id
            """),
            {"tenant_id": row["id"], "actor": user_id},
        )
        owner_membership_id = owner_membership.scalar_one()
        await connection.execute(
            text("""
                insert into public.membership_roles(
                  membership_id,role_id,assigned_by,scope_type,scope_id,valid_from
                )
                select :membership_id,r.id,:actor,'tenant',null,now()
                from public.roles r
                where r.key='corporate_owner' and r.tenant_id is null
                on conflict(membership_id,role_id) do nothing
            """),
            {"membership_id": owner_membership_id, "actor": user_id},
        )
        await connection.execute(
            text("""
            insert into public.audit_logs(
                actor_user_id, action, resource_type, resource_id,
                request_id, ip_address, metadata
            )
            values(
                :actor, 'tenant.created', 'tenant', :resource_id,
                :request_id, :ip, jsonb_build_object('slug', :slug)
            )
        """),
            {
                "actor": user_id,
                "resource_id": str(row["id"]),
                "request_id": _request_id(request),
                "ip": request.client.host if request.client else None,
                "slug": payload.slug,
            },
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=row,
        )
    return row


@router.post(
    "/tenants/{tenant_id}/organizations", status_code=status.HTTP_201_CREATED, tags=["Organization"]
)
async def create_organization(
    tenant_id: UUID,
    payload: OrganizationCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    user_id = UUID(claims["sub"])
    context = None
    try:
        context, _ = await authorize_action(
            session,
            user_id=user_id,
            tenant_id=tenant_id,
            permission_key="corporate.organization.manage",
            platform_permission="",
            aal=None,
            resource_type="corporate.organization",
            action="manage",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
        )
    except HTTPException as exc:
        if exc.status_code != 403:
            raise
        _require_aal2(claims)
        await authorize_platform_action(
            session,
            user_id=user_id,
            permission_key="platform.tenants.manage",
            resource_type="platform.tenants",
            action="manage",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
        )
    if context is not None and any(
        (
            context.organization_id,
            context.organization_unit_id,
            context.branch_id,
            context.department_id,
        )
    ):
        raise HTTPException(
            status_code=403,
            detail="Creating tenant organizations requires tenant-wide scope.",
        )
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", payload.slug):
        raise HTTPException(
            status_code=422, detail="Slug hanya boleh berisi huruf kecil, angka dan tanda hubung."
        )
    if payload.parent_id:
        async with engine.connect() as connection:
            parent = await connection.execute(
                text("""
                select exists(
                    select 1 from public.organizations
                    where id=:parent_id and tenant_id=:tenant_id
                )
            """),
                {"parent_id": payload.parent_id, "tenant_id": tenant_id},
            )
            if not parent.scalar_one():
                raise HTTPException(
                    status_code=422,
                    detail="Parent organization harus berada pada tenant yang sama.",
                )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=user_id,
            tenant_id=tenant_id,
            command_key=f"organization.create:{tenant_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 201,
                content=reservation.replay_body or {},
            )
        result = await connection.execute(
            text("""
            insert into public.organizations(tenant_id,parent_id,name,slug,organization_type)
            values(:tenant_id,:parent_id,:name,:slug,:organization_type)
            returning id,tenant_id,parent_id,name,slug,organization_type,status,created_at
        """),
            {
                "tenant_id": tenant_id,
                "parent_id": payload.parent_id,
                "name": payload.name,
                "slug": payload.slug,
                "organization_type": payload.organization_type,
            },
        )
        row = dict(result.mappings().one())
        await connection.execute(
            text("""
            insert into public.audit_logs(
                tenant_id, actor_user_id, action, resource_type,
                resource_id, request_id, ip_address
            )
            values(
                :tenant_id, :actor, 'organization.created', 'organization',
                :resource_id, :request_id, :ip
            )
        """),
            {
                "tenant_id": tenant_id,
                "actor": user_id,
                "resource_id": str(row["id"]),
                "request_id": _request_id(request),
                "ip": request.client.host if request.client else None,
            },
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=row,
        )
    return row


@router.post(
    "/tenants/{tenant_id}/memberships/invite",
    status_code=status.HTTP_201_CREATED,
    tags=["Membership"],
)
async def invite_tenant_member(
    tenant_id: UUID,
    payload: MembershipInvite,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    user_id = UUID(claims["sub"])
    context = None
    try:
        context, _ = await authorize_action(
            session,
            user_id=user_id,
            tenant_id=tenant_id,
            permission_key="corporate.organization.manage",
            platform_permission="",
            aal=None,
            resource_type="corporate.organization",
            action="manage",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
        )
    except HTTPException as exc:
        if exc.status_code != 403:
            raise
        _require_aal2(claims)
        await authorize_platform_action(
            session,
            user_id=user_id,
            permission_key="platform.memberships.manage",
            resource_type="platform.memberships",
            action="manage",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
        )
    organization_unit_id = payload.organization_unit_id
    branch_id = payload.branch_id
    department_id = payload.department_id
    organization = await session.execute(
        text("""
            select 1 from public.organizations
            where id=:organization_id and tenant_id=:tenant_id and status='active'
        """),
        {"organization_id": payload.organization_id, "tenant_id": tenant_id},
    )
    if payload.organization_id is not None and organization.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Active organization not found in this tenant.")
    if organization_unit_id is not None:
        unit = await session.execute(
            text("""
                select 1 from public.organization_units
                where id=:unit_id and tenant_id=:tenant_id
                  and organization_id=:organization_id and status='active'
            """),
            {
                "unit_id": organization_unit_id,
                "tenant_id": tenant_id,
                "organization_id": payload.organization_id,
            },
        )
        if unit.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=404,
                detail="Organization unit not found in this tenant.",
            )
    if branch_id is not None:
        branch = await session.execute(
            text("""
                select organization_unit_id from public.branches
                where id=:branch_id and tenant_id=:tenant_id
                  and organization_id=:organization_id and status='active'
            """),
            {
                "branch_id": branch_id,
                "tenant_id": tenant_id,
                "organization_id": payload.organization_id,
            },
        )
        branch_row = branch.mappings().first()
        if branch_row is None:
            raise HTTPException(status_code=404, detail="Branch not found in this organization.")
        if branch_row["organization_unit_id"] is not None:
            if organization_unit_id not in (None, branch_row["organization_unit_id"]):
                raise HTTPException(
                    status_code=422,
                    detail="Membership unit and branch scopes do not match.",
                )
            organization_unit_id = branch_row["organization_unit_id"]
    if department_id is not None:
        department = await session.execute(
            text("""
                select branch_id from public.departments
                where id=:department_id and tenant_id=:tenant_id
                  and organization_id=:organization_id and status='active'
            """),
            {
                "department_id": department_id,
                "tenant_id": tenant_id,
                "organization_id": payload.organization_id,
            },
        )
        department_row = department.mappings().first()
        if department_row is None or department_row["branch_id"] != branch_id:
            raise HTTPException(
                status_code=404,
                detail="Department is outside the selected branch.",
            )
    if context is not None:
        authorize_object(
            context,
            resource_tenant_id=tenant_id,
            organization_id=payload.organization_id,
            organization_unit_id=organization_unit_id,
            branch_id=branch_id,
            department_id=department_id,
        )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=user_id,
            tenant_id=tenant_id,
            command_key=f"membership.invite:{tenant_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 201,
                content=reservation.replay_body or {},
            )

    role_key = payload.role_key.strip().lower()
    if role_key in (
        "corporate_owner",
        "corporate_admin",
        "corporate_ai_manager",
        "ai_workforce_admin",
    ):
        is_owner = await _has_tenant_role(session, user_id, tenant_id, "corporate_owner")
        is_platform_manager = await _has_platform_permission(
            session, user_id, "platform.memberships.manage"
        )
        if is_platform_manager:
            _require_aal2(claims)
        if not is_owner and not is_platform_manager:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only the tenant owner or platform membership administrator "
                    "may assign this role."
                ),
            )
    if role_key.startswith("platform_"):
        raise HTTPException(
            status_code=422, detail="Platform roles cannot be assigned inside a tenant."
        )
    role_result = await session.execute(
        text("""
        select id from public.roles where key=:role_key and tenant_id is null
    """),
        {"role_key": role_key},
    )
    role_id = role_result.scalar_one_or_none()
    if role_id is None:
        raise HTTPException(status_code=422, detail="Role template tidak ditemukan.")

    async with engine.connect() as connection:
        existing_membership = await connection.execute(
            text("""
                select m.status
                from public.memberships m
                join auth.users u on u.id=m.user_id
                where m.tenant_id=:tenant_id and lower(u.email)=:email
                limit 1
            """),
            {"tenant_id": tenant_id, "email": payload.email},
        )
        existing_status = existing_membership.scalar_one_or_none()
        if existing_status in ("active", "suspended"):
            raise HTTPException(
                status_code=409, detail="User sudah memiliki membership aktif atau suspended."
            )

    settings = get_settings()
    service_key = settings.supabase_service_role_key
    if not service_key:
        raise HTTPException(status_code=503, detail="Supabase Auth invitation belum dikonfigurasi.")
    invite_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/invite"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if role_key.startswith("ai_") or role_key == "corporate_ai_manager":
        redirect_surface = "ai-workforce"
    elif role_key in (
        "sales_manager",
        "sales_supervisor",
        "sales_official",
        "affiliate_worker",
        "technician",
        "field_quality_inspector",
        "support_agent",
    ):
        redirect_surface = "workforce"
    else:
        redirect_surface = "corporate"
    redirect_to = f"{settings.app_base_url.rstrip('/')}/{redirect_surface}"
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                invite_url,
                params={"redirect_to": redirect_to},
                headers=headers,
                json={
                    "email": payload.email.strip().lower(),
                    "data": {"full_name": payload.full_name.strip()},
                },
            )
        if response.status_code >= 400:
            detail = (
                response.json().get("msg")
                or response.json().get("message")
                or "Supabase Auth menolak undangan."
            )
            raise HTTPException(status_code=400, detail=detail)
        invited_user_id = UUID(response.json()["id"])
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=502, detail="Gagal mengirim undangan melalui Supabase Auth."
        ) from exc

    async with engine.begin() as connection:
        membership_result = await connection.execute(
            text("""
            insert into public.memberships(
                tenant_id,user_id,status,invited_by,invitation_expires_at,
                organization_id,organization_unit_id,branch_id,department_id
            )
            values(
                :tenant_id,:user_id,'invited',:actor,now()+interval '7 days',
                :organization_id,:organization_unit_id,:branch_id,:department_id
            )
            on conflict(tenant_id,user_id) do update set
                status='invited',invited_by=excluded.invited_by,
                invitation_expires_at=excluded.invitation_expires_at,
                organization_id=excluded.organization_id,
                organization_unit_id=excluded.organization_unit_id,
                branch_id=excluded.branch_id,department_id=excluded.department_id,
                accepted_at=null,joined_at=null,ended_at=null,updated_at=now()
            where public.memberships.status in ('invited','revoked')
            returning id,tenant_id,user_id,status,created_at
        """),
            {
                "tenant_id": tenant_id,
                "user_id": invited_user_id,
                "actor": user_id,
                "organization_id": payload.organization_id,
                "organization_unit_id": organization_unit_id,
                "branch_id": branch_id,
                "department_id": department_id,
            },
        )
        membership_row = membership_result.mappings().first()
        if membership_row is None:
            raise HTTPException(
                status_code=409, detail="Membership existing tidak dapat diundang ulang."
            )
        membership = dict(membership_row)
        scope_type = (
            "department"
            if department_id
            else "branch"
            if branch_id
            else "organization_unit"
            if organization_unit_id
            else "organization"
            if payload.organization_id
            else "tenant"
        )
        scope_id = department_id or branch_id or organization_unit_id or payload.organization_id
        await connection.execute(
            text("""
            insert into public.membership_roles(
                membership_id,role_id,assigned_by,scope_type,scope_id,valid_from
            )
            values(:membership_id,:role_id,:actor,:scope_type,:scope_id,now())
            on conflict(membership_id,role_id) do update set
                assigned_by=excluded.assigned_by,scope_type=excluded.scope_type,
                scope_id=excluded.scope_id,valid_from=excluded.valid_from,
                valid_until=null,assigned_at=now()
        """),
            {
                "membership_id": membership["id"],
                "role_id": role_id,
                "actor": user_id,
                "scope_type": scope_type,
                "scope_id": scope_id,
            },
        )
        await connection.execute(
            text("""
            insert into public.audit_logs(
                tenant_id, actor_user_id, action, resource_type,
                resource_id, request_id, ip_address, metadata
            )
            values(:tenant_id,:actor,'membership.invited','membership',:resource_id,:request_id,:ip,
                   jsonb_build_object('email',:email,'role_key',:role_key))
        """),
            {
                "tenant_id": tenant_id,
                "actor": user_id,
                "resource_id": str(membership["id"]),
                "request_id": _request_id(request),
                "ip": request.client.host if request.client else None,
                "email": payload.email.strip().lower(),
                "role_key": role_key,
            },
        )
        response_body = {
            **membership,
            "email": payload.email.strip().lower(),
            "role_key": role_key,
            "invitation_status": "sent",
        }
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=response_body,
        )
    return response_body


@router.get("/permissions", tags=["Access Control"], response_model=PageResponse)
async def list_permission_registry(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    actor = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, actor, "platform.roles.read"):
        raise HTTPException(status_code=403, detail="Missing platform.roles.read permission.")
    cursor_clause = ""
    params = {"limit": limit + 1}
    if cursor:
        cursor_clause = "where key > :cursor_key"
        params["cursor_key"] = decode_key_cursor(cursor)
    result = await session.execute(
        text(f"""
            select key,domain,action,description,resource,risk_level
            from public.permissions
            {cursor_clause}
            order by key
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
            next_cursor=encode_key_cursor(rows[-1]["key"]) if has_more and rows else None,
            request_id=_request_id(request),
        ),
    )


@router.put("/roles/{role_id}/permissions", tags=["Access Control"])
async def replace_role_permissions(
    role_id: UUID,
    payload: RolePermissionUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, actor, "platform.roles.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.roles.manage permission.")
    permission_keys = sorted(set(key.strip() for key in payload.permission_keys))
    if len(permission_keys) != len(payload.permission_keys):
        raise HTTPException(status_code=422, detail="Permission key tidak boleh duplikat.")
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"role.permissions.replace:{role_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        role_result = await connection.execute(
            text(
                "select id,key,tenant_id,scope_type from public.roles where id=:role_id for update"
            ),
            {"role_id": role_id},
        )
        role = role_result.mappings().first()
        if role is None:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan.")
        await _authorize_platform_resource(
            session,
            user_id=actor,
            permission="platform.roles.manage",
            resource={
                "id": str(role_id),
                "key": role["key"],
                "tenant_id": str(role["tenant_id"]) if role["tenant_id"] else None,
                "scope_type": role["scope_type"],
            },
            request_id=_request_id(request),
        )
        if role["scope_type"] == "platform":
            invalid = [key for key in permission_keys if not key.startswith("platform.")]
        else:
            invalid = [key for key in permission_keys if key.startswith("platform.")]
        if invalid:
            raise HTTPException(
                status_code=422, detail="Permission namespace tidak sesuai dengan scope role."
            )
        available = await connection.execute(
            text("select key from public.permissions where key=any(:keys)"),
            {"keys": permission_keys},
        )
        found = {row["key"] for row in available.mappings().all()}
        missing = sorted(set(permission_keys) - found)
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Permission tidak terdaftar: {', '.join(missing)}",
            )
        await connection.execute(
            text("delete from public.role_permissions where role_id=:role_id"),
            {"role_id": role_id},
        )
        if permission_keys:
            await connection.execute(
                text("""
                    insert into public.role_permissions(role_id,permission_key)
                    select :role_id,unnest(cast(:keys as text[]))
                """),
                {"role_id": role_id, "keys": permission_keys},
            )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values (
                  :tenant_id,:actor,'authorization.role_permissions.replaced','role',
                  :resource_id,:request_id,cast(:metadata as jsonb)
                )
            """),
            {
                "tenant_id": role["tenant_id"],
                "actor": actor,
                "resource_id": str(role_id),
                "request_id": _request_id(request),
                "metadata": _audit_metadata(request, {"permission_keys": permission_keys}),
            },
        )
        response_body = {"role_id": str(role_id), "permission_keys": permission_keys}
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.get("/roles", tags=["Access Control"], response_model=PageResponse)
async def list_role_templates(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    user_id = UUID(claims["sub"])
    is_platform_reader = await _has_platform_permission(session, user_id, "platform.roles.read")
    if is_platform_reader:
        _require_aal2(claims)
    else:
        memberships = await session.execute(
            text("""
                select tenant_id from public.memberships
                where user_id=:user_id and status='active'
            """),
            {"user_id": user_id},
        )
        tenant_ids = [row["tenant_id"] for row in memberships.mappings().all()]
        tenant_reader = False
        for tenant_id in tenant_ids:
            if await _has_tenant_permission(
                session, user_id, tenant_id, ("corporate.organization.read",)
            ):
                tenant_reader = True
                break
        if not tenant_reader:
            raise HTTPException(status_code=403, detail="Missing role catalogue read permission.")
    role_filter = "" if is_platform_reader else "and r.key not like 'platform_%'"
    cursor_clause = ""
    params = {"limit": limit + 1}
    if cursor:
        created_at, role_id = decode_time_id_cursor(cursor)
        cursor_clause = "and (r.created_at,r.id) < (:created_at,:cursor_id)"
        params.update({"created_at": created_at, "cursor_id": role_id})
    result = await session.execute(
        text(f"""
        select r.id,r.key,r.name,r.description,r.is_system,r.scope_type,r.tenant_id,r.created_at,
               coalesce(
                   array_agg(rp.permission_key)
                       filter (where rp.permission_key is not null),
                   '{{}}'
               ) as permissions
        from public.roles r left join public.role_permissions rp on rp.role_id=r.id
        where r.tenant_id is null {role_filter} {cursor_clause}
        group by r.id order by r.created_at desc,r.id desc
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
            next_cursor=(
                encode_time_id_cursor(rows[-1]["created_at"], rows[-1]["id"])
                if has_more and rows else None
            ),
            request_id=_request_id(request),
        ),
    )


@router.get("/tenants/{tenant_id}/memberships", tags=["Membership"], response_model=PageResponse)
async def list_tenant_memberships(
    tenant_id: UUID,
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    user_id = UUID(claims["sub"])
    context = None
    try:
        context, _ = await authorize_action(
            session,
            user_id=user_id,
            tenant_id=tenant_id,
            permission_key="corporate.organization.read",
            platform_permission="",
            aal=None,
            resource_type="corporate.organization",
            action="read",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
        )
    except HTTPException as exc:
        if exc.status_code != 403:
            raise
        _require_aal2(claims)
        await authorize_platform_action(
            session,
            user_id=user_id,
            permission_key="platform.memberships.read",
            resource_type="platform.memberships",
            action="read",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
        )
    params = {
        "limit": limit + 1,
        "tenant_id": tenant_id,
        "organization_id": context.organization_id if context else None,
        "organization_unit_id": context.organization_unit_id if context else None,
        "branch_id": context.branch_id if context else None,
        "department_id": context.department_id if context else None,
    }
    cursor_clause = ""
    if cursor:
        created_at, membership_id = decode_time_id_cursor(cursor)
        cursor_clause = "and (m.created_at,m.id) < (:cursor_created_at,:cursor_id)"
        params.update({"cursor_created_at": created_at, "cursor_id": membership_id})
    async with engine.connect() as connection:
        result = await connection.execute(
            text(f"""
            select
                m.id, m.tenant_id, m.user_id, m.organization_id, m.organization_unit_id,
                m.branch_id, m.department_id, p.display_name,
                p.email, m.status, m.joined_at, m.created_at,
                coalesce(
                    array_agg(distinct r.key) filter (where r.key is not null),
                    '{{}}'
                ) as role_keys,
                coalesce(
                    array_agg(distinct rp.permission_key)
                      filter (where rp.permission_key is not null),
                    '{{}}'
                ) as permissions
            from public.memberships m
            left join public.profiles p on p.user_id=m.user_id
            left join public.membership_roles mr on mr.membership_id=m.id
            left join public.roles r on r.id=mr.role_id
            left join public.role_permissions rp on rp.role_id=r.id
            where m.tenant_id=:tenant_id
              and (:organization_id is null or m.organization_id=:organization_id)
              and (:organization_unit_id is null or m.organization_unit_id=:organization_unit_id)
              and (:branch_id is null or m.branch_id=:branch_id)
              and (:department_id is null or m.department_id=:department_id)
              {cursor_clause}
            group by m.id,p.display_name,p.email
            order by m.created_at desc,m.id desc
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
                next_cursor=(
                    encode_time_id_cursor(rows[-1]["created_at"], rows[-1]["id"])
                    if has_more and rows else None
                ),
                request_id=_request_id(request),
            ),
        )


@router.get("/tenants/directory", tags=["Tenant Administration"], response_model=PageResponse)
async def list_platform_tenants(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> PageResponse:
    user_id = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, user_id, "platform.tenants.read"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.read permission.")
    params = {"limit": limit + 1}
    cursor_clause = ""
    if cursor:
        created_at, tenant_id = decode_time_id_cursor(cursor)
        cursor_clause = "where (created_at,id) < (:created_at,:cursor_id)"
        params.update({"created_at": created_at, "cursor_id": tenant_id})
    async with engine.connect() as connection:
        result = await connection.execute(
            text(f"""
            select id,name,slug,tenant_type,status,created_at,updated_at
            from public.tenants {cursor_clause}
            order by created_at desc,id desc
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
                next_cursor=(
                    encode_time_id_cursor(rows[-1]["created_at"], rows[-1]["id"])
                    if has_more and rows else None
                ),
                request_id=_request_id(request),
            ),
        )


class TenantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: str | None = Field(default=None, min_length=2, max_length=80)
    tenant_type: str | None = Field(default=None, pattern="^(corporate|provider|internal|other)$")
    status: str | None = Field(default=None, pattern="^(pending|active|suspended|archived)$")


@router.patch("/tenants/{tenant_id}", tags=["Tenant Administration"])
async def update_tenant(
    tenant_id: UUID,
    payload: TenantUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    user_id = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, user_id, "platform.tenants.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.manage permission.")
    values = {
        key: value
        for key, value in payload.model_dump(exclude_unset=True).items()
        if value is not None
    }
    if not values:
        raise HTTPException(status_code=422, detail="Tidak ada field tenant yang diperbarui.")
    if "slug" in values and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", values["slug"]):
        raise HTTPException(
            status_code=422, detail="Slug hanya boleh berisi huruf kecil, angka dan tanda hubung."
        )
    assignments = ", ".join(f"{key}=:{key}" for key in values)
    values["tenant_id"] = tenant_id
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=user_id,
            tenant_id=tenant_id,
            command_key=f"tenant.update:{tenant_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current_result = await connection.execute(
            text("""
                select id,tenant_type,status,name,slug from public.tenants
                where id=:tenant_id for update
            """),
            {"tenant_id": tenant_id},
        )
        current_tenant = current_result.mappings().first()
        if current_tenant is None:
            raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
        await _authorize_platform_resource(
            session,
            user_id=user_id,
            permission="platform.tenants.manage",
            resource={**dict(current_tenant), "id": str(tenant_id), "tenant_id": str(tenant_id)},
            request_id=_request_id(request),
        )
        result = await connection.execute(
            text(f"""
            update public.tenants set {assignments},updated_at=now()
            where id=:tenant_id
            returning id,name,slug,tenant_type,status,created_at,updated_at
        """),
            values,
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
        await connection.execute(
            text("""
            insert into public.audit_logs(
                actor_user_id, action, resource_type, resource_id,
                request_id, ip_address, metadata
            )
            values(
                :actor, 'tenant.updated', 'tenant', :resource_id,
                :request_id, :ip, cast(:metadata as jsonb)
            )
        """),
            {
                "actor": user_id,
                "resource_id": str(tenant_id),
                "request_id": _request_id(request),
                "ip": request.client.host if request.client else None,
                "metadata": _audit_metadata(request, values),
            },
        )
        response_body = dict(row)
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.delete("/tenants/{tenant_id}", tags=["Tenant Administration"])
async def archive_tenant(
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    user_id = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, user_id, "platform.tenants.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.manage permission.")
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=user_id,
            tenant_id=tenant_id,
            command_key=f"tenant.archive:{tenant_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload={},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current_result = await connection.execute(
            text("""
                select id,tenant_type,status,name,slug from public.tenants
                where id=:tenant_id for update
            """),
            {"tenant_id": tenant_id},
        )
        current_tenant = current_result.mappings().first()
        if current_tenant is None:
            raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
        await _authorize_platform_resource(
            session,
            user_id=user_id,
            permission="platform.tenants.manage",
            resource={**dict(current_tenant), "id": str(tenant_id), "tenant_id": str(tenant_id)},
            request_id=_request_id(request),
        )
        result = await connection.execute(
            text("""
            update public.tenants set status='archived',updated_at=now()
            where id=:tenant_id returning id,name,slug,status
        """),
            {"tenant_id": tenant_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
        await connection.execute(
            text("""
            insert into public.audit_logs(
                actor_user_id, action, resource_type, resource_id,
                request_id, ip_address
            )
            values(
                :actor, 'tenant.archived', 'tenant', :resource_id,
                :request_id, :ip
            )
        """),
            {
                "actor": user_id,
                "resource_id": str(tenant_id),
                "request_id": _request_id(request),
                "ip": request.client.host if request.client else None,
            },
        )
        response_body = dict(row)
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.post("/roles", status_code=status.HTTP_201_CREATED, tags=["Access Control"])
async def create_role(
    payload: RoleCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, actor, "platform.roles.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.roles.manage permission.")
    await _authorize_platform_resource(
        session,
        user_id=actor,
        permission="platform.roles.manage",
        resource={
            "id": payload.key,
            "key": payload.key,
            "scope_type": payload.scope_type,
            "name": payload.name,
            "is_system": False,
        },
        request_id=_request_id(request),
    )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key="role.create",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 201,
                content=reservation.replay_body or {},
            )
        existing = await connection.execute(
            text("select id from public.roles where key=:key and tenant_id is null"),
            {"key": payload.key},
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Role key already exists.")
        result = await connection.execute(
            text("""
                insert into public.roles(key,name,description,is_system,scope_type,tenant_id)
                values(:key,:name,:description,false,:scope_type,null)
                returning id,key,name,description,is_system,scope_type,tenant_id
            """),
            payload.model_dump(),
        )
        row = dict(result.mappings().one())
        row["permissions"] = []
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values (
                  :actor,'role.created','role',:resource_id,:request_id,cast(:metadata as jsonb)
                )
            """),
            {
                "actor": actor,
                "resource_id": str(row["id"]),
                "request_id": _request_id(request),
                "metadata": _audit_metadata(
                    request, {"key": row["key"], "scope_type": row["scope_type"]}
                ),
            },
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=row,
        )
    return row


@router.patch("/roles/{role_id}", tags=["Access Control"])
async def update_role(
    role_id: UUID,
    payload: RolePatch,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, actor, "platform.roles.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.roles.manage permission.")
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="No role changes supplied.")
    if any(value is None for value in values.values()):
        raise HTTPException(status_code=422, detail="Role name and description cannot be null.")
    assignments = ", ".join(f"{key}=:{key}" for key in values)
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"role.update:{role_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        target_result = await connection.execute(
            text(
                "select id,key,tenant_id,scope_type from public.roles where id=:role_id for update"
            ),
            {"role_id": role_id},
        )
        target_role = target_result.mappings().first()
        if (
            target_role is None
            or target_role["tenant_id"] is not None
            or target_role["scope_type"] != "platform"
        ):
            raise HTTPException(status_code=404, detail="Custom platform role not found.")
        await _authorize_platform_resource(
            session,
            user_id=actor,
            permission="platform.roles.manage",
            resource={
                "id": str(role_id),
                "key": target_role["key"],
                "scope_type": target_role["scope_type"],
            },
            request_id=_request_id(request),
        )
        result = await connection.execute(
            text(f"""
                update public.roles set {assignments}
                where id=:role_id and tenant_id is null and is_system=false
                returning id,key,name,description,is_system,scope_type,tenant_id
            """),
            {**values, "role_id": role_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Custom platform role not found.")
        row = dict(row)
        permissions = await connection.execute(
            text("""
                select permission_key from public.role_permissions
                where role_id=:id order by permission_key
            """),
            {"id": role_id},
        )
        row["permissions"] = [item["permission_key"] for item in permissions.mappings().all()]
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values (
                  :actor,'role.updated','role',:resource_id,:request_id,cast(:metadata as jsonb)
                )
            """),
            {
                "actor": actor,
                "resource_id": str(role_id),
                "request_id": _request_id(request),
                "metadata": _audit_metadata(request, {"fields": sorted(values)}),
            },
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=row,
        )
    return row


@router.delete("/roles/{role_id}", status_code=status.HTTP_200_OK, tags=["Access Control"])
async def delete_role(
    role_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, actor, "platform.roles.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.roles.manage permission.")
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"role.delete:{role_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload={},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        result = await connection.execute(
            text("""
                select id,key,is_system,scope_type,tenant_id from public.roles
                where id=:role_id and tenant_id is null for update
            """),
            {"role_id": role_id},
        )
        role = result.mappings().first()
        if role is None or role["is_system"]:
            raise HTTPException(status_code=404, detail="Custom role not found.")
        await _authorize_platform_resource(
            session,
            user_id=actor,
            permission="platform.roles.manage",
            resource={
                "id": str(role_id),
                "key": role["key"],
                "scope_type": role["scope_type"],
                "tenant_id": str(role["tenant_id"]) if role["tenant_id"] else None,
            },
            request_id=_request_id(request),
        )
        assigned = await connection.execute(
            text("select exists(select 1 from public.membership_roles where role_id=:role_id)"),
            {"role_id": role_id},
        )
        if assigned.scalar_one():
            raise HTTPException(status_code=409, detail="Role is still assigned to memberships.")
        await connection.execute(
            text("delete from public.role_permissions where role_id=:role_id"),
            {"role_id": role_id},
        )
        await connection.execute(
            text("delete from public.roles where id=:role_id"),
            {"role_id": role_id},
        )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values (
                  :actor,'role.deleted','role',:resource_id,:request_id,cast(:metadata as jsonb)
                )
            """),
            {
                "actor": actor,
                "resource_id": str(role_id),
                "request_id": _request_id(request),
                "metadata": _audit_metadata(request, {"key": role["key"]}),
            },
        )
        response_body = {"id": str(role_id), "status": "deleted"}
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body
