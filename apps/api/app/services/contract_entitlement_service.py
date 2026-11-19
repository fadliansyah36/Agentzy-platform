"""Contract entitlement resolution and capacity enforcement."""

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession

async def resolve_effective_entitlements(
    connection: AsyncConnection, tenant_id: UUID
) -> list[dict]:
    result = await connection.execute(
        text("""
            select g.id,g.contract_id,g.contract_version_id,g.service_key,
                   g.service_scope,g.sla,g.kpi,g.human_workforce_limit,
                   g.ai_worker_limit,g.ai_credits_limit,g.effective_start,g.effective_end
            from public.contract_entitlement_grants g
            join public.contracts c on c.id=g.contract_id and c.tenant_id=g.tenant_id
            where g.tenant_id=:tenant_id and g.status='active' and c.status='active'
              and (g.effective_start is null or g.effective_start<=current_date)
              and (g.effective_end is null or g.effective_end>=current_date)
              and (c.effective_start is null or c.effective_start<=current_date)
              and (c.effective_end is null or c.effective_end>=current_date)
            order by g.service_key
        """),
        {"tenant_id": tenant_id},
    )
    return [dict(row) for row in result.mappings().all()]


async def require_service_entitlement(
    connection: AsyncConnection,
    tenant_id: UUID,
    service_key: str,
    *,
    current_workforce: int = 0,
    requested_workforce: int = 0,
    current_ai_workers: int = 0,
    requested_ai_workers: int = 0,
    ai_credits_required: int = 0,
) -> dict:
    rows = await resolve_effective_entitlements(connection, tenant_id)
    grant = next((item for item in rows if item["service_key"] == service_key), None)
    if grant is None:
        raise HTTPException(status_code=403, detail="Service is not included in an active contract.")
    if grant["human_workforce_limit"] is not None:
        if current_workforce + requested_workforce > grant["human_workforce_limit"]:
            raise HTTPException(status_code=409, detail="Human workforce entitlement limit exceeded.")
    if grant["ai_worker_limit"] is not None:
        if current_ai_workers + requested_ai_workers > grant["ai_worker_limit"]:
            raise HTTPException(status_code=409, detail="AI worker entitlement limit exceeded.")
    if grant["ai_credits_limit"] is not None and ai_credits_required > grant["ai_credits_limit"]:
        raise HTTPException(status_code=409, detail="AI Credits contract limit exceeded.")
    return grant


HUMAN_WORKFORCE_ROLE_KEYS = (
    "affiliate_worker", "sales_official", "sales_manager", "sales_supervisor",
    "support_agent", "technician", "field_quality_inspector",
)
AI_WORKFORCE_ROLE_KEYS = ("ai_workforce_operator", "ai_worker_supervisor")


async def assert_membership_entitlement_capacity(
    session: AsyncSession,
    tenant_id: UUID,
    role_key: str,
    exclude_membership_id: UUID | None = None,
) -> None:
    if role_key in HUMAN_WORKFORCE_ROLE_KEYS:
        limit_column = "human_workforce_limit"
        role_keys = list(HUMAN_WORKFORCE_ROLE_KEYS)
        label = "Human Workforce"
    elif role_key in AI_WORKFORCE_ROLE_KEYS:
        limit_column = "ai_worker_limit"
        role_keys = list(AI_WORKFORCE_ROLE_KEYS)
        label = "AI Workforce"
    else:
        return

    result = await session.execute(
        text(f"""
            select coalesce(sum(g.{limit_column}),0) as entitlement_limit,
                   count(*) filter (where g.{limit_column} is not null) as configured_grants
            from public.contract_entitlement_grants g
            join public.contracts c on c.id=g.contract_id and c.tenant_id=g.tenant_id
            where g.tenant_id=:tenant and g.status='active' and c.status='active'
              and (g.effective_start is null or g.effective_start<=current_date)
              and (g.effective_end is null or g.effective_end>=current_date)
              and (c.effective_start is null or c.effective_start<=current_date)
              and (c.effective_end is null or c.effective_end>=current_date)
        """),
        {"tenant": tenant_id},
    )
    grant = result.mappings().one()
    if not grant["configured_grants"]:
        raise HTTPException(
            status_code=403,
            detail=f"{label} tidak memiliki entitlement aktif pada kontrak tenant.",
        )

    usage = await session.execute(
        text("""
            select count(distinct m.id)
            from public.memberships m
            join public.membership_roles mr on mr.membership_id=m.id
            join public.roles r on r.id=mr.role_id
            where m.tenant_id=:tenant and m.status in ('active','invited','pending')
              and (:exclude_membership_id is null or m.id<>:exclude_membership_id)
              and r.key=any(:role_keys)
              and mr.scope_type='tenant' and mr.scope_id is null
              and mr.valid_from<=now() and (mr.valid_until is null or mr.valid_until>now())
        """),
        {
            "tenant": tenant_id,
            "role_keys": role_keys,
            "exclude_membership_id": exclude_membership_id,
        },
    )
    current_usage = usage.scalar_one()
    if current_usage >= grant["entitlement_limit"]:
        raise HTTPException(
            status_code=409,
            detail=f"{label} contract entitlement limit reached.",
        )
