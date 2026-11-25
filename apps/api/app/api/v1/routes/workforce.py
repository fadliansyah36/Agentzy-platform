# ruff: noqa: E501
"""Human Workforce Passport, verification, engagement, skills, training and onboarding APIs."""
import json
from datetime import date, datetime, timezone
from hashlib import sha256
from typing import Any
from uuid import UUID, uuid4
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import text

from app.adapters.clamav import scan_bytes
from app.core.authorization import authorize_action
from app.core.config import get_settings
from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.core.security import current_claims
from app.db.session import engine

router = APIRouter(prefix="/workforce", tags=["Human Workforce"])
claims_dependency = Depends(current_claims)
settings = get_settings()

PERMISSIONS = {
    "profile.read": ("workforce.profile.read", "workforce.profile", "read"),
    "profile.manage": ("workforce.profile.manage", "workforce.profile", "manage"),
    "profile.directory": ("workforce.directory.read", "workforce.profile", "directory_read"),
    "identity.submit": ("workforce.identity.submit", "workforce.identity", "submit"),
    "identity.review": ("workforce.identity.review", "workforce.identity", "review"),
    "engagement.read": ("workforce.engagement.read", "workforce.engagement", "read"),
    "engagement.manage": ("workforce.engagement.manage", "workforce.engagement", "manage"),
    "skills.read": ("workforce.skills.read", "workforce.skills", "read"),
    "skills.manage": ("workforce.skills.manage", "workforce.skills", "manage"),
    "certifications.verify": ("workforce.certifications.verify", "workforce.certifications", "verify"),
    "availability.read": ("workforce.availability.read", "workforce.availability", "read"),
    "availability.manage": ("workforce.availability.manage", "workforce.availability", "manage"),
    "training.read": ("workforce.training.read", "workforce.training", "read"),
    "training.manage": ("workforce.training.manage", "workforce.training", "manage"),
    "onboarding.read": ("workforce.onboarding.read", "workforce.onboarding", "read"),
    "onboarding.manage": ("workforce.onboarding.manage", "workforce.onboarding", "manage"),
    "lifecycle.transition": ("workforce.lifecycle.transition", "workforce.lifecycle", "transition"),
    "assignments.read": ("workforce.assignments.read", "workforce.assignments", "read"),
    "assignments.manage": ("workforce.assignments.manage", "workforce.assignments", "manage"),
}
LIFECYCLE = {"invited", "registered", "identity_pending", "verified", "onboarding", "eligible", "active", "inactive", "suspended", "offboarded"}
TRANSITIONS = {
    "invited": {"registered", "inactive"},
    "registered": {"identity_pending", "inactive"},
    "identity_pending": {"verified", "inactive"},
    "verified": {"onboarding", "inactive"},
    "onboarding": {"eligible", "inactive"},
    "eligible": {"active", "inactive"},
    "active": {"inactive", "suspended", "offboarded"},
    "inactive": {"onboarding", "active", "offboarded"},
    "suspended": {"active", "inactive", "offboarded"},
    "offboarded": set(),
}

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

class SelfRegistrationInput(StrictModel):
    tenant_id: UUID
    worker_code: str = Field(min_length=2, max_length=48)
    display_name: str = Field(min_length=2, max_length=160)
    legal_name: str | None = Field(default=None, max_length=180)
    job_family: str | None = Field(default=None, max_length=100)
    job_title: str | None = Field(default=None, max_length=120)
    timezone: str = Field(default='Asia/Jakarta', max_length=80)
    experience_years: float = Field(default=0, ge=0, le=80)

class ProfileCreate(StrictModel):
    tenant_id: UUID
    user_id: UUID
    membership_id: UUID
    worker_code: str = Field(min_length=2, max_length=48)
    display_name: str = Field(min_length=2, max_length=160)
    legal_name: str | None = Field(default=None, max_length=180)
    job_family: str | None = Field(default=None, max_length=100)
    job_title: str | None = Field(default=None, max_length=120)
    timezone: str = Field(default="Asia/Jakarta", max_length=80)
    locale: str = Field(default="id-ID", max_length=16)
    experience_years: float = Field(default=0, ge=0, le=80)
    profile_metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("profile_metadata")
    @classmethod
    def restrict_profile_metadata(cls, value):
        allowed={"portfolio_url","linkedin_url","bio","work_location","preferred_language","pronunciation"}
        if set(value)-allowed:
            raise ValueError("profile_metadata hanya menerima atribut non-sensitif yang diizinkan.")
        if len(json.dumps(value,ensure_ascii=False))>4096:
            raise ValueError("profile_metadata maksimal 4 KB.")
        return value

class ProfilePatch(StrictModel):
    tenant_id: UUID
    display_name: str | None = Field(default=None, min_length=2, max_length=160)
    legal_name: str | None = Field(default=None, max_length=180)
    job_family: str | None = Field(default=None, max_length=100)
    job_title: str | None = Field(default=None, max_length=120)
    timezone: str | None = Field(default=None, max_length=80)
    experience_years: float | None = Field(default=None, ge=0, le=80)
    profile_metadata: dict[str, Any] | None = None

    @field_validator("profile_metadata")
    @classmethod
    def restrict_profile_metadata(cls, value):
        allowed={"portfolio_url","linkedin_url","bio","work_location","preferred_language","pronunciation"}
        if value is not None and set(value)-allowed:
            raise ValueError("profile_metadata hanya menerima atribut non-sensitif yang diizinkan.")
        if value is not None and len(json.dumps(value,ensure_ascii=False))>4096:
            raise ValueError("profile_metadata maksimal 4 KB.")
        return value

class VerificationInput(StrictModel):
    tenant_id: UUID
    verification_type: str = Field(default="identity", pattern="^(identity|address|right_to_work|background_check|other)$")

class VerificationDecision(StrictModel):
    tenant_id: UUID
    decision: str = Field(pattern="^(verified|rejected|in_review)$")
    reason: str = Field(min_length=3, max_length=2000)
    reviewer_notes: str | None = Field(default=None, max_length=2000)
    expires_at: datetime | None = None

class DocumentMetadata(StrictModel):
    tenant_id: UUID
    verification_id: UUID
    storage_path: str = Field(min_length=3, max_length=500)
    document_type: str = Field(min_length=2, max_length=80)
    original_filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(pattern="^(application/pdf|image/jpeg|image/png)$")
    file_size_bytes: int = Field(ge=1, le=10485760)
    sha256: str = Field(pattern="^[a-f0-9]{64}$")
    retention_until: datetime | None = None

class EngagementInput(StrictModel):
    tenant_id: UUID
    contract_id: UUID | None = None
    classification: str = Field(pattern="^(employee|outsourced_worker|independent_contractor|freelance|affiliate|technical_partner|project_based_worker)$")
    agreement_reference: str = Field(min_length=3, max_length=160)
    effective_from: date
    effective_until: date | None = None
    legal_review_reference: str | None = Field(default=None, max_length=160)
    facts_acknowledged: bool
    change_reason: str = Field(min_length=3, max_length=2000)
    @model_validator(mode="after")
    def dates(self):
        if self.effective_until and self.effective_until < self.effective_from:
            raise ValueError("effective_until must be on or after effective_from")
        if not self.facts_acknowledged:
            raise ValueError("Classification requires acknowledgement of actual engagement facts")
        return self

class EngagementApproval(StrictModel):
    tenant_id: UUID
    reason: str = Field(min_length=3, max_length=2000)

class SkillInput(StrictModel):
    tenant_id: UUID
    skill_key: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=80)
    description: str | None = Field(default=None, max_length=1000)

class WorkerSkillInput(StrictModel):
    tenant_id: UUID
    skill_id: UUID
    proficiency: str = Field(pattern="^(beginner|intermediate|advanced|expert)$")
    experience_months: int = Field(default=0, ge=0, le=960)
    evidence_reference: str | None = Field(default=None, max_length=500)

class SkillVerification(StrictModel):
    tenant_id: UUID
    reason: str = Field(min_length=3, max_length=2000)

class CertificationInput(StrictModel):
    tenant_id: UUID
    skill_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    issuer: str = Field(min_length=2, max_length=160)
    certificate_reference: str | None = Field(default=None, max_length=160)
    issued_at: date | None = None
    valid_from: date | None = None
    expires_at: date | None = None
    evidence_metadata: dict[str, Any] = Field(default_factory=dict)

class CertificationRenewal(StrictModel):
    tenant_id: UUID
    certificate_reference: str = Field(min_length=2, max_length=160)
    issued_at: date | None = None
    valid_from: date
    expires_at: date | None = None
    evidence_metadata: dict[str, Any] = Field(default_factory=dict)
    @model_validator(mode="after")
    def renewal_dates(self):
        if self.expires_at and self.expires_at < self.valid_from:
            raise ValueError("expires_at must be on or after valid_from")
        return self

class AvailabilityInput(StrictModel):
    tenant_id: UUID
    availability_type: str = Field(pattern="^(working_hours|unavailable|leave|preferred_shift)$")
    starts_at: datetime
    ends_at: datetime
    timezone: str = Field(min_length=2, max_length=80)
    recurrence_rule: str | None = Field(default=None, max_length=500)
    reason: str | None = Field(default=None, max_length=500)
    @model_validator(mode="after")
    def period(self):
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        if self.starts_at.tzinfo is None or self.ends_at.tzinfo is None:
            raise ValueError("Availability timestamps must include timezone offsets")
        return self

class CourseInput(StrictModel):
    tenant_id: UUID | None = None
    course_key: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=3000)
    materials: list[dict[str, Any]] = Field(default_factory=list, max_length=100)
    assessment: dict[str, Any] = Field(default_factory=dict)
    eligibility_rules: dict[str, Any] = Field(default_factory=dict)
    validity_days: int | None = Field(default=None, ge=1, le=3650)
    status: str = Field(default="draft", pattern="^(draft|published|archived)$")

