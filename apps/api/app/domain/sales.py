"""Deterministic sales lifecycle rules for Phase 05."""
from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation

LEAD_TRANSITIONS: dict[str, set[str]] = {
    "lead_created": {"assigned", "contacted", "disqualified", "closed"},
    "assigned": {"contacted", "disqualified", "closed"},
    "contacted": {"qualified", "disqualified", "closed"},
    "qualified": {"coverage_checked", "disqualified", "closed"},
    "coverage_checked": {"offer_presented", "qualified", "disqualified", "closed"},
    "offer_presented": {"order_submitted", "qualified", "closed"},
    "order_submitted": {"closed"},
    "disqualified": {"closed"},
    "closed": set(),
}
ORDER_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"submitted", "cancelled"},
    "submitted": {"provider_pending", "provider_approved", "provider_rejected", "cancelled", "failed"},
    "provider_pending": {"provider_approved", "provider_rejected", "cancelled", "failed"},
    "provider_approved": {"installation_scheduled", "cancelled"},
    "installation_scheduled": {"installation_in_progress", "cancelled"},
    "installation_in_progress": {"activated", "failed"},
    "provider_rejected": {"cancelled"},
    "failed": {"submitted", "cancelled"},
    "activated": set(),
    "cancelled": set(),
}


def transition_allowed(current: str, target: str, *, order: bool = False) -> bool:
    return target in (ORDER_TRANSITIONS if order else LEAD_TRANSITIONS).get(current, set())


def normalize_provider_status(value: str, mapping: dict[str, str]) -> str | None:
    target = mapping.get(value.strip().lower())
    return target if target in ORDER_TRANSITIONS else None


def parse_decimal_reference(value: object) -> Decimal | None:
    if value is None:
        return None
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    return amount if amount.is_finite() and amount >= 0 else None


def utc_now() -> datetime:
    return datetime.now(UTC)
