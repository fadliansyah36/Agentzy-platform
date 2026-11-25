"""Tenant AI Worker registry governed by active contract entitlements."""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import text

from app.core.security import current_claims
from app.db.session import engine
from app.services.contract_entitlement_service import resolve_effective_entitlements
from app.api.v1.routes.corporate_contracts import require_tenant_permission

router = APIRouter(prefix="/corporate/ai-workers", tags=["Corporate AI Workforce"])
claims_dependency = Depends(current_claims)


class AIWorkerCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    contract_id: UUID
    service_key: str = Field(min_length=2, max_length=100)
    worker_code: str = Field(min_length=2, max_length=80, pattern=r"^[A-Za-z0-9._/-]+$")
    display_name: str = Field(min_length=2, max_length=160)
    model_provider: str = Field(min_length=2, max_length=80)
    model_key: str = Field(min_length=2, max_length=160)
    capabilities: list[str] = Field(default_factory=list, max_length=40)
    runtime_config: dict = Field(default_factory=dict)

    @field_validator("runtime_config")
    @classmethod
    def reject_secret_material(cls, value: dict) -> dict:
        forbidden = {"api_key", "secret", "access_token", "refresh_token", "password", "credential"}
        if any(str(key).lower() in forbidden for key in value):
            raise ValueError("Provider credentials must be stored in the Connections Center, not worker config.")
        return value


class AIWorkerPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    display_name: str | None = Field(default=None, min_length=2, max_length=160)
    model_provider: str | None = Field(default=None, min_length=2, max_length=80)
    model_key: str | None = Field(default=None, min_length=2, max_length=160)
    capabilities: list[str] | None = Field(default=None, max_length=40)
    runtime_config: dict | None = None


async def _active_grant(tenant_id: UUID, contract_id: UUID, service_key: str) -> dict:
    async with engine.connect() as connection:
        grants = await resolve_effective_entitlements(connection, tenant_id)
    grant = next(
        (item for item in grants
         if item["contract_id"] == contract_id and item["service_key"] == service_key),
        None,
    )
    if grant is None:
        raise HTTPException(status_code=403, detail="Service entitlement is not active for this contract.")
    return grant


async def _ensure_capacity(connection, tenant_id: UUID, contract_id: UUID, service_key: str) -> None:
    grants = await resolve_effective_entitlements(connection, tenant_id)
    grant = next(
        (item for item in grants
         if item["contract_id"] == contract_id and item["service_key"] == service_key),
        None,
    )
    if grant is None:
        raise HTTPException(status_code=403, detail="Service entitlement is not active for this contract.")
    if grant["ai_worker_limit"] is None:
        return
    result = await connection.execute(
        text("""
            select count(*) from public.tenant_ai_workers
            where tenant_id=:tenant and contract_id=:contract and service_key=:service
              and status='active'
        """),
        {"tenant": tenant_id, "contract": contract_id, "service": service_key},
    )
    if result.scalar_one() >= grant["ai_worker_limit"]:
        raise HTTPException(status_code=409, detail="AI Worker contract entitlement limit reached.")


@router.get("")
async def list_tenant_ai_workers(tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.ai_workers.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,contract_id,service_key,worker_code,display_name,
                       model_provider,model_key,capabilities,status,created_at,updated_at
                from public.tenant_ai_workers
                where tenant_id=:tenant order by created_at desc,id desc
            """),
            {"tenant": tenant_id},
        )
    return {"data": [{
        **dict(row), "id": str(row["id"]), "contract_id": str(row["contract_id"]),
        "created_at": row["created_at"].isoformat(), "updated_at": row["updated_at"].isoformat(),
    } for row in result.mappings().all()]}


@router.post("", status_code=201)
async def create_tenant_ai_worker(
    payload: AIWorkerCreate,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.ai_workers.manage")
    await _active_grant(payload.tenant_id, payload.contract_id, payload.service_key)
    async with engine.begin() as connection:
        existing = await connection.execute(
            text("""
                select id from public.tenant_ai_workers
                where tenant_id=:tenant and worker_code=:code
            """),
            {"tenant": payload.tenant_id, "code": payload.worker_code},
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Worker code sudah digunakan.")
        result = await connection.execute(
            text("""
                insert into public.tenant_ai_workers(
                  tenant_id,contract_id,service_key,worker_code,display_name,
                  model_provider,model_key,capabilities,runtime_config,created_by,updated_by
                ) values(
                  :tenant,:contract,:service,:code,:name,:provider,:model,
                  cast(:capabilities as jsonb),cast(:config as jsonb),:actor,:actor
                ) returning id,status,worker_code
            """),
            {
                "tenant": payload.tenant_id, "contract": payload.contract_id,
                "service": payload.service_key, "code": payload.worker_code,
                "name": payload.display_name, "provider": payload.model_provider,
                "model": payload.model_key, "capabilities": json.dumps(payload.capabilities),
                "config": json.dumps(payload.runtime_config), "actor": actor,
            },
        )
        row = dict(result.mappings().one())
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'corporate.ai_worker.created',
                  'ai_worker',:id,:request_id,cast(:metadata as jsonb))
            """),
            {
                "tenant": payload.tenant_id, "actor": actor, "id": str(row["id"]),
                "request_id": getattr(request.state, "request_id", None),
                "metadata": json.dumps({"service_key": payload.service_key, "status": "draft"}),
            },
        )
    return {"data": {**row, "id": str(row["id"])}}