class EnrollmentInput(StrictModel):
    tenant_id: UUID
    course_id: UUID

class ProgressInput(StrictModel):
    tenant_id: UUID
    progress_percent: float = Field(ge=0, le=100)
    assessment_score: float | None = Field(default=None, ge=0, le=100)
    assessment_result: dict[str, Any] = Field(default_factory=dict)
    certificate_reference: str | None = Field(default=None, max_length=160)

class OnboardingTaskInput(StrictModel):
    tenant_id: UUID
    task_key: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=1000)
    required: bool = True
    task_type: str = Field(pattern="^(document|agreement_acknowledgement|training|verification|approval|other)$")
    assigned_to: UUID | None = None
    due_at: datetime | None = None

class TaskCompletion(StrictModel):
    tenant_id: UUID
    status: str = Field(pattern="^(in_progress|completed|waived|blocked)$")
    reason: str = Field(min_length=3, max_length=2000)
    completion_reference: str | None = Field(default=None, max_length=500)

class LifecycleTransition(StrictModel):
    tenant_id: UUID
    to_status: str
    reason: str = Field(min_length=3, max_length=2000)
    metadata: dict[str, Any] = Field(default_factory=dict)

class AssignmentInput(StrictModel):
    tenant_id: UUID
    assignment_reference: str = Field(min_length=2, max_length=160)
    assignment_type: str = Field(min_length=2, max_length=80)
    starts_at: datetime
    ends_at: datetime | None = None
    workload_units: float = Field(default=1, ge=0, le=10000)

async def _authorize(claims: dict, tenant_id: UUID, key: str, request: Request, resource_id: UUID | None = None):
    permission, resource_type, action = PERMISSIONS[key]
    async with engine.connect() as connection:
        await authorize_action(
            connection, user_id=UUID(claims["sub"]), tenant_id=tenant_id,
            permission_key=permission, platform_permission="platform.tenants.read",
            aal=claims.get("aal"), resource_type=resource_type, action=action,
            resource={"id": str(resource_id or tenant_id), "tenant_id": str(tenant_id)},
            request_id=getattr(request.state, "request_id", None),
        )

async def _profile(connection, tenant_id: UUID, profile_id: UUID):
    result = await connection.execute(text("""
      select p.* from public.workforce_profiles p
      where p.tenant_id=:tenant and p.id=:id
    """), {"tenant": tenant_id, "id": profile_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Workforce profile tidak ditemukan.")
    return dict(row)

async def _write_audit(connection, tenant_id: UUID, actor: UUID, action: str, resource_type: str, resource_id: UUID, request: Request, metadata: dict | None = None):
    await connection.execute(text("""
      insert into public.audit_logs(tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata)
      values(:tenant,:actor,:action,:type,:id,:request_id,cast(:metadata as jsonb))
    """), {"tenant":tenant_id,"actor":actor,"action":action,"type":resource_type,"id":str(resource_id),
           "request_id":getattr(request.state,"request_id",None),"metadata":json.dumps(metadata or {},default=str)})


async def _assert_profile_scope(connection, claims: dict, tenant_id: UUID, profile: dict, request: Request):
    if profile["user_id"] == UUID(claims["sub"]):
        return
    await _authorize(claims, tenant_id, "profile.manage", request, UUID(str(profile["id"])))


async def _enqueue_workforce_notification(connection, tenant_id: UUID, profile_id: UUID, event_type: str, payload: dict):
    result = await connection.execute(text("""
      select u.email from public.workforce_profiles p join auth.users u on u.id=p.user_id
      where p.tenant_id=:tenant and p.id=:profile
    """), {"tenant":tenant_id,"profile":profile_id})
    recipient = result.scalar_one_or_none()
    if not recipient:
        return
    await connection.execute(text("""
      insert into public.notification_outbox(event_type,aggregate_type,aggregate_id,recipient_email,payload,status,available_at)
      values(:event,'workforce_profile',:profile,:recipient,cast(:payload as jsonb),'pending',now())
    """), {"event":event_type,"profile":profile_id,"recipient":recipient,
           "payload":json.dumps({"tenant_id":str(tenant_id),"workforce_profile_id":str(profile_id),**payload},default=str)})

@router.get("/passport")
async def get_my_passport(tenant_id: UUID, request: Request, claims: dict = claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,tenant_id,"profile.read",request)
    async with engine.connect() as connection:
        result=await connection.execute(text("""
          select p.* from public.workforce_profiles p
          join public.memberships m on m.id=p.membership_id and m.tenant_id=p.tenant_id
          where p.tenant_id=:tenant and p.user_id=:actor and m.user_id=:actor and m.status='active'
        """),{"tenant":tenant_id,"actor":actor})
        row=result.mappings().first()
        if not row:
            raise HTTPException(status_code=404,detail="Workforce Passport belum tersedia.")
        profile=dict(row)
        queries = {
            "identity_verifications": """
              select id,status,verification_type,submitted_at,reviewed_at,rejection_reason,expires_at
              from public.workforce_identity_verifications
              where tenant_id=:tenant and workforce_profile_id=:profile order by submitted_at desc limit 50
            """,
            "identity_documents": """
              select d.id,d.verification_id,d.document_type,d.original_filename,d.content_type,
                     d.file_size_bytes,d.scan_status,d.retention_until,d.redacted_at,d.created_at
              from public.workforce_identity_documents d
              join public.workforce_identity_verifications v on v.id=d.verification_id and v.tenant_id=d.tenant_id
              where d.tenant_id=:tenant and v.workforce_profile_id=:profile
              order by d.created_at desc limit 50
            """,
            "engagements": """
              select e.*,c.contract_number,c.title as contract_title,c.status as contract_status
              from public.workforce_engagements e
              left join public.contracts c on c.id=e.contract_id and c.tenant_id=e.tenant_id
              where e.tenant_id=:tenant and e.workforce_profile_id=:profile
              order by e.effective_from desc
            """,
            "engagement_history": """
              select * from public.workforce_engagement_events
              where tenant_id=:tenant and workforce_profile_id=:profile order by occurred_at desc limit 100
            """,
            "skills": """
              select ws.*,s.skill_key,s.name as skill_name,s.category
              from public.workforce_worker_skills ws
              join public.workforce_skill_registry s on s.id=ws.skill_id
              where ws.tenant_id=:tenant and ws.workforce_profile_id=:profile
              order by s.category,s.name
            """,
            "certifications": """
              select c.*,s.skill_key,s.name as skill_name
              from public.workforce_certifications c
              left join public.workforce_skill_registry s on s.id=c.skill_id
              where c.tenant_id=:tenant and c.workforce_profile_id=:profile
              order by c.expires_at nulls last,c.name
            """,
            "availability": """
              select * from public.workforce_availability
              where tenant_id=:tenant and workforce_profile_id=:profile
              order by starts_at desc limit 100
            """,
            "training": """
              select e.*,c.course_key,c.title as course_title,c.validity_days
              from public.workforce_training_enrollments e
              join public.workforce_training_courses c on c.id=e.course_id
              where e.tenant_id=:tenant and e.workforce_profile_id=:profile
              order by e.enrolled_at desc
            """,
            "assignments": """
              select * from public.workforce_assignments
              where tenant_id=:tenant and workforce_profile_id=:profile
              order by starts_at desc limit 100
            """,
            "onboarding": """
              select * from public.workforce_onboarding_tasks
              where tenant_id=:tenant and workforce_profile_id=:profile
              order by created_at
            """,
            "history": """
              select * from public.workforce_lifecycle_events
              where tenant_id=:tenant and workforce_profile_id=:profile
              order by occurred_at desc limit 100
            """,
        }
        for key, query in queries.items():
            rows=await connection.execute(text(query),{"tenant":tenant_id,"profile":profile["id"]})
            profile[key]=[dict(item) for item in rows.mappings().all()]
        return {"data":profile}

@router.get("/profiles")
async def list_profiles(tenant_id: UUID, request: Request, status: str | None = None, limit: int = Query(50,ge=1,le=100), claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"profile.directory",request)
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select id,tenant_id,user_id,membership_id,worker_code,display_name,job_family,job_title,lifecycle_status,engagement_status,experience_years,created_at,updated_at
          from public.workforce_profiles where tenant_id=:tenant and (:status is null or lifecycle_status=:status)
          order by created_at desc,id desc limit :limit
        """),{"tenant":tenant_id,"status":status,"limit":limit})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/profiles",status_code=201)
async def create_profile(payload: ProfileCreate, request: Request, claims: dict = claims_dependency, idempotency_key: str | None = Header(default=None,alias="Idempotency-Key")):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"profile.manage",request)
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection, actor_user_id=actor, tenant_id=payload.tenant_id,
            command_key="workforce.profile.create", idempotency_key=idempotency_key,
            payload=payload.model_dump(),
        )
        if reservation.replay:
            return reservation.replay_body
        membership=await connection.execute(text("select id,status from public.memberships where id=:id and tenant_id=:tenant and user_id=:user and status in ('invited','active')"),{"id":payload.membership_id,"tenant":payload.tenant_id,"user":payload.user_id})
        membership_row=membership.mappings().first()
        if not membership_row:
            raise HTTPException(status_code=422,detail="Membership tidak valid untuk tenant dan user.")
        initial_status = "invited" if membership_row["status"] == "invited" else "registered"
        row=await connection.execute(text("""
          insert into public.workforce_profiles(tenant_id,user_id,membership_id,worker_code,display_name,legal_name,job_family,job_title,timezone,locale,experience_years,profile_metadata,lifecycle_status,created_by,updated_by)
          values(:tenant,:user,:membership,:code,:name,:legal,:family,:title,:timezone,:locale,:experience,cast(:metadata as jsonb),:status,:actor,:actor)
          returning *
        """),{"tenant":payload.tenant_id,"user":payload.user_id,"membership":payload.membership_id,"code":payload.worker_code,"name":payload.display_name,"legal":payload.legal_name,"family":payload.job_family,"title":payload.job_title,"timezone":payload.timezone,"locale":payload.locale,"experience":payload.experience_years,"metadata":json.dumps(payload.profile_metadata),"status":initial_status,"actor":actor})
        profile=dict(row.mappings().one())
        await connection.execute(text("""
          insert into public.workforce_lifecycle_events(tenant_id,workforce_profile_id,from_status,to_status,actor_user_id,reason,permission_key,request_id,metadata)
          values(:tenant,:profile,null,:status,:actor,'Workforce profile invited or registered','workforce.profile.manage',:request,cast(:metadata as jsonb))
        """),{"tenant":payload.tenant_id,"profile":profile["id"],"status":initial_status,"actor":actor,"request":getattr(request.state,"request_id",None),"metadata":json.dumps({"idempotency_key":idempotency_key})})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.profile.created","workforce_profile",profile["id"],request)
        response = {"data":profile}
        await complete_idempotency(
            connection, record_id=reservation.record_id, response_status=201,
            response_body=response,
        )
        return response

@router.patch("/profiles/{profile_id}")
async def update_profile(profile_id: UUID,payload: ProfilePatch,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"profile.manage",request,profile_id)
    fields=payload.model_dump(exclude={"tenant_id"},exclude_unset=True)
    if not fields: raise HTTPException(status_code=422,detail="Tidak ada field untuk diperbarui.")
    allowed={"display_name","legal_name","job_family","job_title","timezone","experience_years","profile_metadata"}
    if set(fields)-allowed: raise HTTPException(status_code=422,detail="Field tidak diizinkan.")
    assignments=", ".join(f"{key}=:{key}" for key in fields)
    params={**fields,"tenant":payload.tenant_id,"id":profile_id,"actor":actor}
    if "profile_metadata" in params: params["profile_metadata"]=json.dumps(params["profile_metadata"])
    async with engine.begin() as connection:
        result=await connection.execute(text(f"update public.workforce_profiles set {assignments},updated_by=:actor,updated_at=now() where tenant_id=:tenant and id=:id returning *"),params)
        row=result.mappings().first()
        if not row: raise HTTPException(status_code=404,detail="Workforce profile tidak ditemukan.")
        await _write_audit(connection,payload.tenant_id,actor,"workforce.profile.updated","workforce_profile",profile_id,request,{"fields":sorted(fields)})
        return {"data":dict(row)}

@router.post("/profiles/{profile_id}/identity",status_code=201)
async def submit_identity(profile_id: UUID,payload: VerificationInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"identity.submit",request,profile_id)
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        old_status=profile["lifecycle_status"]
        if old_status not in ("registered","identity_pending"):
            raise HTTPException(status_code=409,detail="Status lifecycle tidak mengizinkan pengajuan verifikasi identitas.")
        row=await connection.execute(text("""
          insert into public.workforce_identity_verifications(tenant_id,workforce_profile_id,verification_type,document_metadata)
          values(:tenant,:profile,:type,cast(:metadata as jsonb)) returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"type":payload.verification_type,"metadata":"[]"})
        verification=dict(row.mappings().one())
        if old_status != "identity_pending":
            await connection.execute(text("update public.workforce_profiles set lifecycle_status='identity_pending',updated_by=:actor,updated_at=now() where id=:id and tenant_id=:tenant"),{"actor":actor,"id":profile_id,"tenant":payload.tenant_id})
            await connection.execute(text("""
              insert into public.workforce_lifecycle_events(tenant_id,workforce_profile_id,from_status,to_status,actor_user_id,reason,permission_key,request_id)
              values(:tenant,:profile,:from_status,'identity_pending',:actor,'Identity verification submitted','workforce.identity.submit',:request)
            """),{"tenant":payload.tenant_id,"profile":profile_id,"from_status":old_status,"actor":actor,"request":getattr(request.state,"request_id",None)})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.identity.submitted","workforce_identity_verification",verification["id"],request)
        await _enqueue_workforce_notification(connection,payload.tenant_id,profile_id,"workforce.identity.submitted",{"verification_id":str(verification["id"])})
        return {"data":verification}

