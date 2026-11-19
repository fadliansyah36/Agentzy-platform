"""Application orchestration for private partnership attachment scanning."""

import asyncio
import hashlib
from datetime import UTC, datetime

import structlog

from app.adapters.clamav import scan_bytes
from app.adapters.supabase_storage import download_quarantined_object
from app.repositories.attachment_repository import (
    claim_pending_scan_batch,
    defer_attachment_scan,
    finish_attachment_scan,
)

logger = structlog.get_logger()


async def _scan_one(row: dict) -> None:
    content = await download_quarantined_object(str(row["object_path"]))
    content_hash = hashlib.sha256(content).hexdigest()
    if len(content) != int(row["file_size"]) or content_hash != row["sha256"]:
        await finish_attachment_scan(
            row["id"],
            "rejected",
            {"state": "rejected", "reason": "stored_object_integrity_mismatch"},
        )
        return

    verdict, detail = await scan_bytes(content)
    await finish_attachment_scan(
        row["id"],
        verdict,
        {
            "state": verdict,
            "engine": "clamav",
            "result": detail,
            "scanned_at": datetime.now(UTC).isoformat(),
        },
    )


async def dispatch_attachment_scan_batch() -> int:
    rows = await claim_pending_scan_batch()
    for row in rows:
        try:
            await _scan_one(row)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            error_code = (
                str(exc)
                if str(exc).startswith(("CLAMAV_", "SUPABASE_"))
                else "ATTACHMENT_SCAN_UNAVAILABLE"
            )
            await defer_attachment_scan(row["id"], error_code)
            logger.warning(
                "partnership_attachment_scan_deferred",
                attachment_id=str(row["id"]),
                error_code=error_code,
            )
    return len(rows)


async def run_attachment_scanner_worker() -> None:
    while True:
        try:
            processed = await dispatch_attachment_scan_batch()
            if processed == 0:
                await asyncio.sleep(20)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("partnership_attachment_scanner_batch_failed")
            await asyncio.sleep(20)
