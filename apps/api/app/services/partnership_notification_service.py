"""Application service for partnership notification visibility and recovery."""

from uuid import UUID

from fastapi import HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.db.session import engine
from app.repositories.notification_repository import (
    list_prospect_notification_records,
    lock_notification_record,
    requeue_notification_record,
)


async def list_prospect_notifications(prospect_id: UUID) -> dict:
    rows = await list_prospect_notification_records(prospect_id)
    data = [
        {
            "id": str(row["id"]),
            "event_type": row["event_type"],
            "status": row["status"],
            "attempts": row["attempts"],
            "available_at": row["available_at"].isoformat() if row["available_at"] else None,
            "processed_at": row["processed_at"].isoformat() if row["processed_at"] else None,
            "last_error_code": row["last_error_code"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in rows
    ]
    return {"data": data, "meta": {"count": len(data)}}


async def retry_partnership_notification(
    *,
    notification_id: UUID,
    actor_user_id: UUID,
    request_id: str | None,
    idempotency_key: str | None,
) -> dict | JSONResponse:
    async with engine.begin() as connection:
        row = await lock_notification_record(connection, notification_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Notification tidak ditemukan.")
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor_user_id,
            tenant_id=None,
            command_key=f"partnership.notification.retry:{notification_id}",
            idempotency_key=idempotency_key,
            payload={"notification_id": str(notification_id)},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 202,
                content=reservation.replay_body or {},
            )
        if row["status"] not in ("failed", "dead_letter"):
            raise HTTPException(
                status_code=409,
                detail="Hanya notifikasi failed atau dead-letter yang dapat dicoba ulang.",
            )
        await requeue_notification_record(connection, notification_id)
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(
                  :actor,'partnership.notification.retried','notification_outbox',
                  :id,:request_id,jsonb_build_object('previous_status',:status)
                )
            """),
            {
                "actor": actor_user_id,
                "id": str(notification_id),
                "request_id": request_id,
                "status": row["status"],
            },
        )
        body = {
            "notification_id": str(notification_id),
            "status": "pending",
        }
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=202,
            response_body=body,
        )
    return body
