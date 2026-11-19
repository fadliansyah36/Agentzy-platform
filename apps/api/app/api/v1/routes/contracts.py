"""Corporate contract lifecycle — tenant-scoped FastAPI business authority."""

import hashlib
import json
from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import text

from app.core.security import current_claims
from app.db.session import engine

router = APIRouter(prefix="/corporate/contracts", tags=["Corporate Contracts"])
claims_dependency = Depends(current_claims)


class ContractServiceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_key: str = Field(min_length=2, max_length=100)
    service_scope: str = Field(min_length=3, max_length=4000)
    quantity: int = Field(default=1, ge=1, le=100000)
    monthly_fee: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    sla: dict = Field(default_factory=dict)
    entitlement: dict = Field(default_factory=dict)


class ContractCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    contract_number: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9._/-]+$")
    title: str = Field(min_length=3, max_length=240)
    contract_type: Literal["master", "statement_of_work", "amendment"] = "master"
    currency: str = Field(default="IDR", min_length=3, max_length=3)
    effective_start: date | None = None
    effective_end: date | None = None
    renewal_at: date | None = None
    scope_summary: str = Field(min_length=3, max_length=8000)
    terms: str | None = Field(default=None, max_length=30000)
    commercial_snapshot: dict = Field(default_factory=dict)
    services: list[ContractServiceInput] = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.effective_start and self.effective_end and self.effective_end < self.effective_start:
            raise ValueError("Tanggal akhir kontrak tidak boleh sebelum tanggal mulai.")
        return self


class SubmitReview(BaseModel):
    model_config = ConfigDict(extra="forbid")
    approver_user_ids: list[UUID] = Field(min_length=1, max_length=5)


class ApprovalDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=3, max_length=2000)


