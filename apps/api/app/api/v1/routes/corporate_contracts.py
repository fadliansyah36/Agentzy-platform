"""Corporate profile, contract lifecycle, documents, finance and entitlement APIs."""

import hashlib
import io
import json
import zipfile
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import PurePath
from uuid import UUID, uuid4

import structlog
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import text

from app.adapters.contract_storage import (
    MAX_DOCUMENT_BYTES,
    create_contract_document_signed_url,
    delete_contract_document,
    upload_contract_document,
)
from app.core.security import current_claims
from app.db.session import engine
from app.services.contract_entitlement_service import resolve_effective_entitlements

router = APIRouter(prefix="/corporate", tags=["Corporate & Contract Management"])
claims_dependency = Depends(current_claims)
logger = structlog.get_logger()

DOCUMENT_TYPES = {"master_agreement", "statement_of_work", "sla", "amendment", "supporting"}
MIME_EXTENSIONS = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


class CorporateProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    organization_id: UUID | None = None
    branch_id: UUID | None = None
    legal_name: str = Field(min_length=2, max_length=240)
    registration_number: str | None = Field(default=None, max_length=100)
    billing_email: str | None = Field(default=None, max_length=254)
    billing_phone: str | None = Field(default=None, max_length=40)
    billing_address: dict = Field(default_factory=dict)
    tax_profile: dict = Field(default_factory=dict)
    contact_name: str | None = Field(default=None, max_length=160)
    contact_title: str | None = Field(default=None, max_length=120)
    website: str | None = Field(default=None, max_length=500)
    country_code: str = Field(default="ID", min_length=2, max_length=2)


class ProfileStatusInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    status: str = Field(pattern="^(active|suspended|archived)$")
    reason: str = Field(min_length=3, max_length=2000)


class ContractPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    expected_row_version: int = Field(ge=1)
    title: str | None = Field(default=None, min_length=3, max_length=240)
    effective_start: date | None = None
    effective_end: date | None = None
    renewal_at: date | None = None
    renewal_notice_days: int | None = Field(default=None, ge=0, le=365)
    organization_id: UUID | None = None
    branch_id: UUID | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.effective_start and self.effective_end and self.effective_end < self.effective_start:
            raise ValueError("Tanggal akhir kontrak tidak boleh sebelum tanggal mulai.")
        return self


class AmendmentService(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_key: str = Field(min_length=2, max_length=100)
    service_scope: str = Field(min_length=3, max_length=4000)
    quantity: int = Field(default=1, ge=1, le=100000)
    monthly_fee: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    sla: dict = Field(default_factory=dict)
    kpi: dict = Field(default_factory=dict)
    entitlement: dict = Field(default_factory=dict)
    human_workforce_limit: int | None = Field(default=None, ge=0)
    ai_worker_limit: int | None = Field(default=None, ge=0)
    ai_credits_limit: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)


class AmendmentInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    change_summary: str = Field(min_length=3, max_length=2000)
    scope_summary: str = Field(min_length=3, max_length=8000)
    terms: str | None = Field(default=None, max_length=30000)
    effective_from: date
    commercial_snapshot: dict = Field(default_factory=dict)
    services: list[AmendmentService] = Field(min_length=1, max_length=30)


class ApprovalPolicyStepInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    required_permission_key: str = Field(min_length=3, max_length=120)
    required_role_key: str | None = Field(default=None, max_length=80)
    minimum_approvals: int = Field(default=1, ge=1, le=10)


class ApprovalPolicyInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    policy_name: str = Field(min_length=3, max_length=120)
    contract_type: str = Field(pattern="^(master|statement_of_work|amendment)$")
    currency: str = Field(default="IDR", min_length=3, max_length=3)
    min_amount: Decimal = Field(default=Decimal("0"), ge=0)
    max_amount: Decimal | None = Field(default=None, ge=0)
    steps: list[ApprovalPolicyStepInput] = Field(min_length=1, max_length=8)


class DelegationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    delegatee_user_id: UUID
    starts_at: datetime
    ends_at: datetime
    reason: str = Field(min_length=3, max_length=2000)


class ApprovalDecisionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    approval_id: UUID
    decision: str = Field(pattern="^(approved|rejected)$")
    reason: str = Field(min_length=3, max_length=2000)


class RenewalInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    renewal_type: str = Field(default="renewal", pattern="^(renewal|extension)$")
    requested_start: date | None = None
    requested_end: date
    requested_terms: str | None = Field(default=None, max_length=12000)


class LifecycleReason(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    reason: str = Field(min_length=3, max_length=2000)
    effective_at: date | None = None


class InvoiceLineInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    contract_service_id: UUID | None = None
    description: str = Field(min_length=2, max_length=500)
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    unit_amount: Decimal = Field(ge=0, max_digits=18, decimal_places=2)


class InvoiceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    invoice_number: str = Field(min_length=3, max_length=80)
    title: str = Field(min_length=3, max_length=240)
    currency: str = Field(default="IDR", min_length=3, max_length=3)
    tax_amount: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    due_at: date | None = None
    lines: list[InvoiceLineInput] = Field(min_length=1, max_length=50)


class PaymentReferenceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    reference_number: str = Field(min_length=3, max_length=100)
    payment_method: str = Field(min_length=2, max_length=80)
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)


async def require_tenant_permission(user_id: UUID, tenant_id: UUID, permission: str) -> None:
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
                    and r.scope_type='tenant'
                    and (r.tenant_id is null or r.tenant_id=m.tenant_id)
                    and mr.valid_from<=now()
                    and (mr.valid_until is null or mr.valid_until>now())
                )
            """),
            {"user_id": user_id, "tenant_id": tenant_id, "permission": permission},
        )
    if not result.scalar_one():
        raise HTTPException(status_code=403, detail="Akses tenant tidak diizinkan.")


async def audit_contract_event(
    connection, *, tenant_id, actor, contract_id, event_type, request_id,
    from_status=None, to_status=None, metadata=None, idempotency_key=None,
):
    await connection.execute(
        text("""
            insert into public.contract_events(
              tenant_id,contract_id,actor_user_id,event_type,from_status,to_status,
              metadata,request_id,idempotency_key
            ) values(
              :tenant_id,:contract_id,:actor,:event_type,:from_status,:to_status,
              cast(:metadata as jsonb),:request_id,:idempotency_key
            ) on conflict (tenant_id,idempotency_key)
              where idempotency_key is not null do nothing
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
            "idempotency_key": idempotency_key,
        },
    )
    await connection.execute(
        text("""
            insert into public.audit_logs(
              tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
            ) values(
              :tenant_id,:actor,:event_type,'contract',:contract_id,:request_id,
              cast(:metadata as jsonb)
            )
        """),
        {
            "tenant_id": tenant_id, "actor": actor, "event_type": event_type,
            "contract_id": str(contract_id), "request_id": request_id,
            "metadata": json.dumps(metadata or {}, default=str),
        },
    )


async def enqueue_contract_event(connection, *, tenant_id, contract_id, event_type, payload):
    await connection.execute(
        text("""
            insert into public.notification_outbox(
              event_type,aggregate_type,aggregate_id,payload,status,available_at
            ) values(:event_type,'contract',:contract_id,cast(:payload as jsonb),'pending',now())
        """),
        {
            "event_type": event_type,
            "contract_id": contract_id,
            "payload": json.dumps({"tenant_id": str(tenant_id), **payload}, default=str),
        },
    )


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


@router.get("/profile")
async def get_corporate_profile(tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.profiles.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("select * from public.corporate_profiles where tenant_id=:tenant_id"),
            {"tenant_id": tenant_id},
        )
    row = result.mappings().first()
    return {"data": dict(row) if row else None}


