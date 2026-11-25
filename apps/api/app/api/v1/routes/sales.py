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
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import text

from app.core.authorization import authorize_action
from app.core.idempotency import request_fingerprint
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
    customer_name: str = Field(min_length=2, max_length=180)
    contact_name: str = Field(min_length=2, max_length=160)
    email: str | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=40)
    service_address: str | None = Field(default=None, max_length=800)
    region_code: str | None = Field(default=None, max_length=80)
    source: str = Field(default="manual", min_length=2, max_length=80)
    source_prospect_id: UUID | None = None
    follow_up_at: datetime | None = None
    note: str | None = Field(default=None, max_length=4000)


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
    to_status: str = Field(pattern="^(submitted|installation_scheduled|installation_in_progress|cancelled)$")
    reason: str = Field(min_length=3, max_length=2000)
    evidence: dict[str, Any] = Field(default_factory=dict)


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
    if not idempotency_key or not 8<=len(idempotency_key)<=128:
        raise HTTPException(status_code=428,detail="Idempotency-Key wajib dikirim.")
    fingerprint=request_fingerprint(payload.model_dump(mode="json"))
    async with engine.begin() as connection:
        prior=await connection.execute(text("""
          select id,request_fingerprint from public.sales_leads
          where tenant_id=:tenant and idempotency_key=:key
        """),{"tenant":payload.tenant_id,"key":idempotency_key})
        prior_row=prior.mappings().first()
        if prior_row:
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
            customer_name=prospect["company_name"]; contact_name=prospect["contact_name"]
            email=prospect["business_email"]; phone=prospect["business_phone"]
        else:
            customer_name=payload.customer_name; contact_name=payload.contact_name
            email=payload.email; phone=payload.phone
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
        lead=await _lead_scope(connection,payload.tenant_id,lead_id,actor,context)
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
    return {"data":{"id":str(lead_id),"updated":True}}


@router.post("/leads/{lead_id}/assign")
async def assign_sales_lead(lead_id: UUID,payload: LeadAssign,request: Request,claims: dict = claims_dependency,
                            idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"leads.manage",request,lead_id)
    actor=UUID(claims["sub"])
    if context and "sales_official" in context.role_keys:
        raise HTTPException(status_code=403,detail="Sales official tidak memiliki kewenangan mengubah assignment.")
    async with engine.begin() as connection:
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
    return {"data":{"id":str(lead_id),"assigned_workforce_profile_id":str(payload.workforce_profile_id)}}


