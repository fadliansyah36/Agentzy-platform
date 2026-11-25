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
    if event_type == "contract.expired":
        contract_number = str(payload.get("contract_number") or "—")
        title = str(payload.get("title") or "Kontrak")
        effective_end = str(payload.get("effective_end") or "—")
        return (
            "Kontrak Agentzy Telah Berakhir",
            f"Kontrak {contract_number} — {title} berakhir pada {effective_end}. "
            "Silakan hubungi pengelola Corporate Portal untuk tindak lanjut.",
        )
    if event_type == "contract.renewal_reminder":
        contract_number = str(payload.get("contract_number") or "—")
        title = str(payload.get("title") or "Kontrak")
        effective_end = str(payload.get("effective_end") or "—")
        return (
            "Pengingat Renewal Kontrak Agentzy",
            f"Kontrak {contract_number} — {title} memiliki tanggal akhir {effective_end}. "
            "Silakan ajukan renewal melalui Corporate Portal.",
        )
    if event_type == "contract.activated":
        contract_id = str(payload.get("contract_id") or "—")
        return (
            "Kontrak Agentzy Diaktifkan",
            f"Kontrak Agentzy {contract_id} telah diaktifkan dan entitlement sesuai SOW mulai berlaku.",
        )
    if event_type == "contract.suspended":
        contract_id = str(payload.get("contract_id") or "—")
        reason = str(payload.get("reason") or "Tidak dicantumkan")
        return (
            "Kontrak Agentzy Ditangguhkan",
            f"Kontrak Agentzy {contract_id} ditangguhkan. Alasan: {reason}.",
        )
    if event_type == "contract.terminated":
        contract_id = str(payload.get("contract_id") or "—")
        reason = str(payload.get("reason") or "Tidak dicantumkan")
        return (
            "Kontrak Agentzy Dihentikan",
            f"Kontrak Agentzy {contract_id} dihentikan. Alasan: {reason}.",
        )
    if event_type == "contract.renewal.requested":
        contract_id = str(payload.get("contract_id") or "—")
        requested_end = str(payload.get("requested_end") or "—")
        return (
            "Permintaan Renewal Kontrak Agentzy",
            f"Permintaan renewal untuk kontrak {contract_id} tercatat dengan tanggal akhir yang diajukan {requested_end}.",
        )
    if event_type in {"contract.renewal.approved", "contract.renewal.rejected"}:
        contract_id = str(payload.get("contract_id") or "—")
        outcome = "disetujui" if event_type.endswith("approved") else "ditolak"
        reason = str(payload.get("reason") or "Tidak dicantumkan")
        return (
            "Keputusan Renewal Kontrak Agentzy",
            f"Permintaan renewal kontrak {contract_id} {outcome}. Alasan: {reason}.",
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
