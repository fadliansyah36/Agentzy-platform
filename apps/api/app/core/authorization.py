import json
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.abac import PolicyDecision, evaluate_policies


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
            "membership_id": membership["membership_id"],
            "tenant_id": tenant_id,
            "organization_id": membership["organization_id"],
            "organization_unit_id": membership["organization_unit_id"],
            "branch_id": membership["branch_id"],
            "department_id": membership["department_id"],
        },
    )
    rows = roles_result.mappings().all()
    return TenantAccessContext(
        user_id=user_id,
        tenant_id=tenant_id,
        membership_id=membership["membership_id"],
        organization_id=membership["organization_id"],
        organization_unit_id=membership["organization_unit_id"],
        branch_id=membership["branch_id"],
        department_id=membership["department_id"],
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
    session: AsyncSession,
    *,
    user_id: UUID,
    tenant_id: UUID,
    permission_key: str,
    platform_permission: str,
    aal: str | None,
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
    if aal == "aal2" and platform_permission:
        from app.db.session import engine

        async with engine.begin() as connection:
            emergency = await connection.execute(
                text("""
                    select id from public.break_glass_requests
                    where requester_user_id=:user_id and status='active'
                      and expires_at > now()
                      and requested_scope->'permission_keys' @> jsonb_build_array(:permission)
                      and requested_scope->'tenant_ids' @> jsonb_build_array(:tenant_id)
                    order by activated_at desc limit 1
                """),
                {
                    "user_id": user_id,
                    "permission": platform_permission,
                    "tenant_id": str(tenant_id),
                },
            )
            break_glass_id = emergency.scalar_one_or_none()
            if break_glass_id is not None:
                await connection.execute(
                    text("""
                        insert into public.audit_logs(
                          tenant_id,actor_user_id,action,resource_type,resource_id,metadata
                        ) values (
                          :tenant_id,:actor,'authorization.break_glass.used',
                          'tenant',:resource_id,cast(:metadata as jsonb)
                        )
                    """),
                    {
                        "tenant_id": tenant_id,
                        "actor": user_id,
                        "resource_id": str(tenant_id),
                        "metadata": json.dumps(
                            {
                                "break_glass_id": str(break_glass_id),
                                "permission_key": platform_permission,
                            }
                        ),
                    },
                )
                return None
    raise HTTPException(status_code=403, detail="Akses tidak diizinkan.")


def require_permission(context: TenantAccessContext, permission_key: str) -> None:
    if permission_key not in context.permissions:
        raise HTTPException(status_code=403, detail="Akses tidak diizinkan.")


def authorize_object(
    context: TenantAccessContext,
    *,
    resource_tenant_id: UUID,
    organization_id: UUID | None = None,
    organization_unit_id: UUID | None = None,
    branch_id: UUID | None = None,
    department_id: UUID | None = None,
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


async def authorize_action(
    session: AsyncSession,
    *,
    user_id: UUID,
    tenant_id: UUID,
    permission_key: str,
    platform_permission: str,
    aal: str | None,
    resource_type: str,
    action: str,
    resource: dict,
    request_id: str | None = None,
    request_context: dict | None = None,
) -> tuple[TenantAccessContext | None, PolicyDecision]:
    """Enforce membership/RBAC then dynamic ABAC and persist a minimal decision audit."""
    break_glass_id = None
    try:
        tenant_context = await authorize_tenant(
            session,
            user_id=user_id,
            tenant_id=tenant_id,
            permission_key=permission_key,
            platform_permission=platform_permission,
            aal=aal,
        )
    except HTTPException as exc:
        if exc.status_code != 403 or aal != "aal2":
            raise
        from app.db.session import engine

        async with engine.connect() as connection:
            emergency = await connection.execute(
                text("""
                    select id from public.break_glass_requests
                    where requester_user_id=:user_id and status='active'
                      and expires_at > now()
                      and (
                        requested_scope->'permission_keys' @> jsonb_build_array(:permission_key)
                        or requested_scope->'permission_keys' @> jsonb_build_array(
                            :platform_permission
                        )
                      )
                      and requested_scope->'tenant_ids' @> jsonb_build_array(:tenant_id)
                    order by activated_at desc limit 1
                """),
                {
                    "user_id": user_id,
                    "permission_key": permission_key,
                    "platform_permission": platform_permission,
                    "tenant_id": str(tenant_id),
                },
            )
            break_glass_id = emergency.scalar_one_or_none()
        if break_glass_id is None:
            raise
        tenant_context = None
    if tenant_context is None:
        subject = {
            "id": str(user_id),
            "tenant_id": str(tenant_id),
            "membership_id": None,
            "roles": ["platform"],
            "permissions": sorted({permission_key, platform_permission}),
        }
    else:
        subject = {
            "id": str(user_id),
            "tenant_id": str(tenant_context.tenant_id),
            "membership_id": str(tenant_context.membership_id),
            "organization_id": str(tenant_context.organization_id)
            if tenant_context.organization_id
            else None,
            "organization_unit_id": str(tenant_context.organization_unit_id)
            if tenant_context.organization_unit_id
            else None,
            "branch_id": str(tenant_context.branch_id) if tenant_context.branch_id else None,
            "department_id": str(tenant_context.department_id)
            if tenant_context.department_id
            else None,
            "roles": sorted(tenant_context.role_keys),
            "permissions": sorted(tenant_context.permissions),
        }

    resource_context = {
        **resource,
        "tenant_id": str(tenant_id),
        "type": resource_type,
    }
    try:
        from app.db.session import engine

        # Policy documents are intentionally private. Query only the resolved tenant
        # and global baseline policies through the backend's private database role.
        async with engine.connect() as connection:
            result = await connection.execute(
                text("""
                    select id,tenant_id,resource,action,effect,conditions,priority,status,
                           version,effective_from,effective_until
                    from public.access_policies
                    where status='active'
                      and resource=:resource
                      and action=:action
                      and (tenant_id is null or tenant_id=:tenant_id)
                    order by priority desc,id
                """),
                {
                    "resource": resource_type,
                    "action": action,
                    "tenant_id": tenant_id,
                },
            )
            policies = [dict(row) for row in result.mappings().all()]
        decision = evaluate_policies(
            policies=policies,
            tenant_id=str(tenant_id),
            resource=resource_context,
            action=action,
            subject=subject,
            request_context=request_context or {},
            now=datetime.now(UTC),
        )
        async with engine.begin() as connection:
            await connection.execute(
                text("""
                    insert into public.audit_logs(
                      tenant_id,actor_user_id,action,resource_type,resource_id,
                      request_id,metadata
                    ) values (
                      :tenant_id,:actor,:audit_action,:resource_type,
                      :resource_id,:request_id,cast(:metadata as jsonb)
                    )
                """),
                {
                    "tenant_id": tenant_id,
                    "actor": user_id,
                    "audit_action": (
                        "authorization.break_glass.used"
                        if break_glass_id
                        else "authorization.abac.evaluated"
                    ),
                    "resource_type": resource_type,
                    "resource_id": str(resource.get("id", "")) or None,
                    "request_id": request_id,
                    "metadata": json.dumps(
                        {
                            "decision": decision.decision,
                            "reason_code": decision.reason_code,
                            "matched_policies": decision.matched_policies,
                            "policy_versions": decision.policy_versions,
                            "evaluated_at": decision.evaluated_at,
                            "break_glass_id": str(break_glass_id) if break_glass_id else None,
                        },
                        default=str,
                    ),
                },
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Authorization policy evaluation is temporarily unavailable.",
        ) from exc

    if decision.decision != "ALLOW":
        raise HTTPException(status_code=403, detail="Akses tidak diizinkan.")
    return tenant_context, decision


async def authorize_platform_action(
    session: AsyncSession,
    *,
    user_id: UUID,
    permission_key: str,
    resource_type: str,
    action: str,
    resource: dict,
    request_id: str | None = None,
    request_context: dict | None = None,
) -> PolicyDecision:
    """Enforce a platform role permission through global ABAC policies."""
    break_glass_id = None
    if not await has_platform_permission(session, user_id, permission_key):
        from app.db.session import engine

        async with engine.connect() as connection:
            emergency = await connection.execute(
                text("""
                    select id from public.break_glass_requests
                    where requester_user_id=:user_id and status='active'
                      and expires_at > now()
                      and requested_scope->'permission_keys' @> jsonb_build_array(:permission_key)
                      and coalesce(requested_scope->'tenant_ids','[]'::jsonb) = '[]'::jsonb
                    order by activated_at desc limit 1
                """),
                {"user_id": user_id, "permission_key": permission_key},
            )
            break_glass_id = emergency.scalar_one_or_none()
        if break_glass_id is None:
            raise HTTPException(status_code=403, detail="Akses platform tidak diizinkan.")
    subject = {
        "id": str(user_id),
        "roles": ["platform"],
        "permissions": [permission_key],
    }
    resource_context = {**resource, "type": resource_type}
    try:
        from app.db.session import engine

        async with engine.connect() as connection:
            result = await connection.execute(
                text("""
                    select id,tenant_id,resource,action,effect,conditions,priority,status,
                           version,effective_from,effective_until
                    from public.access_policies
                    where tenant_id is null and status='active'
                      and resource=:resource and action=:action
                    order by priority desc,id
                """),
                {"resource": resource_type, "action": action},
            )
            policies = [dict(row) for row in result.mappings().all()]
        decision = evaluate_policies(
            policies=policies,
            tenant_id="platform",
            resource=resource_context,
            action=action,
            subject=subject,
            request_context=request_context or {},
            now=datetime.now(UTC),
        )
        async with engine.begin() as connection:
            await connection.execute(
                text("""
                    insert into public.audit_logs(
                      actor_user_id,action,resource_type,resource_id,request_id,metadata
                    ) values (
                      :actor,:audit_action,:resource_type,
                      :resource_id,:request_id,cast(:metadata as jsonb)
                    )
                """),
                {
                    "actor": user_id,
                    "audit_action": (
                        "authorization.break_glass.used"
                        if break_glass_id
                        else "authorization.platform_abac.evaluated"
                    ),
                    "resource_type": resource_type,
                    "resource_id": str(resource.get("id", "")) or None,
                    "request_id": request_id,
                    "metadata": json.dumps(
                        {
                            "decision": decision.decision,
                            "reason_code": decision.reason_code,
                            "matched_policies": decision.matched_policies,
                            "policy_versions": decision.policy_versions,
                            "evaluated_at": decision.evaluated_at,
                        },
                        default=str,
                    ),
                },
            )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=503,
            detail="Platform authorization policy evaluation is temporarily unavailable.",
        ) from exc
    if decision.decision != "ALLOW":
        raise HTTPException(status_code=403, detail="Akses platform tidak diizinkan.")
    return decision
