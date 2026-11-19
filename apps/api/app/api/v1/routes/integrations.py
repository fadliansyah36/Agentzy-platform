"""Tenant-scoped Google Workspace OAuth consent and credential lifecycle."""

import hashlib
import secrets
from urllib.parse import urlencode
from uuid import UUID

import structlog
from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text

from app.adapters.google_oauth import (
    build_authorization_url,
    create_pkce_pair,
    exchange_authorization_code,
    refresh_access_token,
    revoke_token,
)
from app.core.config import get_settings
from app.core.security import current_claims
from app.db.session import engine

router = APIRouter(prefix="/integrations", tags=["Provider Integrations"])
claims_dependency = Depends(current_claims)
logger = structlog.get_logger()

ALLOWED_SCOPES = {
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/drive.file",
}


class OAuthStart(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID
    scopes: list[str] = Field(
        default_factory=lambda: ["openid", "email", "profile"],
        min_length=1,
        max_length=8,
    )


class OAuthRevoke(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenant_id: UUID


def _cipher() -> Fernet:
    key = get_settings().oauth_token_encryption_key
    if not key:
        raise HTTPException(status_code=503, detail="OAuth token encryption is not configured.")
    try:
        return Fernet(key.encode())
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="OAuth encryption key is invalid.") from exc


async def _require_tenant_integration_permission(user_id: UUID, tenant_id: UUID) -> None:
    async with engine.connect() as connection:
        allowed = await connection.execute(
            text("""
                select exists (
                  select 1
                  from public.memberships m
                  join public.membership_roles mr on mr.membership_id=m.id
                  join public.roles r on r.id=mr.role_id
                  join public.role_permissions rp on rp.role_id=r.id
                  where m.user_id=:user_id and m.tenant_id=:tenant_id and m.status='active'
                    and rp.permission_key='corporate.integrations.manage'
                    and (mr.valid_from is null or mr.valid_from<=now())
                    and (mr.valid_until is null or mr.valid_until>now())
                    and (r.tenant_id is null or r.tenant_id=m.tenant_id)
                )
            """),
            {"user_id": user_id, "tenant_id": tenant_id},
        )
    if not allowed.scalar_one():
        raise HTTPException(status_code=403, detail="Tenant integration permission required.")


@router.post("/google/oauth/start")
async def start_google_oauth(payload: OAuthStart, claims: dict = claims_dependency):
    user_id = UUID(claims["sub"])
    if not get_settings().google_oauth_configured:
        raise HTTPException(status_code=503, detail="Google OAuth is ready but not configured.")
    if not set(payload.scopes).issubset(ALLOWED_SCOPES):
        raise HTTPException(status_code=422, detail="Requested Google OAuth scope is not allowed.")
    await _require_tenant_integration_permission(user_id, payload.tenant_id)
    state = secrets.token_urlsafe(48)
    state_hash = hashlib.sha256(state.encode()).hexdigest()
    verifier, challenge = create_pkce_pair()
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                insert into public.provider_oauth_states(
                  provider,state_hash,tenant_id,user_id,requested_scopes,code_verifier,expires_at
                ) values(
                  'google_workspace',:state_hash,:tenant_id,:user_id,:scopes,:verifier,
                  now()+interval '10 minutes'
                )
            """),
            {
                "state_hash": state_hash,
                "tenant_id": payload.tenant_id,
                "user_id": user_id,
                "scopes": payload.scopes,
                "verifier": verifier,
            },
        )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,metadata
                ) values(
                  :tenant_id,:user_id,'integration.oauth.consent_started',
                  'provider_connection',:tenant_id,
                  jsonb_build_object('provider','google_workspace','scopes',to_jsonb(:scopes::text[]))
                )
            """),
            {
                "tenant_id": payload.tenant_id,
                "user_id": user_id,
                "scopes": payload.scopes,
            },
        )
    return {"authorization_url": build_authorization_url(state, challenge, payload.scopes)}


