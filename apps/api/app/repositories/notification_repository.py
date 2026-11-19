"""Persistence operations for durable notification outbox delivery."""

from sqlalchemy import text

from app.db.session import engine


async def claim_notification_batch(batch_size: int = 20) -> list[dict]:
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select id,event_type,recipient_email,payload,attempts
                from public.notification_outbox
                where (
                  status in ('pending','failed') and available_at <= now()
                ) or (
                  status='processing' and updated_at < now() - interval '5 minutes'
                )
                order by available_at,created_at
                for update skip locked
                limit :limit
            """),
            {"limit": batch_size},
        )
        claimed = [dict(row) for row in result.mappings().all()]
        for row in claimed:
            await connection.execute(
                text("""
                    update public.notification_outbox
                    set status='processing',attempts=attempts+1,updated_at=now()
                    where id=:id
                """),
                {"id": row["id"]},
            )
    return claimed


async def mark_notification_sent(notification_id) -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                update public.notification_outbox
                set status='sent',processed_at=now(),last_error_code=null,updated_at=now()
                where id=:id
            """),
            {"id": notification_id},
        )


async def mark_notification_failed(notification_id, attempts: int, error_code: str) -> None:
    state = "dead_letter" if attempts >= 5 else "failed"
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                update public.notification_outbox
                set status=:status,last_error_code=:error_code,
                    available_at=now() + make_interval(
                      secs => least(3600, power(2,:attempts)::integer * 30)
                    ),
                    updated_at=now()
                where id=:id
            """),
            {
                "id": notification_id,
                "status": state,
                "error_code": error_code,
                "attempts": attempts,
            },
        )
