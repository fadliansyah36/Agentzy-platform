"""Persistence adapters for the Human Workforce bounded context."""

import json
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def get_workforce_profile(
    connection: AsyncConnection, tenant_id: UUID, profile_id: UUID
) -> dict[str, Any] | None:
    result = await connection.execute(
        text(
            """
            select * from public.workforce_profiles
            where tenant_id=:tenant and id=:profile
            """
        ),
        {"tenant": tenant_id, "profile": profile_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def append_workforce_audit(
    connection: AsyncConnection,
    *,
    tenant_id: UUID,
    actor_user_id: UUID,
    action: str,
    resource_type: str,
    resource_id: UUID,
    request_id: str | None,
    metadata: dict[str, Any] | None = None,
) -> None:
    await connection.execute(
        text(
            """
            insert into public.audit_logs(
              tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
            ) values(:tenant,:actor,:action,:type,:id,:request_id,cast(:metadata as jsonb))
            """
        ),
        {
            "tenant": tenant_id,
            "actor": actor_user_id,
            "action": action,
            "type": resource_type,
            "id": str(resource_id),
            "request_id": request_id,
            "metadata": json.dumps(metadata or {}, default=str),
        },
    )


async def enqueue_workforce_notification(
    connection: AsyncConnection,
    *,
    tenant_id: UUID,
    profile_id: UUID,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    result = await connection.execute(
        text(
            """
            select u.email from public.workforce_profiles p
            join auth.users u on u.id=p.user_id
            where p.tenant_id=:tenant and p.id=:profile
            """
        ),
        {"tenant": tenant_id, "profile": profile_id},
    )
    recipient = result.scalar_one_or_none()
    if not recipient:
        return
    notification = {
        "tenant_id": str(tenant_id),
        "workforce_profile_id": str(profile_id),
        **payload,
    }
    await connection.execute(
        text(
            """
            insert into public.notification_outbox(
              event_type,aggregate_type,aggregate_id,recipient_email,payload,status,available_at
            ) values(:event,'workforce_profile',:profile,:recipient,cast(:payload as jsonb),'pending',now())
            """
        ),
        {
            "event": event_type,
            "profile": profile_id,
            "recipient": recipient,
            "payload": json.dumps(notification, default=str),
        },
    )