@router.get("/google/oauth/callback")
async def google_oauth_callback(
    request: Request,
    code: str | None = Query(default=None, max_length=4096),
    state: str = Query(min_length=24, max_length=256),
    error: str | None = Query(default=None, max_length=128),
):
    settings = get_settings()
    base = settings.app_base_url.rstrip("/")
    if error:
        logger.info("google_oauth_consent_denied", provider_error=error[:64])
        return RedirectResponse(
            f"{base}/integrations/callback?{urlencode({'provider': 'google', 'status': 'denied'})}"
        )
    if not code:
        raise HTTPException(status_code=400, detail="OAuth authorization code is missing.")
    state_hash = hashlib.sha256(state.encode()).hexdigest()
    async with engine.begin() as connection:
        result = await connection.execute(
            text("""
                update public.provider_oauth_states
                set consumed_at=now()
                where state_hash=:state_hash and provider='google_workspace'
                  and consumed_at is null and expires_at>now()
                returning tenant_id,user_id,requested_scopes,code_verifier
            """),
            {"state_hash": state_hash},
        )
        oauth_state = result.mappings().first()
    if oauth_state is None:
        raise HTTPException(
            status_code=400, detail="OAuth state is invalid, expired or already used."
        )
    tenant_id = UUID(str(oauth_state["tenant_id"]))
    user_id = UUID(str(oauth_state["user_id"]))
    try:
        await _require_tenant_integration_permission(user_id, tenant_id)
        tokens, profile = await exchange_authorization_code(code, oauth_state["code_verifier"])
        cipher = _cipher()
        expires_in = int(tokens.get("expires_in") or 3600)
        access_cipher = cipher.encrypt(tokens["access_token"].encode()).decode()
        refresh_cipher = (
            cipher.encrypt(tokens["refresh_token"].encode()).decode()
            if tokens.get("refresh_token")
            else None
        )
        async with engine.begin() as connection:
            await connection.execute(
                text("""
                    insert into public.provider_connections(
                      tenant_id,provider,provider_subject,provider_email,granted_scopes,
                      access_token_ciphertext,refresh_token_ciphertext,access_token_expires_at,
                      connected_by,consented_at
                    ) values(
                      :tenant_id,'google_workspace',:subject,:email,:scopes,
                      :access_token,:refresh_token,now()+(:expires||' seconds')::interval,
                      :user_id,now()
                    )
                    on conflict(tenant_id,provider,provider_subject) do update set
                      provider_email=excluded.provider_email,
                      granted_scopes=excluded.granted_scopes,
                      access_token_ciphertext=excluded.access_token_ciphertext,
                      refresh_token_ciphertext=coalesce(
                        excluded.refresh_token_ciphertext,provider_connections.refresh_token_ciphertext
                      ),
                      access_token_expires_at=excluded.access_token_expires_at,
                      connected_by=excluded.connected_by,consented_at=excluded.consented_at,
                      connected_at=now(),revoked_at=null,updated_at=now()
                """),
                {
                    "tenant_id": tenant_id,
                    "subject": profile["sub"],
                    "email": profile.get("email"),
                    "scopes": tokens.get("scope", "").split()
                    or list(oauth_state["requested_scopes"]),
                    "access_token": access_cipher,
                    "refresh_token": refresh_cipher,
                    "expires": expires_in,
                    "user_id": user_id,
                },
            )
            await connection.execute(
                text("""
                    insert into public.audit_logs(
                      tenant_id,actor_user_id,action,resource_type,resource_id,request_id,metadata
                    ) values(
                      :tenant_id,:user_id,'integration.oauth.connected',
                      'provider_connection',:subject,:request_id,
                      jsonb_build_object('provider','google_workspace','email',:email)
                    )
                """),
                {
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "subject": profile["sub"],
                    "email": profile.get("email"),
                    "request_id": getattr(request.state, "request_id", None),
                },
            )
    except Exception:
        logger.exception("google_oauth_callback_failed", tenant_id=str(tenant_id))
        return RedirectResponse(
            f"{base}/integrations/callback?{urlencode({'provider': 'google', 'status': 'failed'})}"
        )
    return RedirectResponse(
        f"{base}/integrations/callback?{urlencode({'provider': 'google', 'status': 'connected'})}"
    )


