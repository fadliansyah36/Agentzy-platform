"""Authorized partnership notification delivery endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.authorization import authorize_platform_action
from app.core.security import current_claims
from app.db.session import user_session
from app.services.partnership_notification_service import (
    list_prospect_notifications,
    retry_partnership_notification,
)

router = APIRouter(tags=["Partnership Notifications"])
claims_dependency = Depends(current_claims)
session_dependency = Depends(user_session)


@router.get("/partnership/prospects/{prospect_id}/notifications")
async def get_prospect_notifications(
    prospect_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    if claims.get("aal") != "aal2":
        raise HTTPException(status_code=403, detail="AAL2 is required to view delivery events.")
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key="platform.partnership.read",
        resource_type="platform.partnership",
        action="read_notifications",
        resource={"id": str(prospect_id)},
        request_id=getattr(request.state, "request_id", None),
        request_context={
            "correlation_id": getattr(request.state, "correlation_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )
    result = await list_prospect_notifications(prospect_id)
    result["meta"]["request_id"] = getattr(request.state, "request_id", None)
    return result


@router.post("/partnership/notifications/{notification_id}/retry", status_code=202)
async def retry_notification(
    notification_id: UUID,
    request: Request,
    claims: dict = claims_dependency,
    session: AsyncSession = session_dependency,
):
    actor = UUID(claims["sub"])
    if claims.get("aal") != "aal2":
        raise HTTPException(status_code=403, detail="AAL2 is required to retry notifications.")
    await authorize_platform_action(
        session,
        user_id=actor,
        permission_key="platform.partnership.manage",
        resource_type="platform.partnership",
        action="retry_notification",
        resource={"id": str(notification_id)},
        request_id=getattr(request.state, "request_id", None),
        request_context={
            "correlation_id": getattr(request.state, "correlation_id", None),
            "trace_id": getattr(request.state, "trace_id", None),
        },
    )
    return await retry_partnership_notification(
        notification_id=notification_id,
        actor_user_id=actor,
        request_id=getattr(request.state, "request_id", None),
        idempotency_key=request.headers.get("idempotency-key"),
    )