@router.post("/leads/{lead_id}/transition")
async def transition_sales_lead(lead_id: UUID,request: Request,tenant_id: UUID,
                                to_stage: str = Query(pattern="^(assigned|contacted|qualified|coverage_checked|offer_presented|order_submitted|disqualified|closed)$"),
                                reason: str = Query(min_length=3,max_length=2000),
                                claims: dict = claims_dependency,idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,tenant_id,"leads.manage",request,lead_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        lead=await _lead_scope(connection,tenant_id,lead_id,actor,context)
        SalesService.assert_lead_transition(lead["stage"],to_stage)
        key=idempotency_key or str(uuid4())
        updated=await connection.execute(text("""
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
    return {"data":{"id":str(lead_id),"stage":to_stage}}


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
        provider=await connection.execute(text("""
          select id,status from public.provider_profiles where tenant_id=:tenant and id=:id
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
        return {"data":{"id":str(row["id"]),"status":row["status"],"version":row["version"]}}


@router.put("/providers/{provider_id}/integration")
async def configure_provider_integration(provider_id: UUID,payload: ProviderIntegrationInput,request: Request,claims: dict = claims_dependency):
    await _authorize(claims,payload.tenant_id,"catalogue.manage",request,provider_id)
    actor=UUID(claims["sub"])
    if payload.enabled and payload.adapter_key=="http_json" and (not payload.endpoint_url or not payload.auth_env_key):
        raise HTTPException(status_code=422,detail="Endpoint HTTPS dan auth environment reference wajib sebelum adapter diaktifkan.")
    async with engine.begin() as connection:
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
    return {"data":{"provider_id":str(provider_id),"enabled":payload.enabled,"credentials_stored":False}}


@router.post("/leads/{lead_id}/consents",status_code=201)
async def capture_sales_consent(lead_id: UUID,payload: ConsentInput,request: Request,claims: dict = claims_dependency,
                                idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    context=await _authorize(claims,payload.tenant_id,"consent.manage",request,lead_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
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
        return {"data":{"id":str(row["id"]),"captured_at":row["captured_at"],"granted":row["granted"]}}


@router.post("/consents/{consent_id}/revoke")
async def revoke_sales_consent(consent_id: UUID,tenant_id: UUID,request: Request,
                               reason: str = Query(min_length=3,max_length=1000),claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"consent.manage",request,consent_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
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
    return {"data":{"id":str(consent_id),"revoked":True}}


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
        config_result=await connection.execute(text("""
          select * from public.provider_integration_configs
          where tenant_id=:tenant and provider_profile_id=:provider
        """),{"tenant":payload.tenant_id,"provider":product_row["provider_profile_id"]})
        config=config_result.mappings().first()
    result_status="unknown"; source="provider_unconfigured"; provider_reference=None; response_meta={}; error_code="PROVIDER_NOT_CONFIGURED"
    if config and config["enabled"] and config["adapter_key"]=="http_json" and config["endpoint_url"] and config["auth_env_key"]:
        try:
            from app.adapters.provider_adapter import _assert_authorized_endpoint
            _assert_authorized_endpoint(str(config["endpoint_url"]))
            token=os.getenv(str(config["auth_env_key"]))
            if token:
                async with httpx.AsyncClient(timeout=config["timeout_seconds"],trust_env=False) as client:
                    response=await client.post(str(config["endpoint_url"]).rstrip("/")+"/coverage-check",
                        json={"product_code":product_row["product_code"],"service_address":lead["service_address"],"region_code":lead["region_code"]},
                        headers={"Authorization":f"Bearer {token}","Content-Type":"application/json"})
                    response.raise_for_status()
                    body=response.json()
                value=str(body.get("coverage_status","")).lower()
                if value in ("available","unavailable"):
                    result_status=value; source="authorized_provider_api"; error_code=None
                    provider_reference=str(body.get("reference") or "")[:160] or None
                    response_meta={"response_hash":hashlib.sha256(json.dumps(body,sort_keys=True,default=str).encode()).hexdigest()}
                else:
                    result_status="unknown"; source="authorized_provider_api"; error_code="PROVIDER_RESPONSE_UNMAPPED"
            else:
                error_code="PROVIDER_CREDENTIAL_NOT_CONFIGURED"
        except (httpx.HTTPError,ValueError):
            result_status="failed"; source="authorized_provider_api"; error_code="PROVIDER_REQUEST_FAILED"
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
          select id,request_fingerprint,status from public.sales_orders
          where tenant_id=:tenant and idempotency_key=:key
        """),{"tenant":payload.tenant_id,"key":idempotency_key})
        existing=prior.mappings().first()
        if existing:
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
        """),{"tenant":payload.tenant_id,"offer":payload.offer_id,"lead":payload.lead_id})
        offer=offer_result.mappings().first()
        if not offer or offer["status"]!="presented" or offer["product_status"]!="active" or offer["provider_status"]!="active":
            raise HTTPException(status_code=409,detail="Offer/provider/product tidak valid atau tidak aktif.")
        consent=await connection.execute(text("""
          select id from public.sales_customer_consents
          where tenant_id=:tenant and id=:consent and customer_id=:customer and lead_id=:lead
            and consent_type='order_submission' and purpose='submit_provider_order'
            and granted=true and revoked_at is null
        """),{"tenant":payload.tenant_id,"consent":payload.consent_id,"customer":lead["customer_id"],"lead":payload.lead_id})
        if not consent.scalar_one_or_none():
            raise HTTPException(status_code=409,detail="Consent aktif untuk submit_provider_order wajib.")
        if payload.assigned_workforce_profile_id:
            worker=await connection.execute(text("""
              select id from public.workforce_profiles where tenant_id=:tenant and id=:profile
                and lifecycle_status in ('eligible','active')
            """),{"tenant":payload.tenant_id,"profile":payload.assigned_workforce_profile_id})
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
          "product":offer["product_id"],"worker":payload.assigned_workforce_profile_id,"key":idempotency_key,
          "fingerprint":fingerprint,"customer_snapshot":json.dumps(customer_snapshot),
          "product_snapshot":json.dumps(product_snapshot),"actor":actor})
        row=result.mappings().one()
        await connection.execute(text("""
          update public.sales_offers set status='accepted' where tenant_id=:tenant and id=:offer
        """),{"tenant":payload.tenant_id,"offer":payload.offer_id})
        await connection.execute(text("""
          insert into public.sales_order_events(tenant_id,order_id,event_type,from_status,to_status,actor_user_id,
            source,reason,evidence,idempotency_key,trace_id)
          values(:tenant,:order,'order.created',null,'draft',:actor,'portal','Order created from validated offer.',
            cast(:evidence as jsonb),:key,:trace)
        """),{"tenant":payload.tenant_id,"order":row["id"],"actor":actor,
          "evidence":json.dumps({"lead_id":str(payload.lead_id),"offer_id":str(payload.offer_id),"consent_id":str(payload.consent_id)}),
          "key":"order-created-"+idempotency_key,"trace":getattr(request.state,"trace_id",None)})
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
        await _order_scope(connection,payload.tenant_id,order_id,actor,context)
        result=await connection.execute(text("""
          select status,provider_profile_id,customer_id,order_number from public.sales_orders
          where tenant_id=:tenant and id=:id for update
        """),{"tenant":payload.tenant_id,"id":order_id})
        order=result.mappings().first()
        if not order:
            raise HTTPException(status_code=404,detail="Order tidak ditemukan.")
        if payload.to_status not in ("submitted","installation_scheduled","installation_in_progress","cancelled"):
            raise HTTPException(status_code=422,detail="Status provider hanya dapat diperbarui melalui webhook terverifikasi.")
        SalesService.assert_order_transition(order["status"],payload.to_status)
        if payload.to_status=="submitted":
            await connection.execute(text("""
              update public.sales_orders set status='submitted',submitted_at=now(),updated_at=now()
              where tenant_id=:tenant and id=:id
            """),{"tenant":payload.tenant_id,"id":order_id})
            await enqueue_provider_submission(connection,payload.tenant_id,order_id,order["provider_profile_id"])
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
    return {"data":{"id":str(order_id),"status":payload.to_status}}


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
    secret=os.getenv(config["webhook_secret_env_key"])
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
        await _audit(connection,tenant_id,None,"sales.provider.webhook_processed","sales_order",order["id"],request,
                     {"webhook_id":str(webhook_id),"provider_profile_id":str(config["id"]),"status":mapped})
    return {"data":{"duplicate":False,"processed":True,"order_id":str(order["id"]),"status":mapped}}


@router.post("/providers/{provider_id}/retry-blocked")
async def retry_blocked_provider_submissions(provider_id: UUID,tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"catalogue.manage",request,provider_id)
    async with engine.begin() as connection:
        result=await connection.execute(text("""
          update public.sales_outbox o set status='pending',available_at=now(),last_error_code=null,updated_at=now()
          from public.sales_orders s
          where o.tenant_id=:tenant and s.tenant_id=o.tenant_id and s.id=o.aggregate_id
            and s.provider_profile_id=:provider and o.status='blocked_configuration'
          returning o.id
        """),{"tenant":tenant_id,"provider":provider_id})
        count=len(result.fetchall())
    return {"data":{"requeued":count}}


@router.get("/reconciliation")
async def sales_reconciliation(tenant_id: UUID,request: Request,claims: dict = claims_dependency):
    context=await _authorize(claims,tenant_id,"orders.read",request)
    actor=UUID(claims["sub"])
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select s.id,s.order_number,s.status,p.provider_name,
            count(a.id) as submission_attempts,
            max(a.created_at) as last_provider_attempt,
            max(a.error_code) filter(where a.error_code is not null) as last_error_code,
            count(w.id) filter(where w.processing_status in ('received','failed','dead_letter')) as unresolved_webhooks
          from public.sales_orders s
          join public.provider_profiles p on p.id=s.provider_profile_id and p.tenant_id=s.tenant_id
          left join public.provider_submission_attempts a on a.order_id=s.id and a.tenant_id=s.tenant_id
          left join public.provider_webhook_events w on w.mapped_order_id=s.id and w.tenant_id=s.tenant_id
          join public.sales_leads l on l.id=s.lead_id and l.tenant_id=s.tenant_id
          where s.tenant_id=:tenant and s.status not in ('activated','cancelled')
            and (:sales_official=false or l.assigned_user_id=:actor)
          group by s.id,s.order_number,s.status,p.provider_name
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
async def update_sales_product_status(product_id: UUID,payload: ProductStatusInput,request: Request,claims: dict = claims_dependency):
    await _authorize(claims,payload.tenant_id,"catalogue.manage",request,product_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        row=await connection.execute(text("""
          update public.sales_provider_products set status=:status,updated_by=:actor,updated_at=now()
          where tenant_id=:tenant and id=:id and status<>'archived'
          returning id,status,version
        """),{"status":payload.status,"actor":actor,"tenant":payload.tenant_id,"id":product_id})
        product=row.mappings().first()
        if not product:
            raise HTTPException(status_code=404,detail="Product tidak ditemukan atau sudah diarsipkan.")
        await _audit(connection,payload.tenant_id,actor,"sales.catalogue.product_status_changed","sales_provider_product",product_id,request,
                     {"status":payload.status,"reason":payload.reason,"version":product["version"]})
    return {"data":{"id":str(product_id),"status":payload.status}}


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
async def update_sales_customer(customer_id: UUID,payload: CustomerPatch,request: Request,claims: dict = claims_dependency):
    await _authorize(claims,payload.tenant_id,"leads.manage",request,customer_id)
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
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
    return {"data":{"id":str(customer_id),"updated":True}}


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
    from app.adapters.provider_adapter import _assert_authorized_endpoint
    token=os.getenv(config["auth_env_key"])
    if not token:
        return {"data":{"provider_id":str(provider_id),"status":"pending_external_configuration","checked_at":None}}
    try:
        _assert_authorized_endpoint(config["health_url"])
        async with httpx.AsyncClient(timeout=config["timeout_seconds"],trust_env=False) as client:
            response=await client.get(config["health_url"],headers={"Authorization":f"Bearer {token}"})
        state="healthy" if 200<=response.status_code<300 else "unavailable"
    except (httpx.HTTPError,ValueError):
        state="unavailable"
    return {"data":{"provider_id":str(provider_id),"status":state,"checked_at":datetime.now(UTC).isoformat()}}

async def _order_scope(connection, tenant_id: UUID, order_id: UUID, actor: UUID, context):
    order=await get_order_for_tenant(connection,tenant_id,order_id)
    if not order or (context and "sales_official" in context.role_keys and order["assigned_user_id"]!=actor):
        raise HTTPException(status_code=404,detail="Order tidak ditemukan.")
    return order
