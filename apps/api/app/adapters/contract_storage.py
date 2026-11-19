"""Private Supabase Storage adapter for contract documents."""

from urllib.parse import quote

import httpx

from app.core.config import get_settings

BUCKET = "contract-documents"
MAX_DOCUMENT_BYTES = 25 * 1024 * 1024


def _headers(content_type: str | None = None) -> dict[str, str]:
    key = get_settings().supabase_service_role_key
    if not key:
        raise RuntimeError("SUPABASE_STORAGE_CREDENTIALS_NOT_CONFIGURED")
    result = {"Authorization": f"Bearer {key}", "apikey": key}
    if content_type:
        result["Content-Type"] = content_type
        result["x-upsert"] = "false"
    return result


def _object_url(path: str) -> str:
    base = get_settings().supabase_url.rstrip("/")
    return f"{base}/storage/v1/object/{BUCKET}/{quote(path, safe='/')}"


async def upload_contract_document(path: str, content: bytes, content_type: str) -> None:
    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            _object_url(path), content=content, headers=_headers(content_type)
        )
    if response.status_code not in (200, 201):
        raise RuntimeError("CONTRACT_DOCUMENT_UPLOAD_FAILED")


async def delete_contract_document(path: str) -> None:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.delete(_object_url(path), headers=_headers())
    if response.status_code not in (200, 204, 404):
        raise RuntimeError("CONTRACT_DOCUMENT_DELETE_FAILED")


async def create_contract_document_signed_url(path: str, expires_in: int = 60) -> str:
    url = (
        f"{get_settings().supabase_url.rstrip('/')}/storage/v1/object/sign/"
        f"{BUCKET}/{quote(path, safe='/')}"
    )
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            url, headers=_headers(), json={"expiresIn": expires_in}
        )
    if response.status_code not in (200, 201):
        raise RuntimeError("CONTRACT_DOCUMENT_SIGNED_URL_FAILED")
    signed_path = response.json().get("signedURL")
    if not signed_path:
        raise RuntimeError("CONTRACT_DOCUMENT_SIGNED_URL_MISSING")
    if signed_path.startswith("http"):
        return signed_path
    return f"{get_settings().supabase_url.rstrip('/')}/storage/v1{signed_path}"
