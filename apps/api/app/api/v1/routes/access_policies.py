import base64
import json
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.abac import PolicyValidationError, validate_condition
from app.core.authorization import authorize_platform_action
from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.core.pagination import PageResponse
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter(prefix="/security/access-policies", tags=["ABAC Policies"])


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None) or request.headers.get("x-request-id")


claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


class AccessPolicyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    policy_key: str = Field(min_length=3, max_length=120, pattern=r"^[a-z][a-z0-9_.:-]+$")
    policy_name: str = Field(min_length=3, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    tenant_id: UUID | None = None
    resource: str = Field(min_length=2, max_length=120)
    action: str = Field(min_length=2, max_length=80)
    effect: str = Field(pattern="^(allow|deny)$")
    conditions: dict = Field(default_factory=dict)
    priority: int = Field(default=100, ge=0, le=10000)
    effective_from: datetime | None = None
    effective_until: datetime | None = None

    @model_validator(mode="after")
    def validate_policy(self):
        try:
            validate_condition(self.conditions)
        except PolicyValidationError as exc:
            raise ValueError(str(exc)) from exc
        if self.effective_from and self.effective_until:
            start = self.effective_from.replace(tzinfo=self.effective_from.tzinfo or UTC)
            end = self.effective_until.replace(tzinfo=self.effective_until.tzinfo or UTC)
            if end <= start:
                raise ValueError("effective_until must be later than effective_from")
        return self


class AccessPolicyPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    policy_name: str | None = Field(default=None, min_length=3, max_length=160)
    description: str | None = Field(default=None, max_length=1000)
    resource: str | None = Field(default=None, min_length=2, max_length=120)
    action: str | None = Field(default=None, min_length=2, max_length=80)
    effect: str | None = Field(default=None, pattern="^(allow|deny)$")
    conditions: dict | None = None
    priority: int | None = Field(default=None, ge=0, le=10000)
    effective_from: datetime | None = None
    effective_until: datetime | None = None
    status: str | None = Field(default=None, pattern="^(active|inactive)$")

    @model_validator(mode="after")
    def validate_policy(self):
        if not self.model_fields_set:
            raise ValueError("At least one policy field must be supplied")
        if "conditions" in self.model_fields_set and self.conditions is None:
            raise ValueError("conditions cannot be null")
        for field in ("policy_name", "resource", "action", "effect", "priority", "status"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        if self.conditions is not None:
            try:
                validate_condition(self.conditions)
            except PolicyValidationError as exc:
                raise ValueError(str(exc)) from exc
        return self


class AccessPolicyRead(BaseModel):
    id: UUID
    tenant_id: UUID | None
    policy_key: str
    policy_name: str
    description: str | None
    resource: str
    action: str
    effect: str
    conditions: dict
    priority: int
    status: str
    version: int
    effective_from: datetime | None
    effective_until: datetime | None
    created_by: UUID | None
    updated_by: UUID | None
    created_at: datetime
    updated_at: datetime


def _encode_cursor(created_at: datetime, policy_id: UUID) -> str:
    raw = json.dumps({"created_at": created_at.isoformat(), "id": str(policy_id)}).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    try:
        if len(cursor) > 512:
            raise ValueError("cursor too long")
        raw = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        value = json.loads(raw)
        created_at = datetime.fromisoformat(value["created_at"])
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=UTC)
        return created_at, UUID(value["id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail="Invalid cursor") from exc


async def _authorize_policy_object(
    session: AsyncSession,
    *,
    actor: UUID,
    policy: dict,
    request_id: str | None,
) -> None:
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key="platform.security.manage",
        resource_type="platform.security",
        action="manage",
        resource={
            "id": str(policy.get("id") or policy.get("policy_key")),
            "tenant_id": str(policy["tenant_id"]) if policy.get("tenant_id") else None,
            "policy_key": policy.get("policy_key"),
            "resource": policy.get("resource"),
            "action": policy.get("action"),
            "effect": policy.get("effect"),
            "status": policy.get("status"),
            "version": policy.get("version"),
        },
        request_id=request_id,
    )


async def _require_security_admin(claims: dict, session: AsyncSession) -> UUID:
    actor = UUID(claims["sub"])
    if claims.get("aal") != "aal2":
        raise HTTPException(
            status_code=403,
            detail="Platform security administration requires AAL2.",
        )
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key="platform.security.manage",
        resource_type="platform.security",
        action="manage",
        resource={"id": "access_policy_administration"},
    )
    return actor


async def _audit(
    connection,
    request: Request,
    actor: UUID,
    tenant_id: UUID | None,
    action: str,
    policy_id: UUID,
    metadata: dict | None = None,
):
    await connection.execute(
        text("""
            insert into public.audit_logs(
              tenant_id,actor_user_id,action,resource_type,resource_id,request_id,
              ip_address,user_agent,metadata
            ) values (
              :tenant_id,:actor,:action,'access_policy',:resource_id,:request_id,
              :ip,:user_agent,cast(:metadata as jsonb)
            )
        """),
        {
            "tenant_id": tenant_id,
            "actor": actor,
            "action": action,
            "resource_id": str(policy_id),
            "request_id": _request_id(request),
            "ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "metadata": json.dumps(
                {
                    **(metadata or {}),
                    "correlation_id": getattr(request.state, "correlation_id", None),
                    "trace_id": getattr(request.state, "trace_id", None),
                },
                default=str,
            ),
        },
    )