async def _require_permission(user_id: UUID, tenant_id: UUID, permission: str) -> None:
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select exists (
                  select 1
                  from public.memberships m
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.roles r on r.id=mr.role_id
                  join public.role_permissions rp on rp.role_id=r.id
                  where m.user_id=:user_id and m.tenant_id=:tenant_id and m.status='active'
                    and rp.permission_key=:permission
                    and mr.scope_type='tenant' and mr.scope_id is null
                    and (mr.valid_from is null or mr.valid_from<=now())
                    and (mr.valid_until is null or mr.valid_until>now())
                    and (r.tenant_id is null or r.tenant_id=m.tenant_id)
                )
            """),
            {"user_id": user_id, "tenant_id": tenant_id, "permission": permission},
        )
    if not result.scalar_one():
        raise HTTPException(status_code=403, detail="Akses kontrak untuk tenant ini tidak diizinkan.")


async def _audit_event(connection, *, tenant_id, actor, contract_id, event_type, from_status, to_status, request_id, metadata=None):
    await connection.execute(
        text("""
            insert into public.contract_events(
              tenant_id,contract_id,actor_user_id,event_type,from_status,to_status,metadata,request_id
            ) values(
              :tenant_id,:contract_id,:actor,:event_type,:from_status,:to_status,
              cast(:metadata as jsonb),:request_id
            )
        """),
        {
            "tenant_id": tenant_id,
            "contract_id": contract_id,
            "actor": actor,
            "event_type": event_type,
            "from_status": from_status,
            "to_status": to_status,
            "metadata": json.dumps(metadata or {}, default=str),
            "request_id": request_id,
        },
    )
    await connection.execute(
        text("""
            insert into public.audit_logs(
              tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
            ) values(:tenant_id,:actor,:event_type,'contract',:contract_id,:request_id,cast(:metadata as jsonb))
        """),
        {
            "tenant_id": tenant_id,
            "actor": actor,
            "event_type": event_type,
            "contract_id": str(contract_id),
            "request_id": request_id,
            "metadata": json.dumps(metadata or {}, default=str),
        },
    )


@router.post("", status_code=201)
async def create_contract(
    payload: ContractCreate,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi (8–128 karakter).")
    await _require_permission(actor, payload.tenant_id, "corporate.contracts.manage")
    canonical = payload.model_dump(mode="json")
    fingerprint = hashlib.sha256(
        json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    async with engine.begin() as connection:
        replay = await connection.execute(
            text("""
                select id,status,current_version,idempotency_fingerprint from public.contracts
                where tenant_id=:tenant_id and idempotency_key=:key
            """),
            {"tenant_id": payload.tenant_id, "key": idempotency_key},
        )
        existing = replay.mappings().first()
        if existing:
            if existing["idempotency_fingerprint"] != fingerprint:
                raise HTTPException(status_code=409, detail="Idempotency-Key sudah digunakan untuk payload berbeda.")
            return {"data": {"id": str(existing["id"]), "status": existing["status"],
                             "version": existing["current_version"], "replayed": True}}
        contract_result = await connection.execute(
            text("""
                insert into public.contracts(
                  tenant_id,contract_number,title,contract_type,status,currency,
                  effective_start,effective_end,renewal_at,idempotency_key,
                  idempotency_fingerprint,created_by,updated_by
                ) values(
                  :tenant_id,:number,:title,:type,'draft',:currency,
                  :start,:end,:renewal,:key,:fingerprint,:actor,:actor
                ) returning id
            """),
            {
                "tenant_id": payload.tenant_id,
                "number": payload.contract_number,
                "title": payload.title,
                "type": payload.contract_type,
                "currency": payload.currency.upper(),
                "start": payload.effective_start,
                "end": payload.effective_end,
                "renewal": payload.renewal_at,
                "key": idempotency_key,
                "fingerprint": fingerprint,
                "actor": actor,
            },
        )
        contract_id = contract_result.scalar_one()
        snapshot = {
            "contract_number": payload.contract_number,
            "title": payload.title,
            "contract_type": payload.contract_type,
            "currency": payload.currency.upper(),
            "effective_start": payload.effective_start.isoformat() if payload.effective_start else None,
            "effective_end": payload.effective_end.isoformat() if payload.effective_end else None,
            "scope_summary": payload.scope_summary,
            "terms": payload.terms,
            "commercial_snapshot": payload.commercial_snapshot,
            "services": [item.model_dump(mode="json") for item in payload.services],
            "request_fingerprint": fingerprint,
        }
        content_hash = hashlib.sha256(
            json.dumps(snapshot, sort_keys=True, separators=(",", ":"), default=str).encode()
        ).hexdigest()
        version_result = await connection.execute(
            text("""
                insert into public.contract_versions(
                  tenant_id,contract_id,version_number,version_status,scope_summary,terms,
                  commercial_snapshot,content_hash,created_by
                ) values(
                  :tenant_id,:contract_id,1,'draft',:scope,:terms,
                  cast(:commercial as jsonb),:content_hash,:actor
                ) returning id
            """),
            {
                "tenant_id": payload.tenant_id,
                "contract_id": contract_id,
                "scope": payload.scope_summary,
                "terms": payload.terms,
                "commercial": json.dumps({
                    "currency": payload.currency.upper(),
                    "commercial": payload.commercial_snapshot,
                    "effective_start": snapshot["effective_start"],
                    "effective_end": snapshot["effective_end"],
                }),
                "content_hash": content_hash,
                "actor": actor,
            },
        )
        version_id = version_result.scalar_one()
        for item in payload.services:
            await connection.execute(
                text("""
                    insert into public.contract_services(
                      tenant_id,contract_id,contract_version_id,service_key,service_scope,
                      quantity,monthly_fee,currency,sla,entitlement
                    ) values(
                      :tenant_id,:contract_id,:version_id,:service_key,:scope,
                      :quantity,:fee,:currency,cast(:sla as jsonb),cast(:entitlement as jsonb)
                    )
                """),
                {
                    "tenant_id": payload.tenant_id,
                    "contract_id": contract_id,
                    "version_id": version_id,
                    "service_key": item.service_key,
                    "scope": item.service_scope,
                    "quantity": item.quantity,
                    "fee": item.monthly_fee,
                    "currency": payload.currency.upper(),
                    "sla": json.dumps(item.sla),
                    "entitlement": json.dumps(item.entitlement),
                },
            )
        await _audit_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.created", from_status=None, to_status="draft",
            request_id=getattr(request.state, "request_id", None),
            metadata={"version": 1, "content_hash": content_hash},
        )
    return {"data": {"id": str(contract_id), "version_id": str(version_id),
                     "contract_number": payload.contract_number, "status": "draft", "version": 1}}


@router.get("")
async def list_contracts(
    tenant_id: UUID,
    status: str | None = Query(default=None, pattern="^(draft|review_pending|approved|active|suspended|expired|terminated|rejected)$"),
    limit: int = Query(default=25, ge=1, le=100),
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await _require_permission(actor, tenant_id, "corporate.contracts.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,contract_number,title,contract_type,status,currency,
                       effective_start,effective_end,renewal_at,current_version,created_at,updated_at
                from public.contracts
                where tenant_id=:tenant_id and (:status is null or status=:status)
                order by created_at desc,id desc limit :limit
            """),
            {"tenant_id": tenant_id, "status": status, "limit": limit},
        )
    rows = []
    for row in result.mappings().all():
        item = dict(row)
        item["id"] = str(item["id"])
        for key in ("effective_start", "effective_end", "renewal_at", "created_at", "updated_at"):
            if item[key] is not None:
                item[key] = item[key].isoformat()
        rows.append(item)
    return {"data": rows, "meta": {"limit": limit, "has_more": len(rows) == limit}}