@router.put("/profile")
async def upsert_corporate_profile(
    payload: CorporateProfileInput,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.profiles.manage")
    async with engine.begin() as connection:
        if payload.organization_id:
            valid = await connection.execute(
                text("""
                    select exists(select 1 from public.organizations
                      where id=:id and tenant_id=:tenant_id and status='active')
                """),
                {"id": payload.organization_id, "tenant_id": payload.tenant_id},
            )
            if not valid.scalar_one():
                raise HTTPException(status_code=422, detail="Organisasi tidak valid untuk tenant ini.")
        if payload.branch_id:
            valid = await connection.execute(
                text("""
                    select exists(select 1 from public.branches
                      where id=:id and tenant_id=:tenant_id and status='active'
                        and (:organization_id is null or organization_id=:organization_id))
                """),
                {
                    "id": payload.branch_id, "tenant_id": payload.tenant_id,
                    "organization_id": payload.organization_id,
                },
            )
            if not valid.scalar_one():
                raise HTTPException(status_code=422, detail="Cabang tidak valid untuk tenant/organisasi.")
        result = await connection.execute(
            text("""
                insert into public.corporate_profiles(
                  tenant_id,organization_id,branch_id,legal_name,registration_number,
                  billing_email,billing_phone,billing_address,tax_profile,contact_name,
                  contact_title,website,country_code,profile_status,updated_by,updated_at
                ) values(
                  :tenant_id,:organization_id,:branch_id,:legal_name,:registration_number,
                  :billing_email,:billing_phone,cast(:billing_address as jsonb),
                  cast(:tax_profile as jsonb),:contact_name,:contact_title,:website,
                  :country_code,'active',:actor,now()
                )
                on conflict(tenant_id) do update set
                  organization_id=excluded.organization_id,branch_id=excluded.branch_id,
                  legal_name=excluded.legal_name,registration_number=excluded.registration_number,
                  billing_email=excluded.billing_email,billing_phone=excluded.billing_phone,
                  billing_address=excluded.billing_address,tax_profile=excluded.tax_profile,
                  contact_name=excluded.contact_name,contact_title=excluded.contact_title,
                  website=excluded.website,country_code=excluded.country_code,
                  profile_status=case when corporate_profiles.profile_status='archived'
                    then 'draft' else corporate_profiles.profile_status end,
                  updated_by=excluded.updated_by,updated_at=now()
                returning *
            """),
            {
                **payload.model_dump(exclude={"tenant_id"}),
                "tenant_id": payload.tenant_id,
                "billing_address": json.dumps(payload.billing_address),
                "tax_profile": json.dumps(payload.tax_profile),
                "actor": actor,
            },
        )
        row = dict(result.mappings().one())
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant_id,:actor,'corporate.profile.updated',
                  'corporate_profile',:tenant_id,:request_id,'{}'::jsonb)
            """),
            {"tenant_id": payload.tenant_id, "actor": actor, "request_id": _request_id(request)},
        )
    return {"data": row}


@router.patch("/profile/status")
async def update_corporate_profile_status(
    payload: ProfileStatusInput, request: Request, claims: dict = claims_dependency
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.profiles.manage")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.corporate_profiles
                set profile_status=:status,status_reason=:reason,
                    archived_at=case when :status='archived' then now() else null end,
                    updated_by=:actor,updated_at=now()
                where tenant_id=:tenant_id returning tenant_id,profile_status,status_reason,archived_at
            """),
            {
                "status": payload.status, "reason": payload.reason,
                "actor": actor, "tenant_id": payload.tenant_id,
            },
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Corporate profile belum dibuat.")
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant_id,:actor,'corporate.profile.status_changed',
                  'corporate_profile',:tenant_id,:request_id,cast(:metadata as jsonb))
            """),
            {
                "tenant_id": payload.tenant_id, "actor": actor,
                "request_id": _request_id(request),
                "metadata": json.dumps({"status": payload.status, "reason": payload.reason}),
            },
        )
    return {"data": dict(row)}


@router.patch("/contracts/{contract_id}")
async def patch_contract(
    contract_id: UUID, payload: ContractPatch, request: Request, claims: dict = claims_dependency
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.manage")
    async with engine.begin() as connection:
        if payload.organization_id:
            result = await connection.execute(
                text("select exists(select 1 from public.organizations where id=:id and tenant_id=:tenant)"),
                {"id": payload.organization_id, "tenant": payload.tenant_id},
            )
            if not result.scalar_one():
                raise HTTPException(status_code=422, detail="Organisasi kontrak tidak valid.")
        if payload.branch_id:
            result = await connection.execute(
                text("select exists(select 1 from public.branches where id=:id and tenant_id=:tenant)"),
                {"id": payload.branch_id, "tenant": payload.tenant_id},
            )
            if not result.scalar_one():
                raise HTTPException(status_code=422, detail="Cabang kontrak tidak valid.")
        result = await connection.execute(
            text("""
                update public.contracts set
                  title=coalesce(:title,title),
                  effective_start=coalesce(:effective_start,effective_start),
                  effective_end=coalesce(:effective_end,effective_end),
                  renewal_at=coalesce(:renewal_at,renewal_at),
                  renewal_notice_days=coalesce(:notice,renewal_notice_days),
                  organization_id=coalesce(:organization_id,organization_id),
                  branch_id=coalesce(:branch_id,branch_id),
                  row_version=row_version+1,updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant_id and status='draft'
                  and row_version=:expected returning id,status,row_version
            """),
            {
                "title": payload.title, "effective_start": payload.effective_start,
                "effective_end": payload.effective_end, "renewal_at": payload.renewal_at,
                "notice": payload.renewal_notice_days, "organization_id": payload.organization_id,
                "branch_id": payload.branch_id, "actor": actor, "id": contract_id,
                "tenant_id": payload.tenant_id, "expected": payload.expected_row_version,
            },
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=409, detail="Kontrak bukan draft atau row_version sudah berubah.")
        await audit_contract_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.draft_updated", request_id=_request_id(request),
            from_status="draft", to_status="draft", metadata={"row_version": row["row_version"]},
        )
    return {"data": dict(row)}


@router.post("/contracts/{contract_id}/amendments", status_code=201)
async def create_contract_amendment(
    contract_id: UUID,
    payload: AmendmentInput,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi.")
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.manage")
    fingerprint = hashlib.sha256(
        json.dumps(payload.model_dump(mode="json"), sort_keys=True).encode()
    ).hexdigest()
    async with engine.begin() as connection:
        replay = await connection.execute(
            text("""
                select id,metadata from public.contract_events
                where tenant_id=:tenant and idempotency_key=:key
            """),
            {"tenant": payload.tenant_id, "key": idempotency_key},
        )
        old = replay.mappings().first()
        if old:
            if old["metadata"].get("fingerprint") != fingerprint:
                raise HTTPException(status_code=409, detail="Idempotency-Key dipakai untuk payload berbeda.")
            return {"data": {"event_id": str(old["id"]), "replayed": True}}
        contract_result = await connection.execute(
            text("""
                select status,current_version,contract_type,currency
                from public.contracts where id=:id and tenant_id=:tenant for update
            """),
            {"id": contract_id, "tenant": payload.tenant_id},
        )
        contract = contract_result.mappings().first()
        if not contract or contract["status"] not in ("active", "approved"):
            raise HTTPException(status_code=409, detail="Amendment hanya dapat dibuat untuk kontrak approved/active.")
        previous = await connection.execute(
            text("""
                select id,scope_summary,terms,commercial_snapshot
                from public.contract_versions
                where contract_id=:id and version_number=:version
            """),
            {"id": contract_id, "version": contract["current_version"]},
        )
        prior = previous.mappings().one()
        next_version = contract["current_version"] + 1
        snapshot = {
            "parent_version_id": str(prior["id"]),
            "change_summary": payload.change_summary,
            "effective_from": payload.effective_from.isoformat(),
            "commercial": payload.commercial_snapshot,
            "services": [item.model_dump(mode="json") for item in payload.services],
        }
        digest = hashlib.sha256(
            json.dumps({
                "scope": payload.scope_summary, "terms": payload.terms,
                "snapshot": snapshot,
            }, sort_keys=True, default=str).encode()
        ).hexdigest()
        version_result = await connection.execute(
            text("""
                insert into public.contract_versions(
                  tenant_id,contract_id,version_number,version_status,scope_summary,terms,
                  commercial_snapshot,content_hash,created_by
                ) values(
                  :tenant,:contract,:version,'draft',:scope,:terms,
                  cast(:snapshot as jsonb),:hash,:actor
                ) returning id
            """),
            {
                "tenant": payload.tenant_id, "contract": contract_id,
                "version": next_version, "scope": payload.scope_summary,
                "terms": payload.terms, "snapshot": json.dumps(snapshot),
                "hash": digest, "actor": actor,
                "parent_version": prior["id"],
                "change_summary": payload.change_summary,
                "effective_from": payload.effective_from,
            },
        )
        version_id = version_result.scalar_one()
        for service in payload.services:
            await connection.execute(
                text("""
                    insert into public.contract_services(
                      tenant_id,contract_id,contract_version_id,service_key,service_scope,
                      quantity,monthly_fee,currency,sla,entitlement,kpi,
                      human_workforce_limit,ai_worker_limit,ai_credits_limit,effective_start
                    ) values(
                      :tenant,:contract,:version,:key,:scope,:quantity,:fee,:currency,
                      cast(:sla as jsonb),cast(:entitlement as jsonb),cast(:kpi as jsonb),
                      :human_limit,:ai_limit,:credits_limit,:effective
                    )
                """),
                {
                    "tenant": payload.tenant_id, "contract": contract_id,
                    "version": version_id, "key": service.service_key,
                    "scope": service.service_scope, "quantity": service.quantity,
                    "fee": service.monthly_fee, "currency": contract["currency"],
                    "sla": json.dumps(service.sla), "entitlement": json.dumps(service.entitlement),
                    "kpi": json.dumps(service.kpi), "human_limit": service.human_workforce_limit,
                    "ai_limit": service.ai_worker_limit, "credits_limit": service.ai_credits_limit,
                    "effective": payload.effective_from,
                },
            )
        await connection.execute(
            text("""
                update public.contracts set current_version=:version,
                  row_version=row_version+1,updated_by=:actor,updated_at=now()
                where id=:id and tenant_id=:tenant
            """),
            {"version": next_version, "actor": actor, "id": contract_id, "tenant": payload.tenant_id},
        )
        await audit_contract_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.amendment.created", request_id=_request_id(request),
            from_status=contract["status"], to_status="draft",
            metadata={"version": next_version, "content_hash": digest, "change_summary": payload.change_summary,
                      "fingerprint": fingerprint},
            idempotency_key=idempotency_key,
        )
    return {"data": {"contract_id": str(contract_id), "version_id": str(version_id),
                     "version": next_version, "status": contract["status"],
                     "version_status": "draft"}}


@router.post("/approval-policies", status_code=201)
async def create_approval_policy(
    payload: ApprovalPolicyInput, request: Request, claims: dict = claims_dependency
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.policy.manage")
    if payload.max_amount is not None and payload.max_amount < payload.min_amount:
        raise HTTPException(status_code=422, detail="Batas nominal maksimum harus >= minimum.")
    async with engine.begin() as connection:
        for step in payload.steps:
            valid = await connection.execute(
                text("select exists(select 1 from public.permissions where key=:key)"),
                {"key": step.required_permission_key},
            )
            if not valid.scalar_one():
                raise HTTPException(status_code=422, detail="Permission key approval tidak terdaftar.")
            if step.required_role_key:
                valid_role = await connection.execute(
                    text("select exists(select 1 from public.roles where key=:key and scope_type='tenant')"),
                    {"key": step.required_role_key},
                )
                if not valid_role.scalar_one():
                    raise HTTPException(status_code=422, detail="Role approval tidak terdaftar.")
        policy = await connection.execute(
            text("""
                insert into public.contract_approval_policies(
                  tenant_id,policy_name,contract_type,currency,min_amount,max_amount,created_by
                ) values(:tenant,:name,:type,:currency,:minimum,:maximum,:actor) returning id
            """),
            {
                "tenant": payload.tenant_id, "name": payload.policy_name,
                "type": payload.contract_type, "currency": payload.currency.upper(),
                "minimum": payload.min_amount, "maximum": payload.max_amount, "actor": actor,
            },
        )
        policy_id = policy.scalar_one()
        for index, step in enumerate(payload.steps, start=1):
            await connection.execute(
                text("""
                    insert into public.contract_approval_policy_steps(
                      tenant_id,policy_id,step_number,required_permission_key,
                      required_role_key,minimum_approvals
                    ) values(:tenant,:policy,:step,:permission,:role,:minimum)
                """),
                {
                    "tenant": payload.tenant_id, "policy": policy_id, "step": index,
                    "permission": step.required_permission_key, "role": step.required_role_key,
                    "minimum": step.minimum_approvals,
                },
            )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'contract.approval_policy.created',
                  'contract_approval_policy',:id,:request_id,'{}'::jsonb)
            """),
            {"tenant": payload.tenant_id, "actor": actor, "id": str(policy_id), "request_id": _request_id(request)},
        )
    return {"data": {"id": str(policy_id), "policy_name": payload.policy_name}}


