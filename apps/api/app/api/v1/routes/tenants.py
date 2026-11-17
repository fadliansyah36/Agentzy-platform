from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_claims
from app.db.session import engine, user_session
from app.schemas.identity import OrganizationRead, TenantRead

router = APIRouter()


@router.get("", response_model=list[TenantRead])
async def list_tenants(
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
) -> list[TenantRead]:
    result = await session.execute(text("""
        select t.id, t.name, t.slug, t.status, m.status as membership_status
        from public.tenants t
        join public.memberships m on m.tenant_id = t.id
        where m.user_id = :user_id and m.status = 'active' and t.status = 'active'
        order by t.name
    """), {"user_id": UUID(claims["sub"])})
    return [TenantRead(**dict(row)) for row in result.mappings().all()]


@router.get("/{tenant_id}/organizations", response_model=list[OrganizationRead])
async def list_organizations(
    tenant_id: UUID,
    claims: dict = Depends(current_claims),
    session: AsyncSession = Depends(user_session),
) -> list[OrganizationRead]:
    permission = await session.execute(text("""
        select exists (
          select 1
          from public.memberships m
          join public.membership_roles mr on mr.membership_id = m.id
          join public.role_permissions rp on rp.role_id = mr.role_id
          where m.tenant_id = :tenant_id
            and m.user_id = :user_id
            and m.status = 'active'
            and rp.permission_key = 'corporate.organization.read'
        ) or ( :aal2 = 'aal2' and exists (
          select 1 from public.memberships pm
          join public.membership_roles pmr on pmr.membership_id=pm.id
          join public.role_permissions prp on prp.role_id=pmr.role_id
          where pm.user_id=:user_id and pm.status='active' and prp.permission_key='platform.tenants.read'
        ))
    """), {"tenant_id": tenant_id, "user_id": UUID(claims["sub"]), "aal2": claims.get("aal")})
    if not permission.scalar_one():
        raise HTTPException(status_code=403, detail="Missing tenant organization read permission.")

    query = text("""
        select id, tenant_id, parent_id, name, slug, organization_type, status
        from public.organizations
        where tenant_id = :tenant_id and status = 'active'
        order by name
    """)
    if claims.get("aal") == "aal2":
        async with engine.connect() as connection:
            result = await connection.execute(query, {"tenant_id": tenant_id})
    else:
        result = await session.execute(query, {"tenant_id": tenant_id})
    return [OrganizationRead(**dict(row)) for row in result.mappings().all()]
