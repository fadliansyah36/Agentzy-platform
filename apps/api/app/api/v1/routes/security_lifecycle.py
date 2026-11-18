import base64
import csv
import hmac
import io
import json
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import Response

from app.core.authorization import (
    TenantAccessContext,
    authorize_action,
    authorize_platform_action,
)
from app.core.config import get_settings
from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter(prefix="/security", tags=["Security Lifecycle"])
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


class AuthProviderEventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    provider_event_id: str = Field(min_length=8, max_length=200)
    event_type: Literal[
        "user.created",
        "user.updated",
        "user.deleted",
        "user.banned",
        "user.unbanned",
        "session.created",
        "session.revoked",
        "password.recovery.requested",
        "password.updated",
        "user.signed_in",
        "user.signed_out",
    ]
    user_id: UUID | None = None
    session_id: UUID | None = None
    tenant_id: UUID | None = None
    occurred_at: datetime | None = None
    request_id: str | None = Field(default=None, max_length=128)
    payload_digest: str | None = Field(default=None, min_length=32, max_length=128)


class BreakGlassRequestIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=20, max_length=2000)
    permission_keys: list[str] = Field(min_length=1, max_length=5)
    tenant_ids: list[UUID] = Field(min_length=1, max_length=20)
    duration_minutes: int = Field(default=30, ge=5, le=60)


class BreakGlassActivationIn(BaseModel):
    duration_minutes: int | None = Field(default=None, ge=5, le=60)


class BreakGlassReviewIn(BaseModel):
    notes: str = Field(min_length=20, max_length=2000)


