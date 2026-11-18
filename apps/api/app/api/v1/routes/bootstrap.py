import hmac
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, field_validator
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import engine

router = APIRouter()


class BootstrapAdminRequest(BaseModel):
    email: str
    full_name: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if (
            len(normalized) > 254
            or "@" not in normalized
            or normalized.startswith("@")
            or normalized.endswith("@")
        ):
            raise ValueError("Alamat email tidak valid.")
        return normalized

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized or len(normalized) > 120:
            raise ValueError("Nama wajib diisi (maksimal 120 karakter).")
        return normalized


@router.post("/platform-admin", status_code=status.HTTP_201_CREATED, tags=["Bootstrap"])
async def bootstrap_platform_admin(
    payload: BootstrapAdminRequest,
    request: Request,
    bootstrap_token: Annotated[str | None, Header(alias="X-Platform-Bootstrap-Token")] = None,
):
    settings = get_settings()
    expected_token = settings.platform_bootstrap_token
    service_key = settings.supabase_service_role_key
    if not expected_token or not service_key:
        raise HTTPException(
            status_code=503, detail="Bootstrap belum dikonfigurasi pada service API."
        )
    if not bootstrap_token or not hmac.compare_digest(bootstrap_token, expected_token):
        raise HTTPException(status_code=403, detail="Token bootstrap tidak valid.")

    async with engine.connect() as connection:
        existing = await connection.execute(
            text("""
            select count(*)
            from public.membership_roles mr
            join public.roles r on r.id = mr.role_id
            join public.memberships m on m.id = mr.membership_id
            where r.key = 'platform_super_admin' and m.status = 'active'
        """)
        )
        if int(existing.scalar_one()) > 0:
            raise HTTPException(
                status_code=409, detail="Platform Super Admin sudah pernah di-bootstrap."
            )

    invite_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/invite"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                invite_url,
                params={"redirect_to": f"{settings.app_base_url.rstrip('/')}/admin"},
                headers=headers,
                json={"email": payload.email, "data": {"full_name": payload.full_name}},
            )
        if response.status_code >= 400:
            detail = (
                response.json().get("msg")
                or response.json().get("message")
                or "Supabase Auth menolak undangan."
            )
            raise HTTPException(status_code=400, detail=detail)
        invited_user = response.json()
        user_id = UUID(invited_user["id"])
    except HTTPException:
        raise
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=502, detail="Gagal membuat undangan administrator melalui Supabase Auth."
        ) from exc

    try:
        async with engine.begin() as connection:
            tenant_result = await connection.execute(
                text("""
                insert into public.tenants(name,slug,tenant_type,status)
                values ('Agentzy Platform','agentzy-platform','internal','active')
                on conflict (slug) do update set name=excluded.name
                returning id
            """)
            )
            tenant_id = tenant_result.scalar_one()
            membership_result = await connection.execute(
                text("""
                insert into public.memberships(tenant_id,user_id,status,joined_at)
                values (:tenant_id,:user_id,'active',now())
                on conflict (tenant_id,user_id) do update
                  set status='active',
                      joined_at=coalesce(public.memberships.joined_at,now()),
                      updated_at=now()
                returning id
            """),
                {"tenant_id": tenant_id, "user_id": user_id},
            )
            membership_id = membership_result.scalar_one()
            await connection.execute(
                text("""
                insert into public.membership_roles(membership_id,role_id,assigned_by)
                select :membership_id, id, null
                from public.roles
                where key='platform_super_admin'
                  and tenant_id is null
                on conflict do nothing
            """),
                {"membership_id": membership_id},
            )
            await connection.execute(
                text("""
                insert into public.audit_logs(
                    tenant_id, actor_user_id, action, resource_type,
                    resource_id, request_id, ip_address, metadata
                )
                values (
                    :tenant_id, :actor, 'platform.bootstrap_admin.invited',
                    'membership', :membership_id, :request_id, :ip,
                    jsonb_build_object('email', :email)
                )
            """),
                {
                    "tenant_id": tenant_id,
                    "actor": user_id,
                    "membership_id": str(membership_id),
                    "request_id": request.headers.get("x-request-id"),
                    "ip": request.client.host if request.client else None,
                    "email": payload.email,
                },
            )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Undangan terkirim, tetapi provisioning membership gagal. "
                "Perlu rekonsiliasi sebelum mengulang bootstrap."
            ),
        ) from exc

    return {
        "status": "invited",
        "email": payload.email,
        "user_id": str(user_id),
        "tenant_id": str(tenant_id),
        "message": (
            "Undangan administrator dikirim. Selesaikan verifikasi email, "
            "atur password, lalu daftarkan MFA TOTP sebelum login ke Super Admin."
        ),
    }
