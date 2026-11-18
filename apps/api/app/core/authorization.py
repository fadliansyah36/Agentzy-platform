from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True, slots=True)
class TenantAccessContext:
    user_id: UUID
    tenant_id: UUID
    membership_id: UUID
    organization_id: UUID | None
    organization_unit_id: UUID | None
    branch_id: UUID | None
    department_id: UUID | None
    permissions: frozenset[str]
    role_keys: frozenset[str]


async def resolve_tenant_context(
    session: AsyncSession, user_id: UUID, tenant_id: UUID
) -> TenantAccessContext:
    result = await session.execute(
        text("""
            select m.id as membership_id,m.organization_id,m.organization_unit_id,
                   m.branch_id,m.department_id
            from public.memberships m join public.tenants t on t.id=m.tenant_id
            where m.user_id=:user_id and m.tenant_id=:tenant_id
              and m.status='active' and t.status='active'
        """),
        {"user_id": user_id, "tenant_id": tenant_id},
    )
    membership = result.mappings().first()
    if membership is None:
        raise HTTPException(status_code=404, detail="Tenant tidak tersedia untuk identity ini.")
    roles_result = await session.execute(
        text("""
            select distinct r.key as role_key,rp.permission_key
            from public.membership_roles mr
            join public.roles r on r.id=mr.role_id
            left join public.role_permissions rp on rp.role_id=r.id
            where mr.membership_id=:membership_id
              and (mr.valid_from is null or mr.valid_from<=now())
              and (mr.valid_until is null or mr.valid_until>now())
              and (r.tenant_id is null or r.tenant_id=:tenant_id)
              and (
                mr.scope_type='tenant'
                or (mr.scope_type='organization' and mr.scope_id=:organization_id)
                or (mr.scope_type='organization_unit' and mr.scope_id=:organization_unit_id)
                or (mr.scope_type='branch' and mr.scope_id=:branch_id)
                or (mr.scope_type='department' and mr.scope_id=:department_id)
              )
        """),
        {
            "membership_id": membership["membership_id"], "tenant_id": tenant_id,
            "organization_id": membership["organization_id"],
            "organization_unit_id": membership["organization_unit_id"],
            "branch_id": membership["branch_id"], "department_id": membership["department_id"],
        },
    )
    rows = roles_result.mappings().all()
    return TenantAccessContext(
        user_id=user_id, tenant_id=tenant_id, membership_id=membership["membership_id"],
        organization_id=membership["organization_id"],
        organization_unit_id=membership["organization_unit_id"],
        branch_id=membership["branch_id"], department_id=membership["department_id"],
        permissions=frozenset(row["permission_key"] for row in rows if row["permission_key"]),
        role_keys=frozenset(row["role_key"] for row in rows),
    )


async def has_platform_permission(
    session: AsyncSession, user_id: UUID, permission_key: str
) -> bool:
    result = await session.execute(
        text("""
            select exists (
              select 1 from public.memberships m
              join public.tenants t on t.id=m.tenant_id and t.status='active'
              join public.membership_roles mr on mr.membership_id=m.id
              join public.roles r on r.id=mr.role_id and r.tenant_id is null
              join public.role_permissions rp on rp.role_id=r.id
              where m.user_id=:user_id and m.status='active' and mr.scope_type='platform'
                and (mr.valid_from is null or mr.valid_from<=now())
                and (mr.valid_until is null or mr.valid_until>now())
                and rp.permission_key=:permission_key
            )
        """),
        {"user_id": user_id, "permission_key": permission_key},
    )
    return bool(result.scalar_one())


async def authorize_tenant(
    session: AsyncSession, *, user_id: UUID, tenant_id: UUID, permission_key: str,
    platform_permission: str, aal: str | None,
) -> TenantAccessContext | None:
    try:
        context = await resolve_tenant_context(session, user_id, tenant_id)
    except HTTPException as exc:
        if exc.status_code != 404:
            raise
        context = None
    if context is not None and permission_key in context.permissions:
        return context
    if aal == "aal2" and await has_platform_permission(session, user_id, platform_permission):
        return None
    raise HTTPException(status_code=403, detail="Akses tidak diizinkan.")


def require_permission(context: TenantAccessContext, permission_key: str) -> None:
    if permission_key not in context.permissions:
        raise HTTPException(status_code=403, detail="Akses tidak diizinkan.")


def authorize_object(
    context: TenantAccessContext, *, resource_tenant_id: UUID,
    organization_id: UUID | None = None, organization_unit_id: UUID | None = None,
    branch_id: UUID | None = None, department_id: UUID | None = None,
) -> None:
    if resource_tenant_id != context.tenant_id:
        raise HTTPException(status_code=404, detail="Resource tidak tersedia.")
    if context.organization_id and organization_id != context.organization_id:
        raise HTTPException(status_code=404, detail="Resource tidak tersedia.")
    if context.organization_unit_id and organization_unit_id != context.organization_unit_id:
        raise HTTPException(status_code=404, detail="Resource tidak tersedia.")
    if context.branch_id and branch_id != context.branch_id:
        raise HTTPException(status_code=404, detail="Resource tidak tersedia.")
    if context.department_id and department_id != context.department_id:
        raise HTTPException(status_code=404, detail="Resource tidak tersedia.")
