"""Application service for atomic public partnership acquisition."""

import hashlib
import json
from uuid import uuid4

from fastapi import HTTPException

from app.core.redaction import redact_audit_value
from app.db.session import engine
from app.repositories.partnership_repository import (
    enqueue_application_received,
    find_application_by_idempotency_key,
    has_recent_duplicate,
    insert_application,
    insert_application_consents,
    insert_prospect,
    insert_prospect_submission_activity,
    refresh_upload_capability,
    write_application_submission_audit,
)


async def submit_partnership_application(
    *,
    payload: dict,
    request_context: dict,
    idempotency_key: str,
    request_fingerprint: str,
    upload_token: str,
    upload_token_hash: str,
) -> dict:
    async with engine.begin() as connection:
        prior = await find_application_by_idempotency_key(connection, idempotency_key)
        if prior:
            if prior["request_fingerprint"] != request_fingerprint:
                raise HTTPException(
                    status_code=409,
                    detail="Idempotency-Key telah digunakan untuk payload yang berbeda.",
                )
            await refresh_upload_capability(connection, prior["id"])
            return {
                "data": {
                    "id": str(prior["id"]),
                    "reference_code": prior["reference_code"],
                    "status": prior["status"],
                    "upload_token": upload_token,
                    "notification_status": "queued",
                },
                "meta": request_context,
            }

        if await has_recent_duplicate(
            connection, payload["business_email"], payload["company_name"]
        ):
            raise HTTPException(
                status_code=409,
                detail="Pengajuan dengan data perusahaan dan email tersebut baru saja diterima.",
            )

        application_id = uuid4()
        prospect_id = uuid4()
        reference_code = f"AGZ-{application_id.hex[:10].upper()}"
        application = await insert_application(
            connection,
            application_id=application_id,
            reference_code=reference_code,
            payload=payload,
            request_context=request_context,
            upload_token_hash=upload_token_hash,
            idempotency_key=idempotency_key,
            request_fingerprint=request_fingerprint,
        )
        await insert_prospect(
            connection,
            prospect_id=prospect_id,
            application_id=application_id,
            payload=payload,
        )
        await insert_application_consents(
            connection, application_id, payload["policy_version"]
        )
        await insert_prospect_submission_activity(
            connection, prospect_id, reference_code
        )
        await enqueue_application_received(
            connection, application_id, payload, reference_code
        )
        audit_metadata = json.dumps(
            redact_audit_value(
                {
                    "reference_code": reference_code,
                    "company_type": payload["company_type"],
                    "email_hash": hashlib.sha256(
                        payload["business_email"].encode()
                    ).hexdigest(),
                    "correlation_id": request_context["correlation_id"],
                    "trace_id": request_context["trace_id"],
                }
            )
        )
        await write_application_submission_audit(
            connection,
            application_id=application_id,
            request_context=request_context,
            audit_metadata=audit_metadata,
        )

    return {
        "data": {
            "id": str(application["id"]),
            "reference_code": application["reference_code"],
            "status": application["status"],
            "upload_token": upload_token,
            "notification_status": "queued",
        },
        "meta": request_context,
    }
