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
    url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/"
        f"{BUCKET}/{encoded_path}"
    )
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.content
