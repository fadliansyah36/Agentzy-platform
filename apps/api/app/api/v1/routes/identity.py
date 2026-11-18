from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_claims
from app.db.session import user_session
from app.schemas.identity import IdentityRead, MembershipRead

router = APIRouter()
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


@router.get("/me", response_model=IdentityRead)
async def read_identity(
    claims: dict = claims_dependency, session: AsyncSession = session_dependency
) -> IdentityRead:
    result = await session.execute(
        text("""
        select m.id, m.tenant_id, t.name as tenant_name, m.organization_id, m.status,
               coalesce(
                   array_agg(distinct r.key) filter (where r.key is not null),
                   '{}'
               ) as role_keys,
               coalesce(
                   array_agg(distinct rp.permission_key)
                       filter (where rp.permission_key is not null),
                   '{}'
               ) as permissions
        from public.memberships m
        join public.tenants t on t.id = m.tenant_id
        left join public.membership_roles mr on mr.membership_id = m.id
        left join public.roles r on r.id = mr.role_id
        left join public.role_permissions rp on rp.role_id = r.id
        where m.user_id = :user_id and m.status = 'active'
        group by m.id, m.tenant_id, t.name, m.organization_id, m.status
        order by t.name
    """),
        {"user_id": UUID(claims["sub"])},
    )
    memberships = [MembershipRead(**dict(row)) for row in result.mappings().all()]
    profile_result = await session.execute(
        text("select email, display_name from public.profiles where user_id=:user_id"),
        {"user_id": UUID(claims["sub"])},
    )
    profile = profile_result.mappings().first()
    metadata = claims.get("user_metadata") or {}
    return IdentityRead(
        user_id=UUID(claims["sub"]),
        email=(profile["email"] if profile else None) or claims.get("email"),
        display_name=(profile["display_name"] if profile else None)
        or metadata.get("full_name")
        or metadata.get("name"),
        memberships=memberships,
    )
