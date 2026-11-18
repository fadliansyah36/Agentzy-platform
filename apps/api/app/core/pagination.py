"""Cursor pagination primitives shared by Phase 01 management APIs."""

import base64
import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, Field


class PageMeta(BaseModel):
    has_more: bool
    next_cursor: str | None
    request_id: str | None = None


class PageResponse(BaseModel):
    data: list[dict[str, Any]]
    meta: PageMeta


def encode_time_id_cursor(created_at: datetime, row_id: UUID) -> str:
    value = {"created_at": created_at.isoformat(), "id": str(row_id)}
    raw = json.dumps(value, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_time_id_cursor(cursor: str) -> tuple[datetime, UUID]:
    try:
        if not cursor or len(cursor) > 512:
            raise ValueError("invalid cursor length")
        raw = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        value = json.loads(raw)
        created_at = datetime.fromisoformat(value["created_at"])
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=UTC)
        return created_at, UUID(value["id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail="Invalid cursor") from exc


def encode_key_cursor(key: str) -> str:
    raw = json.dumps({"key": key}, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_key_cursor(cursor: str) -> str:
    try:
        if not cursor or len(cursor) > 512:
            raise ValueError("invalid cursor length")
        raw = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        value = json.loads(raw)
        key = value["key"]
        if not isinstance(key, str) or not key:
            raise ValueError("invalid cursor key")
        return key
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail="Invalid cursor") from exc
