import base64
import hashlib
import hmac
import json
import re
from datetime import UTC, datetime
from urllib.parse import unquote
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_platform_action, has_platform_permission
from app.core.config import get_settings
from app.core.idempotency import complete_idempotency, reserve_idempotency
from app.core.redaction import redact_audit_value
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter()
settings = get_settings()
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)

APPLICATION_STATUSES = {
    "submitted",
    "assigned",
    "contacted",
    "qualified",
    "disqualified",
    "proposal",
    "contracted",
    "closed",
}
ALLOWED_TRANSITIONS = {
    "submitted": {"assigned", "contacted", "disqualified", "closed"},
    "assigned": {"contacted", "qualified", "disqualified", "closed"},
    "contacted": {"qualified", "disqualified", "proposal", "closed"},
    "qualified": {"proposal", "disqualified", "closed"},
    "disqualified": {"closed"},
    "proposal": {"contracted", "disqualified", "closed"},
    "contracted": {"closed"},
    "closed": set(),
}
ALLOWED_UPLOADS = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".png": ("image/png", b"\x89PNG\r\n\x1a\n"),
    ".jpg": ("image/jpeg", b"\xff\xd8\xff"),
    ".jpeg": ("image/jpeg", b"\xff\xd8\xff"),
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


class PartnershipApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    company_name: str = Field(min_length=2, max_length=180)
    company_type: str = Field(min_length=2, max_length=80)
    contact_name: str = Field(min_length=2, max_length=120)
    contact_title: str | None = Field(default=None, max_length=120)
    business_email: str = Field(min_length=5, max_length=254)
    business_phone: str = Field(min_length=7, max_length=40)
    website: str | None = Field(default=None, max_length=255)
    operating_locations: str | None = Field(default=None, max_length=500)
    estimated_workforce: int | None = Field(default=None, ge=1, le=1000000)
    human_needs: list[str] = Field(default_factory=list, max_length=10)
    ai_needs: list[str] = Field(default_factory=list, max_length=12)
    provider_products: list[str] = Field(default_factory=list, max_length=12)
    needs_summary: str | None = Field(default=None, max_length=5000)
    privacy_consent: bool
    communication_consent: bool
    policy_version: str = Field(min_length=1, max_length=40)
    captcha_token: str | None = Field(default=None, max_length=4096)
    fax_number: str | None = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def validate_submission(self):
        self.company_name = self.company_name.strip()
        self.contact_name = self.contact_name.strip()
        self.business_email = self.business_email.strip().lower()
        self.business_phone = self.business_phone.strip()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", self.business_email):
            raise ValueError("Email bisnis tidak valid.")
        if not self.privacy_consent or not self.communication_consent:
            raise ValueError("Persetujuan privasi dan komunikasi wajib diberikan.")
        if self.website and not re.fullmatch(r"https?://[^\s]+", self.website.strip(), re.I):
            raise ValueError("Website harus menggunakan URL HTTP atau HTTPS.")
        for collection in (self.human_needs, self.ai_needs, self.provider_products):
            if any(not item.strip() or len(item) > 120 for item in collection):
                raise ValueError("Pilihan layanan tidak valid.")
        return self


class ProspectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str | None = Field(default=None)
    assigned_to: UUID | None = None
    note: str | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def validate_update(self):
        if not self.model_fields_set:
            raise ValueError("Minimal satu perubahan harus dikirim.")
        if self.status is not None and self.status not in APPLICATION_STATUSES:
            raise ValueError("Status prospek tidak valid.")
        if "status" in self.model_fields_set and self.status is None:
            raise ValueError("Status tidak boleh null.")
        if "note" in self.model_fields_set and self.note is not None and not self.note.strip():
            raise ValueError("Catatan tidak boleh kosong.")
        return self


def _request_context(request: Request) -> dict:
    return {
        "request_id": getattr(request.state, "request_id", None),
        "correlation_id": getattr(request.state, "correlation_id", None),
        "trace_id": getattr(request.state, "trace_id", None),
    }


def _client_ip(request: Request) -> str:
    # Forwarded headers are intentionally ignored unless a trusted-proxy layer is configured.
    return request.client.host if request.client else "unknown"


