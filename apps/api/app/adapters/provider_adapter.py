"""Authorized, opt-in provider adapters. Credentials remain deployment-only environment secrets."""
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
    async def check_coverage(self, config: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]: ...
    async def submit_order(self, config: dict[str, Any], payload: dict[str, Any], *, idempotency_key: str) -> ProviderSubmission: ...
    async def check_health(self, config: dict[str, Any]) -> str: ...


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
        if not resolved or any(not ipaddress.ip_address(item[4][0]).is_global for item in resolved):
            raise ValueError("PROVIDER_ENDPOINT_NOT_PUBLIC")


def _path_value(value: Any, path: str) -> Any:
    current = value
    for part in path.split("."):
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
            current = current[int(part)]
        else:
            return None
    return current


def _mapped_request(payload: dict[str, Any], mapping: dict[str, Any] | None) -> dict[str, Any]:
    if not mapping:
        return payload
    mapped: dict[str, Any] = {}
    for provider_field, source_path in mapping.items():
        if isinstance(provider_field, str) and isinstance(source_path, str):
            value = _path_value(payload, source_path)
            if value is not None:
                mapped[provider_field] = value
    return mapped


def _secret(config: dict[str, Any]) -> str | None:
    key = str(config.get("auth_env_key") or "")
    return os.getenv(key) if key.startswith("AGENTZY_PROVIDER_AUTH__") else None


def _response_value(body: dict[str, Any], mapping: dict[str, Any], key: str, default: str) -> Any:
    return _path_value(body, str(mapping.get(key) or default))