@router.get("/approval-policies")
async def list_approval_policies(tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select p.id,p.policy_name,p.contract_type,p.currency,p.min_amount,p.max_amount,p.is_active,
                  coalesce(jsonb_agg(jsonb_build_object(
                    'step_number',s.step_number,'required_permission_key',s.required_permission_key,
                    'required_role_key',s.required_role_key,'minimum_approvals',s.minimum_approvals
                  ) order by s.step_number) filter(where s.id is not null),'[]'::jsonb) as steps
                from public.contract_approval_policies p
                left join public.contract_approval_policy_steps s on s.policy_id=p.id
                where p.tenant_id=:tenant group by p.id order by p.created_at desc
            """),
            {"tenant": tenant_id},
        )
    return {"data": [dict(row) for row in result.mappings().all()]}


@router.post("/contracts/{contract_id}/submit-policy-review", status_code=202)
async def submit_policy_review(
    contract_id: UUID,
    tenant_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi.")
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.manage")
    async with engine.begin() as connection:
        contract_result = await connection.execute(
            text("""
                select c.status,c.current_version,c.contract_type,c.currency,
                  v.version_status,v.commercial_snapshot
                from public.contracts c
                join public.contract_versions v
                  on v.contract_id=c.id and v.version_number=c.current_version
                where c.id=:id and c.tenant_id=:tenant for update of c,v
            """),
            {"id": contract_id, "tenant": tenant_id},
        )
        contract = contract_result.mappings().first()
        if (
            not contract
            or contract["status"] not in ("draft", "active")
            or contract["version_status"] != "draft"
        ):
            raise HTTPException(
                status_code=409,
                detail="Hanya draft kontrak atau amendment draft yang dapat diajukan.",
            )
        amount_result = await connection.execute(
            text("""
                select coalesce(sum(coalesce(monthly_fee,0)*quantity),0)
                from public.contract_services
                where contract_id=:id and contract_version_id=(
                  select id from public.contract_versions where contract_id=:id and version_number=:version
                )
            """),
            {"id": contract_id, "version": contract["current_version"]},
        )
        amount = amount_result.scalar_one()
        policy_result = await connection.execute(
            text("""
                select id from public.contract_approval_policies
                where tenant_id=:tenant and is_active and contract_type=:type
                  and currency=:currency and min_amount<=:amount
                  and (max_amount is null or max_amount>=:amount)
                order by min_amount desc limit 1
            """),
            {"tenant": tenant_id,
             "type": "amendment" if contract["commercial_snapshot"].get("parent_version_id") else contract["contract_type"],
             "currency": contract["currency"], "amount": amount},
        )
        policy_id = policy_result.scalar_one_or_none()
        if not policy_id:
            raise HTTPException(status_code=409, detail="Approval policy aktif untuk kontrak ini belum tersedia.")
        steps_result = await connection.execute(
            text("""
                select step_number,required_permission_key,required_role_key,minimum_approvals
                from public.contract_approval_policy_steps
                where tenant_id=:tenant and policy_id=:policy order by step_number
            """),
            {"tenant": tenant_id, "policy": policy_id},
        )
        steps = steps_result.mappings().all()
        if not steps:
            raise HTTPException(status_code=409, detail="Approval policy belum memiliki tahapan.")
        version_result = await connection.execute(
            text("select id from public.contract_versions where contract_id=:id and version_number=:version"),
            {"id": contract_id, "version": contract["current_version"]},
        )
        version_id = version_result.scalar_one()
        assigned = 0
        for step in steps:
            approvers = await connection.execute(
                text("""
                    select distinct m.user_id
                    from public.memberships m
                    join public.membership_roles mr on mr.membership_id=m.id
                    join public.roles r on r.id=mr.role_id
                    join public.role_permissions rp on rp.role_id=r.id
                    where m.tenant_id=:tenant and m.status='active'
                      and rp.permission_key=:permission
                      and (:role is null or r.key=:role)
                      and mr.scope_type='tenant' and mr.scope_id is null
                      and mr.valid_from<=now() and (mr.valid_until is null or mr.valid_until>now())
                    order by m.user_id limit :needed
                """),
                {
                    "tenant": tenant_id, "permission": step["required_permission_key"],
                    "role": step["required_role_key"], "needed": step["minimum_approvals"],
                },
            )
            users = [row[0] for row in approvers.all()]
            if len(users) < step["minimum_approvals"]:
                raise HTTPException(status_code=409, detail=f"Approver tidak mencukupi untuk step {step['step_number']}.")
            for user_id in users:
                await connection.execute(
                    text("""
                        insert into public.contract_approvals(
                          tenant_id,contract_id,contract_version_id,approval_step,
                          approver_user_id,policy_id
                        ) values(:tenant,:contract,:version,:step,:approver,:policy)
                        on conflict(contract_version_id,approval_step,approver_user_id) do nothing
                    """),
                    {
                        "tenant": tenant_id, "contract": contract_id, "version": version_id,
                        "step": step["step_number"], "approver": user_id, "policy": policy_id,
                    },
                )
                assigned += 1
        await connection.execute(
            text("""
                update public.contracts set
                  status=case when status='draft' then 'review_pending' else status end,
                  updated_by=:actor,updated_at=now(),row_version=row_version+1
                where id=:id and tenant_id=:tenant
            """),
            {"actor": actor, "id": contract_id, "tenant": tenant_id},
        )
        await connection.execute(
            text("""
                update public.contract_versions set version_status='submitted'
                where id=:version
            """),
            {"version": version_id},
        )
        await audit_contract_event(
            connection, tenant_id=tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.policy_review.submitted", request_id=_request_id(request),
            from_status="draft", to_status="review_pending",
            metadata={"policy_id": str(policy_id), "approval_count": assigned},
            idempotency_key=idempotency_key,
        )
        await enqueue_contract_event(
            connection, tenant_id=tenant_id, contract_id=contract_id,
            event_type="contract.review_requested",
            payload={"contract_id": str(contract_id), "policy_id": str(policy_id)},
        )
    return {"data": {"id": str(contract_id),
                     "status": "review_pending" if contract["status"] == "draft" else "active",
                     "version_status": "submitted", "policy_id": str(policy_id),
                     "approval_count": assigned}}


@router.post("/approval-delegations", status_code=201)
async def create_approval_delegation(
    payload: DelegationInput, request: Request, claims: dict = claims_dependency
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.approve")
    now = datetime.now(timezone.utc)
    if payload.starts_at.tzinfo is None or payload.ends_at.tzinfo is None:
        raise HTTPException(status_code=422, detail="Waktu delegasi harus timezone-aware.")
    if payload.ends_at <= payload.starts_at or payload.ends_at <= now:
        raise HTTPException(status_code=422, detail="Rentang delegasi tidak valid.")
    async with engine.begin() as connection:
        member = await connection.execute(
            text("""
                select count(distinct user_id) from public.memberships
                where tenant_id=:tenant and status='active'
                  and user_id=any(:users)
            """),
            {"tenant": payload.tenant_id, "users": [actor, payload.delegatee_user_id]},
        )
        if member.scalar_one() != 2:
            raise HTTPException(status_code=422, detail="Delegator dan delegatee harus anggota aktif tenant.")
        result = await connection.execute(
            text("""
                insert into public.contract_approval_delegations(
                  tenant_id,delegator_user_id,delegatee_user_id,starts_at,ends_at,
                  reason,created_by
                ) values(:tenant,:actor,:delegatee,:starts,:ends,:reason,:actor)
                returning id
            """),
            {
                "tenant": payload.tenant_id, "actor": actor, "delegatee": payload.delegatee_user_id,
                "starts": payload.starts_at, "ends": payload.ends_at, "reason": payload.reason,
            },
        )
        delegation_id = result.scalar_one()
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'contract.approval.delegated',
                  'approval_delegation',:id,:request_id,cast(:metadata as jsonb))
            """),
            {
                "tenant": payload.tenant_id, "actor": actor, "id": str(delegation_id),
                "request_id": _request_id(request),
                "metadata": json.dumps({"delegatee_user_id": str(payload.delegatee_user_id),
                                        "starts_at": payload.starts_at.isoformat(),
                                        "ends_at": payload.ends_at.isoformat()}),
            },
        )
    return {"data": {"id": str(delegation_id), "status": "active"}}


