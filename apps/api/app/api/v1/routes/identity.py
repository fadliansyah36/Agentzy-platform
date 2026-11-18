import json
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import current_claims
from app.db.session import engine, user_session
from app.schemas.identity import IdentityRead, MembershipRead

router = APIRouter()
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


class ProfilePatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    locale: str | None = Field(default=None, min_length=2, max_length=16)
    timezone: str | None = Field(default=None, min_length=3, max_length=64)

    @model_validator(mode="after")
    def require_changes(self):
        if not self.model_fields_set:
            raise ValueError("Minimal satu field profile harus diperbarui.")
        return self


@router.get("/me", response_model=IdentityRead)
async def read_identity(
    claims: dict = claims_dependency, session: AsyncSession = session_dependency
) -> IdentityRead:
    user_id = UUID(claims["sub"])
    result = await session.execute(
        text("""
            select m.id, m.tenant_id, t.name as tenant_name, m.organization_id,
                   m.organization_unit_id,m.branch_id,m.department_id,m.status,
                   coalesce(
                     array_agg(distinct r.key) filter (where r.key is not null), '{}'
                   ) as role_keys,
                   coalesce(array_agg(distinct rp.permission_key)
                     filter (where rp.permission_key is not null), '{}') as permissions
            from public.memberships m
            join public.tenants t on t.id=m.tenant_id and t.status='active'
            left join public.membership_roles mr on mr.membership_id=m.id
              and (mr.valid_from is null or mr.valid_from <= now())
              and (mr.valid_until is null or mr.valid_until > now())
              and (
                mr.scope_type in ('tenant','platform')
                or (mr.scope_type='organization' and mr.scope_id=m.organization_id)
                or (mr.scope_type='organization_unit' and mr.scope_id=m.organization_unit_id)
                or (mr.scope_type='branch' and mr.scope_id=m.branch_id)
                or (mr.scope_type='department' and mr.scope_id=m.department_id)
              )
            left join public.roles r on r.id=mr.role_id
              and (r.tenant_id is null or r.tenant_id=m.tenant_id)
            left join public.role_permissions rp on rp.role_id=r.id
            where m.user_id=:user_id and m.status='active'
            group by m.id,m.tenant_id,t.name,m.organization_id,m.organization_unit_id,
                     m.branch_id,m.department_id,m.status
            order by t.name
        """),
        {"user_id": user_id},
    )
    memberships = [MembershipRead(**dict(row)) for row in result.mappings().all()]
    profile_result = await session.execute(
        text("select email,display_name from public.profiles where user_id=:user_id"),
        {"user_id": user_id},
    )
    profile = profile_result.mappings().first()
    metadata = claims.get("user_metadata") or {}
    return IdentityRead(
        user_id=user_id,
        email=(profile["email"] if profile else None) or claims.get("email"),
        display_name=(profile["display_name"] if profile else None)
        or metadata.get("full_name")
        or metadata.get("name"),
        memberships=memberships,
    )


