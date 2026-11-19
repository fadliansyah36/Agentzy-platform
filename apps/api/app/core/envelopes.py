"""Versioned success-envelope normalization for the public API contract."""

from typing import Any


def success_envelope(payload: Any, request_context: dict[str, str | None]) -> Any:
    """Wrap legacy direct success payloads without double-wrapping established envelopes."""
    if isinstance(payload, dict):
        if "error" in payload:
            return payload
        if "data" in payload and "meta" in payload:
            return payload
    return {
        "data": payload,
        "meta": {
            **request_context,
            "envelope_version": 1,
        },
    }