def _response_hash(body: Any) -> str:
    return hashlib.sha256(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()


class HttpJsonProviderAdapter:
    async def check_coverage(self, config: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
        if not config.get("enabled") or config.get("adapter_key") != "http_json":
            return {"result_status": "unknown", "error_code": "PROVIDER_ADAPTER_NOT_ENABLED"}
        response_mapping=config.get("response_mapping") or {}
        coverage_path=str(response_mapping.get("coverage_path") or "/coverage-check")
        if not coverage_path.startswith("/") or ".." in coverage_path.split("/"):
            return {"result_status":"unknown","error_code":"PROVIDER_COVERAGE_PATH_INVALID"}
        endpoint = str(config.get("endpoint_url") or "").rstrip("/") + coverage_path
        try:
            _assert_authorized_endpoint(endpoint)
        except ValueError as exc:
            return {"result_status": "unknown", "error_code": str(exc)}
        token = _secret(config)
        if not token:
            return {"result_status": "unknown", "error_code": "PROVIDER_CREDENTIAL_NOT_CONFIGURED"}
        try:
            async with httpx.AsyncClient(timeout=float(config.get("timeout_seconds") or 15), trust_env=False, follow_redirects=False) as client:
                response = await client.post(endpoint, json=_mapped_request(payload, config.get("request_mapping")),
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                        "Idempotency-Key": str(payload.get("request_reference") or "agentzy-coverage-check")})
                response.raise_for_status()
                body = response.json() if response.content else {}
        except httpx.TimeoutException:
            return {"result_status": "failed", "error_code": "PROVIDER_TIMEOUT"}
        except httpx.HTTPStatusError as exc:
            code = "PROVIDER_COVERAGE_REJECTED" if 400 <= exc.response.status_code < 500 else "PROVIDER_REQUEST_FAILED"
            return {"result_status": "failed", "error_code": code}
        except (httpx.HTTPError, ValueError):
            return {"result_status": "failed", "error_code": "PROVIDER_REQUEST_FAILED"}
        if not isinstance(body, dict):
            return {"result_status": "unknown", "error_code": "PROVIDER_RESPONSE_INVALID"}
        mapping = config.get("response_mapping") or {}
        status = str(_response_value(body, mapping, "coverage_status_key", "coverage_status") or "").strip().lower()
        if status not in ("available", "unavailable"):
            return {"result_status": "unknown", "error_code": "PROVIDER_RESPONSE_UNMAPPED"}
        reference = _response_value(body, mapping, "reference_key", "reference")
        return {"result_status": status, "error_code": None,
            "provider_reference": str(reference)[:160] if reference else None, "response_hash": _response_hash(body)}

    async def submit_order(self, config: dict[str, Any], payload: dict[str, Any], *, idempotency_key: str) -> ProviderSubmission:
        if not config.get("enabled") or config.get("adapter_key") != "http_json":
            return ProviderSubmission(False, None, None, "PROVIDER_ADAPTER_NOT_ENABLED")
        endpoint = str(config.get("endpoint_url") or "")
        try:
            _assert_authorized_endpoint(endpoint)
        except ValueError as exc:
            return ProviderSubmission(False, None, None, str(exc))
        token = _secret(config)
        if not token:
            return ProviderSubmission(False, None, None, "PROVIDER_CREDENTIAL_NOT_CONFIGURED")
        try:
            async with httpx.AsyncClient(timeout=float(config.get("timeout_seconds") or 15), trust_env=False, follow_redirects=False) as client:
                response = await client.post(endpoint, json=_mapped_request(payload, config.get("request_mapping")),
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Idempotency-Key": idempotency_key})
                response.raise_for_status()
                body = response.json() if response.content else {}
        except httpx.TimeoutException:
            return ProviderSubmission(False, None, None, "PROVIDER_TIMEOUT")
        except httpx.HTTPStatusError as exc:
            code = "PROVIDER_REQUEST_REJECTED" if 400 <= exc.response.status_code < 500 else "PROVIDER_REQUEST_FAILED"
            return ProviderSubmission(False, None, None, code)
        except (httpx.HTTPError, ValueError):
            return ProviderSubmission(False, None, None, "PROVIDER_REQUEST_FAILED")
        if not isinstance(body, dict):
            return ProviderSubmission(False, None, None, "PROVIDER_RESPONSE_INVALID")
        mapping = config.get("response_mapping") or {}
        accepted = _response_value(body, mapping, "accepted_key", "accepted")
        status = str(_response_value(body, mapping, "status_key", "status") or "").strip().lower()
        accepted_states = {str(value).lower() for value in mapping.get("accepted_statuses", ["accepted", "received", "pending", "submitted"])}
        digest = _response_hash(body)
        if accepted is False or status in {"rejected", "declined", "failed", "error"}:
            return ProviderSubmission(False, None, digest, "PROVIDER_SUBMISSION_REJECTED")
        if accepted is not None and accepted is not True and str(accepted).lower() not in ("true", "1", "yes"):
            return ProviderSubmission(False, None, digest, "PROVIDER_RESPONSE_UNMAPPED")
        if status and accepted is None and status not in accepted_states:
            return ProviderSubmission(False, None, digest, "PROVIDER_RESPONSE_UNMAPPED")
        reference = _response_value(body, mapping, "reference_key", "reference") or body.get("order_reference")
        return ProviderSubmission(True, str(reference)[:160] if reference else None, digest, None)

    async def check_health(self, config: dict[str, Any]) -> str:
        if not config.get("enabled"):
            return "pending_external_configuration"
        endpoint = str(config.get("health_url") or "")
        try:
            _assert_authorized_endpoint(endpoint)
        except ValueError:
            return "pending_external_configuration"
        token = _secret(config)
        if not token:
            return "pending_external_configuration"
        try:
            async with httpx.AsyncClient(timeout=float(config.get("timeout_seconds") or 15), trust_env=False, follow_redirects=False) as client:
                response = await client.get(endpoint, headers={"Authorization": f"Bearer {token}"})
            return "healthy" if 200 <= response.status_code < 300 else "unavailable"
        except httpx.HTTPError:
            return "unavailable"


class ContractOnlyProviderAdapter:
    async def check_coverage(self, config: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
        return {"result_status": "unknown", "error_code": "PROVIDER_CHANNEL_PENDING_EXTERNAL_CONFIGURATION"}

    async def submit_order(self, config: dict[str, Any], payload: dict[str, Any], *, idempotency_key: str) -> ProviderSubmission:
        if config.get("adapter_key") == "secure_file_exchange":
            return ProviderSubmission(False, None, None, "PROVIDER_SECURE_FILE_EXCHANGE_PENDING_EXTERNAL_CONFIGURATION")
        return ProviderSubmission(False, None, None, "PROVIDER_PARTNER_PORTAL_PENDING_EXTERNAL_CONFIGURATION")

    async def check_health(self, config: dict[str, Any]) -> str:
        return "pending_external_configuration"
