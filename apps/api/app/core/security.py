from functools import lru_cache
from typing import Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import text

from app.core.config import get_settings

bearer = HTTPBearer(auto_error=False)
bearer_dependency = Depends(bearer)


@lru_cache
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(f"{get_settings().supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json")


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        header = jwt.get_unverified_header(token)
        issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1"
        if header.get("alg") == "HS256" and settings.supabase_jwt_secret:
            claims = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience=settings.supabase_jwt_audience,
                issuer=issuer,
            )
        else:
            signing_key = _jwks_client().get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience=settings.supabase_jwt_audience,
                issuer=issuer,
            )
        if claims.get("role") != "authenticated":
            raise ValueError("JWT is not an end-user access token")
        if not claims.get("sub") or not claims.get("session_id"):
            raise ValueError("JWT is missing subject or session identifier")
        UUID(claims["sub"])
        UUID(claims["session_id"])
        return claims
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from exc


async def current_claims(
    credentials: HTTPAuthorizationCredentials | None = bearer_dependency,
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer access token required")
    claims = decode_access_token(credentials.credentials)

    # A valid signature is not sufficient after logout, account suspension or deletion.
    # Fail closed if the authoritative Auth/session state cannot be checked.
    from app.db.session import engine

    try:
        async with engine.connect() as connection:
            active = await connection.execute(
                text("""
                    select exists (
                      select 1
                      from auth.sessions s
                      join auth.users u on u.id=s.user_id
                      where s.id=:session_id
                        and s.user_id=:user_id
                        and (s.not_after is null or s.not_after > now())
                        and u.deleted_at is null
                        and (u.banned_until is null or u.banned_until < now())
                        and not exists (
                          select 1 from public.revoked_sessions rs
                          where rs.session_id=s.id and rs.expires_at > now()
                        )
                    )
                """),
                {
                    "session_id": UUID(claims["session_id"]),
                    "user_id": UUID(claims["sub"]),
                },
            )
            if not active.scalar_one():
                raise HTTPException(status_code=401, detail="Session is no longer active.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail="Identity/session verification is temporarily unavailable."
        ) from exc

    return claims
