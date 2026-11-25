# ruff: noqa: E501
"""Sales CRM, provider catalogue, consent, coverage, order and provider webhook APIs."""
import hashlib
import hmac
import json
import os
import re
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import text

from app.core.authorization import authorize_action
from app.core.idempotency import complete_idempotency, request_fingerprint, reserve_idempotency
from app.core.pagination import decode_time_id_cursor, encode_time_id_cursor
from app.core.security import current_claims
from app.db.session import engine
from app.domain.sales import normalize_provider_status, transition_allowed
from app.repositories.sales_repository import get_lead_for_tenant, get_order_for_tenant, enqueue_provider_submission
from app.services.sales_service import SalesService

router = APIRouter(prefix="/sales", tags=["Sales CRM & Orders"])
claims_dependency = Depends(current_claims)

PERMISSIONS = {
    "leads.read": ("sales.leads.read", "sales.lead", "read"),
    "leads.manage": ("sales.leads.manage", "sales.lead", "manage"),
    "catalogue.read": ("sales.catalogue.read", "sales.catalogue", "read"),
    "providers.manage": ("sales.catalogue.manage", "sales.catalogue", "manage"),
    "catalogue.manage": ("sales.catalogue.manage", "sales.catalogue", "manage"),
    "consent.manage": ("sales.consent.manage", "sales.consent", "manage"),
    "coverage.check": ("sales.coverage.check", "sales.coverage", "check"),
    "orders.read": ("sales.orders.read", "sales.order", "read"),
    "orders.manage": ("sales.orders.manage", "sales.order", "manage"),
    "orders.submit": ("sales.orders.submit", "sales.order", "submit"),
}


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LeadCreate(StrictModel):
    tenant_id: UUID
    customer_name: str | None = Field(default=None, min_length=2, max_length=180)
    contact_name: str | None = Field(default=None, min_length=2, max_length=160)
    email: str | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=40)
    service_address: str | None = Field(default=None, max_length=800)
    region_code: str | None = Field(default=None, max_length=80)
    source: str = Field(default="manual", min_length=2, max_length=80)
    source_prospect_id: UUID | None = None
    follow_up_at: datetime | None = None
    note: str | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def validate_customer_source(self):
        if self.source_prospect_id is None and (not self.customer_name or not self.contact_name):
            raise ValueError("Nama pelanggan dan kontak wajib untuk lead manual.")
        return self


class LeadPatch(StrictModel):
    tenant_id: UUID
    follow_up_at: datetime | None = None
    qualification: dict[str, Any] | None = None
    note: str | None = Field(default=None, max_length=4000)


class LeadAssign(StrictModel):
    tenant_id: UUID
    workforce_profile_id: UUID
    reason: str = Field(min_length=3, max_length=1000)


class ConsentInput(StrictModel):
    tenant_id: UUID
    consent_type: str = Field(pattern="^(privacy|communication|coverage_check|order_submission|marketing)$")
    purpose: str = Field(min_length=3, max_length=180)
    policy_version: str = Field(min_length=1, max_length=60)
    granted: bool
    source: str = Field(default="corporate_portal", min_length=2, max_length=80)
    evidence: dict[str, Any] = Field(default_factory=dict)


class ProductCreate(StrictModel):
    tenant_id: UUID
    product_code: str = Field(min_length=2, max_length=80, pattern=r"^[A-Za-z0-9._/-]+$")
    name: str = Field(min_length=2, max_length=180)
    category: str = Field(min_length=2, max_length=80)
    description: str | None = Field(default=None, max_length=3000)
    service_regions: list[str] = Field(default_factory=list, max_length=200)
    coverage_source: str = Field(min_length=2, max_length=100)
    requirements: dict[str, Any] = Field(default_factory=dict)
    pricing_reference: dict[str, Any] = Field(default_factory=dict)
    sla: dict[str, Any] = Field(default_factory=dict)
    eligibility: dict[str, Any] = Field(default_factory=dict)
    effective_from: datetime | None = None
    effective_until: datetime | None = None


class ProviderIntegrationInput(StrictModel):
    tenant_id: UUID
    adapter_key: str = Field(pattern="^(http_json|webhook_only|secure_file_exchange)$")
    endpoint_url: str | None = Field(default=None, max_length=1000)
    health_url: str | None = Field(default=None, max_length=1000)
    auth_env_key: str | None = Field(default=None, max_length=120)
    webhook_secret_env_key: str | None = Field(default=None, max_length=120)
    timeout_seconds: int = Field(default=15, ge=2, le=60)
    request_mapping: dict[str, Any] = Field(default_factory=dict)
    response_mapping: dict[str, Any] = Field(default_factory=dict)
    status_mapping: dict[str, str] = Field(default_factory=dict)
    enabled: bool = False

    @field_validator("endpoint_url", "health_url")
    @classmethod
    def https_only(cls, value):
        if value is not None and (not value.startswith("https://") or len(value) > 1000):
            raise ValueError("Provider endpoint wajib HTTPS.")
        return value

    @field_validator("auth_env_key", "webhook_secret_env_key")
    @classmethod
    def environment_reference_only(cls, value):
        if value is not None and not re.fullmatch(r"AGENTZY_PROVIDER_(AUTH|WEBHOOK)__[A-Z0-9_]+", value):
            raise ValueError("Gunakan environment reference AGENTZY_PROVIDER_AUTH__/WEBHOOK__ tanpa nilai secret.")
        return value


class CoverageInput(StrictModel):
    tenant_id: UUID
    product_id: UUID
    consent_id: UUID
    request_reference: str = Field(min_length=8, max_length=128)


class OfferInput(StrictModel):
    tenant_id: UUID
    product_id: UUID
    coverage_check_id: UUID
    valid_until: datetime | None = None


class OrderCreate(StrictModel):
    tenant_id: UUID
    lead_id: UUID
    consent_id: UUID
    offer_id: UUID
    assigned_workforce_profile_id: UUID | None = None


class OrderTransition(StrictModel):
    tenant_id: UUID
    to_status: str = Field(pattern="^(submitted|cancelled)$")
    reason: str = Field(min_length=3, max_length=2000)
    evidence: dict[str, Any] = Field(default_factory=dict)


class OrderAttributionCorrection(StrictModel):
    tenant_id: UUID
    attributed_worker_id: UUID
    reason: str = Field(min_length=3,max_length=1000)


async def _authorize(claims: dict, tenant_id: UUID, permission_name: str, request: Request, resource_id: UUID | None = None):
    permission, resource_type, action = PERMISSIONS[permission_name]
    async with engine.connect() as connection:
        context, _ = await authorize_action(
            connection,
            user_id=UUID(claims["sub"]),
            tenant_id=tenant_id,
            permission_key=permission,
            platform_permission="platform.tenants.read",
            aal=claims.get("aal"),
            resource_type=resource_type,
            action=action,
            resource={"id": str(resource_id or tenant_id), "tenant_id": str(tenant_id)},
            request_id=getattr(request.state, "request_id", None),
        )
    return context


def _request_meta(request: Request) -> dict[str, str | None]:
    return {
        "request_id": getattr(request.state, "request_id", None),
        "correlation_id": getattr(request.state, "correlation_id", None),
        "trace_id": getattr(request.state, "trace_id", None),
    }


async def _audit(connection, tenant_id: UUID, actor: UUID | None, action: str, resource_type: str, resource_id: UUID, request: Request, metadata: dict | None = None):
    await connection.execute(text("""
      insert into public.audit_logs(tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata)
      values(:tenant,:actor,:action,:type,:id,:request_id,cast(:metadata as jsonb))
    """), {
        "tenant":tenant_id,"actor":actor,"action":action,"type":resource_type,"id":str(resource_id),
        "request_id":getattr(request.state,"request_id",None),
        "metadata":json.dumps(metadata or {},default=str),
    })


async def _lead_scope(connection, tenant_id: UUID, lead_id: UUID, actor: UUID, context):
    lead = await get_lead_for_tenant(connection,tenant_id,lead_id)
    if not lead:
        raise HTTPException(status_code=404,detail="Lead tidak ditemukan.")
    if context and "sales_official" in context.role_keys and lead["assigned_user_id"] != actor:
        raise HTTPException(status_code=404,detail="Lead tidak ditemukan.")
    return lead


@router.get("/dashboard")
async def sales_dashboard(tenant_id: UUID, request: Request, claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"leads.read",request)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        result=await connection.execute(text("""
          select count(*) as total_leads,
            count(*) filter(where stage='lead_created') as new_leads,
            count(*) filter(where stage in ('assigned','contacted')) as in_progress,
            count(*) filter(where stage='qualified') as qualified,
            count(*) filter(where stage='coverage_checked') as coverage_checked,
            count(*) filter(where stage='offer_presented') as offers_presented,
            count(*) filter(where stage='order_submitted') as orders_submitted,
            count(*) filter(where stage='disqualified') as disqualified
          from public.sales_leads where tenant_id=:tenant
            and (:sales_official=false or assigned_user_id=:actor)
        """),{"tenant":tenant_id,"sales_official":bool(context and "sales_official" in context.role_keys),"actor":actor})
        orders=await connection.execute(text("""
          select count(*) as total_orders,
            count(*) filter(where status='provider_pending') as provider_pending,
            count(*) filter(where status='provider_approved') as approved,
            count(*) filter(where status='activated') as activated,
            count(*) filter(where status in ('provider_rejected','failed')) as exceptions
          from public.sales_orders o join public.sales_leads l on l.id=o.lead_id and l.tenant_id=o.tenant_id
          where o.tenant_id=:tenant and (:sales_official=false or l.assigned_user_id=:actor)
        """),{"tenant":tenant_id,"sales_official":bool(context and "sales_official" in context.role_keys),"actor":actor})
        return {"data":{"leads":dict(result.mappings().one()),"orders":dict(orders.mappings().one()),"as_of":datetime.now(UTC).isoformat()}}


