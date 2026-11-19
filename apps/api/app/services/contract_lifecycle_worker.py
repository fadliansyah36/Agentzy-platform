"""Durable contract expiry and renewal reminder worker."""

import asyncio
import json

import structlog
from sqlalchemy import text

from app.db.session import engine

logger = structlog.get_logger()


async def process_contract_lifecycle_batch() -> dict[str, int]:
    expired_count = 0
    reminder_count = 0
    async with engine.begin() as connection:
        expired = await connection.execute(
            text("""
                update public.contracts
                set status='expired',updated_at=now(),row_version=row_version+1
                where status='active' and effective_end is not null
                  and effective_end<current_date
                returning id,tenant_id,effective_end
            """)
        )
        expired_rows = expired.mappings().all()
        expired_count = len(expired_rows)
        for row in expired_rows:
            profile = await connection.execute(
                text("""
                    select billing_email from public.corporate_profiles
                    where tenant_id=:tenant and profile_status='active'
                """),
                {"tenant": row["tenant_id"]},
            )
            recipient = profile.scalar_one_or_none()
            contract_info = await connection.execute(
                text("""
                    select contract_number,title from public.contracts
                    where id=:contract and tenant_id=:tenant
                """),
                {"contract": row["id"], "tenant": row["tenant_id"]},
            )
            contract_row = contract_info.mappings().one()
            await connection.execute(
                text("""
                    update public.contract_entitlement_grants
                    set status='expired',updated_at=now()
                    where tenant_id=:tenant and contract_id=:contract and status='active'
                """),
                {"tenant": row["tenant_id"], "contract": row["id"]},
            )
            key = f"contract-expired:{row['id']}:{row['effective_end']}"
            await connection.execute(
                text("""
                    insert into public.contract_events(
                      tenant_id,contract_id,event_type,from_status,to_status,metadata,idempotency_key
                    ) values(:tenant,:contract,'contract.expired','active','expired',
                      jsonb_build_object('effective_end',:effective_end),:key)
                    on conflict (tenant_id,idempotency_key)
                      where idempotency_key is not null do nothing
                """),
                {
                    "tenant": row["tenant_id"], "contract": row["id"],
                    "effective_end": row["effective_end"].isoformat(), "key": key,
                },
            )
            await connection.execute(
                text("""
                    insert into public.notification_outbox(
                      event_type,aggregate_type,aggregate_id,recipient_email,payload,status,available_at
                    ) values('contract.expired','contract',:contract,:recipient,
                      cast(:payload as jsonb),'pending',now())
                """),
                {
                    "contract": row["id"],
                    "recipient": recipient,
                    "payload": json.dumps({
                        "tenant_id": str(row["tenant_id"]),
                        "contract_id": str(row["id"]),
                        "contract_number": contract_row["contract_number"],
                        "title": contract_row["title"],
                        "effective_end": row["effective_end"].isoformat(),
                    }),
                },
            )

        reminders = await connection.execute(
            text("""
                update public.contracts
                set expiry_notified_at=now(),updated_at=now()
                where status='active' and effective_end is not null
                  and expiry_notified_at is null
                  and effective_end>=current_date
                  and effective_end<=current_date+make_interval(days=>renewal_notice_days)
                returning id,tenant_id,effective_end
            """)
        )
        reminder_rows = reminders.mappings().all()
        reminder_count = len(reminder_rows)
        for row in reminder_rows:
            profile = await connection.execute(
                text("""
                    select billing_email from public.corporate_profiles
                    where tenant_id=:tenant and profile_status='active'
                """),
                {"tenant": row["tenant_id"]},
            )
            recipient = profile.scalar_one_or_none()
            contract_info = await connection.execute(
                text("""
                    select contract_number,title from public.contracts
                    where id=:contract and tenant_id=:tenant
                """),
                {"contract": row["id"], "tenant": row["tenant_id"]},
            )
            contract_row = contract_info.mappings().one()
            key = f"contract-renewal-reminder:{row['id']}:{row['effective_end']}"
            await connection.execute(
                text("""
                    insert into public.contract_events(
                      tenant_id,contract_id,event_type,from_status,to_status,metadata,idempotency_key
                    ) values(:tenant,:contract,'contract.renewal_reminder','active','active',
                      jsonb_build_object('effective_end',:effective_end),:key)
                    on conflict (tenant_id,idempotency_key)
                      where idempotency_key is not null do nothing
                """),
                {
                    "tenant": row["tenant_id"], "contract": row["id"],
                    "effective_end": row["effective_end"].isoformat(), "key": key,
                },
            )
            await connection.execute(
                text("""
                    insert into public.notification_outbox(
                      event_type,aggregate_type,aggregate_id,recipient_email,payload,status,available_at
                    ) values('contract.renewal_reminder','contract',:contract,:recipient,
                      cast(:payload as jsonb),'pending',now())
                """),
                {
                    "contract": row["id"],
                    "payload": json.dumps({
                        "tenant_id": str(row["tenant_id"]),
                        "contract_id": str(row["id"]),
                        "effective_end": row["effective_end"].isoformat(),
                    }),
                },
            )
    return {"expired": expired_count, "renewal_reminders": reminder_count}


async def run_contract_lifecycle_worker(poll_seconds: int = 900) -> None:
    while True:
        try:
            result = await process_contract_lifecycle_batch()
            if result["expired"] or result["renewal_reminders"]:
                logger.info("contract_lifecycle_batch_processed", **result)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("contract_lifecycle_worker_failed")
        await asyncio.sleep(max(60, poll_seconds))