@router.post("/contracts/{contract_id}/policy-decision")
async def decide_policy_approval(
    contract_id: UUID,
    payload: ApprovalDecisionInput,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi.")
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.approve")
    fingerprint = hashlib.sha256(
        f"{payload.approval_id}:{payload.decision}:{payload.reason}".encode()
    ).hexdigest()
    async with engine.begin() as connection:
        old = await connection.execute(
            text("""
                select id,decision_fingerprint,status from public.contract_approvals
                where tenant_id=:tenant and decision_idempotency_key=:key
            """),
            {"tenant": payload.tenant_id, "key": idempotency_key},
        )
        replay = old.mappings().first()
        if replay:
            if replay["decision_fingerprint"] != fingerprint:
                raise HTTPException(status_code=409, detail="Idempotency-Key dipakai untuk keputusan berbeda.")
            return {"data": {"approval_id": str(replay["id"]), "status": replay["status"], "replayed": True}}
        result = await connection.execute(
            text("""
                select c.status,c.current_version,a.id,a.status as approval_status,
                       a.approver_user_id,a.approval_step,v.id as version_id,
                       v.version_status
                from public.contracts c
                join public.contract_approvals a on a.contract_id=c.id
                join public.contract_versions v on v.id=a.contract_version_id
                where c.id=:contract and c.tenant_id=:tenant
                  and a.id=:approval and a.status='pending'
                  and v.version_number=c.current_version
                  and not exists (
                    select 1 from public.contract_approvals previous
                    where previous.contract_version_id=a.contract_version_id
                      and previous.approval_step<a.approval_step
                      and previous.status<>'approved'
                  )
                  and (
                    a.approver_user_id=:actor
                    or exists(
                      select 1 from public.contract_approval_delegations d
                      where d.tenant_id=:tenant and d.delegator_user_id=a.approver_user_id
                        and d.delegatee_user_id=:actor and d.status='active'
                        and d.starts_at<=now() and d.ends_at>now()
                    )
                  )
                for update of c,a
            """),
            {
                "contract": contract_id, "tenant": payload.tenant_id,
                "approval": payload.approval_id, "actor": actor,
            },
        )
        approval = result.mappings().first()
        if (
            not approval
            or approval["status"] not in ("review_pending", "active")
            or approval["version_status"] != "submitted"
        ):
            raise HTTPException(
                status_code=404,
                detail="Approval tidak ditemukan atau tidak ditugaskan kepada pengguna ini.",
            )
        await connection.execute(
            text("""
                update public.contract_approvals set status=:decision,decision_reason=:reason,
                  decided_at=now(),decision_idempotency_key=:key,decision_fingerprint=:fingerprint,
                  delegated_from_user_id=case when approver_user_id<>:actor then approver_user_id else null end
                where id=:id
            """),
            {
                "decision": payload.decision, "reason": payload.reason,
                "key": idempotency_key, "fingerprint": fingerprint,
                "actor": actor, "id": payload.approval_id,
            },
        )
        final_decision = payload.decision == "rejected"
        if payload.decision == "rejected":
            version_next_status = "rejected"
            contract_next_status = (
                "active" if approval["status"] == "active" else "rejected"
            )
        else:
            pending = await connection.execute(
                text("""
                    select count(*) from public.contract_approvals
                    where contract_id=:contract and contract_version_id=:version_id
                      and status='pending'
                """),
                {"contract": contract_id, "version_id": approval["version_id"]},
            )
            final_decision = pending.scalar_one() == 0
            version_next_status = "approved" if final_decision else "submitted"
            contract_next_status = (
                ("active" if approval["status"] == "active" else "approved")
                if final_decision else approval["status"]
            )
        if final_decision:
            await connection.execute(
                text("""
                    update public.contracts set status=:status,updated_by=:actor,
                      updated_at=now(),row_version=row_version+1
                    where id=:id and tenant_id=:tenant
                """),
                {"status": contract_next_status, "actor": actor,
                 "id": contract_id, "tenant": payload.tenant_id},
            )
        await connection.execute(
            text("""
                update public.contract_versions set version_status=:status,
                  approved_at=case when :status='approved' then now() else approved_at end
                where id=:version_id
            """),
            {"status": version_next_status, "version_id": approval["version_id"]},
        )
        if approval["status"] == "active" and version_next_status == "approved":
                await connection.execute(
                    text("""
                        update public.contract_entitlement_grants set status='revoked',updated_at=now()
                        where tenant_id=:tenant and contract_id=:contract
                          and contract_version_id<>:version_id and status='active'
                    """),
                    {"tenant": payload.tenant_id, "contract": contract_id,
                     "version_id": approval["version_id"]},
                )
                await connection.execute(
                    text("""
                        insert into public.contract_entitlement_grants(
                          tenant_id,contract_id,contract_version_id,service_key,service_scope,
                          sla,kpi,human_workforce_limit,ai_worker_limit,ai_credits_limit,
                          status,effective_start,effective_end
                        )
                        select s.tenant_id,s.contract_id,s.contract_version_id,s.service_key,
                          jsonb_build_object('scope',s.service_scope,'entitlement',s.entitlement),
                          s.sla,s.kpi,s.human_workforce_limit,s.ai_worker_limit,s.ai_credits_limit,
                          'active',coalesce(s.effective_start,c.effective_start),
                          coalesce(s.effective_end,c.effective_end)
                        from public.contract_services s
                        join public.contracts c on c.id=s.contract_id and c.tenant_id=s.tenant_id
                        where s.contract_id=:contract and s.tenant_id=:tenant
                          and s.contract_version_id=:version_id
                        on conflict(contract_version_id,service_key) do update set
                          status='active',updated_at=now()
                    """),
                    {"tenant": payload.tenant_id, "contract": contract_id,
                     "version_id": approval["version_id"]},
                )
        await audit_contract_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type=f"contract.approval.{payload.decision}", request_id=_request_id(request),
            from_status=approval["status"], to_status=contract_next_status,
            metadata={"approval_id": str(payload.approval_id), "reason": payload.reason,
                      "version_status": version_next_status},
            idempotency_key=idempotency_key,
        )
    return {"data": {"approval_id": str(payload.approval_id),
                     "contract_status": contract_next_status,
                     "version_status": version_next_status}}


