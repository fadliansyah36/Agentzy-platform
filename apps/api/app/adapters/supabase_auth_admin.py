"""Supabase Auth Admin adapter for tenant membership invitations."""

from dataclasses import dataclass
from uuid import UUID

import httpx

from app.core.config import get_settings

settings = get_settings()


@dataclass(frozen=True)
class AuthInviteResult:
    user_id: UUID | None
    status_code: int


async def invite_user(email: str, full_name: str, redirect_to: str) -> AuthInviteResult:
    service_key = settings.supabase_service_role_key
    if not service_key:
        raise RuntimeError("SUPABASE_AUTH_ADMIN_NOT_CONFIGURED")
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/invite"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=25) as client:
        response = await client.post(
            url,
            params={"redirect_to": redirect_to},
            headers=headers,
            json={"email": email.strip().lower(), "data": {"full_name": full_name.strip()}},
        )
    if response.status_code >= 400:
        return AuthInviteResult(user_id=None, status_code=response.status_code)
    try:
        return AuthInviteResult(
            user_id=UUID(response.json()["id"]),
            status_code=response.status_code,
        )
    except (KeyError, ValueError) as exc:
        raise RuntimeError("SUPABASE_AUTH_ADMIN_INVALID_RESPONSE") from exc
