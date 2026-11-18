import json
import re
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter()
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
    result = await session.execute(
        text("""
        select exists (
          select 1 from public.memberships m
          join public.tenants t on t.id=m.tenant_id and t.status='active'
          join public.membership_roles mr on mr.membership_id=m.id
          join public.role_permissions rp on rp.role_id=mr.role_id
          where m.user_id=:user_id and m.status='active'
            and mr.scope_type='platform' and rp.permission_key=:permission
        )
    """),
        {"user_id": user_id, "permission": permission},
    )
    return bool(result.scalar_one())


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
          where m.user_id=:user_id
            and m.tenant_id=:tenant_id
            and m.status='active'
            and mr.scope_type='tenant'
            and r.key=:role_key
        )
    """),
        {"user_id": user_id, "tenant_id": tenant_id, "role_key": role_key},
    )
    return bool(result.scalar_one())


async def _has_tenant_permission(
    session: AsyncSession, user_id: UUID, tenant_id: UUID, permissions: tuple[str, ...]
) -> bool:
    result = await session.execute(
        text("""
        select exists (
          select 1 from public.memberships m
          join public.tenants t on t.id=m.tenant_id and t.status='active'
          join public.membership_roles mr on mr.membership_id=m.id
          join public.role_permissions rp on rp.role_id=mr.role_id
          where m.user_id=:user_id and m.tenant_id=:tenant_id and m.status='active'
            and mr.scope_type='tenant'
            and rp.permission_key = any(:permissions)
        )
    """),
        {"user_id": user_id, "tenant_id": tenant_id, "permissions": list(permissions)},
    )
    return bool(result.scalar_one())


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
    async with engine.begin() as connection:
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
                "request_id": request.headers.get("x-request-id"),
                "ip": request.client.host if request.client else None,
                "slug": payload.slug,
            },
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
    allowed = await _has_tenant_permission(
        session, user_id, tenant_id, ("corporate.organization.manage",)
    )
    if not allowed:
        _require_aal2(claims)
        allowed = await _has_platform_permission(session, user_id, "platform.tenants.manage")
    if not allowed:
        raise HTTPException(
            status_code=403, detail="Missing tenant organization management permission."
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
                "request_id": request.headers.get("x-request-id"),
                "ip": request.client.host if request.client else None,
            },
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
    allowed = await _has_tenant_permission(
        session, user_id, tenant_id, ("corporate.organization.manage",)
    )
    if not allowed:
        _require_aal2(claims)
        allowed = await _has_platform_permission(session, user_id, "platform.memberships.manage")
    if not allowed:
        raise HTTPException(
            status_code=403, detail="Missing tenant membership management permission."
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
                "organization_unit_id": payload.organization_unit_id,
                "branch_id": payload.branch_id,
                "department_id": payload.department_id,
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
            if payload.department_id
            else "branch"
            if payload.branch_id
            else "organization_unit"
            if payload.organization_unit_id
            else "organization"
            if payload.organization_id
            else "tenant"
        )
        scope_id = (
            payload.department_id
            or payload.branch_id
            or payload.organization_unit_id
            or payload.organization_id
        )
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
                "request_id": request.headers.get("x-request-id"),
                "ip": request.client.host if request.client else None,
                "email": payload.email.strip().lower(),
                "role_key": role_key,
            },
        )
    return {
        **membership,
        "email": payload.email.strip().lower(),
        "role_key": role_key,
        "invitation_status": "sent",
    }


@router.get("/permissions", tags=["Access Control"])
async def list_permission_registry(
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    result = await session.execute(
        text("""
            select key,domain,action,description,resource,risk_level
            from public.permissions
            order by domain,action,key
        """)
    )
    return [dict(row) for row in result.mappings().all()]


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
        role_result = await connection.execute(
            text(
                "select id,key,tenant_id,scope_type from public.roles where id=:role_id for update"
            ),
            {"role_id": role_id},
        )
        role = role_result.mappings().first()
        if role is None:
            raise HTTPException(status_code=404, detail="Role tidak ditemukan.")
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
                "request_id": request.headers.get("x-request-id"),
                "metadata": json.dumps({"permission_keys": permission_keys}),
            },
        )
    return {"role_id": str(role_id), "permission_keys": permission_keys}


@router.get("/roles", tags=["Access Control"])
async def list_role_templates(
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    user_id = UUID(claims["sub"])
    is_platform_reader = await _has_platform_permission(session, user_id, "platform.roles.read")
    if is_platform_reader:
        _require_aal2(claims)
    else:
        tenant_reader = await session.execute(
            text("""
                select exists (
                  select 1 from public.memberships m
                  join public.tenants t on t.id=m.tenant_id and t.status='active'
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.role_permissions rp on rp.role_id=mr.role_id
                  where m.user_id=:user_id and m.status='active'
                    and mr.scope_type='tenant'
                    and rp.permission_key='corporate.organization.read'
                )
            """),
            {"user_id": user_id},
        )
        if not bool(tenant_reader.scalar_one()):
            raise HTTPException(status_code=403, detail="Missing role catalogue read permission.")
    role_filter = "" if is_platform_reader else "and r.key not like 'platform_%'"
    result = await session.execute(
        text(f"""
        select r.id,r.key,r.name,r.description,r.is_system,
               coalesce(
                   array_agg(rp.permission_key)
                       filter (where rp.permission_key is not null),
                   '{{}}'
               ) as permissions
        from public.roles r left join public.role_permissions rp on rp.role_id=r.id
        where r.tenant_id is null {role_filter}
        group by r.id order by r.key
    """)
    )
    return [dict(row) for row in result.mappings().all()]


@router.get("/tenants/{tenant_id}/memberships", tags=["Membership"])
async def list_tenant_memberships(
    tenant_id: UUID,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    user_id = UUID(claims["sub"])
    allowed = await _has_tenant_permission(
        session, user_id, tenant_id, ("corporate.organization.read",)
    )
    if not allowed:
        _require_aal2(claims)
        allowed = await _has_platform_permission(session, user_id, "platform.memberships.read")
    if not allowed:
        raise HTTPException(status_code=403, detail="Missing tenant membership read permission.")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
            select
                m.id, m.tenant_id, m.user_id, p.display_name,
                p.email, m.status, m.joined_at, m.created_at,
                coalesce(
                    array_agg(distinct r.key) filter (where r.key is not null),
                    '{}'
                ) as role_keys
            from public.memberships m
            left join public.profiles p on p.user_id=m.user_id
            left join public.membership_roles mr on mr.membership_id=m.id
            left join public.roles r on r.id=mr.role_id
            where m.tenant_id=:tenant_id
            group by m.id,p.display_name,p.email
            order by m.created_at desc
        """),
            {"tenant_id": tenant_id},
        )
        return [dict(row) for row in result.mappings().all()]


@router.get("/tenants/directory", tags=["Tenant Administration"])
async def list_platform_tenants(
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    user_id = UUID(claims["sub"])
    _require_aal2(claims)
    if not await _has_platform_permission(session, user_id, "platform.tenants.read"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.read permission.")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
            select id,name,slug,tenant_type,status,created_at,updated_at
            from public.tenants order by created_at desc
        """)
        )
        return [dict(row) for row in result.mappings().all()]


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
                "request_id": request.headers.get("x-request-id"),
                "ip": request.client.host if request.client else None,
                "metadata": json.dumps(values, default=str),
            },
        )
    return dict(row)


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
                "request_id": request.headers.get("x-request-id"),
                "ip": request.client.host if request.client else None,
            },
        )
    return dict(row)