@router.get("/leads")
async def list_sales_leads(
    tenant_id: UUID, request: Request, stage: str | None = None,
    cursor: str | None = None, limit: int = Query(default=50,ge=1,le=100),
    claims: dict = claims_dependency,
):
    context=await _authorize(claims,tenant_id,"leads.read",request)
    actor=UUID(claims["sub"])
    cursor_value=decode_time_id_cursor(cursor) if cursor else None
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select l.id,l.tenant_id,l.source,l.stage,l.qualification,l.assigned_user_id,
            l.assigned_workforce_profile_id,l.follow_up_at,l.last_activity_at,l.created_at,l.updated_at,
            c.id as customer_id,c.customer_name,c.contact_name,c.email,c.phone,c.service_address,c.region_code
          from public.sales_leads l join public.sales_customers c
            on c.id=l.customer_id and c.tenant_id=l.tenant_id
          where l.tenant_id=:tenant and (:stage is null or l.stage=:stage)
            and (:sales_official=false or l.assigned_user_id=:actor)
            and (:cursor_created is null or (l.created_at,l.id)<(:cursor_created,:cursor_id))
          order by l.created_at desc,l.id desc limit :limit
        """),{
          "tenant":tenant_id,"stage":stage,
          "sales_official":bool(context and "sales_official" in context.role_keys),
          "actor":actor,"cursor_created":cursor_value[0] if cursor_value else None,"cursor_id":cursor_value[1] if cursor_value else None,"limit":limit+1,
        })
        items=[dict(row) for row in rows.mappings().all()]
    has_more=len(items)>limit
    page=items[:limit]
    next_cursor=encode_time_id_cursor(page[-1]["created_at"],page[-1]["id"]) if has_more and page else None
    return {"data":page,"meta":{"has_more":has_more,"next_cursor":next_cursor,"request_id":getattr(request.state,"request_id",None)}}


@router.post("/leads",status_code=201)
async def create_sales_lead(payload: LeadCreate,request: Request,claims: dict = claims_dependency,
                            idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"leads.manage",request)
    actor=UUID(claims["sub"])
    if payload.source_prospect_id and context is not None:
        raise HTTPException(status_code=403,detail="Import prospect Phase 02 hanya dapat dilakukan oleh operator platform yang berwenang.")
    if not idempotency_key or not 8<=len(idempotency_key)<=128:
        raise HTTPException(status_code=428,detail="Idempotency-Key wajib dikirim.")
    fingerprint=request_fingerprint(payload.model_dump(mode="json"))
    async with engine.begin() as connection:
        prior=await connection.execute(text("""
          select id,created_by,request_fingerprint from public.sales_leads
          where tenant_id=:tenant and idempotency_key=:key
        """),{"tenant":payload.tenant_id,"key":idempotency_key})
        prior_row=prior.mappings().first()
        if prior_row:
            if prior_row["created_by"]!=actor:
                raise HTTPException(status_code=409,detail="Idempotency-Key sudah digunakan oleh identity lain.")
            if prior_row["request_fingerprint"]!=fingerprint:
                raise HTTPException(status_code=409,detail="Idempotency-Key digunakan dengan payload berbeda.")
            return {"data":{"id":str(prior_row["id"]),"replayed":True}}
        if payload.source_prospect_id:
            prior_prospect=await connection.execute(text("""
              select id from public.sales_leads where tenant_id=:tenant and source_prospect_id=:prospect
            """),{"tenant":payload.tenant_id,"prospect":payload.source_prospect_id})
            existing_prospect=prior_prospect.scalar_one_or_none()
            if existing_prospect:
                return {"data":{"id":str(existing_prospect),"replayed":True}}
        if payload.source_prospect_id:
            source=await connection.execute(text("""
              select p.id,p.company_name,p.contact_name,p.business_email,p.business_phone
              from public.crm_prospects p where p.id=:id
            """),{"id":payload.source_prospect_id})
            prospect=source.mappings().first()
            if not prospect:
                raise HTTPException(status_code=404,detail="Prospek Phase 02 tidak ditemukan.")
            customer_name=prospect["company_name"]
            contact_name=prospect["contact_name"]
            email=prospect["business_email"]
            phone=prospect["business_phone"]
        else:
            customer_name=payload.customer_name
            contact_name=payload.contact_name
            email=payload.email
            phone=payload.phone
        customer=await connection.execute(text("""
          insert into public.sales_customers(tenant_id,customer_name,contact_name,email,phone,service_address,region_code,created_by)
          values(:tenant,:name,:contact,:email,:phone,:address,:region,:actor) returning id
        """),{"tenant":payload.tenant_id,"name":customer_name,"contact":contact_name,"email":email,
              "phone":phone,"address":payload.service_address,"region":payload.region_code,"actor":actor})
        customer_id=customer.scalar_one()
        lead=await connection.execute(text("""
          insert into public.sales_leads(tenant_id,customer_id,source_prospect_id,source,assigned_user_id,
            follow_up_at,created_by,idempotency_key,request_fingerprint)
          values(:tenant,:customer,:prospect,:source,:assignee,:followup,:actor,:key,:fingerprint) returning *
        """),{"tenant":payload.tenant_id,"customer":customer_id,"prospect":payload.source_prospect_id,
              "source":payload.source,"assignee":actor if context and "sales_official" in context.role_keys else None,
              "followup":payload.follow_up_at,"actor":actor,"key":idempotency_key,"fingerprint":fingerprint})
        row=dict(lead.mappings().one())
        await connection.execute(text("""
          insert into public.sales_lead_activities(tenant_id,lead_id,actor_user_id,activity_type,to_stage,note,source,idempotency_key)
          values(:tenant,:lead,:actor,'lead_created','lead_created',:note,'portal',:key)
        """),{"tenant":payload.tenant_id,"lead":row["id"],"actor":actor,"note":payload.note,"key":idempotency_key})
        await _audit(connection,payload.tenant_id,actor,"sales.lead.created","sales_lead",row["id"],request,
                     {"source":payload.source,"source_prospect_id":str(payload.source_prospect_id) if payload.source_prospect_id else None})
        return {"data":{"id":str(row["id"]),"customer_id":str(customer_id),"stage":row["stage"]}}


@router.patch("/leads/{lead_id}")
async def update_sales_lead(lead_id: UUID,payload: LeadPatch,request: Request,claims: dict = claims_dependency,
                            idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"leads.manage",request,lead_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.lead.update:"+str(lead_id),idempotency_key=idempotency_key,
            payload={"lead_id":str(lead_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        await _lead_scope(connection,payload.tenant_id,lead_id,actor,context)
        await connection.execute(text("""
          update public.sales_leads set follow_up_at=coalesce(:followup,follow_up_at),
            qualification=coalesce(cast(:qualification as jsonb),qualification),
            last_activity_at=now(),updated_at=now()
          where tenant_id=:tenant and id=:id
        """),{"followup":payload.follow_up_at,"qualification":json.dumps(payload.qualification) if payload.qualification is not None else None,
              "tenant":payload.tenant_id,"id":lead_id})
        if payload.note:
            await connection.execute(text("""
              insert into public.sales_lead_activities(tenant_id,lead_id,actor_user_id,activity_type,note,source,idempotency_key)
              values(:tenant,:lead,:actor,'note',:note,'portal',:key)
            """),{"tenant":payload.tenant_id,"lead":lead_id,"actor":actor,"note":payload.note,
                  "key":idempotency_key or str(uuid4())})
        await _audit(connection,payload.tenant_id,actor,"sales.lead.updated","sales_lead",lead_id,request,{})
        response_body={"data":{"id":str(lead_id),"updated":True}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.post("/leads/{lead_id}/assign")
async def assign_sales_lead(lead_id: UUID,payload: LeadAssign,request: Request,claims: dict = claims_dependency,
                            idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"leads.manage",request,lead_id)
    actor=UUID(claims["sub"])
    if context and "sales_official" in context.role_keys:
        raise HTTPException(status_code=403,detail="Sales official tidak memiliki kewenangan mengubah assignment.")
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.lead.assign",idempotency_key=idempotency_key,
            payload={"lead_id":str(lead_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        lead=await _lead_scope(connection,payload.tenant_id,lead_id,actor,context)
        worker=await connection.execute(text("""
          select id,user_id,lifecycle_status from public.workforce_profiles
          where tenant_id=:tenant and id=:profile
        """),{"tenant":payload.tenant_id,"profile":payload.workforce_profile_id})
        profile=worker.mappings().first()
        if not profile or profile["lifecycle_status"] not in ("eligible","active"):
            raise HTTPException(status_code=409,detail="Workforce harus terdaftar dalam tenant dan berstatus eligible/active.")
        await connection.execute(text("""
          update public.sales_leads set stage=case when stage='lead_created' then 'assigned' else stage end,
            assigned_user_id=:user,assigned_workforce_profile_id=:profile,
            last_activity_at=now(),updated_at=now() where tenant_id=:tenant and id=:lead
        """),{"user":profile["user_id"],"profile":payload.workforce_profile_id,"tenant":payload.tenant_id,"lead":lead_id})
        await connection.execute(text("""
          insert into public.sales_lead_activities(tenant_id,lead_id,actor_user_id,activity_type,from_stage,to_stage,note,source,idempotency_key)
          values(:tenant,:lead,:actor,'assigned',:from_stage,:to_stage,:reason,'portal',:key)
        """),{"tenant":payload.tenant_id,"lead":lead_id,"actor":actor,"from_stage":lead["stage"],
              "to_stage":"assigned" if lead["stage"]=="lead_created" else lead["stage"],
              "reason":payload.reason,"key":idempotency_key or str(uuid4())})
        await connection.execute(text("""
          insert into public.notification_outbox(event_type,aggregate_type,aggregate_id,recipient_email,payload,status,available_at)
          select 'sales.lead.assigned','sales_lead',:lead,u.email,
            jsonb_build_object('lead_id',:lead,'customer_name',:customer,'reason',:reason),'pending',now()
          from auth.users u where u.id=:assignee and u.email is not null
        """),{"lead":lead_id,"customer":lead["customer_name"],"reason":payload.reason,"assignee":profile["user_id"]})
        await _audit(connection,payload.tenant_id,actor,"sales.lead.assigned","sales_lead",lead_id,request,
                     {"workforce_profile_id":str(payload.workforce_profile_id)})
        response_body={"data":{"id":str(lead_id),"assigned_workforce_profile_id":str(payload.workforce_profile_id)}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.post("/leads/{lead_id}/transition")
async def transition_sales_lead(lead_id: UUID,request: Request,tenant_id: UUID,
                                to_stage: str = Query(pattern="^(contacted|qualified|disqualified|closed)$"),
                                reason: str = Query(min_length=3,max_length=2000),
                                claims: dict = claims_dependency,idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,tenant_id,"leads.manage",request,lead_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=tenant_id,
            command_key="sales.lead.transition",idempotency_key=idempotency_key,
            payload={"lead_id":str(lead_id),"to_stage":to_stage,"reason":reason})
        if reservation.replay:
            return reservation.replay_body
        lead=await _lead_scope(connection,tenant_id,lead_id,actor,context)
        key=idempotency_key
        SalesService.assert_lead_transition(lead["stage"],to_stage)
        await connection.execute(text("""
          update public.sales_leads set stage=:stage,last_activity_at=now(),updated_at=now()
          where tenant_id=:tenant and id=:id returning stage
        """),{"stage":to_stage,"tenant":tenant_id,"id":lead_id})
        await connection.execute(text("""
          insert into public.sales_lead_activities(tenant_id,lead_id,actor_user_id,activity_type,from_stage,to_stage,note,source,idempotency_key)
          values(:tenant,:lead,:actor,'status_changed',:old,:new,:reason,'portal',:key)
          on conflict do nothing
        """),{"tenant":tenant_id,"lead":lead_id,"actor":actor,"old":lead["stage"],"new":to_stage,"reason":reason,"key":key})
        await _audit(connection,tenant_id,actor,"sales.lead.stage_changed","sales_lead",lead_id,request,
                     {"from":lead["stage"],"to":to_stage,"reason":reason})
        response_body={"data":{"id":str(lead_id),"stage":to_stage}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.get("/leads/{lead_id}/activities")
async def list_sales_lead_activities(lead_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"leads.read",request,lead_id)
    async with engine.connect() as connection:
        await _lead_scope(connection,tenant_id,lead_id,UUID(claims["sub"]),context)
        rows=await connection.execute(text("""
          select id,activity_type,from_stage,to_stage,note,source,evidence,created_at
          from public.sales_lead_activities where tenant_id=:tenant and lead_id=:lead
          order by created_at desc,id desc limit 200
        """),{"tenant":tenant_id,"lead":lead_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.get("/providers")
async def list_sales_providers(tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"catalogue.read",request)
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select p.id,p.provider_code,p.provider_name,p.provider_type,p.service_regions,p.status,
            (cfg.id is not null and cfg.enabled) as adapter_enabled,
            coalesce(cfg.adapter_key,'not_configured') as adapter_key
          from public.provider_profiles p left join public.provider_integration_configs cfg
            on cfg.provider_profile_id=p.id and cfg.tenant_id=p.tenant_id
          where p.tenant_id=:tenant order by p.provider_name
        """),{"tenant":tenant_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.get("/catalogue")
async def list_sales_catalogue(tenant_id: UUID,request: Request,provider_id: UUID | None = None,claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"catalogue.read",request,provider_id)
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select pr.id,pr.provider_profile_id,p.provider_code,p.provider_name,pr.product_code,
            pr.name,pr.category,pr.description,pr.service_regions,pr.coverage_source,
            pr.requirements,pr.pricing_reference,pr.sla,pr.eligibility,pr.status,pr.version,
            pr.effective_from,pr.effective_until
          from public.sales_provider_products pr join public.provider_profiles p
            on p.id=pr.provider_profile_id and p.tenant_id=pr.tenant_id
          where pr.tenant_id=:tenant and pr.status='active'
            and (:provider is null or pr.provider_profile_id=:provider)
            and (pr.effective_from is null or pr.effective_from<=now())
            and (pr.effective_until is null or pr.effective_until>now())
          order by p.provider_name,pr.category,pr.name,pr.version desc
        """),{"tenant":tenant_id,"provider":provider_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.post("/providers/{provider_id}/products",status_code=201)
async def create_provider_product(provider_id: UUID,payload: ProductCreate,request: Request,claims: dict = claims_dependency,
                                  idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    await _authorize(claims,payload.tenant_id,"catalogue.manage",request,provider_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.catalogue.product.create:"+str(provider_id),idempotency_key=idempotency_key,
            payload={"provider_id":str(provider_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        provider=await connection.execute(text("""
          select id,status from public.provider_profiles where tenant_id=:tenant and id=:id for update
        """),{"tenant":payload.tenant_id,"id":provider_id})
        if provider.mappings().first() is None:
            raise HTTPException(status_code=404,detail="Provider tidak ditemukan pada tenant ini.")
        current=await connection.execute(text("""
          select coalesce(max(version),0) from public.sales_provider_products
          where tenant_id=:tenant and provider_profile_id=:provider and product_code=:code
        """),{"tenant":payload.tenant_id,"provider":provider_id,"code":payload.product_code})
        version=int(current.scalar_one())+1
        result=await connection.execute(text("""
          insert into public.sales_provider_products(tenant_id,provider_profile_id,product_code,name,category,
            description,service_regions,coverage_source,requirements,pricing_reference,sla,eligibility,
            version,effective_from,effective_until,created_by,updated_by)
          values(:tenant,:provider,:code,:name,:category,:description,cast(:regions as jsonb),:coverage,
            cast(:requirements as jsonb),cast(:pricing as jsonb),cast(:sla as jsonb),cast(:eligibility as jsonb),
            :version,:effective_from,:effective_until,:actor,:actor) returning id,status,version
        """),{"tenant":payload.tenant_id,"provider":provider_id,"code":payload.product_code,"name":payload.name,
              "category":payload.category,"description":payload.description,"regions":json.dumps(payload.service_regions),
              "coverage":payload.coverage_source,"requirements":json.dumps(payload.requirements),
              "pricing":json.dumps(payload.pricing_reference),"sla":json.dumps(payload.sla),
              "eligibility":json.dumps(payload.eligibility),"version":version,"effective_from":payload.effective_from,
              "effective_until":payload.effective_until,"actor":actor})
        row=result.mappings().one()
        await _audit(connection,payload.tenant_id,actor,"sales.catalogue.product_version_created","sales_provider_product",row["id"],request,
                     {"provider_id":str(provider_id),"product_code":payload.product_code,"version":version})
        response_body={"data":{"id":str(row["id"]),"status":row["status"],"version":row["version"]}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=201,response_body=response_body)
    return response_body


@router.put("/providers/{provider_id}/integration")
async def configure_provider_integration(provider_id: UUID,payload: ProviderIntegrationInput,request: Request,claims: dict = claims_dependency,
                                         idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    await _authorize(claims,payload.tenant_id,"catalogue.manage",request,provider_id)
    actor=UUID(claims["sub"])
    if payload.enabled and payload.adapter_key=="http_json" and (not payload.endpoint_url or not payload.auth_env_key):
        raise HTTPException(status_code=422,detail="Endpoint HTTPS dan auth environment reference wajib sebelum adapter diaktifkan.")
    if payload.enabled and not payload.webhook_secret_env_key:
        raise HTTPException(status_code=422,detail="Webhook secret environment reference wajib agar status order dapat diverifikasi.")
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.provider.integration:"+str(provider_id),idempotency_key=idempotency_key,
            payload={"provider_id":str(provider_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        exists=await connection.execute(text("select id from public.provider_profiles where tenant_id=:tenant and id=:id"),{"tenant":payload.tenant_id,"id":provider_id})
        if not exists.scalar_one_or_none():
            raise HTTPException(status_code=404,detail="Provider tidak ditemukan.")
        await connection.execute(text("""
          insert into public.provider_integration_configs(tenant_id,provider_profile_id,adapter_key,
            endpoint_url,health_url,auth_env_key,webhook_secret_env_key,timeout_seconds,request_mapping,
            response_mapping,status_mapping,enabled,created_by,updated_by)
          values(:tenant,:provider,:adapter,:endpoint,:health,:auth,:webhook,:timeout,cast(:request as jsonb),
            cast(:response as jsonb),cast(:status as jsonb),:enabled,:actor,:actor)
          on conflict(tenant_id,provider_profile_id) do update set adapter_key=excluded.adapter_key,
            endpoint_url=excluded.endpoint_url,health_url=excluded.health_url,auth_env_key=excluded.auth_env_key,
            webhook_secret_env_key=excluded.webhook_secret_env_key,timeout_seconds=excluded.timeout_seconds,
            request_mapping=excluded.request_mapping,response_mapping=excluded.response_mapping,
            status_mapping=excluded.status_mapping,enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=now()
        """),{"tenant":payload.tenant_id,"provider":provider_id,"adapter":payload.adapter_key,"endpoint":payload.endpoint_url,
              "health":payload.health_url,"auth":payload.auth_env_key,"webhook":payload.webhook_secret_env_key,
              "timeout":payload.timeout_seconds,"request":json.dumps(payload.request_mapping),"response":json.dumps(payload.response_mapping),
              "status":json.dumps(payload.status_mapping),"enabled":payload.enabled,"actor":actor})
        await _audit(connection,payload.tenant_id,actor,"sales.provider.integration_configured","provider_profile",provider_id,request,
                     {"adapter_key":payload.adapter_key,"enabled":payload.enabled,"credentials_stored":False})
        response_body={"data":{"provider_id":str(provider_id),"enabled":payload.enabled,"credentials_stored":False}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.post("/leads/{lead_id}/consents",status_code=201)
async def capture_sales_consent(lead_id: UUID,payload: ConsentInput,request: Request,claims: dict = claims_dependency,
                                idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"consent.manage",request,lead_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.consent.capture",idempotency_key=idempotency_key,
            payload={"lead_id":str(lead_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        await _lead_scope(connection,payload.tenant_id,lead_id,actor,context)
        lead=await connection.execute(text("select customer_id from public.sales_leads where tenant_id=:tenant and id=:id"),
                                      {"tenant":payload.tenant_id,"id":lead_id})
        customer_id=lead.scalar_one_or_none()
        if not customer_id:
            raise HTTPException(status_code=404,detail="Lead tidak ditemukan.")
        result=await connection.execute(text("""
          insert into public.sales_customer_consents(tenant_id,customer_id,lead_id,consent_type,purpose,
            policy_version,granted,source,evidence,created_by)
          values(:tenant,:customer,:lead,:type,:purpose,:policy,:granted,:source,cast(:evidence as jsonb),:actor)
          returning id,captured_at,granted
        """),{"tenant":payload.tenant_id,"customer":customer_id,"lead":lead_id,"type":payload.consent_type,
              "purpose":payload.purpose,"policy":payload.policy_version,"granted":payload.granted,
              "source":payload.source,"evidence":json.dumps(payload.evidence),"actor":actor})
        row=result.mappings().one()
        await _audit(connection,payload.tenant_id,actor,"sales.customer.consent_captured","sales_customer_consent",row["id"],request,
                     {"purpose":payload.purpose,"policy_version":payload.policy_version,"granted":payload.granted})
        response_body={"data":{"id":str(row["id"]),"captured_at":row["captured_at"],"granted":row["granted"]}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=201,response_body=response_body)
    return response_body


@router.get("/leads/{lead_id}/consents")
async def list_sales_lead_consents(lead_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"leads.read",request,lead_id)
    async with engine.connect() as connection:
        await _lead_scope(connection,tenant_id,lead_id,UUID(claims["sub"]),context)
        rows=await connection.execute(text("""
          select id,consent_type,purpose,policy_version,granted,source,captured_at,revoked_at,revoked_reason,evidence
          from public.sales_customer_consents where tenant_id=:tenant and lead_id=:lead
          order by captured_at desc,id desc
        """),{"tenant":tenant_id,"lead":lead_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.post("/consents/{consent_id}/revoke")
async def revoke_sales_consent(consent_id: UUID,tenant_id: UUID,request: Request,
                               reason: str = Query(min_length=3,max_length=1000),claims: dict = claims_dependency,
                               idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,tenant_id,"consent.manage",request,consent_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=tenant_id,
            command_key="sales.consent.revoke",idempotency_key=idempotency_key,
            payload={"consent_id":str(consent_id),"reason":reason})
        if reservation.replay:
            return reservation.replay_body
        consent_row=await connection.execute(text("select lead_id from public.sales_customer_consents where tenant_id=:tenant and id=:id"),{"tenant":tenant_id,"id":consent_id})
        consent_lead=consent_row.scalar_one_or_none()
        if context and "sales_official" in context.role_keys:
            if not consent_lead:
                raise HTTPException(status_code=404,detail="Consent tidak ditemukan.")
            await _lead_scope(connection,tenant_id,consent_lead,actor,context)
        result=await connection.execute(text("""
          update public.sales_customer_consents set granted=false,revoked_at=now(),revoked_reason=:reason
          where tenant_id=:tenant and id=:id and revoked_at is null returning id
        """),{"reason":reason,"tenant":tenant_id,"id":consent_id})
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404,detail="Consent tidak ditemukan atau sudah dicabut.")
        await _audit(connection,tenant_id,actor,"sales.customer.consent_revoked","sales_customer_consent",consent_id,request,{"reason":reason})
        response_body={"data":{"id":str(consent_id),"revoked":True}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.post("/leads/{lead_id}/coverage-checks",status_code=201)
async def check_sales_coverage(lead_id: UUID,payload: CoverageInput,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,payload.tenant_id,"coverage.check",request,lead_id)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        lead=await _lead_scope(connection,payload.tenant_id,lead_id,actor,context)
        consent=await connection.execute(text("""
          select id from public.sales_customer_consents
          where tenant_id=:tenant and id=:consent and customer_id=:customer
            and consent_type='coverage_check' and granted=true and revoked_at is null
            and purpose='provider_coverage_validation'
        """),{"tenant":payload.tenant_id,"consent":payload.consent_id,"customer":lead["customer_id"]})
        if not consent.scalar_one_or_none():
            raise HTTPException(status_code=409,detail="Consent aktif untuk provider coverage validation wajib.")
        product=await connection.execute(text("""
          select pr.*,p.provider_code from public.sales_provider_products pr
          join public.provider_profiles p on p.id=pr.provider_profile_id and p.tenant_id=pr.tenant_id
          where pr.tenant_id=:tenant and pr.id=:product and pr.status='active' and p.status='active'
        """),{"tenant":payload.tenant_id,"product":payload.product_id})
        product_row=product.mappings().first()
        if not product_row:
            raise HTTPException(status_code=404,detail="Produk/provider aktif tidak ditemukan.")
        prior_coverage=await connection.execute(text("""
          select id,lead_id,product_id,result_status,source,checked_at,error_code
          from public.sales_coverage_checks where tenant_id=:tenant and request_reference=:reference
        """),{"tenant":payload.tenant_id,"reference":payload.request_reference})
        prior_row=prior_coverage.mappings().first()
        if prior_row:
            if prior_row["lead_id"]!=lead_id or prior_row["product_id"]!=payload.product_id:
                raise HTTPException(status_code=409,detail="Coverage request reference telah digunakan untuk request berbeda.")
            return {"data":{"id":str(prior_row["id"]),"result_status":prior_row["result_status"],
                "source":prior_row["source"],"checked_at":prior_row["checked_at"],
                "error_code":prior_row["error_code"],"replayed":True}}
        config_result=await connection.execute(text("""
          select * from public.provider_integration_configs
          where tenant_id=:tenant and provider_profile_id=:provider
        """),{"tenant":payload.tenant_id,"provider":product_row["provider_profile_id"]})
        config=config_result.mappings().first()
    adapter_config=dict(config) if config else {"enabled":False,"adapter_key":"unknown"}
    from app.adapters.provider_adapter import ContractOnlyProviderAdapter, HttpJsonProviderAdapter
    provider_adapter=HttpJsonProviderAdapter() if adapter_config.get("adapter_key")=="http_json" else ContractOnlyProviderAdapter()
    normalized_result=await provider_adapter.check_coverage(adapter_config,{
        "product_code":product_row["product_code"],
        "service_address":lead["service_address"],
        "region_code":lead["region_code"],
        "request_reference":payload.request_reference,
    })
    result_status=normalized_result["result_status"]
    source=("authorized_provider_api" if config and config["enabled"] and config["adapter_key"]=="http_json"
            else "authorized_partner_channel" if config and config["enabled"]
            else "provider_unconfigured")
    provider_reference=normalized_result.get("provider_reference")
    response_meta={"response_hash":normalized_result["response_hash"]} if normalized_result.get("response_hash") else {}
    error_code=normalized_result.get("error_code")
    async with engine.begin() as connection:
        saved=await connection.execute(text("""
          insert into public.sales_coverage_checks(tenant_id,lead_id,provider_profile_id,product_id,
            request_reference,result_status,source,provider_reference,checked_at,response_metadata,error_code,trace_id,created_by)
          values(:tenant,:lead,:provider,:product,:reference,:status,:source,:provider_reference,now(),
            cast(:meta as jsonb),:error,:trace,:actor) returning id,checked_at
        """),{"tenant":payload.tenant_id,"lead":lead_id,"provider":product_row["provider_profile_id"],
              "product":payload.product_id,"reference":payload.request_reference,"status":result_status,
              "source":source,"provider_reference":provider_reference,"meta":json.dumps(response_meta),
              "error":error_code,"trace":getattr(request.state,"trace_id",None),"actor":actor})
        row=saved.mappings().one()
        await _audit(connection,payload.tenant_id,actor,"sales.coverage.checked","sales_coverage_check",row["id"],request,
                     {"status":result_status,"source":source,"error_code":error_code})
        if result_status in ("available","unavailable"):
            await connection.execute(text("update public.sales_leads set stage='coverage_checked',last_activity_at=now(),updated_at=now() where tenant_id=:tenant and id=:lead and stage='qualified'"),
                                     {"tenant":payload.tenant_id,"lead":lead_id})
    return {"data":{"id":str(row["id"]),"result_status":result_status,"source":source,"checked_at":row["checked_at"],
                    "provider_reference":provider_reference,"error_code":error_code}}


@router.post("/leads/{lead_id}/offers",status_code=201)
async def present_sales_offer(lead_id: UUID,payload: OfferInput,request: Request,claims: dict = claims_dependency,
                              idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"leads.manage",request,lead_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        lead=await _lead_scope(connection,payload.tenant_id,lead_id,actor,context)
        prior_offer=await connection.execute(text("""
          select id from public.sales_offers where tenant_id=:tenant and lead_id=:lead
            and product_id=:product and coverage_check_id=:coverage
        """),{"tenant":payload.tenant_id,"lead":lead_id,"product":payload.product_id,"coverage":payload.coverage_check_id})
        existing_offer=prior_offer.scalar_one_or_none()
        if existing_offer:
            return {"data":{"id":str(existing_offer),"status":"presented","replayed":True}}
        coverage=await connection.execute(text("""
          select id,result_status,product_id from public.sales_coverage_checks
          where tenant_id=:tenant and id=:coverage and lead_id=:lead
        """),{"tenant":payload.tenant_id,"coverage":payload.coverage_check_id,"lead":lead_id})
        cov=coverage.mappings().first()
        if not cov:
            raise HTTPException(status_code=404,detail="Coverage check tidak ditemukan.")
        SalesService.assert_offerable_coverage(cov["result_status"],str(cov["product_id"]),str(payload.product_id))
        product=await connection.execute(text("""
          select id,version,pricing_reference,requirements,status from public.sales_provider_products
          where tenant_id=:tenant and id=:product and status='active'
        """),{"tenant":payload.tenant_id,"product":payload.product_id})
        pr=product.mappings().first()
        if not pr:
            raise HTTPException(status_code=404,detail="Produk tidak aktif.")
        result=await connection.execute(text("""
          insert into public.sales_offers(tenant_id,lead_id,product_id,coverage_check_id,product_version,
            pricing_snapshot,requirements_snapshot,valid_until,created_by)
          values(:tenant,:lead,:product,:coverage,:version,cast(:pricing as jsonb),cast(:requirements as jsonb),:valid,:actor)
          returning id
        """),{"tenant":payload.tenant_id,"lead":lead_id,"product":payload.product_id,"coverage":payload.coverage_check_id,
              "version":pr["version"],"pricing":json.dumps(pr["pricing_reference"]),"requirements":json.dumps(pr["requirements"]),
              "valid":payload.valid_until,"actor":actor})
        offer_id=result.scalar_one()
        if lead["stage"]=="coverage_checked":
            await connection.execute(text("update public.sales_leads set stage='offer_presented',updated_at=now() where tenant_id=:tenant and id=:lead"),
                                     {"tenant":payload.tenant_id,"lead":lead_id})
        await _audit(connection,payload.tenant_id,actor,"sales.offer.presented","sales_offer",offer_id,request,
                     {"product_id":str(payload.product_id),"product_version":pr["version"]})
    return {"data":{"id":str(offer_id),"status":"presented"}}


@router.post("/orders",status_code=201)
async def create_sales_order(payload: OrderCreate,request: Request,claims: dict = claims_dependency,
                             idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"orders.manage",request,payload.lead_id)
    actor=UUID(claims["sub"])
    if not idempotency_key or not 8<=len(idempotency_key)<=128:
        raise HTTPException(status_code=428,detail="Idempotency-Key wajib dikirim.")
    fingerprint=request_fingerprint(payload.model_dump(mode="json"))
    async with engine.begin() as connection:
        prior=await connection.execute(text("""
          select id,created_by,request_fingerprint,status from public.sales_orders
          where tenant_id=:tenant and idempotency_key=:key
        """),{"tenant":payload.tenant_id,"key":idempotency_key})
        existing=prior.mappings().first()
        if existing:
            if existing["created_by"]!=actor:
                raise HTTPException(status_code=409,detail="Idempotency-Key sudah digunakan oleh identity lain.")
            if existing["request_fingerprint"]!=fingerprint:
                raise HTTPException(status_code=409,detail="Idempotency-Key digunakan dengan payload berbeda.")
            return {"data":{"id":str(existing["id"]),"status":existing["status"],"replayed":True}}
        lead=await _lead_scope(connection,payload.tenant_id,payload.lead_id,actor,context)
        offer_result=await connection.execute(text("""
          select o.*,p.provider_profile_id,p.product_code,p.name as product_name,p.version,p.status as product_status,
                 c.status as provider_status
          from public.sales_offers o
          join public.sales_provider_products p on p.id=o.product_id and p.tenant_id=o.tenant_id
          join public.provider_profiles c on c.id=p.provider_profile_id and c.tenant_id=p.tenant_id
          where o.tenant_id=:tenant and o.id=:offer and o.lead_id=:lead
          for update of o
        """),{"tenant":payload.tenant_id,"offer":payload.offer_id,"lead":payload.lead_id})
        offer=offer_result.mappings().first()
        if not offer or offer["status"]!="presented" or offer["product_status"]!="active" or offer["provider_status"]!="active":
            raise HTTPException(status_code=409,detail="Offer/provider/product tidak valid atau tidak aktif.")
        existing_offer_order=await connection.execute(text("select id,order_number,status from public.sales_orders where tenant_id=:tenant and offer_id=:offer"),
            {"tenant":payload.tenant_id,"offer":payload.offer_id})
        prior_order=existing_offer_order.mappings().first()
        if prior_order:
            return {"data":{"id":str(prior_order["id"]),"order_number":prior_order["order_number"],"status":prior_order["status"],"replayed":True}}
        consent=await connection.execute(text("""
          select id from public.sales_customer_consents
          where tenant_id=:tenant and id=:consent and customer_id=:customer and lead_id=:lead
            and consent_type='order_submission' and purpose='submit_provider_order'
            and granted=true and revoked_at is null
        """),{"tenant":payload.tenant_id,"consent":payload.consent_id,"customer":lead["customer_id"],"lead":payload.lead_id})
        if not consent.scalar_one_or_none():
            raise HTTPException(status_code=409,detail="Consent aktif untuk submit_provider_order wajib.")
        workforce_profile_id=lead["assigned_workforce_profile_id"]
        if not workforce_profile_id and lead["assigned_user_id"]:
            assigned_profile=await connection.execute(text("""
              select id from public.workforce_profiles where tenant_id=:tenant and user_id=:user
                and lifecycle_status in ('eligible','active') and engagement_status='active'
            """),{"tenant":payload.tenant_id,"user":lead["assigned_user_id"]})
            workforce_profile_id=assigned_profile.scalar_one_or_none()
        if not workforce_profile_id:
            raise HTTPException(status_code=409,detail="Lead harus memiliki assignment Workforce Phase 04 yang aktif sebelum order.")
        if payload.assigned_workforce_profile_id and payload.assigned_workforce_profile_id!=workforce_profile_id:
            raise HTTPException(status_code=409,detail="Order attribution diturunkan dari assignment lead; client tidak dapat mengganti owner.")
        worker=await connection.execute(text("""
          select id from public.workforce_profiles where tenant_id=:tenant and id=:profile
            and lifecycle_status in ('eligible','active') and engagement_status='active'
        """),{"tenant":payload.tenant_id,"profile":workforce_profile_id})
        if not worker.scalar_one_or_none():
            raise HTTPException(status_code=409,detail="Workforce assignment tidak eligible pada tenant ini.")
        coverage=await connection.execute(text("""
          select result_status from public.sales_coverage_checks
          where tenant_id=:tenant and id=:coverage and lead_id=:lead
        """),{"tenant":payload.tenant_id,"coverage":offer["coverage_check_id"],"lead":payload.lead_id})
        if coverage.scalar_one_or_none()!="available":
            raise HTTPException(status_code=409,detail="Coverage available terbaru wajib sebelum order.")
        order_number="AGZ-"+datetime.now(UTC).strftime("%Y%m%d")+"-"+uuid4().hex[:10].upper()
        customer_snapshot={"customer_name":lead["customer_name"],"contact_name":lead["contact_name"],
          "email":lead["email"],"phone":lead["phone"],"service_address":lead["service_address"],"region_code":lead["region_code"]}
        product_snapshot={"product_code":offer["product_code"],"name":offer["product_name"],"version":offer["version"],
          "pricing_reference":offer["pricing_snapshot"],"requirements":offer["requirements_snapshot"]}
        result=await connection.execute(text("""
          insert into public.sales_orders(tenant_id,order_number,lead_id,customer_id,consent_id,offer_id,
            provider_profile_id,product_id,assigned_workforce_profile_id,idempotency_key,request_fingerprint,
            customer_snapshot,product_snapshot,created_by)
          values(:tenant,:number,:lead,:customer,:consent,:offer,:provider,:product,:worker,:key,:fingerprint,
            cast(:customer_snapshot as jsonb),cast(:product_snapshot as jsonb),:actor) returning id,status
        """),{"tenant":payload.tenant_id,"number":order_number,"lead":payload.lead_id,"customer":lead["customer_id"],
          "consent":payload.consent_id,"offer":payload.offer_id,"provider":offer["provider_profile_id"],
          "product":offer["product_id"],"worker":workforce_profile_id,"key":idempotency_key,
          "fingerprint":fingerprint,"customer_snapshot":json.dumps(customer_snapshot),
          "product_snapshot":json.dumps(product_snapshot),"actor":actor})
        row=result.mappings().one()
        await connection.execute(text("""
          update public.sales_offers set status='accepted' where tenant_id=:tenant and id=:offer
        """),{"tenant":payload.tenant_id,"offer":payload.offer_id})
        await connection.execute(text("""
          insert into public.order_attributions(tenant_id,sales_order_id,attributed_worker_id,attribution_type,
            share_basis,attribution_status,source,evidence,idempotency_key,created_by)
          values(:tenant,:order,:worker,'sales_personal',1.000000,'provisional','lead_assignment',
            cast(:evidence as jsonb),:key,:actor)
        """),{"tenant":payload.tenant_id,"order":row["id"],"worker":workforce_profile_id,
              "evidence":json.dumps({"lead_id":str(payload.lead_id),"assigned_user_id":str(lead["assigned_user_id"]),
                                     "assigned_workforce_profile_id":str(workforce_profile_id)}),
              "key":"order-attribution-"+str(row["id"])+"-sales-personal","actor":actor})
        await connection.execute(text("""
          insert into public.sales_order_events(tenant_id,order_id,event_type,from_status,to_status,actor_user_id,
            source,reason,evidence,idempotency_key,trace_id)
          values(:tenant,:order,'order.created',null,'draft',:actor,'portal','Order created from validated offer.',
            cast(:evidence as jsonb),:key,:trace)
        """),{"tenant":payload.tenant_id,"order":row["id"],"actor":actor,
          "evidence":json.dumps({"lead_id":str(payload.lead_id),"offer_id":str(payload.offer_id),"consent_id":str(payload.consent_id),
                                 "attributed_worker_id":str(workforce_profile_id),"attribution_type":"sales_personal"}),
          "key":"order-created-"+idempotency_key,"trace":getattr(request.state,"trace_id",None)})
        await _audit(connection,payload.tenant_id,actor,"sales.order.attribution_created","order_attribution",row["id"],request,
                     {"attributed_worker_id":str(workforce_profile_id),"attribution_type":"sales_personal","share_basis":"1.000000"})
        await _audit(connection,payload.tenant_id,actor,"sales.order.created","sales_order",row["id"],request,{"order_number":order_number})
        return {"data":{"id":str(row["id"]),"order_number":order_number,"status":row["status"]}}


@router.get("/orders")
async def list_sales_orders(tenant_id: UUID,request: Request,status: str | None = None,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select o.id,o.order_number,o.status,o.provider_order_reference,o.created_at,o.updated_at,
            c.customer_name,p.provider_name,pr.name as product_name,l.id as lead_id
          from public.sales_orders o
          join public.sales_customers c on c.id=o.customer_id and c.tenant_id=o.tenant_id
          join public.provider_profiles p on p.id=o.provider_profile_id and p.tenant_id=o.tenant_id
          join public.sales_provider_products pr on pr.id=o.product_id and pr.tenant_id=o.tenant_id
          join public.sales_leads l on l.id=o.lead_id and l.tenant_id=o.tenant_id
          where o.tenant_id=:tenant and (:status is null or o.status=:status)
            and (:sales_official=false or l.assigned_user_id=:actor)
          order by o.created_at desc limit 200
        """),{"tenant":tenant_id,"status":status,"sales_official":bool(context and "sales_official" in context.role_keys),"actor":actor})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.get("/orders/{order_id}")
