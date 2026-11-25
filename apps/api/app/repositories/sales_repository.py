"""Tenant-scoped repository helpers for the Phase 05 sales bounded context."""
from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def get_lead_for_tenant(connection: AsyncConnection, tenant_id: UUID, lead_id: UUID) -> dict[str, Any] | None:
    result=await connection.execute(text("""
      select l.*,c.customer_name,c.contact_name,c.email,c.phone,c.service_address,c.region_code
      from public.sales_leads l
      join public.sales_customers c on c.id=l.customer_id and c.tenant_id=l.tenant_id
      where l.tenant_id=:tenant and l.id=:id
    """),{"tenant":tenant_id,"id":lead_id})
    row=result.mappings().first()
    return dict(row) if row else None


async def get_order_for_tenant(connection: AsyncConnection, tenant_id: UUID, order_id: UUID) -> dict[str, Any] | None:
    result=await connection.execute(text("""
      select o.id,o.lead_id,o.status,l.assigned_user_id
      from public.sales_orders o
      join public.sales_leads l on l.id=o.lead_id and l.tenant_id=o.tenant_id
      where o.tenant_id=:tenant and o.id=:id
    """),{"tenant":tenant_id,"id":order_id})
    row=result.mappings().first()
    return dict(row) if row else None


async def enqueue_provider_submission(connection: AsyncConnection, tenant_id: UUID, order_id: UUID,
                                      provider_profile_id: UUID, submission_key: str) -> None:
    import json
    await connection.execute(text("""
      insert into public.sales_outbox(tenant_id,aggregate_type,aggregate_id,event_type,dedupe_key,payload)
      values(:tenant,'sales_order',:order,'provider.order.submit',:key,cast(:payload as jsonb))
      on conflict(dedupe_key) do update set status='pending',attempts=0,available_at=now(),
        locked_at=null,processed_at=null,last_error_code=null,updated_at=now()
      where sales_outbox.status in ('dead_letter','blocked_configuration')
    """),{"tenant":tenant_id,"order":order_id,"key":"provider-submit:"+str(order_id)+":"+submission_key,
          "payload":json.dumps({"order_id":str(order_id),"provider_profile_id":str(provider_profile_id),
              "submission_key":submission_key})})