@router.post("/contracts/{contract_id}/documents", status_code=201)
async def upload_contract_document_endpoint(
    contract_id: UUID,
    tenant_id: UUID,
    request: Request,
    document_type: str = Query(pattern="^(master_agreement|statement_of_work|sla|amendment|supporting)$"),
    contract_version_id: UUID | None = None,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    file_name: str = Header(alias="X-File-Name", min_length=1, max_length=240),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi.")
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.documents")
    content_type = request.headers.get("content-type", "").split(";")[0].lower()
    if content_type not in MIME_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Format dokumen tidak didukung.")
    content = await request.body()
    if not content or len(content) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran dokumen harus 1 byte sampai 25 MB.")
    valid_magic = (
        (content_type == "application/pdf" and content.startswith(b"%PDF-"))
        or (content_type == "image/jpeg" and content.startswith(b"\xff\xd8\xff"))
        or (content_type == "image/png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (
            content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            and content.startswith(b"PK")
            and zipfile.is_zipfile(io.BytesIO(content))
            and "word/document.xml" in zipfile.ZipFile(io.BytesIO(content)).namelist()
        )
    )
    if not valid_magic:
        raise HTTPException(status_code=415, detail="Signature file tidak sesuai dengan MIME type.")
    safe_name = PurePath(file_name.replace("\\", "/")).name
    if not safe_name or safe_name in {".", ".."}:
        raise HTTPException(status_code=422, detail="Nama file tidak valid.")
    digest = hashlib.sha256(content).hexdigest()
    fingerprint = hashlib.sha256(
        f"{contract_id}:{contract_version_id}:{document_type}:{safe_name}:{digest}".encode()
    ).hexdigest()
    async with engine.connect() as connection:
        existing = await connection.execute(
            text("""
                select id,upload_fingerprint,lifecycle_status,original_filename,content_type,
                       file_size,sha256,created_at
                from public.contract_documents
                where tenant_id=:tenant and idempotency_key=:key
            """),
            {"tenant": tenant_id, "key": idempotency_key},
        )
        previous = existing.mappings().first()
    if previous:
        if previous["upload_fingerprint"] != fingerprint:
            raise HTTPException(status_code=409, detail="Idempotency-Key dipakai untuk dokumen berbeda.")
        return {"data": {
            **dict(previous), "id": str(previous["id"]),
            "created_at": previous["created_at"].isoformat(),
        }}
    doc_id = uuid4()
    object_path = f"{tenant_id}/{contract_id}/{doc_id}{MIME_EXTENSIONS[content_type]}"
    uploaded = False
    try:
        async with engine.connect() as connection:
            contract = await connection.execute(
                text("""
                    select id,current_version from public.contracts
                    where id=:id and tenant_id=:tenant
                """),
                {"id": contract_id, "tenant": tenant_id},
            )
            if contract.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Kontrak tidak ditemukan.")
            if contract_version_id:
                version = await connection.execute(
                    text("""
                        select exists(select 1 from public.contract_versions
                          where id=:version and contract_id=:contract and tenant_id=:tenant)
                    """),
                    {"version": contract_version_id, "contract": contract_id, "tenant": tenant_id},
                )
                if not version.scalar_one():
                    raise HTTPException(status_code=422, detail="Versi dokumen tidak cocok dengan kontrak.")
        await upload_contract_document(object_path, content, content_type)
        uploaded = True
        async with engine.begin() as connection:
            result = await connection.execute(
                text("""
                    insert into public.contract_documents(
                      id,tenant_id,contract_id,contract_version_id,document_type,
                      original_filename,object_path,content_type,file_size,sha256,
                      lifecycle_status,uploaded_by,verified_at,idempotency_key,upload_fingerprint
                    ) values(
                      :id,:tenant,:contract,:version,:type,:name,:path,:content_type,
                      :size,:sha,'available',:actor,now(),:key,:fingerprint
                    ) returning id,document_type,original_filename,content_type,file_size,
                      sha256,lifecycle_status,created_at
                """),
                {
                    "id": doc_id, "tenant": tenant_id, "contract": contract_id,
                    "version": contract_version_id, "type": document_type,
                    "name": safe_name, "path": object_path, "content_type": content_type,
                    "size": len(content), "sha": digest, "actor": actor,
                    "key": idempotency_key, "fingerprint": fingerprint,
                },
            )
            await audit_contract_event(
                connection, tenant_id=tenant_id, actor=actor, contract_id=contract_id,
                event_type="contract.document.uploaded", request_id=_request_id(request),
                metadata={"document_id": str(doc_id), "sha256": digest, "size": len(content)},
                idempotency_key=idempotency_key,
            )
        return {"data": dict(result.mappings().one())}
    except Exception:
        if uploaded:
            try:
                await delete_contract_document(object_path)
            except Exception:
                logger.exception("contract_document_upload_compensation_failed", document_id=str(doc_id))
        raise


@router.get("/contracts/{contract_id}/documents")
async def list_contract_documents(contract_id: UUID, tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,document_type,original_filename,content_type,file_size,sha256,
                       lifecycle_status,created_at,verified_at,archived_at
                from public.contract_documents
                where tenant_id=:tenant and contract_id=:contract
                order by created_at desc
            """),
            {"tenant": tenant_id, "contract": contract_id},
        )
    return {"data": [{**dict(row), "id": str(row["id"]),
                      "created_at": row["created_at"].isoformat(),
                      "verified_at": row["verified_at"].isoformat() if row["verified_at"] else None,
                      "archived_at": row["archived_at"].isoformat() if row["archived_at"] else None}
                     for row in result.mappings().all()]}


@router.post("/documents/{document_id}/download")
async def download_contract_document(document_id: UUID, tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.documents")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select object_path,lifecycle_status from public.contract_documents
                where id=:id and tenant_id=:tenant
            """),
            {"id": document_id, "tenant": tenant_id},
        )
        row = result.mappings().first()
    if not row or row["lifecycle_status"] != "available":
        raise HTTPException(status_code=404, detail="Dokumen tidak tersedia.")
    try:
        signed_url = await create_contract_document_signed_url(row["object_path"], 60)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Secure document storage is not configured.") from exc
    return {"data": {"signed_url": signed_url, "expires_in": 60}}


