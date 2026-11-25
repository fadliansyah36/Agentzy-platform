import asyncio
from datetime import UTC, datetime

import pytest
from fastapi import HTTPException
from uuid import uuid4

from app.domain.sales import LEAD_TRANSITIONS, ORDER_TRANSITIONS, normalize_provider_status, transition_allowed
from app.core.pagination import decode_time_id_cursor, encode_time_id_cursor
from app.services.sales_service import SalesService
from app.adapters.provider_adapter import HttpJsonProviderAdapter, _assert_authorized_endpoint, _mapped_request
from app.api.v1.routes.sales import OrderAttributionCorrection, OrderCreate, ProviderIntegrationInput


def test_lead_lifecycle_is_ordered_and_terminal():
    assert transition_allowed("lead_created","assigned")
    assert transition_allowed("assigned","contacted")
    assert transition_allowed("contacted","qualified")
    assert transition_allowed("qualified","coverage_checked")
    assert transition_allowed("coverage_checked","offer_presented")
    assert transition_allowed("offer_presented","order_submitted")
    assert not transition_allowed("lead_created","order_submitted")
    assert not transition_allowed("closed","assigned")
    assert not LEAD_TRANSITIONS["closed"]


def test_order_lifecycle_blocks_client_provider_decisions():
    assert transition_allowed("draft","submitted",order=True)
    assert not transition_allowed("draft","provider_approved",order=True)
    assert transition_allowed("provider_approved","installation_scheduled",order=True)
    assert transition_allowed("installation_in_progress","activated",order=True)
    assert not transition_allowed("activated","cancelled",order=True)
    assert not ORDER_TRANSITIONS["activated"]


def test_provider_status_mapping_is_allowlisted():
    mapping={"accepted":"provider_pending","approved":"provider_approved","live":"activated"}
    assert normalize_provider_status("APPROVED",mapping)=="provider_approved"
    assert normalize_provider_status("unknown-state",mapping) is None
    assert normalize_provider_status("accepted",{"accepted":"invented"}) is None


def test_sales_service_enforces_transition_and_coverage_invariants():
    SalesService.assert_lead_transition("qualified","coverage_checked")
    SalesService.assert_order_transition("draft","submitted")
    with pytest.raises(HTTPException):
        SalesService.assert_order_transition("draft","provider_approved")
    with pytest.raises(HTTPException):
        SalesService.assert_offerable_coverage("unknown","product-a","product-a")
    SalesService.assert_offerable_coverage("available","product-a","product-a")


def test_sales_provider_payload_is_normalized_without_client_status():
    payload=SalesService.provider_submission_payload({
        "order_number":"AGZ-20261125-ABC123",
        "customer_name":"Example Customer",
        "contact_name":"Example Contact",
        "email":None,
        "phone":"0812000000",
        "service_address":"Bogor",
        "product_code":"INET-100",
        "product_name":"Internet 100 Mbps",
    })
    assert payload["order_reference"]=="AGZ-20261125-ABC123"
    assert payload["product"]["code"]=="INET-100"
    assert "status" not in payload


def test_sales_cursor_round_trip():
    created_at=datetime(2026,11,25,11,0,tzinfo=UTC)
    row_id=uuid4()
    assert decode_time_id_cursor(encode_time_id_cursor(created_at,row_id))==(created_at,row_id)


def test_provider_request_mapping_uses_normalized_nested_values():
    payload = {
        "order_reference": "AGZ-ORDER-01",
        "customer": {"name": "Example", "address": {"service": "Bogor"}},
    }
    mapped = _mapped_request(payload, {
        "external_order_id": "order_reference",
        "subscriber_name": "customer.name",
        "installation_address": "customer.address.service",
    })
    assert mapped == {
        "external_order_id": "AGZ-ORDER-01",
        "subscriber_name": "Example",
        "installation_address": "Bogor",
    }


def test_provider_endpoint_requires_explicit_allowlisted_https_host(monkeypatch):
    monkeypatch.setenv("AGENTZY_PROVIDER_ALLOWED_HOSTS", "api.authorized-provider.example")
    with pytest.raises(ValueError, match="PROVIDER_HOST_NOT_ALLOWLISTED"):
        _assert_authorized_endpoint("https://unapproved.example/v1/orders")
    with pytest.raises(ValueError, match="PROVIDER_ENDPOINT_INVALID"):
        _assert_authorized_endpoint("http://api.authorized-provider.example/v1/orders")


def test_provider_integration_accepts_only_environment_secret_references():
    valid = ProviderIntegrationInput(
        tenant_id=uuid4(),
        adapter_key="http_json",
        endpoint_url="https://api.authorized-provider.example/v1/orders",
        auth_env_key="AGENTZY_PROVIDER_AUTH__EXAMPLE",
        webhook_secret_env_key="AGENTZY_PROVIDER_WEBHOOK__EXAMPLE",
        enabled=True,
    )
    assert valid.enabled is True
    with pytest.raises(ValueError):
        ProviderIntegrationInput(
            tenant_id=uuid4(),
            adapter_key="http_json",
            endpoint_url="https://api.authorized-provider.example/v1/orders",
            auth_env_key="DATABASE_URL",
            webhook_secret_env_key="AGENTZY_PROVIDER_WEBHOOK__EXAMPLE",
            enabled=True,
        )


def test_unconfigured_coverage_never_returns_available():
    result = asyncio.run(HttpJsonProviderAdapter().check_coverage(
        {"enabled": False, "adapter_key": "http_json"}, {}
    ))
    assert result["result_status"] == "unknown"
    assert result["error_code"] == "PROVIDER_ADAPTER_NOT_ENABLED"


def test_unconfigured_order_submission_never_returns_accepted():
    result = asyncio.run(HttpJsonProviderAdapter().submit_order(
        {"enabled": False, "adapter_key": "http_json"}, {}, idempotency_key="agentzy-order-01"
    ))
    assert result.accepted is False
    assert result.error_code == "PROVIDER_ADAPTER_NOT_ENABLED"


def test_order_attribution_correction_requires_a_reason_and_tenant_scoped_worker():
    correction = OrderAttributionCorrection(
        tenant_id=uuid4(),
        attributed_worker_id=uuid4(),
        reason="Corrected before provider submission.",
    )
    assert correction.reason.startswith("Corrected")
    with pytest.raises(ValueError):
        OrderAttributionCorrection(
            tenant_id=uuid4(),
            attributed_worker_id=uuid4(),
            reason="x",
        )


def test_order_create_does_not_trust_client_status_or_pricing():
    order = OrderCreate(
        tenant_id=uuid4(),
        lead_id=uuid4(),
        consent_id=uuid4(),
        offer_id=uuid4(),
    )
    assert order.assigned_workforce_profile_id is None
    with pytest.raises(ValueError):
        OrderCreate(
            tenant_id=uuid4(),
            lead_id=uuid4(),
            consent_id=uuid4(),
            offer_id=uuid4(),
            status="activated",
        )
