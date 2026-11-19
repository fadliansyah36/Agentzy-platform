"""Persistence operations for the partnership attachment scan queue."""

import json
from datetime import UTC, datetime

from sqlalchemy import text

from app.db.session import engine


async def claim_pending_scan_batch(limit: int = 10) -> list[dict]:
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select id,application_id,object_path,sha256,content_type,file_size,scan_attempts
                from public.public_partnership_attachments
                where scan_status='pending_scan'
                  and coalesce(scan_result->>'state','') <> 'dead_letter'
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
                    set scan_attempts=scan_attempts+1,
                        scan_result=cast(:result as jsonb)
                    where id=:id and scan_status='pending_scan'
                """),
                {
                    "id": row["id"],
                    "result": json.dumps(
                        {
                            "state": "scanning",
                            "started_at": datetime.now(UTC).isoformat(),
                            "attempt_count": int(row.get("scan_attempts") or 0) + 1,
                        }
                    ),
                },
            )
        return rows


async def finish_attachment_scan(attachment_id, status: str, result: dict) -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                update public.public_partnership_attachments
                set scan_status=:status,scanned_at=now(),scan_result=cast(:result as jsonb)
                where id=:id and scan_status='pending_scan'
            """),
            {"id": attachment_id, "status": status, "result": json.dumps(result)},
        )


async def defer_attachment_scan(attachment_id, error_code: str) -> None:
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                update public.public_partnership_attachments
                set scan_result=jsonb_build_object(
                    'state',case when scan_attempts >= 8 then 'dead_letter' else 'retrying' end,
                    'error_code',:error_code,
                    'attempt_count',scan_attempts,
                    'retry_after',case
                      when scan_attempts >= 8 then null
                      else (now() + make_interval(
                        secs => least(21600, power(2,scan_attempts)::integer * 60)
                      ))::text
                    end
                )
                where id=:id and scan_status='pending_scan'
            """),
            {"id": attachment_id, "error_code": error_code},
        )