def _decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    try:
        if len(cursor) > 512:
            raise ValueError("cursor too long")
        raw = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        value = json.loads(raw)
        created = datetime.fromisoformat(value["created_at"])
        if created.tzinfo is None:
            created = created.replace(tzinfo=UTC)
        return created, UUID(value["id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail="Invalid cursor") from exc


def _encode_cursor(created: datetime, row_id: UUID) -> str:
    raw = json.dumps({"created_at": created.isoformat(), "id": str(row_id)}).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


async def _require_platform_permission(
    claims: dict, session: AsyncSession, permission: str, action: str, resource_id: str
) -> UUID:
    actor = UUID(claims["sub"])
    if claims.get("aal") != "aal2":
        raise HTTPException(status_code=403, detail="Platform security actions require AAL2.")
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key=permission,
        resource_type="platform.security",
        action=action,
        resource={"id": resource_id},
    )
    return actor


async def _audit(
    connection,
    request: Request,
    actor: UUID | None,
    action: str,
    resource_type: str,
    resource_id: UUID | str,
    tenant_id: UUID | None = None,
    metadata: dict | None = None,
):
    await connection.execute(
        text("""
            insert into public.audit_logs(
              tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
            ) values (
              :tenant_id,:actor,:action,:resource_type,:resource_id,:request_id,
              cast(:metadata as jsonb)
            )
        """),
        {
            "tenant_id": tenant_id,
            "actor": actor,
            "action": action,
            "resource_type": resource_type,
            "resource_id": str(resource_id),
            "request_id": getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
            "metadata": json.dumps({
                **(metadata or {}),
                "correlation_id": getattr(request.state, "correlation_id", None),
                "trace_id": getattr(request.state, "trace_id", None),
            }, default=str),
        },
    )


async def _expire_break_glass(connection, request: Request) -> int:
    expired = await connection.execute(
        text("""
            update public.break_glass_requests
            set status='expired'
            where status='active' and expires_at <= now()
            returning id,tenant_id,requester_user_id,expires_at
        """)
    )
    rows = expired.mappings().all()
    for row in rows:
        await _audit(
            connection,
            request,
            None,
            "break_glass.expired",
            "break_glass_request",
            row["id"],
            row["tenant_id"],
            {
                "requester_user_id": str(row["requester_user_id"]),
                "expires_at": row["expires_at"],
                "reason": "time_limit_reached",
            },
        )
    return len(rows)


@router.post("/auth-provider-events", status_code=status.HTTP_202_ACCEPTED)
async def ingest_auth_provider_event(
    payload: AuthProviderEventIn,
    request: Request,
    webhook_secret: str | None = Header(default=None, alias="X-Provider-Webhook-Secret"),
):
    configured = get_settings().auth_provider_webhook_secret
    if not configured:
        raise HTTPException(
            status_code=503,
            detail="Auth provider event ingestion is not configured.",
        )
    if not webhook_secret or not hmac.compare_digest(webhook_secret, configured):
        raise HTTPException(status_code=401, detail="Invalid event source credential.")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                insert into public.auth_provider_events(
                  provider,provider_event_id,event_type,user_id,session_id,tenant_id,
                  request_id,occurred_at,processing_status,processed_at,payload_digest,metadata
                ) values (
                  'supabase',:event_id,:event_type,:user_id,:session_id,:tenant_id,
                  :request_id,:occurred_at,'received',null,:payload_digest,
                  cast(:metadata as jsonb)
                )
                on conflict(provider,provider_event_id) do nothing
                returning id
            """),
            {
                "event_id": payload.provider_event_id,
                "event_type": payload.event_type,
                "user_id": payload.user_id,
                "session_id": payload.session_id,
                "tenant_id": payload.tenant_id,
                "request_id": payload.request_id or getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
                "occurred_at": payload.occurred_at,
                "payload_digest": payload.payload_digest,
                "metadata": json.dumps({
                    "correlation_id": getattr(request.state, "correlation_id", None) or request.headers.get("x-correlation-id"),
                    "trace_id": getattr(request.state, "trace_id", None) or request.headers.get("x-trace-id"),
                }),
            },
        )
        event_id = result.scalar_one_or_none()
        if event_id is None:
            existing = await connection.execute(
                text("""
                    select id,processing_status from public.auth_provider_events
                    where provider='supabase' and provider_event_id=:event_id
                """),
                {"event_id": payload.provider_event_id},
            )
            row = existing.mappings().first()
            return {"status": "duplicate", "event_id": str(row["id"]) if row else None}

        if payload.event_type in {"session.revoked", "user.signed_out"} and payload.session_id:
            session_row = await connection.execute(
                text("""
                    select user_id,not_after from auth.sessions where id=:session_id
                """),
                {"session_id": payload.session_id},
            )
            session = session_row.mappings().first()
            if session is not None:
                if payload.user_id and payload.user_id != session["user_id"]:
                    raise HTTPException(status_code=422, detail="Session event identity mismatch.")
                await connection.execute(
                    text("""
                        insert into public.revoked_sessions(
                          session_id,user_id,expires_at,reason,request_id
                        ) values (
                          :session_id,:user_id,:expires_at,:reason,:request_id
                        )
                        on conflict(session_id) do nothing
                    """),
                    {
                        "session_id": payload.session_id,
                        "user_id": session["user_id"],
                        "expires_at": session["not_after"],
                        "reason": f"auth_provider_event:{payload.event_type}",
                        "request_id": payload.request_id or getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
                    },
                )

        if payload.event_type == "user.banned" and payload.user_id:
            active_sessions = await connection.execute(
                text("""
                    select id,not_after from auth.sessions where user_id=:user_id
                """),
                {"user_id": payload.user_id},
            )
            for auth_session in active_sessions.mappings().all():
                await connection.execute(
                    text("""
                        insert into public.revoked_sessions(
                          session_id,user_id,expires_at,reason,request_id
                        ) values (
                          :session_id,:user_id,:expires_at,'auth_provider_event:user.banned',:request_id
                        )
                        on conflict(session_id) do nothing
                    """),
                    {
                        "session_id": auth_session["id"],
                        "user_id": payload.user_id,
                        "expires_at": auth_session["not_after"],
                        "request_id": payload.request_id or getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
                    },
                )

        await connection.execute(
            text("""
                update public.auth_provider_events
                set processing_status='processed',processed_at=now()
                where id=:event_id
            """),
            {"event_id": event_id},
        )
        await _audit(
            connection,
            request,
            None,
            "auth.provider_event.processed",
            "auth_provider_event",
            event_id,
            payload.tenant_id,
            {
                "provider": "supabase",
                "event_type": payload.event_type,
                "session_revocations_applied": payload.event_type in {
                    "session.revoked", "user.signed_out", "user.banned"
                },
            },
        )
    return {"status": "processed", "event_id": str(event_id)}


@router.post("/break-glass/requests", status_code=status.HTTP_201_CREATED)
async def request_break_glass(
    payload: BreakGlassRequestIn,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_platform_permission(
        claims, session, "platform.security.break_glass.request", "request", "break_glass_request"
    )
    if len(set(payload.permission_keys)) != len(payload.permission_keys):
        raise HTTPException(status_code=422, detail="Duplicate permission keys are not allowed.")
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key="security.break_glass.request",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 201,
                content=reservation.replay_body or {},
            )
        permissions = await connection.execute(
            text("""
                select key,risk_level from public.permissions
                where key = any(:keys) and key like 'platform.%'
                  and risk_level in ('privileged','critical')
            """),
            {"keys": payload.permission_keys},
        )
        valid_keys = {row["key"] for row in permissions.mappings().all()}
        if valid_keys != set(payload.permission_keys):
            raise HTTPException(
                status_code=422,
                detail="Requested permission scope contains an unknown or non-platform key.",
            )
        tenant_check = await connection.execute(
            text("""
                select count(*) from public.tenants
                where id = any(:tenant_ids) and status='active'
            """),
            {"tenant_ids": payload.tenant_ids},
        )
        if tenant_check.scalar_one() != len(payload.tenant_ids):
            raise HTTPException(
                status_code=422,
                detail="Break-glass tenant scope contains an unknown or inactive tenant.",
            )
        if len(set(payload.tenant_ids)) != len(payload.tenant_ids):
            raise HTTPException(
                status_code=422,
                detail="Duplicate tenant scope entries are not allowed.",
            )
        row = await connection.execute(
            text("""
                insert into public.break_glass_requests(
                  tenant_id,requester_user_id,reason,requested_scope,status,request_id
                ) values (
                  :tenant_id,:actor,:reason,cast(:scope as jsonb),'requested',:request_id
                ) returning id,tenant_id,requester_user_id,reason,requested_scope,status,
                  requested_at
            """),
            {
                "actor": actor,
                "reason": payload.reason.strip(),
                "tenant_id": payload.tenant_ids[0] if len(payload.tenant_ids) == 1 else None,
                "scope": json.dumps(
                    {
                        "permission_keys": payload.permission_keys,
                        "tenant_ids": [str(item) for item in payload.tenant_ids],
                        "duration_minutes": payload.duration_minutes,
                    }
                ),
                "request_id": getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
            },
        )
        result = dict(row.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            "break_glass.requested",
            "break_glass_request",
            result["id"],
            metadata={"permission_keys": payload.permission_keys},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=result,
        )
    return result


@router.post("/break-glass/requests/{request_id}/approve")
async def approve_break_glass(
    request_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_platform_permission(
        claims, session, "platform.security.break_glass.approve", "approve", str(request_id)
    )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"security.break_glass.approve:{request_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload={},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current = await connection.execute(
            text("select * from public.break_glass_requests where id=:id for update"),
            {"id": request_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Break-glass request not found.")
        if row["requester_user_id"] == actor:
            raise HTTPException(
                status_code=403,
                detail="Requester cannot approve their own emergency request.",
            )
        if row["status"] != "requested":
            raise HTTPException(
                status_code=409,
                detail="Only requested emergency access can be approved.",
            )
        updated = await connection.execute(
            text("""
                update public.break_glass_requests
                set approver_user_id=:actor,approved_at=now(),status='approved'
                where id=:id
                returning id,requester_user_id,approver_user_id,status,approved_at,requested_scope
            """),
            {"actor": actor, "id": request_id},
        )
        result = dict(updated.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            "break_glass.approved",
            "break_glass_request",
            request_id,
            metadata={"requester_user_id": str(row["requester_user_id"])},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=result,
        )
    return result


@router.post("/break-glass/requests/{request_id}/activate")
async def activate_break_glass(
    request_id: UUID,
    payload: BreakGlassActivationIn,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_platform_permission(
        claims, session, "platform.security.break_glass.activate", "activate", str(request_id)
    )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"security.break_glass.activate:{request_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current = await connection.execute(
            text("select * from public.break_glass_requests where id=:id for update"),
            {"id": request_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Break-glass request not found.")
        if row["requester_user_id"] != actor:
            raise HTTPException(
                status_code=403,
                detail="Only the original requester can activate approved access.",
            )
        if row["status"] != "approved" or row["approver_user_id"] is None:
            raise HTTPException(
                status_code=409,
                detail="Break-glass request must be approved first.",
            )
        duration = payload.duration_minutes or row["requested_scope"].get("duration_minutes", 30)
        updated = await connection.execute(
            text("""
                update public.break_glass_requests
                set status='active',activated_by=:actor,activated_at=now(),
                    expires_at=now() + make_interval(mins => :duration)
                where id=:id
                returning id,status,activated_at,expires_at,requested_scope
            """),
            {"actor": actor, "duration": duration, "id": request_id},
        )
        result = dict(updated.mappings().one())
        await _audit(
            connection,
            request,
            actor,
            "break_glass.activated",
            "break_glass_request",
            request_id,
            metadata={"expires_at": result["expires_at"], "scope": row["requested_scope"]},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=result,
        )
    return result


@router.post("/break-glass/requests/{request_id}/revoke")
async def revoke_break_glass(
    request_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_platform_permission(
        claims, session, "platform.security.break_glass.revoke", "revoke", str(request_id)
    )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"security.break_glass.revoke:{request_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload={},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current = await connection.execute(
            text("select * from public.break_glass_requests where id=:id for update"),
            {"id": request_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Break-glass request not found.")
        if actor not in {row["requester_user_id"], row["approver_user_id"]}:
            raise HTTPException(
                status_code=403,
                detail="Only requester or approver can revoke this access.",
            )
        if row["status"] not in {"active", "approved"}:
            raise HTTPException(
                status_code=409,
                detail="Only approved or active access can be revoked.",
            )
        updated = await connection.execute(
            text("""
                update public.break_glass_requests
                set status='revoked',revoked_by=:actor,revoked_at=now()
                where id=:id returning id,status,revoked_at
            """),
            {"actor": actor, "id": request_id},
        )
        result = dict(updated.mappings().one())
        await _audit(
            connection, request, actor, "break_glass.revoked", "break_glass_request", request_id
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=result,
        )
    return result


@router.post("/break-glass/requests/{request_id}/review")
async def review_break_glass(
    request_id: UUID,
    payload: BreakGlassReviewIn,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_platform_permission(
        claims, session, "platform.security.break_glass.review", "review", str(request_id)
    )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"security.break_glass.review:{request_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current = await connection.execute(
            text("select * from public.break_glass_requests where id=:id for update"),
            {"id": request_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Break-glass request not found.")
        if row["requester_user_id"] == actor:
            raise HTTPException(
                status_code=403,
                detail="Requester cannot perform the post-incident review.",
            )
        if row["status"] not in {"expired", "revoked"}:
            raise HTTPException(
                status_code=409,
                detail="Only expired or revoked access can be reviewed.",
            )
        updated = await connection.execute(
            text("""
                update public.break_glass_requests
                set status='reviewed',reviewed_at=now(),review_notes=:notes
                where id=:id returning id,status,reviewed_at
            """),
            {"notes": payload.notes, "id": request_id},
        )
        result = dict(updated.mappings().one())
        await _audit(
            connection, request, actor, "break_glass.reviewed", "break_glass_request", request_id
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=result,
        )
    return result


@router.get("/break-glass/requests")
async def list_break_glass_requests(
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_platform_permission(
        claims, session, "platform.security.manage", "manage", "break_glass_requests"
    )
    async with engine.begin() as connection:
        await _expire_break_glass(connection, request)
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,tenant_id,requester_user_id,approver_user_id,reason,requested_scope,
                       status,requested_at,approved_at,activated_at,expires_at,
                       revoked_at,reviewed_at
                from public.break_glass_requests
                order by requested_at desc,id desc
                limit 200
            """)
        )
    return {"data": [dict(row) for row in result.mappings().all()], "actor": str(actor)}


