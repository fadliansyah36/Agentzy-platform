"""Application service for self-service session inventory and revocation."""

from uuid import UUID

from fastapi import HTTPException
from fastapi.responses import JSONResponse
from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.db.session import engine
from app.repositories.identity_repository import (
    list_user_session_records,
    lock_user_session,
    revoke_session_record,
    write_session_revocation_audit,
)


async def list_sessions_for_user(user_id: UUID, current_session_id: UUID) -> dict:
    rows = await list_user_session_records(user_id)
    data = []
    for row in rows:
        data.append({
            "id": str(row["id"]),
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            "refreshed_at": row["refreshed_at"].isoformat() if row["refreshed_at"] else None,
            "not_after": row["not_after"].isoformat() if row["not_after"] else None,
            "aal": str(row["aal"]) if row["aal"] else None,
            "user_agent": row["user_agent"] or None,
            "is_current": row["id"] == current_session_id,
            "is_revoked": row["revoked_at"] is not None,
            "revoked_at": row["revoked_at"].isoformat() if row["revoked_at"] else None,
        })
    return {
        "data": data,
        "meta": {
            "current_session_id": str(current_session_id),
            "active_count": sum(1 for row in data if not row["is_revoked"]),
        },
    }


async def revoke_session_for_user(
    *,
    user_id: UUID,
    current_session_id: UUID,
    target_session_id: UUID,
    request_id: str | None,
    idempotency_key: str | None,
):
    async with engine.begin() as connection:
        target = await lock_user_session(connection, user_id, target_session_id)
        if target is None:
            raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=user_id,
            tenant_id=None,
            command_key=f"auth.session.revoke:{target_session_id}",
            idempotency_key=idempotency_key,
            payload={"session_id": str(target_session_id)},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 202,
                content=reservation.replay_body or {},
            )
        await revoke_session_record(
            connection,
            user_id=user_id,
            session_id=target_session_id,
            not_after=target["not_after"],
            request_id=request_id,
        )
        await write_session_revocation_audit(
            connection,
            user_id=user_id,
            session_id=target_session_id,
            request_id=request_id,
        )
        response_body = {
            "status": "revoked",
            "session_id": str(target_session_id),
            "current_session_revoked": target_session_id == current_session_id,
        }
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=202,
            response_body=response_body,
        )
    return response_body
