"""Deterministic Phase 03 schema guards for contract and finance APIs."""

from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.api.v1.routes.ai_workers import AIWorkerCreate
from app.api.v1.routes.contracts import ContractCreate
from app.api.v1.routes.corporate_contracts import InvoiceLineInput, ProviderProfileInput


def test_invoice_line_rejects_client_supplied_unit_price():
    with pytest.raises(ValidationError):
        InvoiceLineInput(service_key="internet_fiber", quantity=Decimal("1"), unit_amount="1")


def test_invoice_line_requires_catalogue_service_key():
    with pytest.raises(ValidationError):
        InvoiceLineInput(contract_service_id=uuid4(), quantity=Decimal("1"))


def test_ai_worker_runtime_config_rejects_provider_secrets():
    with pytest.raises(ValidationError):
        AIWorkerCreate(
            tenant_id=uuid4(),
            contract_id=uuid4(),
            service_key="ai_workforce",
            worker_code="worker-01",
            display_name="Support Worker",
            model_provider="openai",
            model_key="gpt-6",
            runtime_config={"api_key": "never-store-here"},
        )


def test_contract_date_range_is_validated_before_database_write():
    with pytest.raises(ValidationError):
        ContractCreate(
            tenant_id=uuid4(),
            contract_number="CN-TEST-001",
            title="Invalid date contract",
            contract_type="master",
            effective_start="2026-12-10",
            effective_end="2026-12-01",
            scope_summary="Test scope",
            services=[{
                "service_key": "internet_fiber",
                "service_scope": "Fiber connectivity",
                "quantity": 1,
                "monthly_fee": "1000",
            }],
        )


def test_provider_profile_rejects_unknown_provider_type():
    with pytest.raises(ValidationError):
        ProviderProfileInput(
            tenant_id=uuid4(),
            provider_code="provider-test",
            provider_name="Provider Test",
            provider_type="unknown",
        )
