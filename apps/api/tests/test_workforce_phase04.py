"""Deterministic Phase 04 workforce domain contract tests."""

from datetime import UTC, date, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.api.v1.routes.workforce import (
    PERMISSIONS,
    TRANSITIONS,
    AvailabilityInput,
    EngagementInput,
    ProfileCreate,
)


def test_lifecycle_graph_has_terminal_offboarded_state():
    assert TRANSITIONS["invited"] == {"registered", "inactive"}
    assert "active" not in TRANSITIONS["registered"]
    assert TRANSITIONS["offboarded"] == set()


def test_all_workforce_permission_routes_are_mapped():
    required = {
        "profile.read",
        "profile.manage",
        "profile.directory",
        "identity.submit",
        "identity.review",
        "engagement.manage",
        "skills.manage",
        "availability.manage",
        "training.manage",
        "onboarding.manage",
        "lifecycle.transition",
        "assignments.manage",
    }
    assert required.issubset(PERMISSIONS)


def test_engagement_requires_actual_facts_acknowledgement():
    with pytest.raises(ValidationError):
        EngagementInput(
            tenant_id="00000000-0000-0000-0000-000000000001",
            classification="independent_contractor",
            agreement_reference="AGR-001",
            effective_from=date.today(),
            facts_acknowledged=False,
            change_reason="New engagement",
        )


def test_engagement_rejects_invalid_effective_period():
    with pytest.raises(ValidationError):
        EngagementInput(
            tenant_id="00000000-0000-0000-0000-000000000001",
            classification="employee",
            agreement_reference="AGR-002",
            effective_from=date.today(),
            effective_until=date.today() - timedelta(days=1),
            facts_acknowledged=True,
            change_reason="Agreement update",
        )


def test_availability_requires_timezone_aware_period():
    with pytest.raises(ValidationError):
        AvailabilityInput(
            tenant_id="00000000-0000-0000-0000-000000000001",
            availability_type="leave",
            starts_at=datetime(2026, 11, 26, 9, 0),
            ends_at=datetime(2026, 11, 26, 17, 0),
            timezone="Asia/Jakarta",
        )


def test_availability_rejects_non_positive_period():
    instant = datetime(2026, 11, 26, 9, 0, tzinfo=UTC)
    with pytest.raises(ValidationError):
        AvailabilityInput(
            tenant_id="00000000-0000-0000-0000-000000000001",
            availability_type="leave",
            starts_at=instant,
            ends_at=instant,
            timezone="Asia/Jakarta",
        )


def test_profile_metadata_rejects_sensitive_identifier_fields():
    with pytest.raises(ValidationError):
        ProfileCreate(
            tenant_id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
            membership_id="00000000-0000-0000-0000-000000000003",
            worker_code="WKR-001",
            display_name="Workforce Member",
            profile_metadata={"national_id_number": "should-not-be-stored"},
        )