async def _save_version(connection, row: dict, actor: UUID):
    await connection.execute(
        text("""
            insert into public.access_policy_versions(
              policy_id,tenant_id,version,snapshot,changed_by
            )
            values(:id,:tenant_id,:version,cast(:snapshot as jsonb),:actor)
        """),
        {
            "id": row["id"],
            "tenant_id": row["tenant_id"],
            "version": row["version"],
            "snapshot": json.dumps(row, default=str),
            "actor": actor,
        },
    )


@router.get("", response_model=PageResponse)
async def list_access_policies(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = None,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    await _require_security_admin(claims, session)
    params = {"limit": limit + 1}
    clause = ""
    if cursor:
        created_at, policy_id = _decode_cursor(cursor)
        clause = "and (created_at, id) < (:created_at, :cursor_id)"
        params.update({"created_at": created_at, "cursor_id": policy_id})
    async with engine.connect() as connection:
        result = await connection.execute(
            text(f"""
            select id,tenant_id,policy_key,policy_name,description,resource,action,effect,
                   conditions,priority,status,version,effective_from,effective_until,
                   created_by,updated_by,created_at,updated_at
            from public.access_policies
            where true {clause}
            order by created_at desc,id desc
            limit :limit
        """),
            params,
        )
    rows = [dict(row) for row in result.mappings().all()]
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = (
        _encode_cursor(rows[-1]["created_at"], rows[-1]["id"]) if has_more and rows else None
    )
    return {
        "data": [AccessPolicyRead(**row).model_dump(mode="json") for row in rows],
        "meta": {
            "next_cursor": next_cursor,
            "has_more": has_more,
            "request_id": _request_id(request),
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED, response_model=AccessPolicyRead)
async def create_access_policy(
    payload: AccessPolicyCreate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_security_admin(claims, session)
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=payload.tenant_id,
            command_key="access_policy.create",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 201,
                content=reservation.replay_body or {},
            )
        if payload.tenant_id:
            exists = await connection.execute(
                text("select 1 from public.tenants where id=:id"), {"id": payload.tenant_id}
            )
            if exists.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Tenant not found")
        duplicate = await connection.execute(
            text("""
            select id from public.access_policies
            where policy_key=:key and tenant_id is not distinct from :tenant_id limit 1
        """),
            {"key": payload.policy_key, "tenant_id": payload.tenant_id},
        )
        if duplicate.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Policy key already exists in this scope")
        result = await connection.execute(
            text("""
            insert into public.access_policies(
              tenant_id,policy_key,policy_name,description,resource,action,effect,
              conditions,priority,status,version,effective_from,effective_until,
              created_by,updated_by
            ) values (
              :tenant_id,:policy_key,:policy_name,:description,:resource,:action,:effect,
              cast(:conditions as jsonb),:priority,'active',1,
              :effective_from,:effective_until,:actor,:actor
            ) returning *
        """),
            {
                **payload.model_dump(exclude={"conditions"}),
                "conditions": json.dumps(payload.conditions),
                "actor": actor,
            },
        )
        row = dict(result.mappings().one())
        await _save_version(connection, row, actor)
        await _audit(
            connection,
            request,
            actor,
            row["tenant_id"],
            "access_policy.created",
            row["id"],
            {"policy_key": row["policy_key"], "version": row["version"]},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=201,
            response_body=AccessPolicyRead(**row).model_dump(mode="json"),
        )
    return AccessPolicyRead(**row)


@router.patch("/{policy_id}", response_model=AccessPolicyRead)
async def update_access_policy(
    policy_id: UUID,
    payload: AccessPolicyPatch,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _require_security_admin(claims, session)
    values = payload.model_dump(exclude_unset=True)
    if "conditions" in values and values["conditions"] is not None:
        values["conditions"] = json.dumps(values["conditions"])
    assignments = [
        f"{key}=cast(:{key} as jsonb)" if key == "conditions" else f"{key}=:{key}" for key in values
    ]
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"access_policy.update:{policy_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json", exclude_unset=True),
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current = await connection.execute(
            text("select * from public.access_policies where id=:id for update"),
            {"id": policy_id},
        )
        existing = current.mappings().first()
        if existing is None:
            raise HTTPException(status_code=404, detail="Policy not found")
        await _authorize_policy_object(
            session, actor=actor, policy=dict(existing), request_id=_request_id(request)
        )
        start = values.get("effective_from", existing["effective_from"])
        end = values.get("effective_until", existing["effective_until"])
        if start and end and end <= start:
            raise HTTPException(
                status_code=422,
                detail="effective_until must be later than effective_from",
            )
        result = await connection.execute(
            text(f"""
            update public.access_policies
            set {", ".join(assignments)},version=version+1,updated_by=:actor,updated_at=now()
            where id=:id returning *
        """),
            {**values, "actor": actor, "id": policy_id},
        )
        row = dict(result.mappings().one())
        await _save_version(connection, row, actor)
        await _audit(
            connection,
            request,
            actor,
            row["tenant_id"],
            "access_policy.updated",
            row["id"],
            {"policy_key": row["policy_key"], "version": row["version"]},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=AccessPolicyRead(**row).model_dump(mode="json"),
        )
    return AccessPolicyRead(**row)


async def _set_policy_status(
    policy_id: UUID, new_status: str, request: Request, claims: dict, session: AsyncSession
):
    actor = await _require_security_admin(claims, session)
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"access_policy.status:{policy_id}:{new_status}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload={"status": new_status},
        )
        if reservation.replay:
            return JSONResponse(
                status_code=reservation.replay_status or 200,
                content=reservation.replay_body or {},
            )
        current = await connection.execute(
            text("select * from public.access_policies where id=:id for update"),
            {"id": policy_id},
        )
        existing = current.mappings().first()
        if existing is None:
            raise HTTPException(status_code=404, detail="Policy not found")
        await _authorize_policy_object(
            session, actor=actor, policy=dict(existing), request_id=_request_id(request)
        )
        result = await connection.execute(
            text("""
            update public.access_policies
            set status=:status,version=version+1,updated_by=:actor,updated_at=now()
            where id=:id returning *
        """),
            {"status": new_status, "actor": actor, "id": policy_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Policy not found")
        row = dict(row)
        await _save_version(connection, row, actor)
        await _audit(
            connection,
            request,
            actor,
            row["tenant_id"],
            f"access_policy.{new_status}",
            row["id"],
            {"policy_key": row["policy_key"], "version": row["version"]},
        )
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=AccessPolicyRead(**row).model_dump(mode="json"),
        )
    return AccessPolicyRead(**row)


@router.post("/{policy_id}/activate", response_model=AccessPolicyRead)
async def activate_access_policy(
    policy_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await _set_policy_status(policy_id, "active", request, claims, session)


@router.post("/{policy_id}/disable", response_model=AccessPolicyRead)
async def disable_access_policy(
    policy_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    return await _set_policy_status(policy_id, "inactive", request, claims, session)


@router.get("/{policy_id}/versions")
async def read_access_policy_versions(
    policy_id: UUID, claims: dict = claims_dependency, session: AsyncSession = session_dependency
):
    actor = await _require_security_admin(claims, session)
    async with engine.connect() as connection:
        current = await connection.execute(
            text("select * from public.access_policies where id=:id"),
            {"id": policy_id},
        )
        policy = current.mappings().first()
        if policy is None:
            raise HTTPException(status_code=404, detail="Policy not found")
        await _authorize_policy_object(
            session, actor=actor, policy=dict(policy), request_id=None
        )
        result = await connection.execute(
            text("""
            select version,snapshot,changed_by,created_at
            from public.access_policy_versions where policy_id=:id order by version desc
        """),
            {"id": policy_id},
        )
    return {"data": [dict(row) for row in result.mappings().all()]}
