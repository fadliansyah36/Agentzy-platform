import re
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter()


class TenantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=80)
    tenant_type: str = Field(pattern="^(corporate|provider|internal|other)$")


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=80)
    organization_type: str = Field(default="company", pattern="^(company|division|department|branch|team)$")
    parent_id: UUID | None = None


class MembershipInvite(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    full_name: str = Field(min_length=1, max_length=120)
    role_key: str = Field(min_length=2, max_length=80)


async def _has_platform_permission(session: AsyncSession, user_id: UUID, permission: str) -> bool:
    result = await session.execute(text("""
        select exists (
          select 1 from public.memberships m
          join public.membership_roles mr on mr.membership_id=m.id
          join public.role_permissions rp on rp.role_id=mr.role_id
          where m.user_id=:user_id and m.status='active' and rp.permission_key=:permission
        )
    """), {"user_id": user_id, "permission": permission})
    return bool(result.scalar_one())


async def _has_tenant_permission(session: AsyncSession, user_id: UUID, tenant_id: UUID, permissions: tuple[str, ...]) -> bool:
    result = await session.execute(text("""
        select exists (
          select 1 from public.memberships m
          join public.membership_roles mr on mr.membership_id=m.id
          join public.role_permissions rp on rp.role_id=mr.role_id
          where m.user_id=:user_id and m.tenant_id=:tenant_id and m.status='active'
            and rp.permission_key = any(:permissions)
        )
    """), {"user_id": user_id, "tenant_id": tenant_id, "permissions": list(permissions)})
    return bool(result.scalar_one())


@router.post("/tenants", status_code=status.HTTP_201_CREATED, tags=["Tenant Administration"])
async def create_tenant(
    payload: TenantCreate,
    request: Request,
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", payload.slug):
        raise HTTPException(status_code=422, detail="Slug hanya boleh berisi huruf kecil, angka dan tanda hubung.")
    if not await _has_platform_permission(session, user_id, "platform.tenants.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.manage permission.")
    async with engine.begin() as connection:
        result = await connection.execute(text("""
            insert into public.tenants(name,slug,tenant_type,status,created_by)
            values(:name,:slug,:tenant_type,'pending',:actor)
            returning id,name,slug,tenant_type,status,created_at
        """), {"name": payload.name, "slug": payload.slug, "tenant_type": payload.tenant_type, "actor": user_id})
        row = dict(result.mappings().one())
        await connection.execute(text("""
            insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,request_id,ip_address,metadata)
            values(:actor,'tenant.created','tenant',:resource_id,:request_id,:ip, jsonb_build_object('slug',:slug))
        """), {"actor": user_id, "resource_id": str(row["id"]), "request_id": request.headers.get("x-request-id"),
               "ip": request.client.host if request.client else None, "slug": payload.slug})
    return row


@router.post("/tenants/{tenant_id}/organizations", status_code=status.HTTP_201_CREATED, tags=["Organization"])
async def create_organization(
    tenant_id: UUID,
    payload: OrganizationCreate,
    request: Request,
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    allowed = await _has_tenant_permission(session, user_id, tenant_id, ("corporate.organization.manage", "platform.tenants.manage"))
    if not allowed:
        raise HTTPException(status_code=403, detail="Missing tenant organization management permission.")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", payload.slug):
        raise HTTPException(status_code=422, detail="Slug hanya boleh berisi huruf kecil, angka dan tanda hubung.")
    async with engine.begin() as connection:
        result = await connection.execute(text("""
            insert into public.organizations(tenant_id,parent_id,name,slug,organization_type)
            values(:tenant_id,:parent_id,:name,:slug,:organization_type)
            returning id,tenant_id,parent_id,name,slug,organization_type,status,created_at
        """), {"tenant_id": tenant_id, "parent_id": payload.parent_id, "name": payload.name,
               "slug": payload.slug, "organization_type": payload.organization_type})
        row = dict(result.mappings().one())
        await connection.execute(text("""
            insert into public.audit_logs(tenant_id,actor_user_id,action,resource_type,resource_id,request_id,ip_address)
            values(:tenant_id,:actor,'organization.created','organization',:resource_id,:request_id,:ip)
        """), {"tenant_id": tenant_id, "actor": user_id, "resource_id": str(row["id"]),
               "request_id": request.headers.get("x-request-id"), "ip": request.client.host if request.client else None})
    return row


@router.post("/tenants/{tenant_id}/memberships/invite", status_code=status.HTTP_201_CREATED, tags=["Membership"])
async def invite_tenant_member(
    tenant_id: UUID,
    payload: MembershipInvite,
    request: Request,
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    allowed = await _has_tenant_permission(
        session, user_id, tenant_id, ("corporate.organization.manage", "platform.memberships.manage")
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Missing tenant membership management permission.")
    role_key = payload.role_key.strip().lower()
    if role_key.startswith("platform_"):
        raise HTTPException(status_code=422, detail="Platform roles cannot be assigned inside a tenant.")
    role_result = await session.execute(text("""
        select id from public.roles where key=:role_key and tenant_id is null
    """), {"role_key": role_key})
    role_id = role_result.scalar_one_or_none()
    if role_id is None:
        raise HTTPException(status_code=422, detail="Role template tidak ditemukan.")

    settings = get_settings()
    service_key = settings.supabase_service_role_key
    if not service_key:
        raise HTTPException(status_code=503, detail="Supabase Auth invitation belum dikonfigurasi.")
    invite_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/invite"
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                invite_url,
                params={"redirect_to": f"{settings.app_base_url.rstrip('/')}/corporate"},
                headers=headers,
                json={"email": payload.email.strip().lower(), "data": {"full_name": payload.full_name.strip()}},
            )
        if response.status_code >= 400:
            detail = response.json().get("msg") or response.json().get("message") or "Supabase Auth menolak undangan."
            raise HTTPException(status_code=400, detail=detail)
        invited_user_id = UUID(response.json()["id"])
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Gagal mengirim undangan melalui Supabase Auth.") from exc

    async with engine.begin() as connection:
        membership_result = await connection.execute(text("""
            insert into public.memberships(tenant_id,user_id,status)
            values(:tenant_id,:user_id,'active')
            on conflict(tenant_id,user_id) do update set status='active',updated_at=now()
            returning id,tenant_id,user_id,status,created_at
        """), {"tenant_id": tenant_id, "user_id": invited_user_id})
        membership = dict(membership_result.mappings().one())
        await connection.execute(text("""
            insert into public.membership_roles(membership_id,role_id,assigned_by)
            values(:membership_id,:role_id,:actor)
            on conflict(membership_id,role_id) do nothing
        """), {"membership_id": membership["id"], "role_id": role_id, "actor": user_id})
        await connection.execute(text("""
            insert into public.audit_logs(tenant_id,actor_user_id,action,resource_type,resource_id,request_id,ip_address,metadata)
            values(:tenant_id,:actor,'membership.invited','membership',:resource_id,:request_id,:ip,
                   jsonb_build_object('email',:email,'role_key',:role_key))
        """), {"tenant_id": tenant_id, "actor": user_id, "resource_id": str(membership["id"]),
               "request_id": request.headers.get("x-request-id"), "ip": request.client.host if request.client else None,
               "email": payload.email.strip().lower(), "role_key": role_key})
    return {**membership, "email": payload.email.strip().lower(), "role_key": role_key, "invitation_status": "sent"}


@router.get("/roles", tags=["Access Control"])
async def list_role_templates(
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    allowed = await _has_platform_permission(session, user_id, "platform.roles.read")
    if not allowed:
        result = await session.execute(text("""
            select exists (
              select 1 from public.memberships m
              join public.membership_roles mr on mr.membership_id=m.id
              join public.role_permissions rp on rp.role_id=mr.role_id
              where m.user_id=:user_id and m.status='active'
                and rp.permission_key='corporate.organization.read'
            )
        """), {"user_id": user_id})
        allowed = bool(result.scalar_one())
    if not allowed:
        raise HTTPException(status_code=403, detail="Missing role catalogue read permission.")
    result = await session.execute(text("""
        select r.id,r.key,r.name,r.description,r.is_system,
               coalesce(array_agg(rp.permission_key) filter (where rp.permission_key is not null),'{}') as permissions
        from public.roles r left join public.role_permissions rp on rp.role_id=r.id
        where r.tenant_id is null
        group by r.id order by r.key
    """))
    return [dict(row) for row in result.mappings().all()]


@router.get("/tenants/{tenant_id}/memberships", tags=["Membership"])
async def list_tenant_memberships(
    tenant_id: UUID,
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    allowed = await _has_tenant_permission(
        session, user_id, tenant_id, ("corporate.organization.read","platform.memberships.read")
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Missing tenant membership read permission.")
    async with engine.connect() as connection:
        result = await connection.execute(text("""
            select m.id,m.tenant_id,m.user_id,p.display_name,p.email,m.status,m.joined_at,m.created_at,
                   coalesce(array_agg(distinct r.key) filter (where r.key is not null),'{}') as role_keys
            from public.memberships m
            left join public.profiles p on p.user_id=m.user_id
            left join public.membership_roles mr on mr.membership_id=m.id
            left join public.roles r on r.id=mr.role_id
            where m.tenant_id=:tenant_id
            group by m.id,p.display_name,p.email
            order by m.created_at desc
        """), {"tenant_id": tenant_id})
        return [dict(row) for row in result.mappings().all()]


@router.get("/tenants/directory", tags=["Tenant Administration"])
async def list_platform_tenants(
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    if not await _has_platform_permission(session, user_id, "platform.tenants.read"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.read permission.")
    result = await session.execute(text("""
        select id,name,slug,tenant_type,status,created_at,updated_at
        from public.tenants order by created_at desc
    """))
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
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    if not await _has_platform_permission(session, user_id, "platform.tenants.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.manage permission.")
    values = payload.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=422, detail="Tidak ada field tenant yang diperbarui.")
    if "slug" in values and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", values["slug"]):
        raise HTTPException(status_code=422, detail="Slug hanya boleh berisi huruf kecil, angka dan tanda hubung.")
    assignments = ", ".join(f"{key}=:{key}" for key in values)
    values["tenant_id"] = tenant_id
    async with engine.begin() as connection:
        result = await connection.execute(text(f"""
            update public.tenants set {assignments},updated_at=now()
            where id=:tenant_id
            returning id,name,slug,tenant_type,status,created_at,updated_at
        """), values)
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
        await connection.execute(text("""
            insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,request_id,ip_address,metadata)
            values(:actor,'tenant.updated','tenant',:resource_id,:request_id,:ip,cast(:metadata as jsonb))
        """), {"actor": user_id, "resource_id": str(tenant_id), "request_id": request.headers.get("x-request-id"),
               "ip": request.client.host if request.client else None, "metadata": __import__('json').dumps(values, default=str)})
    return dict(row)


@router.delete("/tenants/{tenant_id}", tags=["Tenant Administration"])
async def archive_tenant(
    tenant_id: UUID,
    request: Request,
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
):
    user_id = UUID(claims["sub"])
    if not await _has_platform_permission(session, user_id, "platform.tenants.manage"):
        raise HTTPException(status_code=403, detail="Missing platform.tenants.manage permission.")
    async with engine.begin() as connection:
        result = await connection.execute(text("""
            update public.tenants set status='archived',updated_at=now()
            where id=:tenant_id returning id,name,slug,status
        """), {"tenant_id": tenant_id})
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Tenant tidak ditemukan.")
        await connection.execute(text("""
            insert into public.audit_logs(actor_user_id,action,resource_type,resource_id,request_id,ip_address)
            values(:actor,'tenant.archived','tenant',:resource_id,:request_id,:ip)
        """), {"actor": user_id, "resource_id": str(tenant_id), "request_id": request.headers.get("x-request-id"),
               "ip": request.client.host if request.client else None})
    return dict(row)
