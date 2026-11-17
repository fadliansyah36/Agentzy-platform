from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import current_claims
from app.db.session import user_session
from app.schemas.identity import OrganizationRead, TenantRead

router = APIRouter()


@router.get("", response_model=list[TenantRead])
async def list_tenants(claims: dict = Depends(current_claims), session: AsyncSession = Depends(user_session)) -> list[TenantRead]:
    result = await session.execute(text("""
        select t.id, t.name, t.slug, t.status, m.status as membership_status
        from public.tenants t join public.memberships m on m.tenant_id = t.id
        where m.user_id = :user_id and m.status = 'active' and t.status = 'active' order by t.name
    """), {"user_id": UUID(claims["sub"])})
    return [TenantRead(**dict(row)) for row in result.mappings().all()]


@router.get("/{tenant_id}/organizations", response_model=list[OrganizationRead])
async def list_organizations(tenant_id: UUID, claims: dict = Depends(current_claims),
                             session: AsyncSession = Depends(user_session)) -> list[OrganizationRead]:
    result = await session.execute(text("""
        select id, tenant_id, parent_id, name, slug, organization_type, status
        from public.organizations where tenant_id = :tenant_id and status = 'active' order by name
    """), {"tenant_id": tenant_id})
    return [OrganizationRead(**dict(row)) for row in result.mappings().all()]