@router.post("/documents/{document_id}/archive")
async def archive_contract_document(
    document_id: UUID, tenant_id: UUID, request: Request, claims: dict = claims_dependency
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.documents")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.contract_documents set lifecycle_status='archived',archived_at=now()
                where id=:id and tenant_id=:tenant and lifecycle_status='available'
                returning contract_id,object_path
            """),
            {"id": document_id, "tenant": tenant_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")
        await audit_contract_event(
            connection, tenant_id=tenant_id, actor=actor, contract_id=row["contract_id"],
            event_type="contract.document.archived", request_id=_request_id(request),
            metadata={"document_id": str(document_id)},
        )
    return {"data": {"id": str(document_id), "status": "archived"}}


@router.post("/contracts/{contract_id}/renewals", status_code=201)
async def request_contract_renewal(
    contract_id: UUID,
    payload: RenewalInput,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi.")
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.lifecycle")
    if payload.requested_start and payload.requested_end < payload.requested_start:
        raise HTTPException(status_code=422, detail="Rentang renewal tidak valid.")
    async with engine.begin() as connection:
        contract = await connection.execute(
            text("""
                select status,effective_end from public.contracts
                where id=:id and tenant_id=:tenant for update
            """),
            {"id": contract_id, "tenant": payload.tenant_id},
        )
        row = contract.mappings().first()
        if not row or row["status"] not in ("active", "approved"):
            raise HTTPException(status_code=409, detail="Kontrak tidak dapat diperpanjang pada status ini.")
        result = await connection.execute(
            text("""
                insert into public.contract_renewals(
                  tenant_id,contract_id,renewal_type,requested_start,requested_end,
                  requested_terms,idempotency_key,requested_by
                ) values(:tenant,:contract,:type,:start,:end,:terms,:key,:actor)
                on conflict(tenant_id,idempotency_key) do nothing returning id,status
            """),
            {
                "tenant": payload.tenant_id, "contract": contract_id,
                "type": payload.renewal_type, "start": payload.requested_start,
                "end": payload.requested_end, "terms": payload.requested_terms,
                "key": idempotency_key, "actor": actor,
            },
        )
        renewal = result.mappings().first()
        if renewal is None:
            renewal = (await connection.execute(
                text("select id,status from public.contract_renewals where tenant_id=:tenant and idempotency_key=:key"),
                {"tenant": payload.tenant_id, "key": idempotency_key},
            )).mappings().one()
        await audit_contract_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.renewal.requested", request_id=_request_id(request),
            metadata={"renewal_id": str(renewal["id"]), "requested_end": payload.requested_end.isoformat()},
            idempotency_key=idempotency_key,
        )
        await enqueue_contract_event(
            connection, tenant_id=payload.tenant_id, contract_id=contract_id,
            event_type="contract.renewal.requested",
            payload={"renewal_id": str(renewal["id"]), "requested_end": payload.requested_end.isoformat()},
        )
    return {"data": {"id": str(renewal["id"]), "status": renewal["status"]}}


@router.post("/renewals/{renewal_id}/decision")
async def decide_contract_renewal(
    renewal_id: UUID,
    tenant_id: UUID,
    request: Request,
    decision: str = Query(pattern="^(approved|rejected)$"),
    reason: str = Query(min_length=3, max_length=2000),
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.lifecycle")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select r.*,c.status as contract_status
                from public.contract_renewals r
                join public.contracts c on c.id=r.contract_id and c.tenant_id=r.tenant_id
                where r.id=:id and r.tenant_id=:tenant for update of r,c
            """),
            {"id": renewal_id, "tenant": tenant_id},
        )
        renewal = result.mappings().first()
        if not renewal or renewal["status"] not in ("requested", "review_pending"):
            raise HTTPException(status_code=409, detail="Renewal tidak tersedia untuk keputusan.")
        await connection.execute(
            text("""
                update public.contract_renewals set status=:decision,decided_by=:actor,decided_at=now()
                where id=:id and tenant_id=:tenant
            """),
            {"decision": decision, "actor": actor, "id": renewal_id, "tenant": tenant_id},
        )
        if decision == "approved":
            await connection.execute(
                text("""
                    update public.contracts set effective_start=coalesce(:start,effective_start),
                      effective_end=:end,renewal_at=:end,status='active',
                      updated_by=:actor,updated_at=now(),row_version=row_version+1
                    where id=:contract and tenant_id=:tenant
                """),
                {
                    "start": renewal["requested_start"], "end": renewal["requested_end"],
                    "actor": actor, "contract": renewal["contract_id"], "tenant": tenant_id,
                },
            )
        await audit_contract_event(
            connection, tenant_id=tenant_id, actor=actor, contract_id=renewal["contract_id"],
            event_type=f"contract.renewal.{decision}", request_id=_request_id(request),
            from_status=renewal["contract_status"], to_status=renewal["contract_status"],
            metadata={"renewal_id": str(renewal_id), "reason": reason},
        )
    return {"data": {"id": str(renewal_id), "status": decision}}


