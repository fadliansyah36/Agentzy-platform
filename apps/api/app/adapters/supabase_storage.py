"""Private Supabase Storage adapter for quarantined partnership attachments."""

from urllib.parse import quote

import httpx

from app.core.config import get_settings

settings = get_settings()
BUCKET = "partnership-quarantine"


async def download_quarantined_object(object_path: str) -> bytes:
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_STORAGE_CREDENTIALS_NOT_CONFIGURED")
    encoded_path = quote(object_path, safe="/")
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{BUCKET}/{encoded_path}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.content


def _storage_headers(content_type: str | None = None) -> dict[str, str]:
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_STORAGE_CREDENTIALS_NOT_CONFIGURED")
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    if content_type:
        headers["Content-Type"] = content_type
        headers["x-upsert"] = "false"
    return headers


def _object_url(object_path: str) -> str:
    encoded_path = quote(object_path, safe="/")
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{BUCKET}/{encoded_path}"


async def upload_quarantined_object(object_path: str, content: bytes, content_type: str) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            _object_url(object_path),
            content=content,
            headers=_storage_headers(content_type),
        )
    if response.status_code not in (200, 201):
        raise RuntimeError("SUPABASE_STORAGE_UPLOAD_FAILED")


async def delete_quarantined_object(object_path: str) -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.delete(
            _object_url(object_path),
            headers=_storage_headers(),
        )
    if response.status_code not in (200, 204, 404):
        raise RuntimeError("SUPABASE_STORAGE_COMPENSATION_FAILED")


async def create_quarantined_signed_url(object_path: str, expires_in_seconds: int = 60) -> str:
    url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/"
        f"{BUCKET}/{quote(object_path, safe='/')}"
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            url,
            headers=_storage_headers(),
            json={"expiresIn": expires_in_seconds},
        )
    if response.status_code not in (200, 201):
        raise RuntimeError("SUPABASE_STORAGE_SIGNED_URL_FAILED")
    signed_path = response.json().get("signedURL")
    if not signed_path:
        raise RuntimeError("SUPABASE_STORAGE_SIGNED_URL_MISSING")
    if signed_path.startswith("http"):
        return signed_path
    return f"{settings.supabase_url.rstrip('/')}/storage/v1{signed_path}"
