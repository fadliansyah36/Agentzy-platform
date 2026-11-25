"""Human Workforce domain invariants; no persistence or transport dependencies."""

WORKFORCE_LIFECYCLE_TRANSITIONS = {
    "invited": {"registered", "inactive"},
    "registered": {"identity_pending", "inactive"},
    "identity_pending": {"verified", "inactive"},
    "verified": {"onboarding", "inactive"},
    "onboarding": {"eligible", "inactive"},
    "eligible": {"active", "inactive"},
    "active": {"inactive", "suspended", "offboarded"},
    "inactive": {"onboarding", "active", "offboarded"},
    "suspended": {"active", "inactive", "offboarded"},
    "offboarded": set(),
}

WORKFORCE_ENGAGEMENT_CLASSIFICATIONS = {
    "employee",
    "outsourced_worker",
    "independent_contractor",
    "freelance",
    "affiliate",
    "technical_partner",
    "project_based_worker",
}


def is_lifecycle_transition_allowed(current: str, target: str) -> bool:
    return target in WORKFORCE_LIFECYCLE_TRANSITIONS.get(current, set())