@router.patch("/{worker_id}")
async def update_tenant_ai_worker(
    worker_id: UUID,
    payload: AIWorkerPatch,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.ai_workers.manage")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.tenant_ai_workers set
                  display_name=coalesce(:name,display_name),
                  model_provider=coalesce(:provider,model_provider),
                  model_key=coalesce(:model,model_key),
                  capabilities=coalesce(cast(:capabilities as jsonb),capabilities),
                  runtime_config=coalesce(cast(:config as jsonb),runtime_config),
                  updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant and status in ('draft','active','suspended')
                returning id,status,worker_code
            """),
            {
                "name": payload.display_name, "provider": payload.model_provider,
                "model": payload.model_key,
                "capabilities": json.dumps(payload.capabilities) if payload.capabilities is not None else None,
                "config": json.dumps(payload.runtime_config) if payload.runtime_config is not None else None,
                "actor": actor, "id": worker_id, "tenant": payload.tenant_id,
            },
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="AI Worker tidak ditemukan.")
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'corporate.ai_worker.updated',
                  'ai_worker',:id,:request_id,'{}'::jsonb)
            """),
            {
                "tenant": payload.tenant_id, "actor": actor, "id": str(worker_id),
                "request_id": getattr(request.state, "request_id", None),
            },
        )
    return {"data": {**dict(row), "id": str(row["id"])}}


@router.post("/{worker_id}/activate")
async def activate_tenant_ai_worker(
    worker_id: UUID,
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.ai_workers.manage")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select contract_id,service_key,status from public.tenant_ai_workers
                where id=:id and tenant_id=:tenant
            """),
            {"id": worker_id, "tenant": tenant_id},
        )
        worker = result.mappings().first()
    if not worker or worker["status"] not in ("draft","suspended"):
        raise HTTPException(status_code=409, detail="AI Worker tidak dapat diaktifkan.")
    async with engine.begin() as connection:
        lock_key = str(tenant_id) + ":" + str(worker["contract_id"]) + ":" + worker["service_key"]
        await connection.execute(
            text("select pg_advisory_xact_lock(hashtextextended(:lock_key,0))"),
            {"lock_key": lock_key},
        )
        await _ensure_capacity(
            connection, tenant_id, worker["contract_id"], worker["service_key"]
        )
        result = await connection.execute(
            text("""
                update public.tenant_ai_workers set
                status='active',updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant and status in ('draft','suspended')
                returning id,status
            """),
            {"actor": actor, "id": worker_id, "tenant": tenant_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=409, detail="Status AI Worker berubah; refresh lalu ulangi.")
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'corporate.ai_worker.activated',
                  'ai_worker',:id,:request_id,'{}'::jsonb)
            """),
            {"tenant": tenant_id, "actor": actor, "id": str(worker_id),
             "request_id": getattr(request.state, "request_id", None)},
        )
    return {"data": {"id": str(worker_id), "status": "active"}}


@router.post("/{worker_id}/suspend")
async def suspend_tenant_ai_worker(
    worker_id: UUID,
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.ai_workers.manage")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.tenant_ai_workers set
                status='suspended',updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant and status='active' returning id,status
            """),
            {"actor": actor, "id": worker_id, "tenant": tenant_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=409, detail="AI Worker tidak aktif.")
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'corporate.ai_worker.suspended',
                  'ai_worker',:id,:request_id,'{}'::jsonb)
            """),
            {"tenant": tenant_id, "actor": actor, "id": str(worker_id),
             "request_id": getattr(request.state, "request_id", None)},
        )
    return {"data": {"id": str(worker_id), "status": "suspended"}}
