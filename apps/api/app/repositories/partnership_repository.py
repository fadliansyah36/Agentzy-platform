"""Persistence boundary for public partnership acquisition and CRM intake."""

import json
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def find_application_by_idempotency_key(connection: AsyncConnection, key: str):
    result = await connection.execute(
        text("""
            select id,reference_code,status,request_fingerprint
            from public.public_partnership_applications
            where submission_idempotency_key=:key
        """),
        {"key": key},
    )
    return result.mappings().first()


async def refresh_upload_capability(connection: AsyncConnection, application_id: UUID) -> None:
    await connection.execute(
        text("""
            update public.public_partnership_applications
            set upload_token_expires_at=now() + interval '2 hours'
            where id=:id
        """),
        {"id": application_id},
    )


async def has_recent_duplicate(connection: AsyncConnection, email: str, company: str) -> bool:
    result = await connection.execute(
        text("""
            select 1 from public.public_partnership_applications
            where lower(business_email)=:email
              and lower(company_name)=:company
              and created_at > now() - interval '24 hours'
            limit 1
        """),
        {"email": email.lower(), "company": company.lower()},
    )
    return result.first() is not None


async def insert_application(
    connection: AsyncConnection,
    *,
    application_id: UUID,
    reference_code: str,
    payload: dict,
    request_context: dict,
    upload_token_hash: str,
    idempotency_key: str,
    request_fingerprint: str,
) -> dict:
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
            "company": payload["company_name"],
            "company_type": payload["company_type"],
            "contact": payload["contact_name"],
            "title": payload["contact_title"],
            "email": payload["business_email"],
            "phone": payload["business_phone"],
            "website": payload.get("website"),
            "locations": payload["operating_locations"],
            "workforce": payload.get("estimated_workforce"),
            "human": payload.get("human_needs"),
            "ai": payload.get("ai_needs"),
            "products": payload.get("provider_products"),
            "summary": payload.get("needs_summary"),
            "request_id": request_context["request_id"],
            "correlation_id": request_context["correlation_id"],
            "trace_id": request_context["trace_id"],
            "upload_hash": upload_token_hash,
            "idempotency": idempotency_key,
            "fingerprint": request_fingerprint,
        },
    )
    return dict(result.mappings().one())


async def insert_prospect(
    connection: AsyncConnection, *, prospect_id: UUID, application_id: UUID, payload: dict
) -> None:
    await connection.execute(
        text("""
            insert into public.crm_prospects(
              id,application_id,company_name,contact_name,business_email,business_phone,status
            ) values(:id,:application_id,:company,:contact,:email,:phone,'submitted')
        """),
        {
            "id": prospect_id,
            "application_id": application_id,
            "company": payload["company_name"],
            "contact": payload["contact_name"],
            "email": payload["business_email"],
            "phone": payload["business_phone"],
        },
    )


async def insert_application_consents(
    connection: AsyncConnection,
    application_id: UUID,
    policy_version: str,
    privacy_granted: bool,
    communication_granted: bool,
) -> None:
    await connection.execute(
        text("""
            insert into public.public_partnership_consents(
              application_id,consent_type,granted,policy_version
            )
            values
              (:id,'privacy',:privacy_granted,:version),
              (:id,'communication',:communication_granted,:version)
        """),
        {
            "id": application_id,
            "version": policy_version,
            "privacy_granted": privacy_granted,
            "communication_granted": communication_granted,
        },
    )


async def insert_prospect_submission_activity(
    connection: AsyncConnection, prospect_id: UUID, reference_code: str
) -> None:
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


async def enqueue_application_received(
    connection: AsyncConnection, application_id: UUID, payload: dict, reference_code: str
) -> None:
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
            "email": payload["business_email"],
            "payload": json.dumps(
                {
                    "reference_code": reference_code,
                    "company_name": payload["company_name"],
                    "contact_name": payload["contact_name"],
                    "event": "partnership.application_received",
                }
            ),
        },
    )


async def write_application_submission_audit(
    connection: AsyncConnection,
    *,
    application_id: UUID,
    request_context: dict,
    audit_metadata: str,
) -> None:
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
            "request_id": request_context["request_id"],
            "metadata": audit_metadata,
        },
    )
