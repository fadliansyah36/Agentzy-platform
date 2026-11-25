"""Outbox-driven provider submission worker with bounded retry and no synthetic success."""
from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

import structlog
from sqlalchemy import text

from app.adapters.provider_adapter import ContractOnlyProviderAdapter, HttpJsonProviderAdapter
from app.db.session import engine
from app.services.sales_service import SalesService

logger = structlog.get_logger()
adapter = HttpJsonProviderAdapter()
contract_only_adapter = ContractOnlyProviderAdapter()


async def process_sales_outbox_batch(batch_size: int = 20) -> int:
    processed = 0
    async with engine.begin() as connection:
        rows = await connection.execute(text("""
          select id,tenant_id,aggregate_id,payload,attempts
          from public.sales_outbox
          where (status in ('pending','retry') and available_at<=now())
             or (status='processing' and locked_at<now()-interval '5 minutes')
          order by available_at,created_at
          for update skip locked limit :limit
        """), {"limit": batch_size})
        events = [dict(row) for row in rows.mappings().all()]
        for event in events:
            await connection.execute(text("""
              update public.sales_outbox set status='processing',locked_at=now(),updated_at=now()
              where id=:id
            """), {"id": event["id"]})
    for event in events:
        try:
            async with engine.connect() as connection:
                order_result = await connection.execute(text("""
                  select o.*,p.provider_code,p.provider_name,c.customer_name,c.contact_name,
                         c.email,c.phone,c.service_address,pr.product_code,pr.name as product_name,
                         cfg.adapter_key,cfg.endpoint_url,cfg.auth_env_key,cfg.timeout_seconds,cfg.enabled,cfg.request_mapping,cfg.response_mapping
                  from public.sales_orders o
                  join public.provider_profiles p on p.id=o.provider_profile_id and p.tenant_id=o.tenant_id
                  join public.sales_customers c on c.id=o.customer_id and c.tenant_id=o.tenant_id
                  join public.sales_provider_products pr on pr.id=o.product_id and pr.tenant_id=o.tenant_id
                  left join public.provider_integration_configs cfg
                    on cfg.provider_profile_id=p.id and cfg.tenant_id=p.tenant_id
                  where o.id=:order and o.tenant_id=:tenant
                """), {"order": event["aggregate_id"], "tenant": event["tenant_id"]})
                order = order_result.mappings().first()
            if not order:
                await _finish(event["id"], "dead_letter", "ORDER_NOT_FOUND")
                continue
            if order["status"] != "submitted":
                await _finish(event["id"], "done", "ORDER_NO_LONGER_SUBMITTABLE")
                continue
            config = dict(order)
            payload = SalesService.provider_submission_payload(dict(order))
            request_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
            submission_key=str((event.get("payload") or {}).get("submission_key") or event["id"])
            result = await (adapter if config.get("adapter_key")=="http_json" else contract_only_adapter).submit_order(
                config, payload, idempotency_key="agentzy-order-"+str(event["aggregate_id"])+"-"+submission_key
            )
            outbox_attempt=int(event["attempts"])+1
            async with engine.connect() as connection:
                attempt_result=await connection.execute(text("""
                  select coalesce(max(attempt_number),0)+1 from public.provider_submission_attempts
                  where tenant_id=:tenant and order_id=:order
                """),{"tenant":event["tenant_id"],"order":event["aggregate_id"]})
                attempt_number=int(attempt_result.scalar_one())
            async with engine.begin() as connection:
                await connection.execute(text("""
                  insert into public.provider_submission_attempts(
                    tenant_id,order_id,provider_profile_id,attempt_number,status,request_hash,
                    response_hash,provider_reference,error_code
                  ) values(:tenant,:order,:provider,:attempt,:status,:request_hash,:response_hash,:reference,:error)
                  on conflict(tenant_id,order_id,attempt_number) do nothing
                """), {
                    "tenant": event["tenant_id"], "order": event["aggregate_id"],
                    "provider": order["provider_profile_id"], "attempt": attempt_number,
                    "status": "succeeded" if result.accepted or result.error_code=="PROVIDER_SUBMISSION_REJECTED" else ("blocked_configuration" if result.error_code and any(marker in result.error_code for marker in ("CONFIG","ALLOWLIST","REFERENCE","ENABLED","ENDPOINT","INVALID","UNMAPPED","REQUEST_REJECTED")) else "retry"),
                    "request_hash": request_hash, "response_hash": result.response_hash,
                    "reference": result.provider_reference, "error": result.error_code,
                })
                if result.error_code=="PROVIDER_SUBMISSION_REJECTED":
                    rejected=await connection.execute(text("""
                      update public.sales_orders set status='provider_rejected',updated_at=now()
                      where id=:order and tenant_id=:tenant and status='submitted'
                    """),{"order":event["aggregate_id"],"tenant":event["tenant_id"]})
                    if rejected.rowcount:
                        await connection.execute(text("""
                          update public.order_attributions set attribution_status='reversed',reason='Provider rejected order submission'
                          where tenant_id=:tenant and sales_order_id=:order and attribution_status='provisional'
                        """),{"tenant":event["tenant_id"],"order":event["aggregate_id"]})
                        await connection.execute(text("""
                          update public.sales_leads set stage='closed',last_activity_at=now(),updated_at=now()
                          where tenant_id=:tenant and id=(select lead_id from public.sales_orders where tenant_id=:tenant and id=:order)
                            and stage='order_submitted'
                        """),{"tenant":event["tenant_id"],"order":event["aggregate_id"]})
                        await connection.execute(text("""
                          insert into public.sales_order_events(tenant_id,order_id,event_type,from_status,to_status,
                            source,reason,evidence,idempotency_key)
                          values(:tenant,:order,'provider.submission.rejected','submitted','provider_rejected',
                            'provider_adapter','Provider rejected the order submission.',
                            cast(:evidence as jsonb),:key)
                          on conflict(tenant_id,order_id,idempotency_key) do nothing
                        """),{"tenant":event["tenant_id"],"order":event["aggregate_id"],
                              "evidence":json.dumps({"response_hash":result.response_hash,"provider_reference":result.provider_reference}),
                              "key":"provider-rejected-"+str(event["id"])})
                    await connection.execute(text("""
                      update public.sales_outbox set status='done',attempts=:attempts,processed_at=now(),locked_at=null,
                        last_error_code='PROVIDER_SUBMISSION_REJECTED',updated_at=now() where id=:id
                    """),{"id":event["id"],"attempts":outbox_attempt})
                    processed += 1
                    continue
                if result.accepted:
                    await connection.execute(text("""
                      update public.sales_orders set status='provider_pending',
                        provider_order_reference=coalesce(:reference,provider_order_reference),updated_at=now()
                      where id=:order and tenant_id=:tenant and status='submitted'
                    """), {"reference": result.provider_reference, "order": event["aggregate_id"], "tenant": event["tenant_id"]})
                    await connection.execute(text("""
                      insert into public.sales_order_events(tenant_id,order_id,event_type,from_status,to_status,
                        source,reason,evidence,idempotency_key)
                      values(:tenant,:order,'provider.submission.received','submitted','provider_pending',
                        'provider_adapter','Provider accepted the submission request; provider approval is pending.',
                        cast(:evidence as jsonb),:key)
                      on conflict(tenant_id,order_id,idempotency_key) do nothing
                    """), {"tenant":event["tenant_id"],"order":event["aggregate_id"],
                      "evidence":json.dumps({"provider_reference":result.provider_reference,"response_hash":result.response_hash}),
                      "key":"provider-submit-"+str(event["id"])})
                    await connection.execute(text("""
                      update public.sales_outbox set status='done',attempts=:attempts,processed_at=now(),locked_at=null,updated_at=now()
                      where id=:id
                    """), {"id": event["id"],"attempts":outbox_attempt})
                else:
                    blocked = result.error_code and any(marker in result.error_code for marker in ("CONFIG","ALLOWLIST","REFERENCE","ENABLED","ENDPOINT","INVALID","UNMAPPED","REQUEST_REJECTED"))
                    next_attempt = outbox_attempt >= 6
                    await connection.execute(text("""
                      update public.sales_outbox set status=:status,attempts=:attempts,
                        available_at=:available,last_error_code=:error,locked_at=null,updated_at=now()
                      where id=:id
                    """), {
                      "status":"blocked_configuration" if blocked else ("dead_letter" if next_attempt else "retry"),
                      "attempts":outbox_attempt,"available":datetime.now(UTC)+timedelta(seconds=min(3600,30*(2**min(outbox_attempt,7)))),
                      "error":result.error_code,"id":event["id"],
                    })
            processed += 1
        except Exception as exc:
            logger.exception("sales_outbox_processing_failed", outbox_id=str(event["id"]))
            await _finish(event["id"], "retry", type(exc).__name__)
    return processed


async def _finish(event_id: UUID, status: str, error_code: str) -> None:
    async with engine.begin() as connection:
        await connection.execute(text("""
          update public.sales_outbox set status=case
              when :status='retry' and attempts+1>=6 then 'dead_letter'
              else :status end,
            attempts=attempts+1,
            available_at=now()+make_interval(secs=>least(3600,30*power(2,least(attempts,7))::integer)),
            last_error_code=:error,locked_at=null,updated_at=now() where id=:id
        """), {"status":status,"error":error_code[:80],"id":event_id})


async def run_sales_worker(poll_seconds: int = 10) -> None:
    while True:
        try:
            count = await process_sales_outbox_batch()
            if not count:
                await asyncio.sleep(poll_seconds)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("sales_worker_loop_failed")
            await asyncio.sleep(poll_seconds)