@router.patch("/me", response_model=IdentityRead)
async def update_identity(
    payload: ProfilePatch,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
) -> IdentityRead:
    user_id = UUID(claims["sub"])
    values = payload.model_dump(exclude_unset=True)
    assignments = ", ".join(f"{key}=:{key}" for key in values)
    values["user_id"] = user_id
    async with engine.begin() as connection:
        await connection.execute(
            text(f"""
                insert into public.profiles(user_id,display_name,locale,timezone)
                values(:user_id,:display_name,:locale,:timezone)
                on conflict(user_id) do update set {assignments},updated_at=now()
                returning user_id,display_name,email
            """),
            {
                "user_id": user_id,
                "display_name": values.get("display_name"),
                "locale": values.get("locale", "id-ID"),
                "timezone": values.get("timezone", "Asia/Jakarta"),
                **{k: v for k, v in values.items() if k != "user_id"},
            },
        )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values (
                  :actor,'identity.profile.updated','profile',:resource_id,:request_id,
                  cast(:metadata as jsonb)
                )
            """),
            {
                "actor": user_id,
                "resource_id": str(user_id),
                "request_id": request.headers.get("x-request-id"),
                "metadata": json.dumps(values, default=str),
            },
        )

    # Re-read through the same authenticated/RLS-scoped identity path.
    return await read_identity(claims=claims, session=session)


@router.get("/me/permissions")
async def read_my_permissions(
    claims: dict = claims_dependency, session: AsyncSession = session_dependency
):
    user_id = UUID(claims["sub"])
    result = await session.execute(
        text("""
            select m.id as membership_id,m.tenant_id,t.name as tenant_name,
                   m.organization_id,m.status,
                   coalesce(
                     array_agg(distinct r.key) filter (where r.key is not null), '{}'
                   ) as roles,
                   coalesce(array_agg(distinct rp.permission_key)
                     filter (where rp.permission_key is not null),'{}') as permissions
            from public.memberships m
            join public.tenants t on t.id=m.tenant_id and t.status='active'
            left join public.membership_roles mr on mr.membership_id=m.id
              and (mr.valid_from is null or mr.valid_from <= now())
              and (mr.valid_until is null or mr.valid_until > now())
              and (
                mr.scope_type in ('tenant','platform')
                or (mr.scope_type='organization' and mr.scope_id=m.organization_id)
                or (mr.scope_type='organization_unit' and mr.scope_id=m.organization_unit_id)
                or (mr.scope_type='branch' and mr.scope_id=m.branch_id)
                or (mr.scope_type='department' and mr.scope_id=m.department_id)
              )
            left join public.roles r on r.id=mr.role_id
              and (r.tenant_id is null or r.tenant_id=m.tenant_id)
            left join public.role_permissions rp on rp.role_id=r.id
            where m.user_id=:user_id and m.status='active'
            group by m.id,m.tenant_id,t.name,m.organization_id,m.organization_unit_id,
                     m.branch_id,m.department_id,m.status
            order by t.name
        """),
        {"user_id": user_id},
    )
    memberships = [dict(row) for row in result.mappings().all()]
    return {"user_id": str(user_id), "memberships": memberships}


@router.get("/me/invitations")
async def list_my_invitations(claims: dict = claims_dependency):
    user_id = UUID(claims["sub"])
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
            select m.id,m.tenant_id,t.name as tenant_name,m.invitation_expires_at,
                   coalesce(
                     array_agg(distinct r.key) filter (where r.key is not null), '{}'
                   ) as role_keys,
                   coalesce(
                     array_agg(distinct rp.permission_key)
                       filter (where rp.permission_key is not null), '{}'
                   ) as permission_keys
            from public.memberships m
            join public.tenants t on t.id=m.tenant_id
            left join public.membership_roles mr on mr.membership_id=m.id
            left join public.roles r on r.id=mr.role_id
            left join public.role_permissions rp on rp.role_id=r.id
            where m.user_id=:user_id and m.status='invited' and t.status='active'
              and (m.invitation_expires_at is null or m.invitation_expires_at>now())
            group by m.id,m.tenant_id,t.name,m.invitation_expires_at
            order by m.invitation_expires_at
        """),
            {"user_id": user_id},
        )
    return {"invitations": [dict(row) for row in result.mappings().all()]}


@router.post("/auth/session/revoke", status_code=202)
async def revoke_sessions(request: Request, claims: dict = claims_dependency):
    user_id = UUID(claims["sub"])
    session_id = UUID(claims["session_id"])
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                insert into public.revoked_sessions(
                   session_id,user_id,revoked_at,expires_at,reason,request_id
                 )
                select s.id,s.user_id,now(),coalesce(s.not_after,now()+interval '24 hours'),
                       'user_requested_logout',:request_id
                from auth.sessions s
                where s.user_id=:user_id
                  and (s.not_after is null or s.not_after > now())
                on conflict(session_id) do update
                  set revoked_at=excluded.revoked_at,
                      expires_at=excluded.expires_at,
                      reason=excluded.reason,
                      request_id=excluded.request_id
            """),
            {"user_id": user_id, "request_id": request.headers.get("x-request-id")},
        )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values (
                  :actor,'auth.sessions.revoked','auth_session',:resource_id,:request_id,
                  jsonb_build_object('scope','all_sessions')
                )
            """),
            {
                "actor": user_id,
                "resource_id": str(session_id),
                "request_id": request.headers.get("x-request-id"),
            },
        )
    return {"status": "revoked", "scope": "all_sessions"}
