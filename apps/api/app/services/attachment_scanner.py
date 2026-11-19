"""Private quarantine malware scanning via a configured ClamAV daemon."""

import asyncio
import hashlib
import json
import struct
from datetime import UTC, datetime
from urllib.parse import quote

import httpx
import structlog
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import engine

logger = structlog.get_logger()
settings = get_settings()
BUCKET = "partnership-quarantine"
CHUNK_SIZE = 64 * 1024


async def _clamav_scan(content: bytes) -> tuple[str, str]:
    if not settings.clamav_host:
        raise RuntimeError("CLAMAV_NOT_CONFIGURED")
    reader, writer = await asyncio.wait_for(
        asyncio.open_connection(settings.clamav_host, settings.clamav_port),
        timeout=settings.clamav_timeout_seconds,
    )
    try:
        writer.write(b"zINSTREAM\0")
        for offset in range(0, len(content), CHUNK_SIZE):
            chunk = content[offset : offset + CHUNK_SIZE]
            writer.write(struct.pack("!I", len(chunk)))
            writer.write(chunk)
        writer.write(struct.pack("!I", 0))
        await writer.drain()
        response = await asyncio.wait_for(
            reader.readuntil(b"\0"), timeout=settings.clamav_timeout_seconds
        )
        message = response.rstrip(b"\0").decode("utf-8", errors="replace")
        if message.endswith(" OK"):
            return "clean", message
        if " FOUND" in message:
            return "infected", message[:500]
        raise RuntimeError("CLAMAV_INVALID_RESPONSE")
    finally:
        writer.close()
        await writer.wait_closed()


async def _claim_batch(limit: int = 10) -> list[dict]:
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select id,application_id,object_path,sha256,content_type,file_size
                from public.public_partnership_attachments
                where scan_status='pending_scan'
                  and (
                    scan_result->>'state' is distinct from 'scanning'
                    or coalesce((scan_result->>'started_at')::timestamptz,
                                now() - interval '1 hour') < now() - interval '10 minutes'
                  )
                  and coalesce((scan_result->>'retry_after')::timestamptz,
                               '-infinity'::timestamptz) <= now()
                order by uploaded_at
                limit :limit
                for update skip locked
            """),
            {"limit": limit},
        )
        rows = [dict(row) for row in result.mappings().all()]
        for row in rows:
            await connection.execute(
                text("""
                    update public.public_partnership_attachments
                    set scan_result=cast(:result as jsonb)
                    where id=:id and scan_status='pending_scan'
                """),
                {
                    "id": row["id"],
                    "result": json.dumps(
                        {"state": "scanning", "started_at": datetime.now(UTC).isoformat()}
                    ),
                },
            )
        return rows


async def _scan_one(row: dict) -> None:
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_STORAGE_CREDENTIALS_NOT_CONFIGURED")
    object_path = quote(str(row["object_path"]), safe="/")
    url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/"
        f"{BUCKET}/{object_path}"
    )
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        content = response.content

    if len(content) != int(row["file_size"]) or hashlib.sha256(content).hexdigest() != row["sha256"]:
        await _finish(row["id"], "rejected", {
            "state": "rejected", "reason": "stored_object_integrity_mismatch"
        })
        return

    verdict, detail = await _clamav_scan(content)
    await _finish(
        row["id"],
        verdict,
        {"state": verdict, "engine": "clamav", "result": detail,
         "scanned_at": datetime.now(UTC).isoformat()},
    )


async def _finish(attachment_id, status: str, result: dict) -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                update public.public_partnership_attachments
                set scan_status=:status,scanned_at=now(),scan_result=cast(:result as jsonb)
                where id=:id and scan_status='pending_scan'
            """),
            {"id": attachment_id, "status": status, "result": json.dumps(result)},
        )


async def _defer(attachment_id, error_code: str) -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                update public.public_partnership_attachments
                set scan_result=cast(:result as jsonb)
                where id=:id and scan_status='pending_scan'
            """),
            {
                "id": attachment_id,
                "result": json.dumps({
                    "state": "retrying",
                    "error_code": error_code,
                    "retry_after": (datetime.now(UTC)).isoformat(),
                }),
            },
        )
        await connection.execute(
            text("""
                update public.public_partnership_attachments
                set scan_result=jsonb_set(
                    scan_result,'{retry_after}',
                    to_jsonb((now() + interval '1 minute')::text),true
                )
                where id=:id and scan_status='pending_scan'
            """),
            {"id": attachment_id},
        )


async def dispatch_attachment_scan_batch() -> int:
    rows = await _claim_batch()
    for row in rows:
        try:
            await _scan_one(row)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            error_code = str(exc) if str(exc).startswith(
                ("CLAMAV_", "SUPABASE_")
            ) else "ATTACHMENT_SCAN_UNAVAILABLE"
            await _defer(row["id"], error_code)
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
