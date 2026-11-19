"""Deterministic contract entitlement resolution and enforcement helpers."""

from datetime import date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

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
    workforce_delta: int = 0,
    ai_worker_delta: int = 0,
    ai_credits_required: int = 0,
) -> dict:
    rows = await resolve_effective_entitlements(connection, tenant_id)
    grant = next((item for item in rows if item["service_key"] == service_key), None)
    if grant is None:
        raise HTTPException(status_code=403, detail="Service is not included in an active contract.")
    if workforce_delta > 0 and grant["human_workforce_limit"] is not None:
        if workforce_delta > grant["human_workforce_limit"]:
            raise HTTPException(status_code=409, detail="Human workforce entitlement limit exceeded.")
    if ai_worker_delta > 0 and grant["ai_worker_limit"] is not None:
        if ai_worker_delta > grant["ai_worker_limit"]:
            raise HTTPException(status_code=409, detail="AI worker entitlement limit exceeded.")
    if ai_credits_required > 0 and grant["ai_credits_limit"] is not None:
        if ai_credits_required > grant["ai_credits_limit"]:
            raise HTTPException(status_code=409, detail="AI Credits contract limit exceeded.")
    return grant
