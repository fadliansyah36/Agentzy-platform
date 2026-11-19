"""Google Workspace OAuth 2.0 adapter. Provider secrets stay server-side."""

import base64
import hashlib
import secrets
from urllib.parse import urlencode

import httpx

from app.core.config import get_settings

AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo"
REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke"


def create_pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
    return verifier, challenge.decode().rstrip("=")


def build_authorization_url(state: str, challenge: str, scopes: list[str]) -> str:
    settings = get_settings()
    if not settings.google_oauth_configured:
        raise RuntimeError("GOOGLE_OAUTH_NOT_CONFIGURED")
    return (
        AUTHORIZE_ENDPOINT
        + "?"
        + urlencode(
            {
                "client_id": settings.google_oauth_client_id,
                "redirect_uri": settings.google_oauth_redirect_uri,
                "response_type": "code",
                "scope": " ".join(scopes),
                "access_type": "offline",
                "prompt": "consent",
                "include_granted_scopes": "true",
                "state": state,
                "code_challenge": challenge,
                "code_challenge_method": "S256",
            }
        )
    )


async def exchange_authorization_code(code: str, verifier: str) -> tuple[dict, dict]:
    settings = get_settings()
    if not settings.google_oauth_configured:
        raise RuntimeError("GOOGLE_OAUTH_NOT_CONFIGURED")
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            TOKEN_ENDPOINT,
            data={
                "code": code,
                "client_id": settings.google_oauth_client_id,
                "client_secret": settings.google_oauth_client_secret,
                "redirect_uri": settings.google_oauth_redirect_uri,
                "grant_type": "authorization_code",
                "code_verifier": verifier,
            },
        )
        response.raise_for_status()
        tokens = response.json()
        profile_response = await client.get(
            USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        profile_response.raise_for_status()
        return tokens, profile_response.json()


async def refresh_access_token(refresh_token: str) -> dict:
    settings = get_settings()
    if not settings.google_oauth_configured:
        raise RuntimeError("GOOGLE_OAUTH_NOT_CONFIGURED")
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            TOKEN_ENDPOINT,
            data={
                "client_id": settings.google_oauth_client_id,
                "client_secret": settings.google_oauth_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        return response.json()


async def revoke_token(token: str) -> None:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(REVOKE_ENDPOINT, params={"token": token})
        if response.status_code not in (200, 400):
            response.raise_for_status()