async def get_sales_order(order_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request,order_id)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        row=await connection.execute(text("""
          select o.*,c.customer_name,c.contact_name,p.provider_name,pr.name as product_name
          from public.sales_orders o join public.sales_customers c on c.id=o.customer_id and c.tenant_id=o.tenant_id
          join public.provider_profiles p on p.id=o.provider_profile_id and p.tenant_id=o.tenant_id
          join public.sales_provider_products pr on pr.id=o.product_id and pr.tenant_id=o.tenant_id
          where o.tenant_id=:tenant and o.id=:id
        """),{"tenant":tenant_id,"id":order_id})
        order=row.mappings().first()
        if not order:
            raise HTTPException(status_code=404,detail="Order tidak ditemukan.")
        await _order_scope(connection,tenant_id,order_id,actor,context)
        return {"data":dict(order)}


@router.get("/orders/{order_id}/events")
async def list_sales_order_events(order_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request,order_id)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        await _order_scope(connection,tenant_id,order_id,actor,context)
        rows=await connection.execute(text("""
          select event_type,from_status,to_status,actor_user_id,source,reason,evidence,trace_id,created_at
          from public.sales_order_events where tenant_id=:tenant and order_id=:order
          order by created_at,id
        """),{"tenant":tenant_id,"order":order_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.post("/orders/{order_id}/transition")
async def transition_sales_order(order_id: UUID,payload: OrderTransition,request: Request,claims: dict = claims_dependency,
                                 idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    permission="orders.submit" if payload.to_status=="submitted" else "orders.manage"
    context=await _authorize(claims,payload.tenant_id,permission,request,order_id)
    actor=UUID(claims["sub"])
    if not idempotency_key or not 8<=len(idempotency_key)<=128:
        raise HTTPException(status_code=428,detail="Idempotency-Key wajib dikirim.")
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.order.transition:"+str(order_id),idempotency_key=idempotency_key,
            payload={"order_id":str(order_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        await _order_scope(connection,payload.tenant_id,order_id,actor,context)
        result=await connection.execute(text("""
          select status,provider_profile_id,customer_id,order_number from public.sales_orders
          where tenant_id=:tenant and id=:id for update
        """),{"tenant":payload.tenant_id,"id":order_id})
        order=result.mappings().first()
        if not order:
            raise HTTPException(status_code=404,detail="Order tidak ditemukan.")
        if payload.to_status not in ("submitted","cancelled"):
            raise HTTPException(status_code=422,detail="Status provider dan instalasi hanya dapat diperbarui melalui webhook terverifikasi.")
        if payload.to_status=="submitted" and order["status"] in ("submitted","provider_pending"):
            response_body={"data":{"id":str(order_id),"status":order["status"],"replayed":True}}
            await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
            return response_body
        if payload.to_status=="cancelled" and order["status"]=="cancelled":
            response_body={"data":{"id":str(order_id),"status":"cancelled","replayed":True}}
            await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
            return response_body
        SalesService.assert_order_transition(order["status"],payload.to_status)
        if payload.to_status=="cancelled" and order["status"] not in ("draft","submitted"):
            raise HTTPException(status_code=409,detail="Pembatalan setelah provider menerima order memerlukan cancellation contract resmi dari provider.")
        if payload.to_status=="cancelled" and order["status"]=="submitted":
            submission=await connection.execute(text("""
              select status from public.sales_outbox where tenant_id=:tenant and aggregate_id=:order
                and event_type='provider.order.submit' order by created_at desc limit 1
            """),{"tenant":payload.tenant_id,"order":order_id})
            outbox_status=submission.scalar_one_or_none()
            if outbox_status in ("processing","done"):
                raise HTTPException(status_code=409,detail="Provider submission sedang diproses atau sudah diterima. Cancellation eksternal membutuhkan contract resmi.")
        if payload.to_status=="submitted":
            consent_check=await connection.execute(text("""
              select 1 from public.sales_customer_consents
              where tenant_id=:tenant and id=(select consent_id from public.sales_orders where tenant_id=:tenant and id=:order)
                and granted=true and revoked_at is null and consent_type='order_submission'
                and purpose='submit_provider_order'
            """),{"tenant":payload.tenant_id,"order":order_id})
            if not consent_check.scalar_one_or_none():
                raise HTTPException(status_code=409,detail="Consent order submission sudah tidak aktif.")
            await connection.execute(text("""
              update public.sales_orders set status='submitted',submitted_at=now(),updated_at=now()
              where tenant_id=:tenant and id=:id
            """),{"tenant":payload.tenant_id,"id":order_id})
            await enqueue_provider_submission(connection,payload.tenant_id,order_id,order["provider_profile_id"],idempotency_key) 
            await connection.execute(text("""
              update public.sales_leads set stage='order_submitted',last_activity_at=now(),updated_at=now()
              where tenant_id=:tenant and id=(select lead_id from public.sales_orders where tenant_id=:tenant and id=:order)
                and stage='offer_presented'
            """),{"tenant":payload.tenant_id,"order":order_id})
            await connection.execute(text("""
              insert into public.notification_outbox(event_type,aggregate_type,aggregate_id,recipient_email,payload,status,available_at)
              select 'sales.order.submitted','sales_order',:order,c.email,
                jsonb_build_object('order_number',:number,'status','provider_submission_pending'),'pending',now()
              from public.sales_customers c where c.tenant_id=:tenant and c.id=:customer and c.email is not null
            """),{"order":order_id,"number":order["order_number"],"tenant":payload.tenant_id,"customer":order["customer_id"]})
        else:
            await connection.execute(text("""
              update public.sales_orders set status=:status,
                cancelled_at=case when :status='cancelled' then now() else cancelled_at end,updated_at=now()
              where tenant_id=:tenant and id=:id
            """),{"status":payload.to_status,"tenant":payload.tenant_id,"id":order_id})
        await connection.execute(text("""
          insert into public.sales_order_events(tenant_id,order_id,event_type,from_status,to_status,actor_user_id,
            source,reason,evidence,idempotency_key,trace_id)
          values(:tenant,:order,'order.status_changed',:from,:to,:actor,'portal',:reason,cast(:evidence as jsonb),:key,:trace)
          on conflict(tenant_id,order_id,idempotency_key) do nothing
        """),{"tenant":payload.tenant_id,"order":order_id,"from":order["status"],"to":payload.to_status,
          "actor":actor,"reason":payload.reason,"evidence":json.dumps(payload.evidence),"key":idempotency_key,
          "trace":getattr(request.state,"trace_id",None)})
        await _audit(connection,payload.tenant_id,actor,"sales.order.status_changed","sales_order",order_id,request,
                     {"from":order["status"],"to":payload.to_status,"reason":payload.reason})
        response_body={"data":{"id":str(order_id),"status":payload.to_status}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body




@router.get("/orders/{order_id}/attributions")
async def list_sales_order_attributions(order_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request,order_id)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        await _order_scope(connection,tenant_id,order_id,actor,context)
        rows=await connection.execute(text("""
          select a.id,a.attributed_worker_id,w.worker_code,w.display_name,w.job_title,
            a.attribution_type,a.share_basis,a.attribution_status,a.source,a.reason,a.locked_at,a.created_at
          from public.order_attributions a
          join public.workforce_profiles w on w.id=a.attributed_worker_id and w.tenant_id=a.tenant_id
          where a.tenant_id=:tenant and a.sales_order_id=:order
          order by a.created_at,a.id
        """),{"tenant":tenant_id,"order":order_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.post("/orders/{order_id}/attributions/correct")
async def correct_sales_order_attribution(order_id: UUID,payload: OrderAttributionCorrection,request: Request,
                                          claims: dict = claims_dependency,
                                          idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"orders.manage",request,order_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.order.attribution.correct:"+str(order_id),idempotency_key=idempotency_key,
            payload={"order_id":str(order_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        await _order_scope(connection,payload.tenant_id,order_id,actor,context)
        order_result=await connection.execute(text("""
          select status,assigned_workforce_profile_id from public.sales_orders
          where tenant_id=:tenant and id=:order for update
        """),{"tenant":payload.tenant_id,"order":order_id})
        order=order_result.mappings().first()
        if not order:
            raise HTTPException(status_code=404,detail="Order tidak ditemukan.")
        if order["status"]!="draft":
            raise HTTPException(status_code=409,detail="Attribution hanya dapat dikoreksi sebelum order disubmit ke provider.")
        worker=await connection.execute(text("""
          select id from public.workforce_profiles where tenant_id=:tenant and id=:worker
            and lifecycle_status in ('eligible','active') and engagement_status='active'
        """),{"tenant":payload.tenant_id,"worker":payload.attributed_worker_id})
        if not worker.scalar_one_or_none():
            raise HTTPException(status_code=409,detail="Worker attribution tidak eligible pada tenant ini.")
        current=await connection.execute(text("""
          select id,attributed_worker_id from public.order_attributions
          where tenant_id=:tenant and sales_order_id=:order and attribution_type='sales_personal'
            and attribution_status='provisional' for update
        """),{"tenant":payload.tenant_id,"order":order_id})
        current_row=current.mappings().first()
        if current_row and current_row["attributed_worker_id"]==payload.attributed_worker_id:
            response_body={"data":{"order_id":str(order_id),"attributed_worker_id":str(payload.attributed_worker_id),"replayed":True}}
            await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
            return response_body
        previous_id=str(current_row["id"]) if current_row else None
        if current_row:
            await connection.execute(text("""
              update public.order_attributions set attribution_status='reversed',reason=:reason
              where tenant_id=:tenant and id=:id
            """),{"tenant":payload.tenant_id,"id":current_row["id"],"reason":payload.reason})
        await connection.execute(text("""
          insert into public.order_attributions(tenant_id,sales_order_id,attributed_worker_id,attribution_type,
            share_basis,attribution_status,source,reason,evidence,idempotency_key,created_by)
          values(:tenant,:order,:worker,'sales_personal',1.000000,'provisional','authorized_correction',:reason,
            cast(:evidence as jsonb),:key,:actor)
        """),{"tenant":payload.tenant_id,"order":order_id,"worker":payload.attributed_worker_id,"reason":payload.reason,
              "evidence":json.dumps({"previous_attribution_id":previous_id,"corrected_by":str(actor)}),
              "key":"order-attribution-correction-"+str(order_id)+"-"+str(reservation.record_id),"actor":actor})
        await connection.execute(text("""
          update public.sales_orders set assigned_workforce_profile_id=:worker,updated_at=now()
          where tenant_id=:tenant and id=:order
        """),{"tenant":payload.tenant_id,"order":order_id,"worker":payload.attributed_worker_id})
        await _audit(connection,payload.tenant_id,actor,"sales.order.attribution_corrected","order_attribution",order_id,request,
                     {"previous_attribution_id":previous_id,"attributed_worker_id":str(payload.attributed_worker_id),"reason":payload.reason})
        response_body={"data":{"order_id":str(order_id),"attributed_worker_id":str(payload.attributed_worker_id),"corrected":True}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.get("/orders/{order_id}/attempts")
async def list_sales_order_attempts(order_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request,order_id)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        await _order_scope(connection,tenant_id,order_id,actor,context)
        rows=await connection.execute(text("""
          select attempt_number,status,request_hash,response_hash,provider_reference,error_code,duration_ms,created_at
          from public.provider_submission_attempts where tenant_id=:tenant and order_id=:order
          order by attempt_number
        """),{"tenant":tenant_id,"order":order_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.get("/webhooks/unmatched")
async def list_unmatched_provider_webhooks(tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request)
    if context and "sales_official" in context.role_keys:
        return {"data":[]}
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select e.id,e.external_event_id,e.event_type,e.payload_hash,e.processing_status,e.error_code,
            e.event_timestamp,e.received_at,p.provider_code,p.provider_name
          from public.provider_webhook_events e
          join public.provider_profiles p on p.id=e.provider_profile_id and p.tenant_id=e.tenant_id
          where e.tenant_id=:tenant and e.mapped_order_id is null
            and e.processing_status in ('ignored','failed','dead_letter','received')
          order by e.received_at desc limit 200
        """),{"tenant":tenant_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.post("/webhooks/providers/{provider_code}")
async def ingest_provider_webhook(provider_code: str,tenant_id: UUID,request: Request,
                                  signature: str | None = Header(default=None,alias="X-Provider-Signature"),
                                  timestamp: str | None = Header(default=None,alias="X-Provider-Timestamp")):
    raw=await request.body()
    if len(raw)>1024*1024 or not signature or not timestamp:
        raise HTTPException(status_code=400,detail="Webhook signature/timestamp wajib dan payload maksimal 1 MB.")
    try:
        event_time=datetime.fromtimestamp(int(timestamp),UTC)
    except (ValueError,OverflowError):
        raise HTTPException(status_code=400,detail="Webhook timestamp tidak valid.")
    if abs((datetime.now(UTC)-event_time).total_seconds())>300:
        raise HTTPException(status_code=401,detail="Webhook timestamp di luar toleransi replay.")
    try:
        body=json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400,detail="Payload webhook bukan JSON valid.") from exc
    if not isinstance(body,dict) or not body.get("event_id") or not body.get("event_type"):
        raise HTTPException(status_code=422,detail="event_id dan event_type provider wajib.")
    async with engine.connect() as connection:
        provider=await connection.execute(text("""
          select p.id,p.provider_code,c.webhook_secret_env_key,c.status_mapping
          from public.provider_profiles p join public.provider_integration_configs c
            on c.provider_profile_id=p.id and c.tenant_id=p.tenant_id
          where p.tenant_id=:tenant and lower(p.provider_code)=lower(:code) and c.enabled
        """),{"tenant":tenant_id,"code":provider_code})
        config=provider.mappings().first()
    if not config or not config["webhook_secret_env_key"]:
        raise HTTPException(status_code=404,detail="Provider webhook belum dikonfigurasi.")
    webhook_secret_key=str(config["webhook_secret_env_key"] or "")
    if not webhook_secret_key.startswith("AGENTZY_PROVIDER_WEBHOOK__"):
        raise HTTPException(status_code=503,detail="Webhook secret environment reference tidak valid.")
    secret=os.getenv(webhook_secret_key)
    if not secret:
        raise HTTPException(status_code=503,detail="Webhook secret provider belum tersedia pada deployment.")
    expected=hmac.new(secret.encode(),timestamp.encode()+b"."+raw,hashlib.sha256).hexdigest()
    supplied=signature.removeprefix("sha256=")
    if not hmac.compare_digest(expected,supplied):
        raise HTTPException(status_code=401,detail="Webhook signature tidak valid.")
    payload_hash=hashlib.sha256(raw).hexdigest()
    async with engine.begin() as connection:
        inserted=await connection.execute(text("""
          insert into public.provider_webhook_events(tenant_id,provider_profile_id,external_event_id,event_type,
            payload_hash,signature_verified,event_timestamp,payload_metadata)
          values(:tenant,:provider,:event_id,:event_type,:hash,true,:event_time,cast(:metadata as jsonb))
          on conflict(provider_profile_id,external_event_id) do nothing returning id
        """),{"tenant":tenant_id,"provider":config["id"],"event_id":str(body["event_id"])[:180],
              "event_type":str(body["event_type"])[:120],"hash":payload_hash,"event_time":event_time,
              "metadata":json.dumps({"order_number":body.get("order_number"),"provider_reference":body.get("provider_reference"),
                                     "status":body.get("status")})})
        webhook_id=inserted.scalar_one_or_none()
        if not webhook_id:
            return {"data":{"duplicate":True,"processed":False}}
        order_result=await connection.execute(text("""
          select id,status from public.sales_orders where tenant_id=:tenant and provider_profile_id=:provider
            and (order_number=:number or provider_order_reference=:reference) for update
        """),{"tenant":tenant_id,"provider":config["id"],"number":body.get("order_number") or "",
              "reference":body.get("provider_reference") or ""})
        order=order_result.mappings().first()
        mapped=normalize_provider_status(str(body.get("status") or body["event_type"]),dict(config["status_mapping"] or {}))
        if not order or not mapped:
            await connection.execute(text("""
              update public.provider_webhook_events set processing_status='ignored',error_code=:error
              where id=:id
            """),{"error":"ORDER_NOT_MAPPED" if not order else "STATUS_NOT_MAPPED","id":webhook_id})
            return {"data":{"duplicate":False,"processed":False,"reason":"ORDER_OR_STATUS_NOT_MAPPED"}}
        if not transition_allowed(order["status"],mapped,order=True):
            await connection.execute(text("""
              update public.provider_webhook_events set processing_status='failed',error_code='INVALID_STATUS_TRANSITION'
              where id=:id
            """),{"id":webhook_id})
            return {"data":{"duplicate":False,"processed":False,"reason":"INVALID_STATUS_TRANSITION"}}
        await connection.execute(text("""
          update public.sales_orders set status=:status,
            activated_at=case when :status='activated' then now() else activated_at end,updated_at=now()
          where tenant_id=:tenant and id=:order
        """),{"status":mapped,"tenant":tenant_id,"order":order["id"]})
        await connection.execute(text("""
          insert into public.sales_order_events(tenant_id,order_id,event_type,from_status,to_status,source,reason,
            evidence,idempotency_key,trace_id)
          values(:tenant,:order,:event,:from,:to,'provider_webhook','Verified provider webhook.',
            cast(:evidence as jsonb),:key,:trace)
          on conflict(tenant_id,order_id,idempotency_key) do nothing
        """),{"tenant":tenant_id,"order":order["id"],"event":str(body["event_type"])[:120],
              "from":order["status"],"to":mapped,"evidence":json.dumps({"webhook_id":str(webhook_id),"payload_hash":payload_hash}),
              "key":"provider-webhook-"+str(webhook_id),"trace":getattr(request.state,"trace_id",None)})
        await connection.execute(text("""
          update public.provider_webhook_events set processing_status='processed',mapped_order_id=:order,processed_at=now()
          where id=:id
        """),{"order":order["id"],"id":webhook_id})
        if mapped in ("provider_approved","activated"):
            await connection.execute(text("""
              update public.order_attributions set attribution_status='locked',locked_at=coalesce(locked_at,now())
              where tenant_id=:tenant and sales_order_id=:order and attribution_status='provisional'
            """),{"tenant":tenant_id,"order":order["id"]})
        elif mapped=="provider_rejected":
            await connection.execute(text("""
              update public.order_attributions set attribution_status='reversed',reason='Provider rejected order'
              where tenant_id=:tenant and sales_order_id=:order and attribution_status='provisional'
            """),{"tenant":tenant_id,"order":order["id"]})
        if mapped=="activated":
            await connection.execute(text("""
              update public.sales_leads set stage='closed',last_activity_at=now(),updated_at=now()
              where tenant_id=:tenant and id=(select lead_id from public.sales_orders where tenant_id=:tenant and id=:order)
                and stage='order_submitted'
            """),{"tenant":tenant_id,"order":order["id"]})
        await _audit(connection,tenant_id,None,"sales.provider.webhook_processed","sales_order",order["id"],request,
                     {"webhook_id":str(webhook_id),"provider_profile_id":str(config["id"]),"status":mapped})
    return {"data":{"duplicate":False,"processed":True,"order_id":str(order["id"]),"status":mapped}}


@router.post("/providers/{provider_id}/retry-blocked")
async def retry_blocked_provider_submissions(provider_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency,
                                             idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    await _authorize(claims,tenant_id,"catalogue.manage",request,provider_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=tenant_id,
            command_key="sales.provider.retry:"+str(provider_id),idempotency_key=idempotency_key,
            payload={"provider_id":str(provider_id),"tenant_id":str(tenant_id)})
        if reservation.replay:
            return reservation.replay_body
        result=await connection.execute(text("""
          update public.sales_outbox o set status='pending',attempts=0,available_at=now(),last_error_code=null,locked_at=null,processed_at=null,updated_at=now()
          from public.sales_orders s
          where o.tenant_id=:tenant and s.tenant_id=o.tenant_id and s.id=o.aggregate_id
            and s.provider_profile_id=:provider and o.status in ('blocked_configuration','dead_letter')
          returning o.id
        """),{"tenant":tenant_id,"provider":provider_id})
        count=len(result.fetchall())
        response_body={"data":{"requeued":count}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.get("/reconciliation")
async def sales_reconciliation(tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select s.id,s.order_number,s.status,p.provider_name,
            (select count(*) from public.provider_submission_attempts a where a.order_id=s.id and a.tenant_id=s.tenant_id) as submission_attempts,
            (select max(a.created_at) from public.provider_submission_attempts a where a.order_id=s.id and a.tenant_id=s.tenant_id) as last_provider_attempt,
            (select a.error_code from public.provider_submission_attempts a where a.order_id=s.id and a.tenant_id=s.tenant_id and a.error_code is not null order by a.created_at desc limit 1) as last_error_code,
            (select count(*) from public.provider_webhook_events w where w.mapped_order_id=s.id and w.tenant_id=s.tenant_id
              and w.processing_status in ('received','failed','dead_letter')) as unresolved_webhooks
          from public.sales_orders s
          join public.provider_profiles p on p.id=s.provider_profile_id and p.tenant_id=s.tenant_id
          join public.sales_leads l on l.id=s.lead_id and l.tenant_id=s.tenant_id
          where s.tenant_id=:tenant and s.status not in ('activated','cancelled')
            and (:sales_official=false or l.assigned_user_id=:actor)
          order by s.updated_at desc limit 200
        """),{"tenant":tenant_id,"sales_official":bool(context and "sales_official" in context.role_keys),"actor":actor})
        return {"data":[dict(row) for row in rows.mappings().all()]}


class ProductStatusInput(StrictModel):
    tenant_id: UUID
    status: str = Field(pattern="^(active|suspended|archived)$")
    reason: str = Field(min_length=3,max_length=1000)


@router.get("/products")
async def list_sales_products(tenant_id: UUID,request: Request,provider_id: UUID | None = None,claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"catalogue.manage",request,provider_id)
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select pr.id,pr.provider_profile_id,p.provider_code,p.provider_name,pr.product_code,pr.name,
            pr.category,pr.coverage_source,pr.status,pr.version,pr.updated_at
          from public.sales_provider_products pr join public.provider_profiles p
            on p.id=pr.provider_profile_id and p.tenant_id=pr.tenant_id
          where pr.tenant_id=:tenant and (:provider is null or pr.provider_profile_id=:provider)
          order by p.provider_name,pr.product_code,pr.version desc
        """),{"tenant":tenant_id,"provider":provider_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.patch("/products/{product_id}/status")
async def update_sales_product_status(product_id: UUID,payload: ProductStatusInput,request: Request,claims: dict = claims_dependency,
                                      idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    await _authorize(claims,payload.tenant_id,"catalogue.manage",request,product_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.catalogue.product.status:"+str(product_id),idempotency_key=idempotency_key,
            payload={"product_id":str(product_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        current=await connection.execute(text("""
          select pr.id,pr.provider_profile_id,pr.product_code,pr.version,p.status as provider_status
          from public.sales_provider_products pr
          join public.provider_profiles p on p.id=pr.provider_profile_id and p.tenant_id=pr.tenant_id
          where pr.tenant_id=:tenant and pr.id=:id and pr.status<>'archived'
          for update of pr,p
        """),{"tenant":payload.tenant_id,"id":product_id})
        product=current.mappings().first()
        if not product:
            raise HTTPException(status_code=404,detail="Product tidak ditemukan atau sudah diarsipkan.")
        if payload.status=="active" and product["provider_status"]!="active":
            raise HTTPException(status_code=409,detail="Provider harus aktif sebelum product dapat dipublikasikan.")
        if payload.status=="active":
            await connection.execute(text("""
              update public.sales_provider_products set status='suspended',updated_by=:actor,updated_at=now()
              where tenant_id=:tenant and provider_profile_id=:provider and product_code=:code
                and status='active' and id<>:id
            """),{"actor":actor,"tenant":payload.tenant_id,"provider":product["provider_profile_id"],
                  "code":product["product_code"],"id":product_id})
        await connection.execute(text("""
          update public.sales_provider_products set status=:status,updated_by=:actor,updated_at=now()
          where tenant_id=:tenant and id=:id
        """),{"status":payload.status,"actor":actor,"tenant":payload.tenant_id,"id":product_id})
        await _audit(connection,payload.tenant_id,actor,"sales.catalogue.product_status_changed","sales_provider_product",product_id,request,
                     {"status":payload.status,"reason":payload.reason,"version":product["version"]})
        response_body={"data":{"id":str(product_id),"status":payload.status}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


class CustomerPatch(StrictModel):
    tenant_id: UUID
    customer_name: str | None = Field(default=None,min_length=2,max_length=180)
    contact_name: str | None = Field(default=None,min_length=2,max_length=160)
    email: str | None = Field(default=None,max_length=254)
    phone: str | None = Field(default=None,max_length=40)
    service_address: str | None = Field(default=None,max_length=800)
    region_code: str | None = Field(default=None,max_length=80)


@router.get("/customers")
async def list_sales_customers(tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"leads.read",request)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select id,customer_name,contact_name,email,phone,service_address,region_code,created_at,updated_at
          from public.sales_customers c where tenant_id=:tenant
            and (:sales_official=false or exists(select 1 from public.sales_leads l
              where l.tenant_id=c.tenant_id and l.customer_id=c.id and l.assigned_user_id=:actor))
          order by updated_at desc limit 200
        """),{"tenant":tenant_id,"sales_official":bool(context and "sales_official" in context.role_keys),"actor":actor})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.patch("/customers/{customer_id}")
async def update_sales_customer(customer_id: UUID,payload: CustomerPatch,request: Request,claims: dict = claims_dependency,
                                idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"leads.manage",request,customer_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.customer.update:"+str(customer_id),idempotency_key=idempotency_key,
            payload={"customer_id":str(customer_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        if context and "sales_official" in context.role_keys:
            scoped=await connection.execute(text("""
              select 1 from public.sales_leads where tenant_id=:tenant and customer_id=:customer and assigned_user_id=:actor
            """),{"tenant":payload.tenant_id,"customer":customer_id,"actor":actor})
            if not scoped.scalar_one_or_none():
                raise HTTPException(status_code=404,detail="Customer tidak ditemukan.")
        result=await connection.execute(text("""
          update public.sales_customers set
            customer_name=coalesce(:name,customer_name),contact_name=coalesce(:contact,contact_name),
            email=coalesce(:email,email),phone=coalesce(:phone,phone),
            service_address=coalesce(:address,service_address),region_code=coalesce(:region,region_code),
            updated_at=now()
          where tenant_id=:tenant and id=:id returning id
        """),{"name":payload.customer_name,"contact":payload.contact_name,"email":payload.email,
              "phone":payload.phone,"address":payload.service_address,"region":payload.region_code,
              "tenant":payload.tenant_id,"id":customer_id})
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404,detail="Customer tidak ditemukan.")
        await _audit(connection,payload.tenant_id,actor,"sales.customer.updated","sales_customer",customer_id,request,{})
        response_body={"data":{"id":str(customer_id),"updated":True}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body


@router.get("/workforce-options")
async def list_sales_workforce_options(tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"leads.manage",request)
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select id,worker_code,display_name,job_title,lifecycle_status
          from public.workforce_profiles where tenant_id=:tenant and lifecycle_status in ('eligible','active')
          order by display_name limit 300
        """),{"tenant":tenant_id})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.get("/providers/{provider_id}/health")
async def get_sales_provider_health(provider_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"catalogue.read",request,provider_id)
    async with engine.connect() as connection:
        result=await connection.execute(text("""
          select p.provider_name,c.adapter_key,c.endpoint_url,c.health_url,c.auth_env_key,c.timeout_seconds,c.enabled
          from public.provider_profiles p left join public.provider_integration_configs c
            on c.provider_profile_id=p.id and c.tenant_id=p.tenant_id
          where p.tenant_id=:tenant and p.id=:provider
        """),{"tenant":tenant_id,"provider":provider_id})
        config=result.mappings().first()
    if not config:
        raise HTTPException(status_code=404,detail="Provider tidak ditemukan.")
    if not config["enabled"] or not config["health_url"] or not config["auth_env_key"]:
        return {"data":{"provider_id":str(provider_id),"status":"pending_external_configuration","checked_at":None}}
    from app.adapters.provider_adapter import HttpJsonProviderAdapter
    state=await HttpJsonProviderAdapter().check_health(dict(config))
    return {"data":{"provider_id":str(provider_id),"status":state,"checked_at":datetime.now(UTC).isoformat()}}

async def _order_scope(connection, tenant_id: UUID, order_id: UUID, actor: UUID, context):
    order=await get_order_for_tenant(connection,tenant_id,order_id)
    if not order or (context and "sales_official" in context.role_keys and order["assigned_user_id"]!=actor):
        raise HTTPException(status_code=404,detail="Order tidak ditemukan.")
    return order


class ProviderCreate(StrictModel):
    tenant_id: UUID
    provider_code: str = Field(min_length=2,max_length=80,pattern=r"^[A-Za-z0-9._/-]+$")
    provider_name: str = Field(min_length=2,max_length=180)
    provider_type: str = Field(pattern="^(isp|telecom|managed_service|technology|other)$")
    registration_number: str | None = Field(default=None,max_length=120)
    contact_email: str | None = Field(default=None,max_length=254)
    contact_phone: str | None = Field(default=None,max_length=40)
    service_regions: list[str] = Field(default_factory=list,max_length=200)
    service_metadata: dict[str,Any] = Field(default_factory=dict)


class ProviderStatusInput(StrictModel):
    tenant_id: UUID
    status: str = Field(pattern="^(active|suspended|archived)$")
    reason: str = Field(min_length=3,max_length=1000)


@router.post("/providers",status_code=201)
async def create_sales_provider(payload: ProviderCreate,request: Request,claims: dict = claims_dependency,
                                idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    await _authorize(claims,payload.tenant_id,"providers.manage",request)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.provider.create",idempotency_key=idempotency_key,payload=payload.model_dump(mode="json"))
        if reservation.replay:
            return reservation.replay_body
        result=await connection.execute(text("""
          insert into public.provider_profiles(tenant_id,provider_code,provider_name,provider_type,
            registration_number,contact_email,contact_phone,service_regions,service_metadata,status,created_by,updated_by)
          values(:tenant,:code,:name,:type,:registration,:email,:phone,cast(:regions as jsonb),
            cast(:metadata as jsonb),'draft',:actor,:actor) returning id,status
        """),{"tenant":payload.tenant_id,"code":payload.provider_code,"name":payload.provider_name,
              "type":payload.provider_type,"registration":payload.registration_number,
              "email":payload.contact_email,"phone":payload.contact_phone,
              "regions":json.dumps(payload.service_regions),"metadata":json.dumps(payload.service_metadata),"actor":actor})
        row=result.mappings().one()
        await _audit(connection,payload.tenant_id,actor,"sales.provider.created","provider_profile",row["id"],request,
                     {"provider_code":payload.provider_code,"status":"draft"})
        response_body={"data":{"id":str(row["id"]),"status":row["status"]}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=201,response_body=response_body)
    return response_body


@router.patch("/providers/{provider_id}/status")
async def update_sales_provider_status(provider_id: UUID,payload: ProviderStatusInput,request: Request,claims: dict = claims_dependency,
                                       idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    await _authorize(claims,payload.tenant_id,"providers.manage",request,provider_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        reservation=await reserve_idempotency(connection,actor_user_id=actor,tenant_id=payload.tenant_id,
            command_key="sales.provider.status:"+str(provider_id),idempotency_key=idempotency_key,
            payload={"provider_id":str(provider_id),**payload.model_dump(mode="json")})
        if reservation.replay:
            return reservation.replay_body
        result=await connection.execute(text("""
          update public.provider_profiles set status=:status,updated_by=:actor,updated_at=now()
          where tenant_id=:tenant and id=:id and status<>'archived' returning id,status
        """),{"status":payload.status,"actor":actor,"tenant":payload.tenant_id,"id":provider_id})
        row=result.mappings().first()
        if not row:
            raise HTTPException(status_code=404,detail="Provider tidak ditemukan atau sudah diarsipkan.")
        await _audit(connection,payload.tenant_id,actor,"sales.provider.status_changed","provider_profile",provider_id,request,
                     {"status":payload.status,"reason":payload.reason})
        response_body={"data":{"id":str(provider_id),"status":payload.status}}
        await complete_idempotency(connection,record_id=reservation.record_id,response_status=200,response_body=response_body)
    return response_body
