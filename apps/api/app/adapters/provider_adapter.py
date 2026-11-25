"""Authorized, opt-in provider adapter contracts. No credentials are stored in PostgreSQL."""
from __future__ import annotations

import hashlib
import ipaddress
import json
import os
import socket
from dataclasses import dataclass
from typing import Any, Protocol
from urllib.parse import urlsplit

import httpx


@dataclass(frozen=True)
class ProviderSubmission:
    accepted: bool
    provider_reference: str | None
    response_hash: str | None
    error_code: str | None


class ProviderAdapter(Protocol):
    async def submit_order(self, config: dict[str, Any], payload: dict[str, Any]) -> ProviderSubmission: ...


def _assert_authorized_endpoint(endpoint: str) -> None:
    parsed = urlsplit(endpoint)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("PROVIDER_ENDPOINT_INVALID")
    host = parsed.hostname.lower().rstrip(".")
    allowed = {item.strip().lower().rstrip(".") for item in os.getenv("AGENTZY_PROVIDER_ALLOWED_HOSTS", "").split(",") if item.strip()}
    if not allowed or host not in allowed:
        raise ValueError("PROVIDER_HOST_NOT_ALLOWLISTED")
    try:
        address = ipaddress.ip_address(host)
        if not address.is_global:
            raise ValueError("PROVIDER_ENDPOINT_NOT_PUBLIC")
    except ValueError as exc:
        if str(exc) == "PROVIDER_ENDPOINT_NOT_PUBLIC":
            raise
        try:
            resolved = socket.getaddrinfo(host, parsed.port or 443, type=socket.SOCK_STREAM)
        except OSError as dns_error:
            raise ValueError("PROVIDER_DNS_UNAVAILABLE") from dns_error
        if any(not ipaddress.ip_address(item[4][0]).is_global for item in resolved):
            raise ValueError("PROVIDER_ENDPOINT_NOT_PUBLIC")


class HttpJsonProviderAdapter:
    async def check_coverage(self, config: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
        if not config.get("enabled") or config.get("adapter_key") != "http_json":
            return {"result_status":"unknown","error_code":"PROVIDER_ADAPTER_NOT_ENABLED"}
        endpoint = str(config.get("endpoint_url") or "").rstrip("/") + "/coverage-check"
        try:
            _assert_authorized_endpoint(endpoint)
        except ValueError as exc:
            return {"result_status":"unknown","error_code":str(exc)}
        auth_key = str(config.get("auth_env_key") or "")
        token = os.getenv(auth_key) if auth_key.startswith("AGENTZY_PROVIDER_AUTH__") else None
        if not token:
            return {"result_status":"unknown","error_code":"PROVIDER_CREDENTIAL_NOT_CONFIGURED"}
        try:
            async with httpx.AsyncClient(timeout=float(config.get("timeout_seconds") or 15), trust_env=False) as client:
                response = await client.post(endpoint,json=payload,headers={"Authorization":f"Bearer {token}","Content-Type":"application/json"})
                response.raise_for_status()
                body = response.json() if response.content else {}
        except httpx.TimeoutException:
            return {"result_status":"failed","error_code":"PROVIDER_TIMEOUT"}
        except (httpx.HTTPError,ValueError):
            return {"result_status":"failed","error_code":"PROVIDER_REQUEST_FAILED"}
        status = str(body.get("coverage_status","")).lower()
        if status not in ("available","unavailable"):
            return {"result_status":"unknown","error_code":"PROVIDER_RESPONSE_UNMAPPED"}
        return {"result_status":status,"error_code":None,"provider_reference":str(body.get("reference") or "")[:160] or None,
                "response_hash":hashlib.sha256(json.dumps(body,sort_keys=True,default=str).encode()).hexdigest()}

    async def submit_order(self, config: dict[str, Any], payload: dict[str, Any]) -> ProviderSubmission:
        if not config.get("enabled") or config.get("adapter_key") != "http_json":
            return ProviderSubmission(False, None, None, "PROVIDER_ADAPTER_NOT_ENABLED")
        endpoint = str(config.get("endpoint_url") or "")
        try:
            _assert_authorized_endpoint(endpoint)
        except ValueError as exc:
            return ProviderSubmission(False, None, None, str(exc))
        auth_key = str(config.get("auth_env_key") or "")
        if not auth_key or not auth_key.startswith("AGENTZY_PROVIDER_AUTH__"):
            return ProviderSubmission(False, None, None, "PROVIDER_AUTH_REFERENCE_MISSING")
        token = os.getenv(auth_key)
        if not token:
            return ProviderSubmission(False, None, None, "PROVIDER_CREDENTIAL_NOT_CONFIGURED")
        timeout = float(config.get("timeout_seconds") or 15)
        try:
            async with httpx.AsyncClient(timeout=timeout, trust_env=False) as client:
                response = await client.post(
                    endpoint,
                    json=payload,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                )
                response.raise_for_status()
                body = response.json() if response.content else {}
        except httpx.TimeoutException:
            return ProviderSubmission(False, None, None, "PROVIDER_TIMEOUT")
        except (httpx.HTTPError, ValueError):
            return ProviderSubmission(False, None, None, "PROVIDER_REQUEST_FAILED")
        response_hash = hashlib.sha256(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()
        reference = body.get("reference") or body.get("order_reference")
        return ProviderSubmission(True, str(reference)[:160] if reference else None, response_hash, None)

class ContractOnlyProviderAdapter:
    """Explicit hand-off adapter for partner portal / secure file exchange contracts.

    It never fabricates an acknowledgement. The outbox remains blocked until an
    authorized partner channel and its operator credentials are configured.
    """
    async def submit_order(self, config: dict[str, Any], payload: dict[str, Any]) -> ProviderSubmission:
        key = str(config.get("adapter_key") or "unknown")
        if key == "secure_file_exchange":
            return ProviderSubmission(False,None,None,"PROVIDER_SECURE_FILE_EXCHANGE_PENDING_EXTERNAL_CONFIGURATION")
        return ProviderSubmission(False,None,None,"PROVIDER_PARTNER_PORTAL_PENDING_EXTERNAL_CONFIGURATION")
