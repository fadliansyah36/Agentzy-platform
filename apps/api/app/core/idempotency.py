"""Database-backed idempotency reservations for sensitive FastAPI commands."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


@dataclass(frozen=True, slots=True)
class IdempotencyReservation:
    record_id: UUID
    replay_status: int | None = None
    replay_body: dict[str, Any] | None = None

    @property
    def replay(self) -> bool:
        return self.replay_status is not None


def request_fingerprint(payload: Any) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def reserve_idempotency(
    connection: AsyncConnection,
    *,
    actor_user_id: UUID,
    tenant_id: UUID | None,
    command_key: str,
    idempotency_key: str | None,
    payload: Any,
    ttl_hours: int = 24,
) -> IdempotencyReservation:
    if not idempotency_key:
        raise HTTPException(status_code=428, detail="Idempotency-Key header is required.")
    if not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(
            status_code=422,
            detail="Idempotency-Key length must be 8–128 characters.",
        )
    fingerprint = request_fingerprint(payload)
    now = datetime.now(UTC)
    expires = now + timedelta(hours=ttl_hours)
    inserted = await connection.execute(
        text("""
            insert into public.idempotency_records(
              actor_user_id,tenant_id,command_key,idempotency_key,
              request_fingerprint,status,expires_at
            ) values (
              :actor,:tenant_id,:command,:key,:fingerprint,'processing',:expires
            )
            on conflict(actor_user_id,tenant_id,command_key,idempotency_key) do nothing
            returning id
        """),
        {
            "actor": actor_user_id,
            "tenant_id": tenant_id,
            "command": command_key,
            "key": idempotency_key,
            "fingerprint": fingerprint,
            "expires": expires,
        },
    )
    record_id = inserted.scalar_one_or_none()
    if record_id is not None:
        return IdempotencyReservation(record_id)

    existing_result = await connection.execute(
        text("""
            select id,request_fingerprint,status,response_status,response_body,expires_at,updated_at
            from public.idempotency_records
            where actor_user_id=:actor
              and tenant_id is not distinct from :tenant_id
              and command_key=:command and idempotency_key=:key
            for update
        """),
        {
            "actor": actor_user_id,
            "tenant_id": tenant_id,
            "command": command_key,
            "key": idempotency_key,
        },
    )
    existing = existing_result.mappings().first()
    if existing is None:
        raise HTTPException(
            status_code=409,
            detail="Idempotency reservation could not be acquired.",
        )
    if existing["expires_at"] <= now:
        await connection.execute(
            text("""
                update public.idempotency_records
                set request_fingerprint=:fingerprint,status='processing',
                    response_status=null,response_body=null,created_at=:now,
                    updated_at=:now,expires_at=:expires
                where id=:id
            """),
            {"fingerprint": fingerprint, "now": now, "expires": expires, "id": existing["id"]},
        )
        return IdempotencyReservation(existing["id"])
    if existing["request_fingerprint"] != fingerprint:
        raise HTTPException(
            status_code=409,
            detail="Idempotency-Key was already used with a different payload.",
        )
    if existing["status"] == "completed":
        return IdempotencyReservation(
            existing["id"],
            replay_status=existing["response_status"],
            replay_body=existing["response_body"] or {},
        )
    if existing["status"] == "failed" or (
        existing["status"] == "processing"
        and existing["updated_at"] <= now - timedelta(minutes=10)
    ):
        await connection.execute(
            text("""
                update public.idempotency_records
                set status='processing',updated_at=now(),response_status=null,response_body=null
                where id=:id
            """),
            {"id": existing["id"]},
        )
        return IdempotencyReservation(existing["id"])
    raise HTTPException(
        status_code=409,
        detail="A command with this Idempotency-Key is still processing.",
    )


async def complete_idempotency(
    connection: AsyncConnection,
    *,
    record_id: UUID,
    response_status: int,
    response_body: dict[str, Any],
) -> None:
    await connection.execute(
        text("""
            update public.idempotency_records
            set status='completed',response_status=:status,
                response_body=cast(:body as jsonb),updated_at=now()
            where id=:id and status='processing'
        """),
        {
            "id": record_id,
            "status": response_status,
            "body": json.dumps(response_body, default=str),
        },
    )


async def fail_idempotency(
    connection: AsyncConnection,
    *,
    record_id: UUID,
    error_code: str,
) -> None:
    """Release a committed reservation after an external command fails.

    Only a bounded machine-readable code is persisted; provider response bodies
    and credentials must never be stored in the idempotency record.
    """
    await connection.execute(
        text("""
            update public.idempotency_records
            set status='failed',
                response_status=null,
                response_body=cast(:body as jsonb),
                updated_at=now()
            where id=:id and status='processing'
        """),
        {
            "id": record_id,
            "body": json.dumps({"error_code": error_code[:80]}),
        },
    )
