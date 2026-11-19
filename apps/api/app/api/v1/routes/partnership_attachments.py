"""Authorized access to partnership files after malware scanning."""

import json
from datetime import UTC, datetime
from urllib.parse import quote
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_platform_action
from app.core.config import get_settings
from app.core.security import current_claims
from app.db.session import engine, user_session

router = APIRouter(tags=["Partnership Attachments"])
settings = get_settings()
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


async def _authorize_attachment_read(
    request: Request, claims: dict, session: AsyncSession, resource_id: str
) -> UUID:
    if claims.get("aal") != "aal2":
        raise HTTPException(
            status_code=403, detail="AAL2 is required to access partnership attachments."
        )
    actor = UUID(claims["sub"])
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key="platform.partnership.read",
        resource_type="platform.partnership",
        action="read",
        resource={"id": resource_id},
        request_id=getattr(request.state, "request_id", None),
        request_context={
            "correlation_id": getattr(request.state, "correlation_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )
    return actor


@router.get("/partnership/prospects/{prospect_id}/attachments")
async def list_prospect_attachments(
    prospect_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    await _authorize_attachment_read(request, claims, session, str(prospect_id))
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select a.id,a.original_filename,a.content_type,a.file_size,a.sha256,
                       a.scan_status,a.uploaded_at,a.scanned_at
                from public.public_partnership_attachments a
                join public.crm_prospects p on p.application_id=a.application_id
                where p.id=:prospect_id
                order by a.uploaded_at
            """),
            {"prospect_id": prospect_id},
        )
        rows = [dict(row) for row in result.mappings().all()]
    for row in rows:
        row["id"] = str(row["id"])
        row["uploaded_at"] = row["uploaded_at"].isoformat()
        row["scanned_at"] = row["scanned_at"].isoformat() if row["scanned_at"] else None
        row["download_available"] = row["scan_status"] == "clean"
    return {"data": rows, "meta": {"request_id": getattr(request.state, "request_id", None)}}


@router.post("/partnership/attachments/{attachment_id}/download")
async def create_attachment_download(
    attachment_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = await _authorize_attachment_read(request, claims, session, str(attachment_id))
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select a.id,a.application_id,a.object_path,a.original_filename,a.scan_status,
                       p.id as prospect_id
                from public.public_partnership_attachments a
                join public.crm_prospects p on p.application_id=a.application_id
                where a.id=:id
            """),
            {"id": attachment_id},
        )
        row = result.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Lampiran tidak ditemukan.")
    if row["scan_status"] != "clean":
        raise HTTPException(
            status_code=409,
            detail="Lampiran belum lolos pemindaian keamanan dan belum dapat diunduh.",
        )
    if not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Storage access belum dikonfigurasi.")
    object_path = quote(str(row["object_path"]), safe="/")
    url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/"
        f"partnership-quarantine/{object_path}"
    )
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(url, headers=headers, json={"expiresIn": 60})
    if response.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail="Signed download tidak dapat dibuat.")
    signed_path = response.json().get("signedURL")
    if not signed_path:
        raise HTTPException(status_code=502, detail="Storage tidak mengembalikan signed URL.")
    signed_url = (
        signed_path if signed_path.startswith("http")
        else f"{settings.supabase_url.rstrip('/')}/storage/v1{signed_path}"
    )
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(
                  :actor,'partnership.attachment.download_url_issued',
                  'partnership_attachment',:id,:request_id,cast(:metadata as jsonb)
                )
            """),
            {
                "actor": actor,
                "id": str(attachment_id),
                "request_id": getattr(request.state, "request_id", None),
                "metadata": json.dumps({
                    "prospect_id": str(row["prospect_id"]),
                    "expires_in_seconds": 60,
                    "scan_status": "clean",
                    "issued_at": datetime.now(UTC).isoformat(),
                }),
            },
        )
    return {
        "data": {
            "attachment_id": str(attachment_id),
            "filename": row["original_filename"],
            "signed_url": signed_url,
            "expires_in_seconds": 60,
        },
        "meta": {"request_id": getattr(request.state, "request_id", None)},
    }