async def _rate_limit(request: Request, *, action: str, limit: int = 10) -> None:
    ip_hash = hashlib.sha256(f"{action}:{_client_ip(request)}".encode()).hexdigest()
    now = datetime.now(UTC)
    window = now.replace(minute=0, second=0, microsecond=0)
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                insert into public.public_api_rate_limits(key_hash,window_started_at,request_count)
                values(:key_hash,:window,1)
                on conflict(key_hash,window_started_at) do update
                  set request_count=public.public_api_rate_limits.request_count+1,
                      updated_at=now()
                returning request_count
            """),
            {"key_hash": ip_hash, "window": window},
        )
        count = int(result.scalar_one())
    if count > limit:
        raise HTTPException(
            status_code=429, detail="Batas permintaan tercapai. Coba kembali nanti."
        )


def _upload_token_for_key(idempotency_key: str) -> str:
    secret = (
        settings.auth_provider_webhook_secret
        or settings.supabase_jwt_secret
        or settings.supabase_service_role_key
    )
    if not secret:
        raise HTTPException(
            status_code=503, detail="Public application capability is not configured."
        )
    message = f"agentzy-partnership-upload:{idempotency_key}".encode()
    digest = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")


async def _verify_turnstile(token: str | None, request: Request) -> None:
    secret = settings.turnstile_secret_key
    if not secret:
        if settings.turnstile_required:
            raise HTTPException(
                status_code=503,
                detail="Verifikasi anti-bot belum dikonfigurasi pada layanan pengajuan publik.",
            )
        return
    if not token:
        raise HTTPException(status_code=400, detail="Verifikasi anti-bot diperlukan.")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": secret, "response": token, "remoteip": _client_ip(request)},
            )
            response.raise_for_status()
            verification = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Layanan verifikasi anti-bot sementara tidak tersedia.",
        ) from exc
    if not verification.get("success"):
        raise HTTPException(status_code=400, detail="Verifikasi anti-bot gagal.")


@router.get("/public/catalogue", tags=["Public Catalogue"])
async def public_catalogue():
    async with engine.connect() as connection:
        services = await connection.execute(
            text("""
            select audience,service_key,name,summary,scope,output,boundary,governance,sort_order
            from public.public_catalogue_items
            where is_published=true order by audience,sort_order,name
        """)
        )
        faqs = await connection.execute(
            text("""
            select faq_key,question,answer,sort_order
            from public.public_faq_entries
            where is_published=true order by sort_order,faq_key
        """)
        )
    service_rows = [dict(row) for row in services.mappings().all()]
    return {
        "data": {
            "human_workforce": [row for row in service_rows if row["audience"] == "human"],
            "ai_workforce": [row for row in service_rows if row["audience"] == "ai"],
            "faqs": [dict(row) for row in faqs.mappings().all()],
        },
        "meta": {"source": "agentzy_database", "updated_at": datetime.now(UTC).isoformat()},
    }


@router.post(
    "/public/partnership-applications",
    status_code=status.HTTP_201_CREATED,
    tags=["Public Partnership"],
)
async def create_partnership_application(
    payload: PartnershipApplicationCreate,
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    await _rate_limit(request, action="partnership-submit", limit=10)
    if payload.fax_number:
        raise HTTPException(status_code=400, detail="Permintaan tidak dapat diproses.")
    await _verify_turnstile(payload.captcha_token, request)
    if not idempotency_key or not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", idempotency_key):
        raise HTTPException(status_code=400, detail="Idempotency-Key yang valid wajib dikirim.")

    upload_token = _upload_token_for_key(idempotency_key)
    upload_token_hash = hashlib.sha256(upload_token.encode()).hexdigest()
    request_fingerprint = hashlib.sha256(
        json.dumps(
            payload.model_dump(exclude={"captcha_token", "fax_number"}, mode="json"),
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
    ).hexdigest()
    context = _request_context(request)
    async with engine.begin() as connection:
        existing = await connection.execute(
            text("""
                select id, reference_code, status, request_fingerprint, upload_token_expires_at
                from public.public_partnership_applications
                where submission_idempotency_key=:key
            """),
            {"key": idempotency_key},
        )
        prior = existing.mappings().first()
        if prior:
            if prior["request_fingerprint"] != request_fingerprint:
                raise HTTPException(
                    status_code=409,
                    detail="Idempotency-Key telah digunakan untuk payload yang berbeda.",
                )
            await connection.execute(
                text("""
                    update public.public_partnership_applications
                    set upload_token_expires_at=now() + interval '2 hours'
                    where id=:id
                """),
                {"id": prior["id"]},
            )
            return {
                "data": {
                    "id": str(prior["id"]),
                    "reference_code": prior["reference_code"],
                    "status": prior["status"],
                    "upload_token": upload_token,
                    "notification_status": "queued",
                },
                "meta": context,
            }

        duplicate = await connection.execute(
            text("""
                select 1 from public.public_partnership_applications
                where lower(business_email)=:email
                  and lower(company_name)=:company
                  and created_at > now() - interval '24 hours'
                limit 1
            """),
            {"email": payload.business_email, "company": payload.company_name.lower()},
        )
        if duplicate.first():
            raise HTTPException(
                status_code=409,
                detail="Pengajuan dengan data perusahaan dan email tersebut baru saja diterima.",
            )

        application_id = uuid4()
        reference_code = f"AGZ-{application_id.hex[:10].upper()}"
        result = await connection.execute(
            text("""
                insert into public.public_partnership_applications(
                  id,reference_code,company_name,company_type,contact_name,contact_title,
                  business_email,business_phone,website,operating_locations,estimated_workforce,
                  human_needs,ai_needs,provider_products,needs_summary,status,source,
                  request_id,correlation_id,trace_id,upload_token_hash,upload_token_expires_at,
                  submission_idempotency_key,request_fingerprint
                ) values (
                  :id,:reference,:company,:company_type,:contact,:title,:email,:phone,
                  :website,:locations,:workforce,:human,:ai,:products,:summary,'submitted',
                  'public_landing',:request_id,:correlation_id,:trace_id,
                  :upload_hash,now() + interval '2 hours',:idempotency,:fingerprint
                ) returning id,reference_code,status,created_at
            """),
            {
                "id": application_id,
                "reference": reference_code,
                "company": payload.company_name,
                "company_type": payload.company_type,
                "contact": payload.contact_name,
                "title": payload.contact_title,
                "email": payload.business_email,
                "phone": payload.business_phone,
                "website": payload.website,
                "locations": payload.operating_locations,
                "workforce": payload.estimated_workforce,
                "human": payload.human_needs,
                "ai": payload.ai_needs,
                "products": payload.provider_products,
                "summary": payload.needs_summary,
                "request_id": context["request_id"],
                "correlation_id": context["correlation_id"],
                "trace_id": context["trace_id"],
                "upload_hash": upload_token_hash,
                "idempotency": idempotency_key,
                "fingerprint": request_fingerprint,
            },
        )
        application = dict(result.mappings().one())
        prospect_id = uuid4()
        await connection.execute(
            text("""
                insert into public.crm_prospects(
                  id,application_id,company_name,contact_name,business_email,business_phone,status
                ) values(:id,:application_id,:company,:contact,:email,:phone,'submitted')
            """),
            {
                "id": prospect_id,
                "application_id": application_id,
                "company": payload.company_name,
                "contact": payload.contact_name,
                "email": payload.business_email,
                "phone": payload.business_phone,
            },
        )
        await connection.execute(
            text("""
                insert into public.public_partnership_consents(
                  application_id,consent_type,granted,policy_version
                )
                values(:id,'privacy',true,:version),(:id,'communication',true,:version)
            """),
            {"id": application_id, "version": payload.policy_version},
        )
        await connection.execute(
            text("""
                insert into public.crm_prospect_activities(
                  prospect_id,activity_type,to_status,metadata
                )
                values(:prospect,'submitted','submitted',cast(:metadata as jsonb))
            """),
            {
                "prospect": prospect_id,
                "metadata": json.dumps(
                    {"source": "public_landing", "reference_code": reference_code}
                ),
            },
        )
        await connection.execute(
            text("""
                insert into public.notification_outbox(
                  event_type,aggregate_type,aggregate_id,recipient_email,payload
                )
                values(
                  'partnership.application_received','partnership_application',
                  :id,:email,cast(:payload as jsonb)
                )
            """),
            {
                "id": application_id,
                "email": payload.business_email,
                "payload": json.dumps(
                    {
                        "reference_code": reference_code,
                        "company_name": payload.company_name,
                        "contact_name": payload.contact_name,
                        "event": "partnership.application_received",
                    }
                ),
            },
        )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  action,resource_type,resource_id,request_id,metadata
                ) values(
                  'partnership.application.submitted','partnership_application',:id,:request_id,
                  cast(:metadata as jsonb)
                )
            """),
            {
                "id": str(application_id),
                "request_id": context["request_id"],
                "metadata": json.dumps(
                    redact_audit_value(
                        {
                            "reference_code": reference_code,
                            "company_type": payload.company_type,
                            "email_hash": hashlib.sha256(
                                payload.business_email.encode()
                            ).hexdigest(),
                            "correlation_id": context["correlation_id"],
                            "trace_id": context["trace_id"],
                        }
                    )
                ),
            },
        )

    return {
        "data": {
            "id": str(application["id"]),
            "reference_code": application["reference_code"],
            "status": application["status"],
            "upload_token": upload_token,
            "notification_status": "queued",
        },
        "meta": context,
    }