@router.get("/{contract_id}")
async def get_contract(contract_id: UUID, tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await _require_permission(actor, tenant_id, "corporate.contracts.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select c.*,v.id as version_id,v.version_number,v.version_status,
                       v.scope_summary,v.terms,v.commercial_snapshot,v.content_hash
                from public.contracts c
                join public.contract_versions v
                  on v.contract_id=c.id and v.version_number=c.current_version
                where c.id=:id and c.tenant_id=:tenant_id
            """),
            {"id": contract_id, "tenant_id": tenant_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Kontrak tidak ditemukan.")
        services = await connection.execute(
            text("""
                select service_key,service_scope,quantity,monthly_fee,currency,sla,entitlement
                from public.contract_services
                where contract_id=:id and contract_version_id=:version_id order by id
            """),
            {"id": contract_id, "version_id": row["version_id"]},
        )
        approvals = await connection.execute(
            text("""
                select id,approval_step,approver_user_id,status,decision_reason,decided_at
                from public.contract_approvals where contract_id=:id
                  and contract_version_id=:version_id order by approval_step,id
            """),
            {"id": contract_id, "version_id": row["version_id"]},
        )
    data = dict(row)
    for key, value in list(data.items()):
        if isinstance(value, UUID):
            data[key] = str(value)
        elif hasattr(value, "isoformat"):
            data[key] = value.isoformat()
    data["services"] = [
        {**dict(item), "monthly_fee": str(item["monthly_fee"]) if item["monthly_fee"] is not None else None}
        for item in services.mappings().all()
    ]
    data["approvals"] = [
        {**dict(item), "id": str(item["id"]), "approver_user_id": str(item["approver_user_id"]),
         "decided_at": item["decided_at"].isoformat() if item["decided_at"] else None}
        for item in approvals.mappings().all()
    ]
    return {"data": data}


@router.post("/{contract_id}/submit-review", status_code=202)
async def submit_contract_review(
    contract_id: UUID,
    payload: SubmitReview,
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await _require_permission(actor, tenant_id, "corporate.contracts.manage")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select status,current_version from public.contracts
                where id=:id and tenant_id=:tenant_id for update
            """),
            {"id": contract_id, "tenant_id": tenant_id},
        )
        contract = result.mappings().first()
        if contract is None:
            raise HTTPException(status_code=404, detail="Kontrak tidak ditemukan.")
        if contract["status"] != "draft":
            raise HTTPException(status_code=409, detail="Hanya kontrak draft yang dapat diajukan.")
        approver_result = await connection.execute(
            text("""
                select distinct m.user_id
                from public.memberships m
                where m.tenant_id=:tenant_id and m.status='active' and m.user_id=any(:users)
                  and exists (
                    select 1
                    from public.membership_roles mr
                    join public.roles r on r.id=mr.role_id
                    join public.role_permissions rp on rp.role_id=r.id
                    where mr.membership_id=m.id
                      and rp.permission_key='corporate.contracts.approve'
                      and mr.scope_type='tenant' and mr.scope_id is null
                      and (mr.valid_from is null or mr.valid_from<=now())
                      and (mr.valid_until is null or mr.valid_until>now())
                  )
            """),
            {"tenant_id": tenant_id, "users": payload.approver_user_ids},
        )
        valid_approvers = {row[0] for row in approver_result.all()}
        if valid_approvers != set(payload.approver_user_ids):
            raise HTTPException(status_code=422, detail="Approver harus anggota aktif tenant.")
        for step, approver in enumerate(payload.approver_user_ids, start=1):
            await connection.execute(
                text("""
                    insert into public.contract_approvals(
                      tenant_id,contract_id,contract_version_id,approval_step,approver_user_id
                    ) select :tenant_id,:contract_id,id,:step,:approver
                      from public.contract_versions
                      where contract_id=:contract_id and version_number=:version
                """),
                {"tenant_id": tenant_id, "contract_id": contract_id,
                 "step": step, "approver": approver, "version": contract["current_version"]},
            )
        await connection.execute(
            text("""
                update public.contracts set status='review_pending',updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant_id
            """),
            {"id": contract_id, "tenant_id": tenant_id, "actor": actor},
        )
        await connection.execute(
            text("""
                update public.contract_versions set version_status='submitted'
                where contract_id=:id and version_number=:version
            """),
            {"id": contract_id, "version": contract["current_version"]},
        )
        await _audit_event(
            connection, tenant_id=tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.submitted_for_review", from_status="draft",
            to_status="review_pending", request_id=getattr(request.state, "request_id", None),
            metadata={"approver_count": len(payload.approver_user_ids)},
        )
    return {"data": {"id": str(contract_id), "status": "review_pending"}}