@router.post("/identity/{verification_id}/decision")
async def decide_identity(verification_id: UUID,payload: VerificationDecision,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"identity.review",request,verification_id)
    async with engine.begin() as connection:
        existing=await connection.execute(text("select * from public.workforce_identity_verifications where tenant_id=:tenant and id=:id for update"),{"tenant":payload.tenant_id,"id":verification_id})
        verification=existing.mappings().first()
        if not verification: raise HTTPException(status_code=404,detail="Verifikasi tidak ditemukan.")
        if verification["status"] in ("verified","rejected"): raise HTTPException(status_code=409,detail="Keputusan verifikasi sudah final.")
        if payload.decision == "verified":
            evidence = await connection.execute(text("""
              select exists(select 1 from public.workforce_identity_documents
                where tenant_id=:tenant and verification_id=:verification and scan_status='clean' and redacted_at is null)
            """), {"tenant":payload.tenant_id,"verification":verification_id})
            if not evidence.scalar_one():
                raise HTTPException(status_code=409,detail="Minimal satu dokumen identitas bersih wajib tersedia sebelum verifikasi.")
        reason=payload.reason if payload.decision=="rejected" else None
        result=await connection.execute(text("""
          update public.workforce_identity_verifications set status=:status,reviewed_by=:actor,reviewed_at=now(),
          rejection_reason=:reason,reviewer_notes=:notes,expires_at=:expires,updated_at=now()
          where id=:id and tenant_id=:tenant returning *
        """),{"status":payload.decision,"actor":actor,"reason":reason,"notes":payload.reviewer_notes,"expires":payload.expires_at,"id":verification_id,"tenant":payload.tenant_id})
        if payload.decision == "verified":
            profile=await _profile(connection,payload.tenant_id,verification["workforce_profile_id"])
            if profile["lifecycle_status"] != "identity_pending":
                raise HTTPException(status_code=409,detail="Profile tidak berada pada identity_pending.")
            await connection.execute(text("update public.workforce_profiles set lifecycle_status='verified',updated_by=:actor,updated_at=now() where id=:profile and tenant_id=:tenant"),{"actor":actor,"profile":verification["workforce_profile_id"],"tenant":payload.tenant_id})
            await connection.execute(text("""
              insert into public.workforce_lifecycle_events(tenant_id,workforce_profile_id,from_status,to_status,actor_user_id,reason,permission_key,request_id)
              values(:tenant,:profile,'identity_pending','verified',:actor,:reason,'workforce.identity.review',:request)
            """),{"tenant":payload.tenant_id,"profile":verification["workforce_profile_id"],"actor":actor,"reason":payload.reason,"request":getattr(request.state,"request_id",None)})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.identity."+payload.decision,"workforce_identity_verification",verification_id,request,{"reason":payload.reason})
        await _enqueue_workforce_notification(connection,payload.tenant_id,verification["workforce_profile_id"],"workforce.identity."+payload.decision,{"reason":payload.reason})
        return {"data":dict(result.mappings().one())}

@router.post("/identity/{verification_id}/documents",status_code=201)
async def register_identity_document(verification_id: UUID,payload: DocumentMetadata,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"identity.submit",request,verification_id)
    expected_prefix=f"{payload.tenant_id}/{verification_id}/"
    if not payload.storage_path.startswith(expected_prefix) or ".." in payload.storage_path:
        raise HTTPException(status_code=422,detail="Storage path tidak sesuai scope tenant/verifikasi.")
    async with engine.begin() as connection:
        verification=await connection.execute(text("select workforce_profile_id from public.workforce_identity_verifications where tenant_id=:tenant and id=:id"),{"tenant":payload.tenant_id,"id":verification_id})
        verification_row=verification.mappings().first()
        if not verification_row: raise HTTPException(status_code=404,detail="Verifikasi tidak ditemukan.")
        profile=await _profile(connection,payload.tenant_id,verification_row["workforce_profile_id"])
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        row=await connection.execute(text("""
          insert into public.workforce_identity_documents(tenant_id,verification_id,storage_path,document_type,original_filename,content_type,file_size_bytes,sha256,retention_until,uploaded_by)
          values(:tenant,:verification,:path,:type,:filename,:mime,:size,:sha,:retention,:actor) returning *
        """),{"tenant":payload.tenant_id,"verification":verification_id,"path":payload.storage_path,"type":payload.document_type,"filename":payload.original_filename,"mime":payload.content_type,"size":payload.file_size_bytes,"sha":payload.sha256,"retention":payload.retention_until,"actor":actor})
        document=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.identity.document_registered","workforce_identity_document",document["id"],request,{"content_type":payload.content_type,"size":payload.file_size_bytes})
        return {"data":document}