@router.post(
    "/public/partnership-applications/{application_id}/attachments",
    status_code=status.HTTP_201_CREATED,
    tags=["Public Partnership"],
)
async def upload_partnership_attachment(
    application_id: UUID,
    request: Request,
    upload_token: str | None = Header(default=None, alias="X-Application-Upload-Token"),
    filename: str | None = Header(default=None, alias="X-File-Name"),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    await _rate_limit(request, action="partnership-attachment", limit=20)
    if not upload_token:
        raise HTTPException(status_code=401, detail="Upload capability diperlukan.")
    if not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=503, detail="Private attachment storage belum dikonfigurasi."
        )

    safe_filename = unquote((filename or "").strip()).replace("\\", "/").rsplit("/", 1)[-1]
    safe_filename = re.sub(r"[\\x00-\\x1f\\x7f]", "", safe_filename)
    extension = "." + safe_filename.rsplit(".", 1)[-1].lower() if "." in safe_filename else ""
    content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    allowed = ALLOWED_UPLOADS.get(extension)
    if not allowed or content_type != allowed[0]:
        raise HTTPException(
            status_code=415,
            detail="Format lampiran tidak didukung. Gunakan PDF, JPG, atau PNG.",
        )

    chunks = bytearray()
    async for chunk in request.stream():
        chunks.extend(chunk)
        if len(chunks) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File melebihi batas 10 MB.")
    content = bytes(chunks)
    if not content or not content.startswith(allowed[1]):
        raise HTTPException(status_code=400, detail="File tidak valid atau melebihi 10 MB.")

    if not idempotency_key or not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", idempotency_key):
        raise HTTPException(status_code=400, detail="Idempotency-Key yang valid wajib dikirim.")
    token_hash = hashlib.sha256(upload_token.encode()).hexdigest()
    file_hash = hashlib.sha256(content).hexdigest()
    request_fingerprint = hashlib.sha256(
        json.dumps(
            {
                "application_id": str(application_id),
                "filename": safe_filename[:255],
                "content_type": allowed[0],
                "file_size": len(content),
                "sha256": file_hash,
            },
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
    ).hexdigest()
    object_path = f"{application_id}/{uuid4().hex}{extension}"
    storage_url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/"
        f"partnership-quarantine/{object_path}"
    )
    storage_headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
        "Content-Type": allowed[0],
        "x-upsert": "false",
    }
    storage_uploaded = False
    attachment_id = uuid4()

    # Serialize attachment quota checks for the same application.
    # Keep the application row locked through Storage upload and metadata insert.
    try:
        async with engine.begin() as connection:
            await connection.execute(
                text("select pg_advisory_xact_lock(hashtextextended(:key, 0))"),
                {"key": str(application_id)},
            )
            app_result = await connection.execute(
                text("""
                    select upload_token_hash,upload_token_expires_at,status
                    from public.public_partnership_applications
                    where id=:id
                    for update
                """),
                {"id": application_id},
            )
            application = app_result.mappings().first()
            if (
                application is None
                or application["status"] in ("closed", "disqualified")
                or not application["upload_token_hash"]
                or not application["upload_token_expires_at"]
                or application["upload_token_expires_at"] <= datetime.now(UTC)
                or not hmac.compare_digest(application["upload_token_hash"], token_hash)
            ):
                raise HTTPException(
                    status_code=404, detail="Pengajuan atau akses upload tidak tersedia."
                )

            prior_result = await connection.execute(
                text("""
                    select id,scan_status,request_fingerprint
                    from public.public_partnership_attachments
                    where application_id=:application_id
                      and upload_idempotency_key=:idempotency_key
                """),
                {"application_id": application_id, "idempotency_key": idempotency_key},
            )
            prior = prior_result.mappings().first()
            if prior:
                if prior["request_fingerprint"] != request_fingerprint:
                    raise HTTPException(
                        status_code=409,
                        detail="Idempotency-Key lampiran telah digunakan untuk file berbeda.",
                    )
                return {
                    "data": {
                        "id": str(prior["id"]),
                        "application_id": str(application_id),
                        "scan_status": prior["scan_status"],
                        "download_available": prior["scan_status"] == "clean",
                    },
                    "meta": _request_context(request),
                }

            attachment_count = await connection.execute(
                text("""
                    select count(*) from public.public_partnership_attachments
                    where application_id=:id
                """),
                {"id": application_id},
            )
            if int(attachment_count.scalar_one()) >= 5:
                raise HTTPException(
                    status_code=409, detail="Batas lima lampiran per pengajuan tercapai."
                )

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(storage_url, content=content, headers=storage_headers)
            if response.status_code not in (200, 201):
                raise HTTPException(
                    status_code=502,
                    detail="Lampiran tidak dapat disimpan ke private quarantine storage.",
                )
            storage_uploaded = True

            await connection.execute(
                text("""
                    insert into public.public_partnership_attachments(
                      id,application_id,object_path,original_filename,
                      content_type,file_size,sha256,scan_status,
                      upload_idempotency_key,request_fingerprint
                    ) values(
                      :id,:application_id,:path,:filename,:content_type,
                      :size,:sha256,'pending_scan',:idempotency_key,:fingerprint
                    )
                """),
                {
                    "id": attachment_id,
                    "application_id": application_id,
                    "path": object_path,
                    "filename": safe_filename[:255],
                    "content_type": allowed[0],
                    "size": len(content),
                    "sha256": file_hash,
                    "idempotency_key": idempotency_key,
                    "fingerprint": request_fingerprint,
                },
            )
    except Exception:
        if storage_uploaded:
            async with httpx.AsyncClient(timeout=15.0) as client:
                await client.delete(storage_url, headers=storage_headers)
        raise

    return {
        "data": {
            "id": str(attachment_id),
            "application_id": str(application_id),
            "scan_status": "pending_scan",
            "download_available": False,
        },
        "meta": _request_context(request),
    }