@router.post("/{contract_id}/decision")
async def decide_contract_approval(
    contract_id: UUID,
    payload: ApprovalDecision,
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await _require_permission(actor, tenant_id, "corporate.contracts.approve")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select c.status,c.current_version,a.id as approval_id
                from public.contracts c
                join public.contract_versions v on v.contract_id=c.id and v.version_number=c.current_version
                join public.contract_approvals a on a.contract_version_id=v.id
                where c.id=:id and c.tenant_id=:tenant_id
                  and a.approver_user_id=:actor and a.status='pending'
                for update of c,a
            """),
            {"id": contract_id, "tenant_id": tenant_id, "actor": actor},
        )
        approval = result.mappings().first()
        if approval is None or approval["status"] != "review_pending":
            raise HTTPException(status_code=404, detail="Approval aktif tidak ditemukan.")
        await connection.execute(
            text("""
                update public.contract_approvals
                set status=:decision,decision_reason=:reason,decided_at=now()
                where id=:approval_id
            """),
            {"decision": payload.decision, "reason": payload.reason,
             "approval_id": approval["approval_id"]},
        )
        if payload.decision == "rejected":
            next_status = "rejected"
        else:
            pending = await connection.execute(
                text("""
                    select count(*) from public.contract_approvals
                    where contract_id=:id and status='pending'
                """),
                {"id": contract_id},
            )
            next_status = "approved" if pending.scalar_one() == 0 else "review_pending"
        if next_status != approval["status"]:
            await connection.execute(
                text("""
                    update public.contracts set status=:status,updated_by=:actor,updated_at=now()
                    where id=:id and tenant_id=:tenant_id
                """),
                {"status": next_status, "actor": actor, "id": contract_id, "tenant_id": tenant_id},
            )
            if next_status in ("approved", "rejected"):
                await connection.execute(
                    text("""
                        update public.contract_versions set version_status=:status,
                          approved_at=case when :status='approved' then now() else approved_at end
                        where contract_id=:id and version_number=:version
                    """),
                    {"status": next_status, "id": contract_id, "version": approval["current_version"]},
                )
        await _audit_event(
            connection, tenant_id=tenant_id, actor=actor, contract_id=contract_id,
            event_type=f"contract.approval.{payload.decision}",
            from_status=approval["status"], to_status=next_status,
            request_id=getattr(request.state, "request_id", None),
            metadata={"reason": payload.reason},
        )
    return {"data": {"id": str(contract_id), "status": next_status}}


@router.post("/{contract_id}/activate")
async def activate_contract(
    contract_id: UUID,
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await _require_permission(actor, tenant_id, "corporate.contracts.manage")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select status,effective_start,effective_end from public.contracts
                where id=:id and tenant_id=:tenant_id for update
            """),
            {"id": contract_id, "tenant_id": tenant_id},
        )
        contract = result.mappings().first()
        if contract is None:
            raise HTTPException(status_code=404, detail="Kontrak tidak ditemukan.")
        if contract["status"] != "approved":
            raise HTTPException(status_code=409, detail="Kontrak harus disetujui sebelum aktivasi.")
        today = date.today()
        if contract["effective_start"] and contract["effective_start"] > today:
            raise HTTPException(status_code=409, detail="Tanggal efektif kontrak belum dimulai.")
        if contract["effective_end"] and contract["effective_end"] < today:
            raise HTTPException(status_code=409, detail="Tanggal akhir kontrak telah lewat.")
        await connection.execute(
            text("""
                update public.contracts set status='active',updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant_id
            """),
            {"id": contract_id, "tenant_id": tenant_id, "actor": actor},
        )
        await _audit_event(
            connection, tenant_id=tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.activated", from_status="approved", to_status="active",
            request_id=getattr(request.state, "request_id", None),
        )
    return {"data": {"id": str(contract_id), "status": "active"}}