_SENSITIVE_KEYS = {
    "access_token",
    "refresh_token",
    "token",
    "secret",
    "password",
    "credential",
    "authorization",
    "email",
    "phone",
    "ip",
    "ip_address",
}


def _redact(value):
    if isinstance(value, dict):
        return {
            key: ("[REDACTED]" if key.lower() in _SENSITIVE_KEYS else _redact(item))
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_redact(item) for item in value]
    return value


async def _audit_rows(
    connection,
    tenant_id: UUID | None,
    resource_type: str | None,
    actor_user_id: UUID | None,
    limit: int,
    cursor: str | None,
    context: TenantAccessContext | None = None,
):
    params = {"limit": limit + 1}
    filters = []
    if tenant_id is not None:
        filters.append("tenant_id=:tenant_id")
        params["tenant_id"] = tenant_id
    if resource_type:
        filters.append("resource_type=:resource_type")
        params["resource_type"] = resource_type
    if actor_user_id:
        filters.append("actor_user_id=:actor_user_id")
        params["actor_user_id"] = actor_user_id
    if context is not None:
        if context.department_id:
            params["scope_department_id"] = context.department_id
            filters.append("""
                (
                  (resource_type='department' and resource_id=:scope_department_id::text)
                  or (resource_type='membership' and resource_id in (
                    select id::text from public.memberships
                    where tenant_id=:tenant_id and department_id=:scope_department_id
                  ))
                )
            """)
        elif context.branch_id:
            params["scope_branch_id"] = context.branch_id
            filters.append("""
                (
                  (resource_type='branch' and resource_id=:scope_branch_id::text)
                  or (resource_type='department' and resource_id in (
                    select id::text from public.departments
                    where tenant_id=:tenant_id and branch_id=:scope_branch_id
                  ))
                  or (resource_type='membership' and resource_id in (
                    select id::text from public.memberships
                    where tenant_id=:tenant_id and branch_id=:scope_branch_id
                  ))
                )
            """)
        elif context.organization_unit_id:
            params["scope_unit_id"] = context.organization_unit_id
            filters.append("""
                (
                  (resource_type='organization_unit' and resource_id=:scope_unit_id::text)
                  or (resource_type='branch' and resource_id in (
                    select id::text from public.branches
                    where tenant_id=:tenant_id and organization_unit_id=:scope_unit_id
                  ))
                  or (resource_type='department' and resource_id in (
                    select d.id::text from public.departments d
                    join public.branches b on b.id=d.branch_id and b.tenant_id=d.tenant_id
                    where d.tenant_id=:tenant_id and b.organization_unit_id=:scope_unit_id
                  ))
                  or (resource_type='membership' and resource_id in (
                    select id::text from public.memberships
                    where tenant_id=:tenant_id and organization_unit_id=:scope_unit_id
                  ))
                )
            """)
        elif context.organization_id:
            params["scope_organization_id"] = context.organization_id
            filters.append("""
                (
                  (resource_type='organization' and resource_id=:scope_organization_id::text)
                  or (resource_type='organization_unit' and resource_id in (
                    select id::text from public.organization_units
                    where tenant_id=:tenant_id and organization_id=:scope_organization_id
                  ))
                  or (resource_type='branch' and resource_id in (
                    select id::text from public.branches
                    where tenant_id=:tenant_id and organization_id=:scope_organization_id
                  ))
                  or (resource_type='department' and resource_id in (
                    select id::text from public.departments
                    where tenant_id=:tenant_id and organization_id=:scope_organization_id
                  ))
                  or (resource_type='membership' and resource_id in (
                    select id::text from public.memberships
                    where tenant_id=:tenant_id and organization_id=:scope_organization_id
                  ))
                )
            """)
        else:
            filters.append("false")
    if cursor:
        created_at, row_id = _decode_cursor(cursor)
        filters.append("(created_at,id) < (:created_at,:cursor_id)")
        params.update({"created_at": created_at, "cursor_id": row_id})
    where = "where " + " and ".join(filters) if filters else ""
    result = await connection.execute(
        text(f"""
        select id,tenant_id,actor_user_id,action,resource_type,resource_id,request_id,
               metadata,created_at
        from public.audit_logs {where}
        order by created_at desc,id desc limit :limit
    """),
        params,
    )
    rows = [dict(row) for row in result.mappings().all()]
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = (
        _encode_cursor(rows[-1]["created_at"], rows[-1]["id"]) if has_more and rows else None
    )
    safe = [
        {
            **row,
            "metadata": _redact(row.get("metadata") or {}),
        }
        for row in rows
    ]
    return safe, has_more, next_cursor


