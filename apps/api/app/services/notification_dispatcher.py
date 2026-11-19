"""Application orchestration for durable partnership notifications."""

import asyncio

import structlog

from app.adapters.smtp import send_email
from app.repositories.notification_repository import (
    claim_notification_batch,
    mark_notification_failed,
    mark_notification_sent,
)

logger = structlog.get_logger()


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
    if event_type == "partnership.prospect.assigned":
        company = str(payload.get("company_name") or "Perusahaan")
        return (
            "Lead Kemitraan Baru Ditugaskan",
            f"Prospek {company} ({reference}) telah ditugaskan kepada Anda. "
            "Silakan tindak lanjuti melalui Super Admin Partnership Lead Inbox.",
        )
    raise ValueError("Unsupported notification event type")


async def dispatch_notification_batch(batch_size: int = 20) -> int:
    claimed = await claim_notification_batch(batch_size)
    for row in claimed:
        try:
            if not row["recipient_email"]:
                raise ValueError("Missing recipient")
            subject, body = _message_for(row["event_type"], row["payload"])
            await asyncio.to_thread(send_email, row["recipient_email"], subject, body)
            await mark_notification_sent(row["id"])
        except Exception as exc:
            attempts = int(row["attempts"]) + 1
            error_code = (
                "NOTIFICATION_CONFIGURATION_INVALID"
                if isinstance(exc, ValueError)
                else "SMTP_DELIVERY_FAILED"
            )
            await mark_notification_failed(row["id"], attempts, error_code)
            logger.warning(
                "notification_delivery_failed",
                event_type=row["event_type"],
                attempt=attempts,
                error_code=error_code,
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
