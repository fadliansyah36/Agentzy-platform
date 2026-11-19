import asyncio
import smtplib
from email.message import EmailMessage

import structlog
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import engine

logger = structlog.get_logger()
settings = get_settings()


def _message_for(event_type: str, payload: dict) -> tuple[str, str]:
    reference = str(payload.get("reference_code") or "—")
    if event_type == "partnership.application_received":
        return (
            "Pengajuan Kerja Sama Agentzy diterima",
            f"Pengajuan kerja sama Anda telah diterima oleh Agentzy. Nomor referensi: {reference}. "
            "Tim Agentzy akan menindaklanjuti proses kualifikasi.",
        )
    if event_type == "partnership.prospect.updated":
        status = str(payload.get("status") or "diperbarui")
        return (
            "Pembaruan Pengajuan Kemitraan Agentzy",
            f"Status pengajuan kemitraan Anda ({reference}) telah diperbarui menjadi: {status}.",
        )
    raise ValueError("Unsupported notification event type")


def _send_email(recipient: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)
    smtp_class = smtplib.SMTP if settings.smtp_starttls else smtplib.SMTP_SSL
    with smtp_class(settings.smtp_host, settings.smtp_port, timeout=20) as client:
        if settings.smtp_starttls:
            client.starttls()
        if settings.smtp_username:
            client.login(settings.smtp_username, settings.smtp_password or "")
        client.send_message(message)


async def dispatch_notification_batch(batch_size: int = 20) -> int:
    claimed = []
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

    for row in claimed:
        try:
            if not row["recipient_email"]:
                raise ValueError("Missing recipient")
            subject, body = _message_for(row["event_type"], row["payload"])
            await asyncio.to_thread(_send_email, row["recipient_email"], subject, body)
            async with engine.begin() as connection:
                await connection.execute(
                    text("""
                        update public.notification_outbox
                        set status='sent',processed_at=now(),last_error_code=null,updated_at=now()
                        where id=:id
                    """),
                    {"id": row["id"]},
                )
        except Exception as exc:
            attempts = int(row["attempts"]) + 1
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
                        "id": row["id"],
                        "status": state,
                        "error_code": (
                            "SMTP_DELIVERY_FAILED"
                            if not isinstance(exc, ValueError)
                            else "NOTIFICATION_CONFIGURATION_INVALID"
                        ),
                        "attempts": attempts,
                    },
                )
            logger.warning(
                "notification_delivery_failed",
                event_type=row["event_type"],
                attempt=attempts,
            )
    return len(claimed)


async def run_notification_worker() -> None:
    while True:
        try:
            processed = await dispatch_notification_batch()
            if processed == 0:
                await asyncio.sleep(15)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("notification_worker_batch_failed")
            await asyncio.sleep(15)