@router.get("/audit")
async def read_audit_logs(
    request: Request,
    tenant_id: UUID | None = None,
    resource_type: str | None = Query(default=None, max_length=120),
    actor_user_id: UUID | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    platform_read = False
    try:
        await _require_platform_permission(
            claims, session, "platform.audit.read", "read", "audit_log_collection"
        )
        platform_read = True
    except HTTPException as exc:
        if exc.status_code != 403:
            raise
    if not platform_read:
        if tenant_id is None:
            raise HTTPException(
                status_code=403,
                detail="Tenant-scoped audit access requires tenant_id.",
            )
        tenant_context, _ = await authorize_action(
            session,
            user_id=actor,
            tenant_id=tenant_id,
            permission_key="corporate.audit.read",
            platform_permission="",
            aal=None,
            resource_type="corporate.audit",
            action="read",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
            request_id=getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
        )
    if platform_read:
        tenant_context = None
    async with engine.connect() as connection:
        rows, has_more, next_cursor = await _audit_rows(
            connection, tenant_id, resource_type, actor_user_id, limit, cursor, tenant_context
        )
    async with engine.begin() as connection:
        await _audit(
            connection,
            request,
            actor,
            "audit.logs.read",
            "audit_log_collection",
            tenant_id,
            tenant_id,
            {"limit": limit, "resource_type": resource_type},
        )
    return {
        "data": rows,
        "meta": {
            "has_more": has_more,
            "next_cursor": next_cursor,
            "request_id": getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
        },
    }


@router.get("/audit/export")
async def export_audit_logs(
    request: Request,
    tenant_id: UUID | None = None,
    resource_type: str | None = Query(default=None, max_length=120),
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    platform_export = False
    try:
        await _require_platform_permission(
            claims, session, "platform.audit.export", "export", "audit_log_export"
        )
        platform_export = True
    except HTTPException as exc:
        if exc.status_code != 403:
            raise
    if not platform_export:
        if tenant_id is None:
            raise HTTPException(
                status_code=403,
                detail="Tenant-scoped audit export requires tenant_id.",
            )
        tenant_context, _ = await authorize_action(
            session,
            user_id=actor,
            tenant_id=tenant_id,
            permission_key="corporate.audit.export",
            platform_permission="",
            aal=None,
            resource_type="corporate.audit",
            action="export",
            resource={"id": str(tenant_id), "tenant_id": str(tenant_id)},
            request_id=getattr(request.state, "request_id", None) or request.headers.get("x-request-id"),
        )
    if platform_export:
        tenant_context = None
    async with engine.connect() as connection:
        rows, _, _ = await _audit_rows(
            connection, tenant_id, resource_type, None, 5000, None, tenant_context
        )
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "id",
            "tenant_id",
            "actor_user_id",
            "action",
            "resource_type",
            "resource_id",
            "request_id",
            "created_at",
            "metadata",
        ],
    )
    writer.writeheader()
    for row in rows:
        writer.writerow({**row, "metadata": json.dumps(row["metadata"], default=str)})
    async with engine.begin() as connection:
        await _audit(
            connection,
            request,
            actor,
            "audit.logs.exported",
            "audit_log_export",
            str(tenant_id or "platform"),
            tenant_id,
            {"rows": len(rows), "resource_type": resource_type},
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="agentzy-audit-export.csv"'},
    )


@router.post("/break-glass/requests/{request_id}/reject")
async def reject_break_glass(
    request_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_platform_permission(
        claims, session, "platform.security.break_glass.approve", "approve", str(request_id)
    )
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"security.break_glass.reject:{request_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload={},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current = await connection.execute(
            text("select * from public.break_glass_requests where id=:id for update"),
            {"id": request_id},
        )
        row = current.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Break-glass request not found.")
        if row["requester_user_id"] == actor:
            raise HTTPException(
                status_code=403,
                detail="Requester cannot reject their own emergency request.",
            )
        if row["status"] != "requested":
            raise HTTPException(
                status_code=409,
                detail="Only requested emergency access can be rejected.",
            )
        updated = await connection.execute(
            text("""
                update public.break_glass_requests
                set status='rejected',approver_user_id=:actor,approved_at=now()
                where id=:id returning id,status,approver_user_id,approved_at
            """),
            {"actor": actor, "id": request_id},
        )
        result = dict(updated.mappings().one())
        await _audit(
            connection, request, actor, "break_glass.rejected", "break_glass_request", request_id
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=result,
        )
    return result