async def _authorize_partnership(
    request: Request,
    claims: dict,
    session: AsyncSession,
    *,
    permission: str,
    action: str,
    resource: dict,
):
    actor = UUID(claims["sub"])
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key=permission,
        resource_type="platform.partnership",
        action=action,
        resource=resource,
        request_id=getattr(request.state, "request_id", None),
        request_context={
            "ip": _client_ip(request),
            "correlation_id": getattr(request.state, "correlation_id", None),
        },
    )
    return actor


@router.get("/partnership/prospects", tags=["Partnership CRM"])
async def list_partnership_prospects(
    request: Request,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=25, ge=1, le=100),
    cursor: str | None = Query(default=None, max_length=512),
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    await _authorize_partnership(
        request,
        claims,
        session,
        permission="platform.partnership.read",
        action="read",
        resource={"id": "prospect_inbox"},
    )
    if status_filter and status_filter not in APPLICATION_STATUSES:
        raise HTTPException(status_code=422, detail="Filter status tidak valid.")
    cursor_values = None
    if cursor:
        try:
            raw = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
            value = json.loads(raw)
            cursor_values = (datetime.fromisoformat(value["created_at"]), UUID(value["id"]))
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=422, detail="Cursor tidak valid.") from exc

    async with engine.connect() as connection:
        rows = await connection.execute(
            text("""
                select p.id,p.application_id,p.company_name,p.contact_name,p.business_email,
                       p.business_phone,p.status,p.assigned_to,p.assigned_at,p.last_activity_at,
                       p.created_at,a.reference_code,a.company_type,a.human_needs,a.ai_needs,
                       a.provider_products,a.operating_locations,a.estimated_workforce
                from public.crm_prospects p
                join public.public_partnership_applications a on a.id=p.application_id
                where (:status is null or p.status=:status)
                  and (:cursor_created is null or (p.created_at,p.id)<(:cursor_created,:cursor_id))
                order by p.created_at desc,p.id desc limit :limit
            """),
            {
                "status": status_filter,
                "cursor_created": cursor_values[0] if cursor_values else None,
                "cursor_id": cursor_values[1] if cursor_values else None,
                "limit": limit + 1,
            },
        )
    records = [dict(row) for row in rows.mappings().all()]
    has_more = len(records) > limit
    records = records[:limit]
    next_cursor = None
    if has_more and records:
        last = records[-1]
        next_cursor = (
            base64.urlsafe_b64encode(
                json.dumps(
                    {
                        "created_at": last["created_at"].isoformat(),
                        "id": str(last["id"]),
                    }
                ).encode()
            )
            .decode()
            .rstrip("=")
        )
    for item in records:
        for key, value in list(item.items()):
            if isinstance(value, UUID):
                item[key] = str(value)
            elif isinstance(value, datetime):
                item[key] = value.isoformat()
    return {
        "data": records,
        "meta": {"has_more": has_more, "next_cursor": next_cursor, **_request_context(request)},
    }