@router.post("/contracts/{contract_id}/suspend")
async def suspend_contract(
    contract_id: UUID, payload: LifecycleReason, request: Request, claims: dict = claims_dependency
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.lifecycle")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.contracts set status='suspended',suspended_at=now(),
                  suspension_reason=:reason,updated_by=:actor,updated_at=now(),row_version=row_version+1
                where id=:id and tenant_id=:tenant and status='active'
                returning status
            """),
            {"reason": payload.reason, "actor": actor, "id": contract_id, "tenant": payload.tenant_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=409, detail="Hanya kontrak aktif yang dapat ditangguhkan.")
        await connection.execute(
            text("""
                update public.contract_entitlement_grants set status='suspended',updated_at=now()
                where tenant_id=:tenant and contract_id=:contract and status='active'
            """),
            {"tenant": payload.tenant_id, "contract": contract_id},
        )
        await audit_contract_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.suspended", request_id=_request_id(request),
            from_status="active", to_status="suspended", metadata={"reason": payload.reason},
        )
        await enqueue_contract_event(
            connection, tenant_id=payload.tenant_id, contract_id=contract_id,
            event_type="contract.suspended", payload={"reason": payload.reason},
        )
    return {"data": {"id": str(contract_id), "status": "suspended"}}


@router.post("/contracts/{contract_id}/terminate")
async def terminate_contract(
    contract_id: UUID, payload: LifecycleReason, request: Request, claims: dict = claims_dependency
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, payload.tenant_id, "corporate.contracts.lifecycle")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.contracts set status='terminated',terminated_at=now(),
                  termination_reason=:reason,updated_by=:actor,updated_at=now(),row_version=row_version+1
                where id=:id and tenant_id=:tenant and status in ('active','suspended','approved')
                returning status
            """),
            {"reason": payload.reason, "actor": actor, "id": contract_id, "tenant": payload.tenant_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=409, detail="Kontrak tidak dapat dihentikan pada status ini.")
        await connection.execute(
            text("""
                update public.contract_entitlement_grants set status='revoked',updated_at=now()
                where tenant_id=:tenant and contract_id=:contract and status in ('active','suspended','pending')
            """),
            {"tenant": payload.tenant_id, "contract": contract_id},
        )
        await audit_contract_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.terminated", request_id=_request_id(request),
            from_status="active/suspended/approved", to_status="terminated",
            metadata={"reason": payload.reason, "effective_at": payload.effective_at.isoformat() if payload.effective_at else None},
        )
        await enqueue_contract_event(
            connection, tenant_id=payload.tenant_id, contract_id=contract_id,
            event_type="contract.terminated", payload={"reason": payload.reason},
        )
    return {"data": {"id": str(contract_id), "status": "terminated"}}


