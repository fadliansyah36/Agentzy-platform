"""ClamAV daemon adapter using the INSTREAM protocol."""

import asyncio
import struct

from app.core.config import get_settings

settings = get_settings()
CHUNK_SIZE = 64 * 1024


async def scan_bytes(content: bytes) -> tuple[str, str]:
    if not settings.clamav_host:
        raise RuntimeError("CLAMAV_NOT_CONFIGURED")
    reader, writer = await asyncio.wait_for(
        asyncio.open_connection(settings.clamav_host, settings.clamav_port),
        timeout=settings.clamav_timeout_seconds,
    )
    try:
        writer.write(b"zINSTREAM\\0")
        for offset in range(0, len(content), CHUNK_SIZE):
            chunk = content[offset : offset + CHUNK_SIZE]
            writer.write(struct.pack("!I", len(chunk)))
            writer.write(chunk)
        writer.write(struct.pack("!I", 0))
        await writer.drain()
        response = await asyncio.wait_for(
            reader.readuntil(b"\\0"), timeout=settings.clamav_timeout_seconds
        )
        message = response.rstrip(b"\\0").decode("utf-8", errors="replace")
        if message.endswith(" OK"):
            return "clean", message
        if " FOUND" in message:
            return "infected", message[:500]
        raise RuntimeError("CLAMAV_INVALID_RESPONSE")
    finally:
        writer.close()
        await writer.wait_closed()