@router.patch("/partnership/prospects/{prospect_id}", tags=["Partnership CRM"])
async def update_partnership_prospect(
    prospect_id: UUID,
    payload: ProspectUpdate,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _authorize_partnership(
        request,
        claims,
        session,
        permission="platform.partnership.manage",
        action="manage",
        resource={"id": str(prospect_id)},
    )
    response_body = None
    async with engine.begin() as connection:
        reservation = await reserve_idempotency(
            connection,
            actor_user_id=actor,
            tenant_id=None,
            command_key=f"partnership.prospect.update:{prospect_id}",
            idempotency_key=request.headers.get("idempotency-key"),
            payload=payload.model_dump(mode="json"),
        )
        if reservation.replay:
            return reservation.replay_body or {}
        result = await connection.execute(
            text("""
                select p.*,a.reference_code,a.business_email,a.company_name
                from public.crm_prospects p
                join public.public_partnership_applications a on a.id=p.application_id
                where p.id=:id for update of p
            """),
            {"id": prospect_id},
        )
        current = result.mappings().first()
        if current is None:
            raise HTTPException(status_code=404, detail="Prospek tidak ditemukan.")
        next_status = payload.status or current["status"]
        if payload.status and payload.status != current["status"]:
            if payload.status not in ALLOWED_TRANSITIONS[current["status"]]:
                raise HTTPException(
                    status_code=409, detail="Transisi status prospek tidak diizinkan."
                )
        assigned_to = current["assigned_to"]
        if "assigned_to" in payload.model_fields_set:
            assigned_to = payload.assigned_to
            if assigned_to is not None and not await has_platform_permission(
                session, assigned_to, "platform.partnership.manage"
            ):
                raise HTTPException(
                    status_code=422,
                    detail="Petugas tujuan tidak memiliki akses partnership.",
                )
            if assigned_to is not None and next_status == "submitted":
                next_status = "assigned"
        await connection.execute(
            text("""
                update public.crm_prospects
                set status=:status,assigned_to=:assigned_to,
                    assigned_at=case
                      when :assigned_to is distinct from assigned_to then
                        case when :assigned_to is not null then now() else null end
                      else assigned_at end,
                    last_activity_at=now(),updated_at=now()
                where id=:id
            """),
            {"status": next_status, "assigned_to": assigned_to, "id": prospect_id},
        )
        await connection.execute(
            text("""
                update public.public_partnership_applications
                set status=:status,updated_at=now() where id=:application_id
            """),
            {"status": next_status, "application_id": current["application_id"]},
        )
        if payload.status and payload.status != current["status"]:
            await connection.execute(
                text("""
                    insert into public.crm_prospect_activities(
                      prospect_id,actor_user_id,activity_type,from_status,to_status,note,metadata
                    ) values(:id,:actor,'status_changed',:from_status,:to_status,:note,'{}'::jsonb)
                """),
                {
                    "id": prospect_id,
                    "actor": actor,
                    "from_status": current["status"],
                    "to_status": next_status,
                    "note": payload.note,
                },
            )
        elif payload.note:
            await connection.execute(
                text("""
                    insert into public.crm_prospect_activities(
                      prospect_id,actor_user_id,activity_type,note
                    ) values(:id,:actor,'note',:note)
                """),
                {"id": prospect_id, "actor": actor, "note": payload.note.strip()},
            )
        if assigned_to != current["assigned_to"]:
            await connection.execute(
                text("""
                    insert into public.crm_prospect_activities(
                      prospect_id,actor_user_id,activity_type,metadata
                    ) values(:id,:actor,'assigned',cast(:metadata as jsonb))
                """),
                {
                    "id": prospect_id,
                    "actor": actor,
                    "metadata": json.dumps(
                        {"assigned_to": str(assigned_to) if assigned_to else None}
                    ),
                },
            )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(
                  :actor,'partnership.prospect.updated','crm_prospect',
                  :id,:request_id,cast(:metadata as jsonb)
                )
            """),
            {
                "actor": actor,
                "id": str(prospect_id),
                "request_id": getattr(request.state, "request_id", None),
                "metadata": json.dumps(
                    redact_audit_value(
                        {
                            "status": next_status,
                            "assigned_to": str(assigned_to) if assigned_to else None,
                            "correlation_id": getattr(request.state, "correlation_id", None),
                            "trace_id": getattr(request.state, "trace_id", None),
                        }
                    )
                ),
            },
        )
        if payload.status or ("assigned_to" in payload.model_fields_set):
            await connection.execute(
                text("""
                    insert into public.notification_outbox(
                      event_type,aggregate_type,aggregate_id,recipient_email,payload
                    ) values(
                      'partnership.prospect.updated','crm_prospect',:id,
                      :email,cast(:payload as jsonb)
                    )
                """),
                {
                    "id": prospect_id,
                    "email": current["business_email"],
                    "payload": json.dumps(
                        {
                            "reference_code": current["reference_code"],
                            "status": next_status,
                            "event": "partnership.prospect.updated",
                        }
                    ),
                },
            )

        if assigned_to is not None and assigned_to != current["assigned_to"]:
            assignee = await connection.execute(
                text("select email from auth.users where id=:user_id and deleted_at is null"),
                {"user_id": assigned_to},
            )
            assignee_email = assignee.scalar_one_or_none()
            if assignee_email:
                await connection.execute(
                    text("""
                        insert into public.notification_outbox(
                          event_type,aggregate_type,aggregate_id,recipient_email,payload
                        ) values(
                          'partnership.prospect.assigned','crm_prospect',:id,
                          :email,cast(:payload as jsonb)
                        )
                    """),
                    {
                        "id": prospect_id,
                        "email": assignee_email,
                        "payload": json.dumps(
                            {
                                "reference_code": current["reference_code"],
                                "company_name": current["company_name"],
                                "event": "partnership.prospect.assigned",
                            }
                        ),
                    },
                )
        response_body = {
            "data": {
                "id": str(prospect_id),
                "reference_code": current["reference_code"],
                "status": next_status,
                "assigned_to": str(assigned_to) if assigned_to else None,
            },
            "meta": _request_context(request),
        }
        await complete_idempotency(
            connection,
            record_id=reservation.record_id,
            response_status=200,
            response_body=response_body,
        )
    return response_body


@router.get("/partnership/prospects/{prospect_id}/activities", tags=["Partnership CRM"])
async def list_prospect_activities(
    prospect_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    await _authorize_partnership(
        request,
        claims,
        session,
        permission="platform.partnership.read",
        action="read",
        resource={"id": str(prospect_id)},
    )
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,actor_user_id,activity_type,from_status,to_status,note,metadata,created_at
                from public.crm_prospect_activities
                where prospect_id=:id order by created_at desc,id desc limit 200
            """),
            {"id": prospect_id},
        )
    activities = []
    for row in result.mappings().all():
        item = dict(row)
        for key, value in list(item.items()):
            if isinstance(value, UUID):
                item[key] = str(value)
            elif isinstance(value, datetime):
                item[key] = value.isoformat()
        activities.append(item)
    return {"data": activities, "meta": _request_context(request)}
