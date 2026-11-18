from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

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
        if not claims.get("sub"):
            raise ValueError("Missing JWT subject")
        return claims
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from exc


async def current_claims(
    credentials: HTTPAuthorizationCredentials | None = bearer_dependency,
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer access token required")
    return decode_access_token(credentials.credentials)
