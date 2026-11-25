import pytest
from fastapi import HTTPException
from datetime import UTC, datetime
from uuid import uuid4

from app.domain.sales import LEAD_TRANSITIONS, ORDER_TRANSITIONS, normalize_provider_status, transition_allowed
from app.core.pagination import decode_time_id_cursor, encode_time_id_cursor
from app.services.sales_service import SalesService


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