@router.post("/documents/{document_id}/download")
async def signed_document_download(document_id: UUID,tenant_id: UUID,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    if not settings.supabase_service_role_key:
        raise HTTPException(status_code=503,detail="Secure document storage belum dikonfigurasi.")
    async with engine.connect() as connection:
        result=await connection.execute(text("""
          select d.storage_bucket,d.storage_path,d.original_filename,d.scan_status,p.user_id
          from public.workforce_identity_documents d
          join public.workforce_identity_verifications v on v.id=d.verification_id and v.tenant_id=d.tenant_id
          join public.workforce_profiles p on p.id=v.workforce_profile_id and p.tenant_id=v.tenant_id
          where d.tenant_id=:tenant and d.id=:id and d.redacted_at is null
            and (d.retention_until is null or d.retention_until>now())
        """),{"tenant":tenant_id,"id":document_id})
        doc=result.mappings().first()
    if not doc or doc["scan_status"]!="clean":
        raise HTTPException(status_code=404,detail="Dokumen tidak tersedia atau belum lolos pemindaian.")
    if doc["user_id"]==actor:
        await _authorize(claims,tenant_id,"identity.submit",request,document_id)
    else:
        await _authorize(claims,tenant_id,"identity.review",request,document_id)
    url=f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/{doc['storage_bucket']}/{quote(doc['storage_path'],safe='/')}"
    headers={"Authorization":f"Bearer {settings.supabase_service_role_key}","apikey":settings.supabase_service_role_key}
    async with httpx.AsyncClient(timeout=15) as client:
        response=await client.post(url,headers=headers,json={"expiresIn":60})
    if response.status_code not in (200,201):
        raise HTTPException(status_code=503,detail="Signed URL dokumen gagal dibuat.")
    signed=response.json().get("signedURL")
    if not signed: raise HTTPException(status_code=503,detail="Signed URL tidak tersedia.")
    if not signed.startswith("http"): signed=f"{settings.supabase_url.rstrip('/')}/storage/v1{signed}"
    async with engine.begin() as connection:
        await _write_audit(connection,tenant_id,actor,"workforce.identity.document_download_authorized","workforce_identity_document",document_id,request,{"expires_in_seconds":60})
    return {"data":{"document_id":str(document_id),"filename":doc["original_filename"],"signed_url":signed,"expires_in_seconds":60}}

@router.post("/documents/{document_id}/redact")
async def redact_identity_document(document_id: UUID,tenant_id: UUID,payload: EngagementApproval,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,tenant_id,"identity.review",request,document_id)
    if not settings.supabase_service_role_key:
        raise HTTPException(status_code=503,detail="Secure document storage belum dikonfigurasi.")
    async with engine.connect() as connection:
        result=await connection.execute(text("""
          select storage_bucket,storage_path from public.workforce_identity_documents
          where tenant_id=:tenant and id=:id and redacted_at is null
        """),{"tenant":tenant_id,"id":document_id})
        doc=result.mappings().first()
    if not doc: raise HTTPException(status_code=404,detail="Dokumen tidak ditemukan atau sudah di-redact.")
    object_url=f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{doc['storage_bucket']}/{quote(doc['storage_path'],safe='/')}"
    headers={"Authorization":f"Bearer {settings.supabase_service_role_key}","apikey":settings.supabase_service_role_key}
    async with httpx.AsyncClient(timeout=15) as client:
        response=await client.delete(object_url,headers=headers)
    if response.status_code not in (200,204,404):
        raise HTTPException(status_code=503,detail="Penghapusan object storage gagal; metadata tidak diubah.")
    async with engine.begin() as connection:
        await connection.execute(text("update public.workforce_identity_documents set redacted_at=now() where tenant_id=:tenant and id=:id"),{"tenant":tenant_id,"id":document_id})
        await _write_audit(connection,tenant_id,actor,"workforce.identity.document_redacted","workforce_identity_document",document_id,request,{"reason":payload.reason})
    return {"data":{"document_id":str(document_id),"redacted":True}}

@router.get("/profiles/{profile_id}/engagements")
async def list_engagements(profile_id: UUID,tenant_id: UUID,request: Request,claims: dict=claims_dependency):
    await _authorize(claims,tenant_id,"engagement.read",request,profile_id)
    async with engine.connect() as connection:
        profile=await _profile(connection,tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,tenant_id,profile,request)
        rows=await connection.execute(text("select * from public.workforce_engagements where tenant_id=:tenant and workforce_profile_id=:profile order by effective_from desc"),{"tenant":tenant_id,"profile":profile_id})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/profiles/{profile_id}/engagements",status_code=201)
async def create_engagement(profile_id: UUID,payload: EngagementInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"engagement.manage",request,profile_id)
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        if payload.contract_id:
            contract=await connection.execute(text("""
              select contract_number,status from public.contracts
              where id=:contract and tenant_id=:tenant
            """),{"contract":payload.contract_id,"tenant":payload.tenant_id})
            contract_row=contract.mappings().first()
            if not contract_row or contract_row["status"] not in ("approved","active"):
                raise HTTPException(status_code=422,detail="Contract harus approved/active dan dimiliki tenant.")
            if payload.agreement_reference not in (contract_row["contract_number"],str(payload.contract_id)):
                raise HTTPException(status_code=422,detail="Agreement reference harus cocok dengan contract number atau ID.")
        superseded=await connection.execute(text("""
          update public.workforce_engagements set status='superseded',updated_at=now()
          where tenant_id=:tenant and workforce_profile_id=:profile and status in ('pending','active')
          returning id,status
        """),{"tenant":payload.tenant_id,"profile":profile_id})
        for previous in superseded.mappings().all():
            await connection.execute(text("""
              insert into public.workforce_engagement_events(tenant_id,engagement_id,workforce_profile_id,event_type,from_status,to_status,actor_user_id,reason)
              values(:tenant,:engagement,:profile,'superseded',:from_status,'superseded',:actor,:reason)
            """),{"tenant":payload.tenant_id,"engagement":previous["id"],"profile":profile_id,"from_status":previous["status"],"actor":actor,"reason":payload.change_reason})
        row=await connection.execute(text("""
          insert into public.workforce_engagements(tenant_id,workforce_profile_id,contract_id,classification,agreement_reference,effective_from,effective_until,legal_review_reference,facts_acknowledged,change_reason,created_by)
          values(:tenant,:profile,:contract,:classification,:agreement,:start,:end,:legal,:facts,:reason,:actor) returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"contract":payload.contract_id,"classification":payload.classification,"agreement":payload.agreement_reference,"start":payload.effective_from,"end":payload.effective_until,"legal":payload.legal_review_reference,"facts":payload.facts_acknowledged,"reason":payload.change_reason,"actor":actor})
        engagement=dict(row.mappings().one())
        await connection.execute(text("update public.workforce_profiles set engagement_status='pending',updated_at=now() where tenant_id=:tenant and id=:profile"),{"tenant":payload.tenant_id,"profile":profile_id})
        await connection.execute(text("""
          insert into public.workforce_engagement_events(tenant_id,engagement_id,workforce_profile_id,event_type,from_status,to_status,actor_user_id,reason,metadata)
          values(:tenant,:engagement,:profile,'created',null,'pending',:actor,:reason,cast(:metadata as jsonb))
        """),{"tenant":payload.tenant_id,"engagement":engagement["id"],"profile":profile_id,"actor":actor,"reason":payload.change_reason,"metadata":json.dumps({"classification":payload.classification,"agreement_reference":payload.agreement_reference})})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.engagement.created","workforce_engagement",engagement["id"],request,{"classification":payload.classification,"reason":payload.change_reason})
        return {"data":engagement}

@router.get("/skills")
async def list_skills(tenant_id: UUID,request: Request,claims: dict=claims_dependency):
    await _authorize(claims,tenant_id,"skills.read",request)
    async with engine.connect() as connection:
        rows=await connection.execute(text("select * from public.workforce_skill_registry where tenant_id is null or tenant_id=:tenant order by category,name"),{"tenant":tenant_id})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/skills",status_code=201)
async def create_skill(payload: SkillInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"skills.manage",request)
    async with engine.begin() as connection:
        row=await connection.execute(text("insert into public.workforce_skill_registry(tenant_id,skill_key,name,category,description) values(:tenant,:key,:name,:category,:description) returning *"),{"tenant":payload.tenant_id,"key":payload.skill_key,"name":payload.name,"category":payload.category,"description":payload.description})
        skill=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.skill.created","workforce_skill",skill["id"],request)
        return {"data":skill}

@router.post("/profiles/{profile_id}/skills",status_code=201)
async def add_worker_skill(profile_id: UUID,payload: WorkerSkillInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"skills.read",request,profile_id)
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        valid=await connection.execute(text("select exists(select 1 from public.workforce_skill_registry where id=:skill and (tenant_id is null or tenant_id=:tenant) and status='active')"),{"skill":payload.skill_id,"tenant":payload.tenant_id})
        if not valid.scalar_one(): raise HTTPException(status_code=422,detail="Skill registry tidak valid.")
        row=await connection.execute(text("""
          insert into public.workforce_worker_skills(tenant_id,workforce_profile_id,skill_id,proficiency,experience_months,evidence_reference)
          values(:tenant,:profile,:skill,:proficiency,:months,:evidence)
          on conflict(tenant_id,workforce_profile_id,skill_id) do update set proficiency=excluded.proficiency,experience_months=excluded.experience_months,evidence_reference=excluded.evidence_reference,updated_at=now()
          returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"skill":payload.skill_id,"proficiency":payload.proficiency,"months":payload.experience_months,"evidence":payload.evidence_reference})
        skill_record=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.profile.skill_submitted","workforce_worker_skill",skill_record["id"],request)
        return {"data":skill_record}

@router.post("/profiles/{profile_id}/certifications",status_code=201)
async def add_certification(profile_id: UUID,payload: CertificationInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"skills.read",request,profile_id)
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        row=await connection.execute(text("""
          insert into public.workforce_certifications(tenant_id,workforce_profile_id,skill_id,name,issuer,certificate_reference,issued_at,valid_from,expires_at,evidence_metadata)
          values(:tenant,:profile,:skill,:name,:issuer,:reference,:issued,:valid,:expires,cast(:evidence as jsonb)) returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"skill":payload.skill_id,"name":payload.name,"issuer":payload.issuer,"reference":payload.certificate_reference,"issued":payload.issued_at,"valid":payload.valid_from,"expires":payload.expires_at,"evidence":json.dumps(payload.evidence_metadata)})
        cert=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.certification.submitted","workforce_certification",cert["id"],request)
        return {"data":cert}

@router.post("/certifications/{certification_id}/verify")
async def verify_certification(certification_id: UUID,tenant_id: UUID,decision: str=Query(pattern="^(verified|rejected)$"),reason: str=Query(min_length=3,max_length=2000),request: Request=None,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,tenant_id,"certifications.verify",request,certification_id)
    async with engine.begin() as connection:
        result=await connection.execute(text("""
          update public.workforce_certifications set verification_status=:decision,verified_by=:actor,verified_at=now(),rejection_reason=:reason,updated_at=now()
          where tenant_id=:tenant and id=:id and verification_status='pending' and (expires_at is null or expires_at>=current_date) returning *
        """),{"decision":decision,"actor":actor,"reason":reason if decision=="rejected" else None,"tenant":tenant_id,"id":certification_id})
        row=result.mappings().first()
        if not row: raise HTTPException(status_code=404,detail="Sertifikasi tidak ditemukan atau sudah diputuskan.")
        await _write_audit(connection,tenant_id,actor,"workforce.certification."+decision,"workforce_certification",certification_id,request,{"reason":reason})
        return {"data":dict(row)}

@router.get("/profiles/{profile_id}/availability")
async def list_availability(profile_id: UUID,tenant_id: UUID,starts_at: datetime | None=None,ends_at: datetime | None=None,request: Request=None,claims: dict=claims_dependency):
    await _authorize(claims,tenant_id,"availability.read",request,profile_id)
    async with engine.connect() as connection:
        profile=await _profile(connection,tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,tenant_id,profile,request)
        rows=await connection.execute(text("""
          select * from public.workforce_availability where tenant_id=:tenant and workforce_profile_id=:profile and status='active'
          and (:start is null or ends_at>:start) and (:end is null or starts_at<:end) order by starts_at
        """),{"tenant":tenant_id,"profile":profile_id,"start":starts_at,"end":ends_at})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/profiles/{profile_id}/availability",status_code=201)
async def create_availability(profile_id: UUID,payload: AvailabilityInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"availability.manage",request,profile_id)
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        conflict=await connection.execute(text("""
          select exists(select 1 from public.workforce_availability where tenant_id=:tenant and workforce_profile_id=:profile and status='active'
            and availability_type in ('unavailable','leave') and :start < ends_at and :end > starts_at)
        """),{"tenant":payload.tenant_id,"profile":profile_id,"start":payload.starts_at,"end":payload.ends_at})
        if payload.availability_type in ("working_hours","preferred_shift") and conflict.scalar_one():
            raise HTTPException(status_code=409,detail="Availability berbenturan dengan leave/unavailable period.")
        if payload.availability_type in ("unavailable","leave"):
            assignment_conflict=await connection.execute(text("""
              select exists(select 1 from public.workforce_assignments
                where tenant_id=:tenant and workforce_profile_id=:profile and status in ('scheduled','active')
                  and :start < coalesce(ends_at,'infinity'::timestamptz) and :end > starts_at)
            """),{"tenant":payload.tenant_id,"profile":profile_id,"start":payload.starts_at,"end":payload.ends_at})
            if assignment_conflict.scalar_one():
                raise HTTPException(status_code=409,detail="Leave/unavailable period berbenturan dengan assignment aktif/terjadwal.")
        row=await connection.execute(text("""
          insert into public.workforce_availability(tenant_id,workforce_profile_id,availability_type,starts_at,ends_at,timezone,recurrence_rule,reason,created_by)
          values(:tenant,:profile,:type,:start,:end,:timezone,:recurrence,:reason,:actor) returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"type":payload.availability_type,"start":payload.starts_at,"end":payload.ends_at,"timezone":payload.timezone,"recurrence":payload.recurrence_rule,"reason":payload.reason,"actor":actor})
        record=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.availability.created","workforce_availability",record["id"],request)
        return {"data":record}

@router.get("/training/courses")
async def list_courses(tenant_id: UUID,request: Request,claims: dict=claims_dependency):
    await _authorize(claims,tenant_id,"training.read",request)
    async with engine.connect() as connection:
        rows=await connection.execute(text("select * from public.workforce_training_courses where status='published' and (tenant_id is null or tenant_id=:tenant) order by title"),{"tenant":tenant_id})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/training/courses",status_code=201)
async def create_course(payload: CourseInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    if payload.tenant_id is None: raise HTTPException(status_code=422,detail="Tenant-scoped course creation requires tenant_id.")
    await _authorize(claims,payload.tenant_id,"training.manage",request)
    async with engine.begin() as connection:
        row=await connection.execute(text("""
          insert into public.workforce_training_courses(tenant_id,course_key,title,description,materials,assessment,eligibility_rules,validity_days,status,created_by)
          values(:tenant,:key,:title,:description,cast(:materials as jsonb),cast(:assessment as jsonb),cast(:rules as jsonb),:validity,:status,:actor) returning *
        """),{"tenant":payload.tenant_id,"key":payload.course_key,"title":payload.title,"description":payload.description,"materials":json.dumps(payload.materials),"assessment":json.dumps(payload.assessment),"rules":json.dumps(payload.eligibility_rules),"validity":payload.validity_days,"status":payload.status,"actor":actor})
        return {"data":dict(row.mappings().one())}

@router.post("/profiles/{profile_id}/training/enroll",status_code=201)
async def enroll_training(profile_id: UUID,payload: EnrollmentInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"training.read",request,profile_id)
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        course=await connection.execute(text("select id,eligibility_rules from public.workforce_training_courses where id=:id and status='published' and (tenant_id is null or tenant_id=:tenant)"),{"id":payload.course_id,"tenant":payload.tenant_id})
        course_row=course.mappings().first()
        if not course_row: raise HTTPException(status_code=404,detail="Training course tidak tersedia.")
        rules=course_row["eligibility_rules"] or {}
        if rules.get("required_lifecycle_statuses") and profile["lifecycle_status"] not in rules["required_lifecycle_statuses"]:
            raise HTTPException(status_code=403,detail="Lifecycle status belum memenuhi eligibility course.")
        if rules.get("required_job_families") and profile["job_family"] not in rules["required_job_families"]:
            raise HTTPException(status_code=403,detail="Job family belum memenuhi eligibility course.")
        required_skills=rules.get("required_skills",[])
        if required_skills:
            skill_check=await connection.execute(text("""
              select count(distinct s.skill_key) from public.workforce_worker_skills ws
              join public.workforce_skill_registry s on s.id=ws.skill_id
              where ws.tenant_id=:tenant and ws.workforce_profile_id=:profile and s.skill_key=any(:skills)
            """),{"tenant":payload.tenant_id,"profile":profile_id,"skills":required_skills})
            if skill_check.scalar_one()<len(set(required_skills)):
                raise HTTPException(status_code=403,detail="Skill prerequisite belum terpenuhi.")
        required_classes=rules.get("required_classifications",[])
        if required_classes:
            class_check=await connection.execute(text("""
              select exists(select 1 from public.workforce_engagements
                where tenant_id=:tenant and workforce_profile_id=:profile and status='active'
                  and classification=any(:classes))
            """),{"tenant":payload.tenant_id,"profile":profile_id,"classes":required_classes})
            if not class_check.scalar_one():
                raise HTTPException(status_code=403,detail="Engagement classification belum memenuhi eligibility course.")
        row=await connection.execute(text("""
          insert into public.workforce_training_enrollments(tenant_id,workforce_profile_id,course_id)
          values(:tenant,:profile,:course) on conflict(tenant_id,workforce_profile_id,course_id) do update set status='enrolled',updated_at=now()
          returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"course":payload.course_id})
        record=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.training.enrolled","workforce_training_enrollment",record["id"],request)
        return {"data":record}

@router.patch("/training/enrollments/{enrollment_id}")
async def update_training_progress(enrollment_id: UUID,payload: ProgressInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"training.read",request,enrollment_id)
    async with engine.begin() as connection:
        existing=await connection.execute(text("""
          select e.*,c.validity_days,c.assessment,p.id as profile_id,p.user_id from public.workforce_training_enrollments e
          join public.workforce_training_courses c on c.id=e.course_id
          join public.workforce_profiles p on p.id=e.workforce_profile_id and p.tenant_id=e.tenant_id
          where e.tenant_id=:tenant and e.id=:id for update
        """),{"tenant":payload.tenant_id,"id":enrollment_id})
        enrollment=existing.mappings().first()
        if not enrollment: raise HTTPException(status_code=404,detail="Enrollment tidak ditemukan.")
        profile=await _profile(connection,payload.tenant_id,enrollment["profile_id"])
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        if enrollment["status"] in ("completed","cancelled","expired"): raise HTTPException(status_code=409,detail="Enrollment sudah final.")
        assessment_rules=enrollment["assessment"] or {}
        pass_score=float(assessment_rules.get("pass_score",70))
        complete=payload.progress_percent==100 and payload.assessment_score is not None and payload.assessment_score>=pass_score
        if payload.progress_percent==100 and not complete: raise HTTPException(status_code=422,detail=f"Assessment score minimal {pass_score:g} diperlukan untuk completion.")
        expiry=None
        if complete and enrollment["validity_days"]: expiry=datetime.now(timezone.utc)+__import__("datetime").timedelta(days=enrollment["validity_days"])
        row=await connection.execute(text("""
          update public.workforce_training_enrollments set progress_percent=:progress,assessment_score=:score,assessment_result=cast(:result as jsonb),
          status=:status,completed_at=case when :complete then now() else completed_at end,certificate_reference=coalesce(:certificate,certificate_reference),
          certificate_expires_at=:expiry,updated_at=now() where tenant_id=:tenant and id=:id returning *
        """),{"progress":payload.progress_percent,"score":payload.assessment_score,"result":json.dumps(payload.assessment_result),"status":"completed" if complete else "in_progress","complete":complete,"certificate":payload.certificate_reference,"expiry":expiry,"tenant":payload.tenant_id,"id":enrollment_id})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.training.progress_updated","workforce_training_enrollment",enrollment_id,request,{"progress":payload.progress_percent,"completed":complete})
        return {"data":dict(row.mappings().one())}

@router.get("/profiles/{profile_id}/onboarding")
async def list_onboarding(profile_id: UUID,tenant_id: UUID,request: Request,claims: dict=claims_dependency):
    await _authorize(claims,tenant_id,"onboarding.read",request,profile_id)
    async with engine.connect() as connection:
        profile=await _profile(connection,tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,tenant_id,profile,request)
        rows=await connection.execute(text("select * from public.workforce_onboarding_tasks where tenant_id=:tenant and workforce_profile_id=:profile order by created_at"),{"tenant":tenant_id,"profile":profile_id})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/profiles/{profile_id}/onboarding",status_code=201)
async def add_onboarding_task(profile_id: UUID,payload: OnboardingTaskInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"onboarding.manage",request,profile_id)
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        row=await connection.execute(text("""
          insert into public.workforce_onboarding_tasks(tenant_id,workforce_profile_id,task_key,title,description,required,task_type,assigned_to,due_at)
          values(:tenant,:profile,:key,:title,:description,:required,:type,:assignee,:due) returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"key":payload.task_key,"title":payload.title,"description":payload.description,"required":payload.required,"type":payload.task_type,"assignee":payload.assigned_to,"due":payload.due_at})
        record=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.onboarding.task_created","workforce_onboarding_task",record["id"],request)
        return {"data":record}

@router.patch("/onboarding/tasks/{task_id}")
async def update_onboarding_task(task_id: UUID,payload: TaskCompletion,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    async with engine.begin() as connection:
        task_scope=await connection.execute(text("select workforce_profile_id,task_type,required from public.workforce_onboarding_tasks where tenant_id=:tenant and id=:id"),{"tenant":payload.tenant_id,"id":task_id})
        task_scope_row=task_scope.mappings().first()
        if not task_scope_row: raise HTTPException(status_code=404,detail="Onboarding task tidak ditemukan.")
        manager_only=task_scope_row["task_type"] in ("approval","verification") or payload.status in ("waived","blocked")
        await _authorize(claims,payload.tenant_id,"onboarding.manage" if manager_only else "onboarding.read",request,task_id)
        profile=await _profile(connection,payload.tenant_id,task_scope_row["workforce_profile_id"])
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        if payload.status=="completed" and task_scope_row["task_type"] in ("document","agreement_acknowledgement") and not payload.completion_reference:
            raise HTTPException(status_code=422,detail="Completion reference wajib untuk dokumen dan acknowledgement.")
        if payload.status=="completed" and task_scope_row["task_type"]=="training":
            if not payload.completion_reference:
                raise HTTPException(status_code=422,detail="Course ID wajib sebagai completion reference.")
            training=await connection.execute(text("""
              select exists(select 1 from public.workforce_training_enrollments
                where tenant_id=:tenant and workforce_profile_id=:profile and course_id=cast(:course as uuid)
                  and status='completed' and (certificate_expires_at is null or certificate_expires_at>=now()))
            """),{"tenant":payload.tenant_id,"profile":profile["id"],"course":payload.completion_reference})
            if not training.scalar_one():
                raise HTTPException(status_code=409,detail="Training belum completed atau certificate sudah expired.")
        row=await connection.execute(text("""
          update public.workforce_onboarding_tasks set status=:status,completed_by=case when :status in ('completed','waived') then :actor else completed_by end,
          completed_at=case when :status in ('completed','waived') then now() else null end,completion_reference=:reference,reason=:reason,updated_at=now()
          where tenant_id=:tenant and id=:id returning *
        """),{"status":payload.status,"actor":actor,"reference":payload.completion_reference,"reason":payload.reason,"tenant":payload.tenant_id,"id":task_id})
        task=row.mappings().first()
        if not task: raise HTTPException(status_code=404,detail="Onboarding task tidak ditemukan.")
        await _write_audit(connection,payload.tenant_id,actor,"workforce.onboarding.task_"+payload.status,"workforce_onboarding_task",task_id,request,{"reason":payload.reason})
        return {"data":dict(task)}

@router.post("/profiles/{profile_id}/lifecycle")
async def transition_lifecycle(profile_id: UUID,payload: LifecycleTransition,request: Request,claims: dict=claims_dependency,idempotency_key: str | None=Header(default=None,alias="Idempotency-Key")):
    actor=UUID(claims["sub"])
    if payload.to_status not in LIFECYCLE: raise HTTPException(status_code=422,detail="Lifecycle status tidak valid.")
    await _authorize(claims,payload.tenant_id,"lifecycle.transition",request,profile_id)
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection, actor_user_id=actor, tenant_id=payload.tenant_id,
            command_key=f"workforce.lifecycle.{profile_id}", idempotency_key=idempotency_key,
            payload=payload.model_dump(),
        )
        if reservation.replay:
            return reservation.replay_body
        current=await connection.execute(text("select * from public.workforce_profiles where tenant_id=:tenant and id=:id for update"),{"tenant":payload.tenant_id,"id":profile_id})
        profile=current.mappings().first()
        if not profile: raise HTTPException(status_code=404,detail="Workforce profile tidak ditemukan.")
        await _assert_profile_scope(connection,claims,payload.tenant_id,dict(profile),request)
        old=profile["lifecycle_status"]; target=payload.to_status
        if target not in TRANSITIONS[old]: raise HTTPException(status_code=409,detail=f"Transisi {old} ke {target} tidak diizinkan.")
        if target=="verified":
            ok=await connection.execute(text("select exists(select 1 from public.workforce_identity_verifications where tenant_id=:tenant and workforce_profile_id=:profile and status='verified')"),{"tenant":payload.tenant_id,"profile":profile_id})
            if not ok.scalar_one(): raise HTTPException(status_code=409,detail="Identity verification belum verified.")
        if target in ("eligible","active"):
            tasks=await connection.execute(text("select count(*) from public.workforce_onboarding_tasks where tenant_id=:tenant and workforce_profile_id=:profile and required and status not in ('completed','waived')"),{"tenant":payload.tenant_id,"profile":profile_id})
            if tasks.scalar_one()>0: raise HTTPException(status_code=409,detail="Onboarding checklist wajib belum selesai.")
            engagement=await connection.execute(text("select exists(select 1 from public.workforce_engagements where tenant_id=:tenant and workforce_profile_id=:profile and status='active' and effective_from<=current_date and (effective_until is null or effective_until>=current_date))"),{"tenant":payload.tenant_id,"profile":profile_id})
            if not engagement.scalar_one(): raise HTTPException(status_code=409,detail="Engagement agreement aktif belum tersedia.")
        if target=="active" and old!="eligible": raise HTTPException(status_code=409,detail="Activation hanya dapat dilakukan dari status eligible.")
        if target in ("eligible","active"):
            required_training=await connection.execute(text("""
              select count(*) from public.workforce_training_courses c
              where c.status='published' and (c.tenant_id is null or c.tenant_id=:tenant)
                and coalesce(c.eligibility_rules->>'required_for_activation','false')='true'
                and not exists(
                  select 1 from public.workforce_training_enrollments e
                  where e.tenant_id=:tenant and e.workforce_profile_id=:profile and e.course_id=c.id
                    and e.status='completed' and (e.certificate_expires_at is null or e.certificate_expires_at>=now())
                )
            """),{"tenant":payload.tenant_id,"profile":profile_id})
            if required_training.scalar_one()>0:
                raise HTTPException(status_code=409,detail="Training wajib untuk eligibility belum selesai atau sudah kedaluwarsa.")
        if target=="offboarded":
            active_assignments=await connection.execute(text("""
              select count(*) from public.workforce_assignments
              where tenant_id=:tenant and workforce_profile_id=:profile and status in ('scheduled','active')
            """),{"tenant":payload.tenant_id,"profile":profile_id})
            active_engagements=await connection.execute(text("""
              select count(*) from public.workforce_engagements
              where tenant_id=:tenant and workforce_profile_id=:profile and status in ('active','suspended','pending')
            """),{"tenant":payload.tenant_id,"profile":profile_id})
            if active_assignments.scalar_one()>0 or active_engagements.scalar_one()>0:
                raise HTTPException(status_code=409,detail="Offboarding readiness gagal: assignment dan engagement harus ditutup terlebih dahulu.")
        updated=await connection.execute(text("update public.workforce_profiles set lifecycle_status=:target,engagement_status=case when :target='active' then 'active' when :target='offboarded' then 'ended' when :target in ('inactive','suspended') then :target else engagement_status end,updated_by=:actor,updated_at=now() where id=:id and tenant_id=:tenant returning *"),{"target":target,"actor":actor,"id":profile_id,"tenant":payload.tenant_id})
        if target == "suspended":
            rows=await connection.execute(text("""
              update public.workforce_engagements set status='suspended',updated_at=now()
              where tenant_id=:tenant and workforce_profile_id=:profile and status='active'
              returning id
            """),{"tenant":payload.tenant_id,"profile":profile_id})
            for row in rows.mappings().all():
                await connection.execute(text("""
                  insert into public.workforce_engagement_events(tenant_id,engagement_id,workforce_profile_id,event_type,from_status,to_status,actor_user_id,reason)
                  values(:tenant,:engagement,:profile,'suspended','active','suspended',:actor,:reason)
                """),{"tenant":payload.tenant_id,"engagement":row["id"],"profile":profile_id,"actor":actor,"reason":payload.reason})
        await connection.execute(text("""
          insert into public.workforce_lifecycle_events(tenant_id,workforce_profile_id,from_status,to_status,actor_user_id,reason,permission_key,request_id,metadata)
          values(:tenant,:profile,:old,:new,:actor,:reason,'workforce.lifecycle.transition',:request,cast(:metadata as jsonb))
        """),{"tenant":payload.tenant_id,"profile":profile_id,"old":old,"new":target,"actor":actor,"reason":payload.reason,"request":getattr(request.state,"request_id",None),"metadata":json.dumps({**payload.metadata,"idempotency_key":idempotency_key})})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.lifecycle.transitioned","workforce_profile",profile_id,request,{"from":old,"to":target,"reason":payload.reason})
        await _enqueue_workforce_notification(connection,payload.tenant_id,profile_id,"workforce.lifecycle."+target,{"from_status":old,"to_status":target,"reason":payload.reason})
        response = {"data":dict(updated.mappings().one())}
        await complete_idempotency(
            connection, record_id=reservation.record_id, response_status=200,
            response_body=response,
        )
        return response

@router.get("/profiles/{profile_id}/assignments")
async def list_assignments(profile_id: UUID,tenant_id: UUID,request: Request,claims: dict=claims_dependency):
    await _authorize(claims,tenant_id,"assignments.read",request,profile_id)
    async with engine.connect() as connection:
        profile=await _profile(connection,tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,tenant_id,profile,request)
        rows=await connection.execute(text("select * from public.workforce_assignments where tenant_id=:tenant and workforce_profile_id=:profile order by starts_at desc limit 100"),{"tenant":tenant_id,"profile":profile_id})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/profiles/{profile_id}/assignments",status_code=201)
async def create_assignment(profile_id: UUID,payload: AssignmentInput,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"assignments.manage",request,profile_id)
    if payload.starts_at.tzinfo is None or (payload.ends_at and payload.ends_at.tzinfo is None): raise HTTPException(status_code=422,detail="Assignment timestamps must include timezone offsets.")
    async with engine.begin() as connection:
        profile=await _profile(connection,payload.tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        conflicts=await connection.execute(text("""
          select exists(select 1 from public.workforce_assignments
            where tenant_id=:tenant and workforce_profile_id=:profile and status in ('scheduled','active')
              and :start < coalesce(ends_at,'infinity'::timestamptz)
              and coalesce(:end,'infinity'::timestamptz) > starts_at)
        """),{"tenant":payload.tenant_id,"profile":profile_id,"start":payload.starts_at,"end":payload.ends_at})
        if conflicts.scalar_one():
            raise HTTPException(status_code=409,detail="Assignment berbenturan dengan penugasan yang sudah terjadwal.")
        availability_conflict=await connection.execute(text("""
          select exists(select 1 from public.workforce_availability
            where tenant_id=:tenant and workforce_profile_id=:profile and status='active'
              and availability_type in ('leave','unavailable')
              and :start < ends_at and coalesce(:end,'infinity'::timestamptz) > starts_at)
        """),{"tenant":payload.tenant_id,"profile":profile_id,"start":payload.starts_at,"end":payload.ends_at})
        if availability_conflict.scalar_one():
            raise HTTPException(status_code=409,detail="Assignment berbenturan dengan leave/unavailable period.")
        row=await connection.execute(text("""
          insert into public.workforce_assignments(tenant_id,workforce_profile_id,assignment_reference,assignment_type,starts_at,ends_at,workload_units,created_by)
          values(:tenant,:profile,:reference,:type,:start,:end,:load,:actor) returning *
        """),{"tenant":payload.tenant_id,"profile":profile_id,"reference":payload.assignment_reference,"type":payload.assignment_type,"start":payload.starts_at,"end":payload.ends_at,"load":payload.workload_units,"actor":actor})
        record=dict(row.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.assignment.created","workforce_assignment",record["id"],request)
        return {"data":record}

@router.get("/profiles/{profile_id}/history")
async def get_workforce_history(profile_id: UUID,tenant_id: UUID,request: Request,claims: dict=claims_dependency):
    await _authorize(claims,tenant_id,"profile.read",request,profile_id)
    async with engine.connect() as connection:
        profile=await _profile(connection,tenant_id,profile_id)
        await _assert_profile_scope(connection,claims,tenant_id,profile,request)
        rows=await connection.execute(text("select * from public.workforce_lifecycle_events where tenant_id=:tenant and workforce_profile_id=:profile order by occurred_at desc limit 200"),{"tenant":tenant_id,"profile":profile_id})
        return {"data":[dict(r) for r in rows.mappings().all()]}

@router.post("/register", status_code=201)
async def register_workforce(
    payload: SelfRegistrationInput,
    request: Request,
    claims: dict = claims_dependency,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    actor = UUID(claims["sub"])
    await _authorize(claims, payload.tenant_id, "identity.submit", request)
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection, actor_user_id=actor, tenant_id=payload.tenant_id,
            command_key="workforce.profile.self_register", idempotency_key=idempotency_key,
            payload=payload.model_dump(),
        )
        if reservation.replay:
            return reservation.replay_body
        membership = await connection.execute(text("""
          select id from public.memberships
          where tenant_id=:tenant and user_id=:actor and status='active'
          order by joined_at desc nulls last limit 1
        """), {"tenant": payload.tenant_id, "actor": actor})
        membership_id = membership.scalar_one_or_none()
        if not membership_id:
            raise HTTPException(status_code=403, detail="Membership Workforce aktif diperlukan untuk registrasi.")
        existing_result = await connection.execute(text("""
          select * from public.workforce_profiles
          where tenant_id=:tenant and user_id=:actor for update
        """), {"tenant":payload.tenant_id,"actor":actor})
        existing = existing_result.mappings().first()
        if existing and existing["lifecycle_status"] != "invited":
            raise HTTPException(status_code=409, detail="Workforce Passport sudah terdaftar.")
        if existing:
            from_status = "invited"
            result = await connection.execute(text("""
              update public.workforce_profiles set membership_id=:membership,worker_code=:code,
                display_name=:name,legal_name=:legal,job_family=:family,job_title=:title,
                timezone=:timezone,experience_years=:experience,lifecycle_status='registered',
                updated_by=:actor,updated_at=now()
              where tenant_id=:tenant and id=:id returning *
            """), {"tenant":payload.tenant_id,"id":existing["id"],"actor":actor,"membership":membership_id,
                   "code":payload.worker_code,"name":payload.display_name,"legal":payload.legal_name,
                   "family":payload.job_family,"title":payload.job_title,"timezone":payload.timezone,
                   "experience":payload.experience_years})
        else:
            from_status = None
            result = await connection.execute(text("""
              insert into public.workforce_profiles(tenant_id,user_id,membership_id,worker_code,display_name,legal_name,job_family,job_title,timezone,experience_years,created_by,updated_by)
              values(:tenant,:actor,:membership,:code,:name,:legal,:family,:title,:timezone,:experience,:actor,:actor)
              returning *
            """), {"tenant":payload.tenant_id,"actor":actor,"membership":membership_id,"code":payload.worker_code,
                   "name":payload.display_name,"legal":payload.legal_name,"family":payload.job_family,
                   "title":payload.job_title,"timezone":payload.timezone,"experience":payload.experience_years})
        profile = dict(result.mappings().one())
        await connection.execute(text("""
          insert into public.workforce_lifecycle_events(tenant_id,workforce_profile_id,from_status,to_status,actor_user_id,reason,permission_key,request_id)
          values(:tenant,:profile,:from_status,'registered',:actor,'Self registration','workforce.identity.submit',:request)
        """), {"tenant":payload.tenant_id,"profile":profile["id"],"from_status":from_status,"actor":actor,"request":getattr(request.state,"request_id",None)})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.profile.self_registered","workforce_profile",profile["id"],request)
        response = {"data":profile}
        await complete_idempotency(
            connection, record_id=reservation.record_id, response_status=201,
            response_body=response,
        )
        return response


@router.get("/identity/verifications")
async def list_identity_verifications(tenant_id: UUID, request: Request, status: str = Query(default="pending",pattern="^(pending|in_review|verified|rejected|expired|all)$"), claims: dict = claims_dependency):
    await _authorize(claims,tenant_id,"identity.review",request)
    async with engine.connect() as connection:
        rows=await connection.execute(text("""
          select v.id,v.tenant_id,v.workforce_profile_id,v.status,v.verification_type,v.submitted_at,v.reviewed_by,v.reviewed_at,v.rejection_reason,
                 p.worker_code,p.display_name,p.job_title
          from public.workforce_identity_verifications v
          join public.workforce_profiles p on p.id=v.workforce_profile_id and p.tenant_id=v.tenant_id
          where v.tenant_id=:tenant and (:status='all' or v.status=:status)
          order by v.submitted_at asc limit 200
        """),{"tenant":tenant_id,"status":status})
        return {"data":[dict(row) for row in rows.mappings().all()]}


@router.post("/identity/{verification_id}/upload", status_code=201)
async def upload_identity_document(
    verification_id: UUID,
    request: Request,
    tenant_id: UUID,
    document_type: str = Query(min_length=2, max_length=80),
    file: UploadFile = File(...),
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await _authorize(claims, tenant_id, "identity.submit", request, verification_id)
    if not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Private document storage belum dikonfigurasi.")
    content_type = (file.content_type or "").lower()
    if content_type not in {"application/pdf", "image/jpeg", "image/png"}:
        raise HTTPException(status_code=415, detail="Format dokumen harus PDF, JPG, atau PNG.")
    raw = await file.read(10 * 1024 * 1024 + 1)
    if not raw or len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ukuran dokumen maksimal 10 MB.")
    try:
        scan_status, _ = await scan_bytes(raw)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Pemindaian antivirus dokumen belum tersedia.") from exc
    if scan_status != "clean":
        raise HTTPException(status_code=422, detail="Dokumen ditolak oleh pemindaian keamanan.")
    verification = None
    async with engine.connect() as connection:
        result = await connection.execute(text("""
          select workforce_profile_id from public.workforce_identity_verifications
          where tenant_id=:tenant and id=:id and status in ('pending','in_review')
        """), {"tenant":tenant_id,"id":verification_id})
        verification = result.mappings().first()
    if not verification:
        raise HTTPException(status_code=404, detail="Verifikasi tidak ditemukan atau sudah final.")
    async with engine.connect() as connection:
        profile = await _profile(connection, tenant_id, verification["workforce_profile_id"])
        await _assert_profile_scope(connection, claims, tenant_id, profile, request)
    filename = (file.filename or "identity-document").replace("\\", "/").split("/")[-1][:255]
    extension = {"application/pdf":".pdf","image/jpeg":".jpg","image/png":".png"}[content_type]
    object_path = f"{tenant_id}/{verification_id}/{uuid4()}{extension}"
    encoded_path = quote(object_path, safe="/")
    object_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/workforce-private-documents/{encoded_path}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
        "Content-Type": content_type,
        "x-upsert": "false",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        stored = await client.post(object_url, content=raw, headers=headers)
    if stored.status_code not in (200,201):
        raise HTTPException(status_code=503, detail="Penyimpanan dokumen privat gagal.")
    document_id = uuid4()
    try:
        async with engine.begin() as connection:
            result = await connection.execute(text("""
              insert into public.workforce_identity_documents(
                id,tenant_id,verification_id,storage_path,document_type,original_filename,content_type,
                file_size_bytes,sha256,scan_status,uploaded_by
              ) values(:id,:tenant,:verification,:path,:type,:filename,:mime,:size,:sha,'clean',:actor)
              returning *
            """), {
                "id":document_id,"tenant":tenant_id,"verification":verification_id,"path":object_path,
                "type":document_type,"filename":filename,"mime":content_type,"size":len(raw),
                "sha":sha256(raw).hexdigest(),"actor":actor,
            })
            document = dict(result.mappings().one())
            await _write_audit(connection,tenant_id,actor,"workforce.identity.document_uploaded",
                                "workforce_identity_document",document_id,request,
                                {"content_type":content_type,"size":len(raw),"scan":"clean"})
            return {"data":document}
    except Exception:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.delete(object_url, headers={
                "Authorization":f"Bearer {settings.supabase_service_role_key}",
                "apikey":settings.supabase_service_role_key,
            })
        raise


@router.post("/engagements/{engagement_id}/activate")
async def activate_engagement(
    engagement_id: UUID,
    payload: EngagementApproval,
    request: Request,
    claims: dict = claims_dependency,
):
    actor = UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"engagement.manage",request,engagement_id)
    async with engine.begin() as connection:
        result=await connection.execute(text("""
          select * from public.workforce_engagements
          where tenant_id=:tenant and id=:id for update
        """),{"tenant":payload.tenant_id,"id":engagement_id})
        engagement=result.mappings().first()
        if not engagement: raise HTTPException(status_code=404,detail="Engagement tidak ditemukan.")
        if engagement["status"] not in ("pending","suspended"): raise HTTPException(status_code=409,detail="Engagement harus pending atau suspended untuk aktivasi/resume.")
        previous_status=engagement["status"]
        if engagement["effective_from"]>date.today() or (engagement["effective_until"] and engagement["effective_until"]<date.today()):
            raise HTTPException(status_code=409,detail="Engagement belum atau tidak lagi berada dalam periode efektif.")
        if not engagement["facts_acknowledged"] or not engagement["legal_review_reference"]:
            raise HTTPException(status_code=409,detail="Acknowledgement fakta kerja dan legal review reference wajib sebelum aktivasi.")
        if engagement["contract_id"]:
            contract=await connection.execute(text("select status from public.contracts where id=:id and tenant_id=:tenant"),{"id":engagement["contract_id"],"tenant":payload.tenant_id})
            if contract.scalar_one_or_none() != "active":
                raise HTTPException(status_code=409,detail="Corporate contract harus berstatus active sebelum engagement diaktifkan.")
        updated=await connection.execute(text("""
          update public.workforce_engagements set status='active',updated_at=now()
          where tenant_id=:tenant and id=:id returning *
        """),{"tenant":payload.tenant_id,"id":engagement_id})
        await connection.execute(text("""
          update public.workforce_profiles set engagement_status='active',updated_at=now()
          where tenant_id=:tenant and id=:profile
        """),{"tenant":payload.tenant_id,"profile":engagement["workforce_profile_id"]})
        await connection.execute(text("""
          insert into public.workforce_engagement_events(tenant_id,engagement_id,workforce_profile_id,event_type,from_status,to_status,actor_user_id,reason)
          values(:tenant,:engagement,:profile,:event,:previous,'active',:actor,:reason)
        """),{"tenant":payload.tenant_id,"engagement":engagement_id,"profile":engagement["workforce_profile_id"],"event":"activated" if previous_status=="pending" else "amended","previous":previous_status,"actor":actor,"reason":payload.reason})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.engagement.activated","workforce_engagement",engagement_id,request,{"reason":payload.reason})
        return {"data":dict(updated.mappings().one())}


@router.post("/engagements/{engagement_id}/status")
async def change_engagement_status(
    engagement_id: UUID,
    payload: EngagementApproval,
    target_status: str = Query(pattern="^(suspended|ended)$"),
    request: Request = None,
    claims: dict = claims_dependency,
):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"engagement.manage",request,engagement_id)
    async with engine.begin() as connection:
        result=await connection.execute(text("select * from public.workforce_engagements where tenant_id=:tenant and id=:id for update"),{"tenant":payload.tenant_id,"id":engagement_id})
        engagement=result.mappings().first()
        if not engagement: raise HTTPException(status_code=404,detail="Engagement tidak ditemukan.")
        if engagement["status"] not in ("active","suspended"): raise HTTPException(status_code=409,detail="Status engagement tidak dapat diubah.")
        old=engagement["status"]
        updated=await connection.execute(text("update public.workforce_engagements set status=:status,updated_at=now() where tenant_id=:tenant and id=:id returning *"),{"status":target_status,"tenant":payload.tenant_id,"id":engagement_id})
        await connection.execute(text("update public.workforce_profiles set engagement_status=:status,updated_at=now() where tenant_id=:tenant and id=:profile"),{"status":target_status,"tenant":payload.tenant_id,"profile":engagement["workforce_profile_id"]})
        await connection.execute(text("""
          insert into public.workforce_engagement_events(tenant_id,engagement_id,workforce_profile_id,event_type,from_status,to_status,actor_user_id,reason)
          values(:tenant,:engagement,:profile,:event,:old,:new,:actor,:reason)
        """),{"tenant":payload.tenant_id,"engagement":engagement_id,"profile":engagement["workforce_profile_id"],"event":target_status,"old":old,"new":target_status,"actor":actor,"reason":payload.reason})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.engagement."+target_status,"workforce_engagement",engagement_id,request,{"reason":payload.reason})
        return {"data":dict(updated.mappings().one())}


@router.post("/skills/{worker_skill_id}/verify")
async def verify_worker_skill(worker_skill_id: UUID,payload: SkillVerification,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"skills.manage",request,worker_skill_id)
    async with engine.begin() as connection:
        result=await connection.execute(text("""
          select workforce_profile_id from public.workforce_worker_skills
          where tenant_id=:tenant and id=:id for update
        """),{"tenant":payload.tenant_id,"id":worker_skill_id})
        skill=result.mappings().first()
        if not skill: raise HTTPException(status_code=404,detail="Skill workforce tidak ditemukan.")
        updated=await connection.execute(text("""
          update public.workforce_worker_skills set verified=true,verified_by=:actor,verified_at=now(),updated_at=now()
          where tenant_id=:tenant and id=:id returning *
        """),{"actor":actor,"tenant":payload.tenant_id,"id":worker_skill_id})
        await _write_audit(connection,payload.tenant_id,actor,"workforce.skill.verified","workforce_worker_skill",worker_skill_id,request,{"reason":payload.reason})
        return {"data":dict(updated.mappings().one())}


@router.post("/certifications/{certification_id}/renew",status_code=201)
async def renew_certification(certification_id: UUID,payload: CertificationRenewal,request: Request,claims: dict=claims_dependency):
    actor=UUID(claims["sub"])
    await _authorize(claims,payload.tenant_id,"skills.read",request,certification_id)
    async with engine.begin() as connection:
        old_result=await connection.execute(text("""
          select * from public.workforce_certifications
          where tenant_id=:tenant and id=:id for update
        """),{"tenant":payload.tenant_id,"id":certification_id})
        old=old_result.mappings().first()
        if not old: raise HTTPException(status_code=404,detail="Sertifikasi sebelumnya tidak ditemukan.")
        profile=await _profile(connection,payload.tenant_id,old["workforce_profile_id"])
        await _assert_profile_scope(connection,claims,payload.tenant_id,profile,request)
        if old["expires_at"] and payload.valid_from<=old["expires_at"]:
            raise HTTPException(status_code=409,detail="Renewal harus memiliki periode validitas setelah sertifikat sebelumnya.")
        result=await connection.execute(text("""
          insert into public.workforce_certifications(
            tenant_id,workforce_profile_id,skill_id,name,issuer,certificate_reference,
            issued_at,valid_from,expires_at,evidence_metadata,verification_status,supersedes_certification_id
          ) values(:tenant,:profile,:skill,:name,:issuer,:reference,:issued,:valid,:expires,
            cast(:evidence as jsonb),'pending',:old_id) returning *
        """),{"tenant":payload.tenant_id,"profile":old["workforce_profile_id"],"skill":old["skill_id"],
              "name":old["name"],"issuer":old["issuer"],"reference":payload.certificate_reference,
              "issued":payload.issued_at,"valid":payload.valid_from,"expires":payload.expires_at,
              "evidence":json.dumps(payload.evidence_metadata),"old_id":certification_id})
        renewed=dict(result.mappings().one())
        await _write_audit(connection,payload.tenant_id,actor,"workforce.certification.renewed","workforce_certification",renewed["id"],request,{"supersedes":str(certification_id)})
        return {"data":renewed}