@router.get("/connections")
async def list_provider_connections(
    tenant_id: UUID,
    claims: dict = claims_dependency,
):
    user_id = UUID(claims["sub"])
    await _require_tenant_integration_permission(user_id, tenant_id)
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select id,provider,provider_email,granted_scopes,connected_by,
                       connected_at,last_refreshed_at,access_token_expires_at
                from public.provider_connections
                where tenant_id=:tenant_id and revoked_at is null
                order by connected_at desc
            """),
            {"tenant_id": tenant_id},
        )
    return {"data": [dict(row) for row in result.mappings().all()]}


@router.post("/connections/{connection_id}/refresh")
async def refresh_provider_connection(
    connection_id: UUID,
    payload: OAuthRevoke,
    claims: dict = claims_dependency,
):
    user_id = UUID(claims["sub"])
    await _require_tenant_integration_permission(user_id, payload.tenant_id)
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select refresh_token_ciphertext
                from public.provider_connections
                where id=:id and tenant_id=:tenant_id and revoked_at is null
            """),
            {"id": connection_id, "tenant_id": payload.tenant_id},
        )
        row = result.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Provider connection not found.")
    if not row["refresh_token_ciphertext"]:
        raise HTTPException(
            status_code=409, detail="Provider did not grant offline refresh consent."
        )
    cipher = _cipher()
    try:
        refresh_token = cipher.decrypt(row["refresh_token_ciphertext"].encode()).decode()
    except (InvalidToken, ValueError) as exc:
        raise HTTPException(
            status_code=500, detail="Stored provider credential cannot be decrypted."
        ) from exc
    try:
        tokens = await refresh_access_token(refresh_token)
        access_cipher = cipher.encrypt(tokens["access_token"].encode()).decode()
        expires_in = int(tokens.get("expires_in") or 3600)
        async with engine.begin() as connection:
            await connection.execute(
                text("""
                    update public.provider_connections
                    set access_token_ciphertext=:access_token,
                        refresh_token_ciphertext=coalesce(:refresh_token,refresh_token_ciphertext),
                        access_token_expires_at=now()+(:expires||' seconds')::interval,
                        last_refreshed_at=now(),updated_at=now()
                    where id=:id and tenant_id=:tenant_id and revoked_at is null
                """),
                {
                    "access_token": access_cipher,
                    "refresh_token": (
                        cipher.encrypt(tokens["refresh_token"].encode()).decode()
                        if tokens.get("refresh_token")
                        else None
                    ),
                    "expires": expires_in,
                    "id": connection_id,
                    "tenant_id": payload.tenant_id,
                },
            )
            await connection.execute(
                text("""
                    insert into public.audit_logs(
                      tenant_id,actor_user_id,action,resource_type,resource_id,metadata
                    ) values(
                      :tenant_id,:user_id,'integration.oauth.token_refreshed',
                      'provider_connection',:id,
                      jsonb_build_object('provider','google_workspace')
                    )
                """),
                {"tenant_id": payload.tenant_id, "user_id": user_id, "id": str(connection_id)},
            )
    except Exception as exc:
        logger.warning("google_oauth_token_refresh_failed", connection_id=str(connection_id))
        raise HTTPException(status_code=502, detail="Google token refresh failed.") from exc
    return {"data": {"id": str(connection_id), "status": "refreshed"}}


@router.post("/connections/{connection_id}/revoke")
async def revoke_provider_connection(
    connection_id: UUID,
    payload: OAuthRevoke,
    claims: dict = claims_dependency,
):
    user_id = UUID(claims["sub"])
    await _require_tenant_integration_permission(user_id, payload.tenant_id)
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                select access_token_ciphertext,refresh_token_ciphertext
                from public.provider_connections
                where id=:id and tenant_id=:tenant_id and revoked_at is null
            """),
            {"id": connection_id, "tenant_id": payload.tenant_id},
        )
        row = result.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Provider connection not found.")
    cipher = _cipher()
    try:
        encrypted = row["refresh_token_ciphertext"] or row["access_token_ciphertext"]
        token = cipher.decrypt(encrypted.encode()).decode()
    except (InvalidToken, ValueError) as exc:
        raise HTTPException(
            status_code=500, detail="Stored provider credential cannot be decrypted."
        ) from exc
    try:
        await revoke_token(token)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Google token revocation failed.") from exc
    async with engine.begin() as connection:
        await connection.execute(
            text("""
                update public.provider_connections
                set revoked_at=now(),updated_at=now()
                where id=:id and tenant_id=:tenant_id and revoked_at is null
            """),
            {"id": connection_id, "tenant_id": payload.tenant_id},
        )
        await connection.execute(
            text("""
                insert into public.audit_logs(
                  tenant_id,actor_user_id,action,resource_type,resource_id,metadata
                ) values(
                  :tenant_id,:user_id,'integration.oauth.revoked',
                  'provider_connection',:id,
                  jsonb_build_object('provider','google_workspace')
                )
            """),
            {"tenant_id": payload.tenant_id, "user_id": user_id, "id": str(connection_id)},
        )
    return {"data": {"id": str(connection_id), "status": "revoked"}}
