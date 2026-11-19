"""Authorized access to partnership files after malware scanning."""

import json
from datetime import UTC, datetime
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.supabase_storage import create_quarantined_signed_url
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
                       a.scan_status,a.scan_attempts,a.scan_result,a.uploaded_at,a.scanned_at
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
        scan_result = row.pop("scan_result", None) or {}
        row["scan_state"] = scan_result.get("state", "queued")
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
    try:
        signed_url = await create_quarantined_signed_url(str(row["object_path"]), 60)
    except (httpx.HTTPError, RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Signed download tidak dapat dibuat.") from exc
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
                "metadata": json.dumps(
                    {
                        "prospect_id": str(row["prospect_id"]),
                        "expires_in_seconds": 60,
                        "scan_status": "clean",
                        "issued_at": datetime.now(UTC).isoformat(),
                    }
                ),
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


@router.post("/partnership/attachments/{attachment_id}/retry-scan")
async def retry_attachment_scan(
    attachment_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    if claims.get("aal") != "aal2":
        raise HTTPException(status_code=403, detail="AAL2 is required for scanner recovery.")
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key="platform.partnership.manage",
        resource_type="platform.partnership",
        action="retry_scan",
        resource={"id": str(attachment_id)},
        request_id=getattr(request.state, "request_id", None),
        request_context={
            "correlation_id": getattr(request.state, "correlation_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                select id,scan_status,scan_result,scan_attempts
                from public.public_partnership_attachments
                where id=:id
                for update
            """),
            {"id": attachment_id},
        )
        row = result.mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Lampiran tidak ditemukan.")
        if (
            row["scan_status"] != "pending_scan"
            or (row["scan_result"] or {}).get("state") != "dead_letter"
        ):
            raise HTTPException(
                status_code=409,
                detail="Hanya pemindaian dead-letter yang dapat dimasukkan kembali ke antrean.",
            )
        await connection.execute(
            text("""
                update public.public_partnership_attachments
                set scan_attempts=0,
                    scan_result=jsonb_build_object(
                      'state','retrying',
                      'retry_after',now()::text,
                      'manual_retry_by',:actor
                    )
                where id=:id
            """),
            {"id": attachment_id, "actor": str(actor)},
        )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  actor_user_id,action,resource_type,resource_id,request_id,metadata
                ) values(
                  :actor,'partnership.attachment.scan_retried',
                  'partnership_attachment',:id,:request_id,
                  jsonb_build_object('previous_attempts',:attempts)
                )
            """),
            {
                "actor": actor,
                "id": str(attachment_id),
                "request_id": getattr(request.state, "request_id", None),
                "attempts": row["scan_attempts"],
            },
        )
    return {
        "data": {
            "attachment_id": str(attachment_id),
            "scan_status": "pending_scan",
            "scan_state": "retrying",
        },
        "meta": {"request_id": getattr(request.state, "request_id", None)},
    }
