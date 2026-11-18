"""Recursive redaction for audit and security event payloads."""

import re
from collections.abc import Mapping
from typing import Any

_REDACTED = "[REDACTED]"
_SENSITIVE_KEYS = frozenset(
    {
        "accesstoken",
        "refreshtoken",
        "idtoken",
        "token",
        "secret",
        "clientsecret",
        "password",
        "passwd",
        "credential",
        "credentials",
        "authorization",
        "proxyauthorization",
        "cookie",
        "setcookie",
        "apikey",
        "privatekey",
        "email",
        "emailaddress",
        "phone",
        "phonenumber",
        "mobile",
        "ip",
        "ipaddress",
        "useragent",
        "sessiontoken",
        "webhooksecret",
        "nik",
        "npwp",
        "passport",
        "bankaccount",
        "accountnumber",
        "dateofbirth",
    }
)
_SENSITIVE_SUFFIXES = (
    "accesstoken",
    "refreshtoken",
    "idtoken",
    "clientsecret",
    "webhooksecret",
    "password",
    "credential",
    "authorization",
    "cookie",
    "apikey",
    "privatekey",
    "emailaddress",
    "email",
    "phonenumber",
    "phone",
    "mobile",
    "ipaddress",
    "ip",
    "sessiontoken",
    "sessionid",
    "servicerolekey",
    "secretkey",
)
_BEARER = re.compile(r"(?i)(?<![A-Za-z0-9])Bearer[ \t]+[A-Za-z0-9._~+/=-]{12,}")
_JWT = re.compile(
    r"(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}(?![A-Za-z0-9_-])"
)
_OPAQUE_KEY = re.compile(r"(?<![A-Za-z0-9])(?:sk-proj-|sk-live-|sb_secret_)[A-Za-z0-9_-]{16,}")


def _normalized_key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def redact_audit_value(value: Any) -> Any:
    """Redact sensitive fields recursively and opaque bearer/JWT credentials in text."""
    if isinstance(value, Mapping):
        result = {}
        for key, item in value.items():
            normalized = _normalized_key(key)
            sensitive = normalized in _SENSITIVE_KEYS or any(
                normalized.endswith(suffix) for suffix in _SENSITIVE_SUFFIXES
            )
            result[str(key)] = _REDACTED if sensitive else redact_audit_value(item)
        return result
    if isinstance(value, list):
        return [redact_audit_value(item) for item in value]
    if isinstance(value, tuple):
        return [redact_audit_value(item) for item in value]
    if isinstance(value, str):
        redacted = _BEARER.sub(_REDACTED, value)
        redacted = _JWT.sub(_REDACTED, redacted)
        return _OPAQUE_KEY.sub(_REDACTED, redacted)
    return value