@router.post("/contracts/lifecycle/process-due")
async def process_due_contracts(tenant_id: UUID, request: Request, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.contracts.lifecycle")
    async with engine.begin() as connection:
        rows = await connection.execute(
            text("""
                update public.contracts set status='expired',updated_at=now(),row_version=row_version+1
                where tenant_id=:tenant and status='active'
                  and effective_end is not null and effective_end<current_date
                returning id
            """),
            {"tenant": tenant_id},
        )
        expired = [row[0] for row in rows.all()]
        if expired:
            await connection.execute(
                text("""
                    update public.contract_entitlement_grants set status='expired',updated_at=now()
                    where tenant_id=:tenant and contract_id=any(:contracts) and status='active'
                """),
                {"tenant": tenant_id, "contracts": expired},
            )
            for contract_id in expired:
                await audit_contract_event(
                    connection, tenant_id=tenant_id, actor=actor, contract_id=contract_id,
                    event_type="contract.expired", request_id=_request_id(request),
                    from_status="active", to_status="expired",
                )
                await enqueue_contract_event(
                    connection, tenant_id=tenant_id, contract_id=contract_id,
                    event_type="contract.expired", payload={},
                )
    return {"data": {"expired_count": len(expired), "contract_ids": [str(item) for item in expired]}}


@router.post("/contracts/{contract_id}/invoices", status_code=201)
async def create_contract_invoice(
    contract_id: UUID,
    payload: InvoiceInput,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi.")
    await require_tenant_permission(actor, payload.tenant_id, "corporate.finance.invoice.manage")
    subtotal = sum((line.quantity * line.unit_amount for line in payload.lines), Decimal("0.00"))
    subtotal = subtotal.quantize(Decimal("0.01"))
    total = (subtotal + payload.tax_amount).quantize(Decimal("0.01"))
    fingerprint = hashlib.sha256(
        json.dumps(payload.model_dump(mode="json"), sort_keys=True).encode()
    ).hexdigest()
    async with engine.begin() as connection:
        existing = await connection.execute(
            text("""
                select id,metadata from public.contract_events
                where tenant_id=:tenant and idempotency_key=:key
            """),
            {"tenant": payload.tenant_id, "key": idempotency_key},
        )
        replay = existing.mappings().first()
        if replay:
            if replay["metadata"].get("fingerprint") != fingerprint:
                raise HTTPException(status_code=409, detail="Idempotency-Key dipakai untuk payload berbeda.")
            return {"data": {"event_id": str(replay["id"]), "replayed": True}}
        contract = await connection.execute(
            text("select status from public.contracts where id=:id and tenant_id=:tenant"),
            {"id": contract_id, "tenant": payload.tenant_id},
        )
        if contract.scalar_one_or_none() not in ("active", "approved"):
            raise HTTPException(status_code=409, detail="Invoice hanya dapat dibuat untuk kontrak approved/active.")
        invoice = await connection.execute(
            text("""
                insert into public.contract_invoices(
                  tenant_id,contract_id,invoice_number,title,currency,subtotal,tax_amount,
                  total_amount,status,due_at,idempotency_key,created_by
                ) values(
                  :tenant,:contract,:number,:title,:currency,:subtotal,:tax,:total,
                  'draft',:due,:key,:actor
                ) returning id,status,total_amount
            """),
            {
                "tenant": payload.tenant_id, "contract": contract_id,
                "number": payload.invoice_number, "title": payload.title,
                "currency": payload.currency.upper(), "subtotal": subtotal,
                "tax": payload.tax_amount, "total": total, "due": payload.due_at,
                "key": idempotency_key, "actor": actor,
            },
        )
        invoice_row = invoice.mappings().one()
        for line in payload.lines:
            if line.contract_service_id:
                valid = await connection.execute(
                    text("""
                        select exists(select 1 from public.contract_services
                          where id=:id and tenant_id=:tenant and contract_id=:contract)
                    """),
                    {"id": line.contract_service_id, "tenant": payload.tenant_id, "contract": contract_id},
                )
                if not valid.scalar_one():
                    raise HTTPException(status_code=422, detail="Service invoice bukan milik kontrak ini.")
            line_amount = (line.quantity * line.unit_amount).quantize(Decimal("0.01"))
            await connection.execute(
                text("""
                    insert into public.contract_invoice_lines(
                      tenant_id,invoice_id,contract_service_id,description,quantity,unit_amount,line_amount
                    ) values(:tenant,:invoice,:service,:description,:quantity,:unit,:amount)
                """),
                {
                    "tenant": payload.tenant_id, "invoice": invoice_row["id"],
                    "service": line.contract_service_id, "description": line.description,
                    "quantity": line.quantity, "unit": line.unit_amount, "amount": line_amount,
                },
            )
        await audit_contract_event(
            connection, tenant_id=payload.tenant_id, actor=actor, contract_id=contract_id,
            event_type="contract.invoice.created", request_id=_request_id(request),
            metadata={"invoice_id": str(invoice_row["id"]), "total": str(total), "fingerprint": fingerprint},
            idempotency_key=idempotency_key,
        )
    return {"data": {"id": str(invoice_row["id"]), "status": invoice_row["status"], "total_amount": str(total)}}


@router.post("/invoices/{invoice_id}/issue")
async def issue_contract_invoice(invoice_id: UUID, tenant_id: UUID, request: Request, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.finance.invoice.manage")
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.contract_invoices set status='issued',issued_at=now(),updated_at=now()
                where id=:id and tenant_id=:tenant and status='draft'
                returning contract_id,status,invoice_number
            """),
            {"id": invoice_id, "tenant": tenant_id},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=409, detail="Invoice tidak ditemukan atau bukan draft.")
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'contract.invoice.issued','contract_invoice',:id,:request_id,'{}'::jsonb)
            """),
            {"tenant": tenant_id, "actor": actor, "id": str(invoice_id), "request_id": _request_id(request)},
        )
    return {"data": {"id": str(invoice_id), "status": row["status"], "invoice_number": row["invoice_number"]}}


@router.get("/invoices")
async def list_contract_invoices(
    tenant_id: UUID,
    status: str | None = Query(default=None, pattern="^(draft|issued|partially_paid|paid|overdue|cancelled)$"),
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.finance.invoice.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,contract_id,invoice_number,title,currency,subtotal,tax_amount,
                  total_amount,status,issued_at,due_at,created_at
                from public.contract_invoices
                where tenant_id=:tenant and (:status is null or status=:status)
                order by created_at desc,id desc
            """),
            {"tenant": tenant_id, "status": status},
        )
    return {"data": [{
        **dict(row), "id": str(row["id"]), "contract_id": str(row["contract_id"]),
        "subtotal": str(row["subtotal"]), "tax_amount": str(row["tax_amount"]),
        "total_amount": str(row["total_amount"]),
        "issued_at": row["issued_at"].isoformat() if row["issued_at"] else None,
        "due_at": row["due_at"].isoformat() if row["due_at"] else None,
        "created_at": row["created_at"].isoformat(),
    } for row in result.mappings().all()]}


@router.post("/invoices/{invoice_id}/payment-references", status_code=201)
async def create_payment_reference(
    invoice_id: UUID,
    payload: PaymentReferenceInput,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(status_code=400, detail="Idempotency-Key wajib diisi.")
    await require_tenant_permission(actor, payload.tenant_id, "corporate.finance.invoice.manage")
    async with engine.begin() as connection:
        invoice = await connection.execute(
            text("""
                select total_amount,status from public.contract_invoices
                where id=:id and tenant_id=:tenant for update
            """),
            {"id": invoice_id, "tenant": payload.tenant_id},
        )
        row = invoice.mappings().first()
        if not row or row["status"] not in ("issued", "partially_paid", "overdue"):
            raise HTTPException(status_code=409, detail="Invoice belum diterbitkan atau tidak dapat dibayar.")
        if payload.amount > row["total_amount"]:
            raise HTTPException(status_code=422, detail="Nominal referensi melebihi total invoice.")
        result = await connection.execute(
            text("""
                insert into public.contract_payment_references(
                  tenant_id,invoice_id,reference_number,payment_method,amount,
                  idempotency_key,created_by
                ) values(:tenant,:invoice,:reference,:method,:amount,:key,:actor)
                on conflict(tenant_id,idempotency_key) do nothing returning id,status
            """),
            {
                "tenant": payload.tenant_id, "invoice": invoice_id,
                "reference": payload.reference_number, "method": payload.payment_method,
                "amount": payload.amount, "key": idempotency_key, "actor": actor,
            },
        )
        reference = result.mappings().first()
        if not reference:
            reference = (await connection.execute(
                text("""
                    select id,status from public.contract_payment_references
                    where tenant_id=:tenant and idempotency_key=:key
                """),
                {"tenant": payload.tenant_id, "key": idempotency_key},
            )).mappings().one()
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(:tenant,:actor,'contract.payment_reference.created',
                  'contract_payment_reference',:id,:request_id,cast(:metadata as jsonb))
            """),
            {
                "tenant": payload.tenant_id, "actor": actor, "id": str(reference["id"]),
                "request_id": _request_id(request),
                "metadata": json.dumps({"invoice_id": str(invoice_id), "amount": str(payload.amount),
                                        "status": "reference_created"}),
            },
        )
    return {"data": {"id": str(reference["id"]), "status": reference["status"],
                     "payment_confirmed": False}}


@router.get("/invoices/{invoice_id}/payment-references")
async def list_payment_references(invoice_id: UUID, tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.finance.invoice.read")
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,reference_number,payment_method,amount,status,external_reference,
                  submitted_at,verified_at,reconciled_at,created_at
                from public.contract_payment_references
                where tenant_id=:tenant and invoice_id=:invoice order by created_at desc
            """),
            {"tenant": tenant_id, "invoice": invoice_id},
        )
    return {"data": [{
        **dict(row), "id": str(row["id"]), "amount": str(row["amount"]),
        "submitted_at": row["submitted_at"].isoformat() if row["submitted_at"] else None,
        "verified_at": row["verified_at"].isoformat() if row["verified_at"] else None,
        "reconciled_at": row["reconciled_at"].isoformat() if row["reconciled_at"] else None,
        "created_at": row["created_at"].isoformat(),
    } for row in result.mappings().all()]}


@router.get("/entitlements/effective")
async def get_effective_entitlements(tenant_id: UUID, claims: dict = claims_dependency):
    actor = UUID(claims["sub"])
    await require_tenant_permission(actor, tenant_id, "corporate.entitlements.read")
    async with engine.connect() as connection:
        rows = await resolve_effective_entitlements(connection, tenant_id)
    return {"data": [{
        **row,
        "id": str(row["id"]),
        "contract_id": str(row["contract_id"]),
        "contract_version_id": str(row["contract_version_id"]),
        "ai_credits_limit": str(row["ai_credits_limit"]) if row["ai_credits_limit"] is not None else None,
        "effective_start": row["effective_start"].isoformat() if row["effective_start"] else None,
        "effective_end": row["effective_end"].isoformat() if row["effective_end"] else None,
    } for row in rows]}
