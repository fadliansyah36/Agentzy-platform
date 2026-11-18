"""Deterministic, data-only ABAC condition evaluation.

The evaluator accepts JSON policy documents only. It deliberately does not
execute Python expressions, SQL fragments, templates, or arbitrary callables.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

ALLOWED_OPERATORS = frozenset(
    {
        "equals",
        "not_equals",
        "in",
        "not_in",
        "contains",
        "starts_with",
        "greater_than",
        "less_than",
        "exists",
    }
)
LOGICAL_OPERATORS = frozenset({"all", "any", "not"})
MAX_DEPTH = 12
MAX_NODES = 128
MAX_PATH_SEGMENTS = 12


class PolicyValidationError(ValueError):
    """Raised when a stored policy has an unsupported or malformed shape."""


@dataclass(frozen=True, slots=True)
class ConditionResult:
    matched: bool
    failed: tuple[dict[str, Any], ...] = ()


@dataclass(frozen=True, slots=True)
class PolicyDecision:
    decision: str
    matched_policies: tuple[dict[str, Any], ...]
    failed_conditions: tuple[dict[str, Any], ...]
    reason_code: str
    policy_versions: tuple[dict[str, Any], ...]
    evaluated_at: str


def _validate_path(path: Any) -> None:
    if not isinstance(path, str) or not path or len(path) > 256:
        raise PolicyValidationError(
            "Condition path must be a non-empty string of at most 256 chars"
        )
    parts = path.split(".")
    if len(parts) > MAX_PATH_SEGMENTS or any(
        not part or part.startswith("_") or "__" in part for part in parts
    ):
        raise PolicyValidationError("Condition path contains a forbidden segment")


def validate_condition(node: Any, *, depth: int = 0, counter: list[int] | None = None) -> None:
    """Validate a JSON condition tree using a strict operator allowlist."""
    if counter is None:
        counter = [0]
    counter[0] += 1
    if counter[0] > MAX_NODES or depth > MAX_DEPTH:
        raise PolicyValidationError("Condition tree exceeds complexity limits")
    if not isinstance(node, dict):
        raise PolicyValidationError("Each condition node must be an object")
    if not node:
        return
    if len(node) != 1:
        if set(node) - {"path", "op", "value"} or not {"path", "op"} <= set(node):
            raise PolicyValidationError(
                "Leaf condition must contain only path, op and optional value"
            )
        _validate_path(node["path"])
        operator = node["op"]
        if operator not in ALLOWED_OPERATORS:
            raise PolicyValidationError(f"Unsupported condition operator: {operator!r}")
        if operator == "exists":
            if "value" in node and not isinstance(node["value"], bool):
                raise PolicyValidationError("exists.value must be boolean")
        elif "value" not in node:
            raise PolicyValidationError(f"{operator}.value is required")
        if operator in {"in", "not_in"} and not isinstance(node.get("value"), list):
            raise PolicyValidationError(f"{operator}.value must be an array")
        if operator == "starts_with" and not isinstance(node.get("value"), str):
            raise PolicyValidationError("starts_with.value must be a string")
        return
    key, value = next(iter(node.items()))
    if key == "all" or key == "any":
        if not isinstance(value, list):
            raise PolicyValidationError(f"{key} requires an array")
        for child in value:
            validate_condition(child, depth=depth + 1, counter=counter)
        return
    if key == "not":
        validate_condition(value, depth=depth + 1, counter=counter)
        return
    raise PolicyValidationError("Condition node must be a leaf or all/any/not expression")


def _lookup(context: dict[str, Any], path: str) -> tuple[bool, Any]:
    current: Any = context
    for segment in path.split("."):
        if not isinstance(current, dict) or segment not in current:
            return False, None
        current = current[segment]
    return True, current


def _strict_equal(left: Any, right: Any) -> bool:
    # Avoid Python's bool/int equivalence in policy comparisons.
    if isinstance(left, bool) != isinstance(right, bool):
        return False
    return type(left) is type(right) and left == right


def _compare(node: dict[str, Any], context: dict[str, Any]) -> ConditionResult:
    path, operator = node["path"], node["op"]
    found, actual = _lookup(context, path)
    expected = node.get("value")
    if operator == "exists":
        desired = node.get("value", True)
        return ConditionResult(
            found is desired,
            ()
            if found is desired
            else (
                {
                    "path": path,
                    "operator": operator,
                    "expected": desired,
                    "actual_exists": found,
                },
            ),
        )
    if not found:
        return ConditionResult(
            False,
            (
                {
                    "path": path,
                    "operator": operator,
                    "reason": "attribute_missing",
                },
            ),
        )

    matched = False
    if operator == "equals":
        matched = _strict_equal(actual, expected)
    elif operator == "not_equals":
        matched = not _strict_equal(actual, expected)
    elif operator == "in":
        matched = any(_strict_equal(actual, item) for item in expected)
    elif operator == "not_in":
        matched = not any(_strict_equal(actual, item) for item in expected)
    elif operator == "contains":
        if isinstance(actual, str) and isinstance(expected, str):
            matched = expected in actual
        elif isinstance(actual, list):
            matched = any(_strict_equal(expected, item) for item in actual)
        elif isinstance(actual, dict) and isinstance(expected, str):
            matched = expected in actual
    elif operator == "starts_with":
        matched = isinstance(actual, str) and actual.startswith(expected)
    elif operator in {"greater_than", "less_than"}:
        comparable = (
            isinstance(actual, (int, float))
            and not isinstance(actual, bool)
            and isinstance(expected, (int, float))
            and not isinstance(expected, bool)
        )
        if comparable:
            matched = actual > expected if operator == "greater_than" else actual < expected

    return ConditionResult(
        matched,
        ()
        if matched
        else (
            {
                "path": path,
                "operator": operator,
                "reason": "comparison_failed",
            },
        ),
    )


def evaluate_condition(node: dict[str, Any], context: dict[str, Any]) -> ConditionResult:
    """Evaluate a validated condition tree and retain deterministic failure details."""
    validate_condition(node)
    if not node:
        return ConditionResult(True)
    if "all" in node:
        results = [evaluate_condition(child, context) for child in node["all"]]
        failed = tuple(item for result in results for item in result.failed)
        return ConditionResult(all(result.matched for result in results), failed)
    if "any" in node:
        results = [evaluate_condition(child, context) for child in node["any"]]
        if any(result.matched for result in results):
            return ConditionResult(True)
        return ConditionResult(False, tuple(item for result in results for item in result.failed))
    if "not" in node:
        result = evaluate_condition(node["not"], context)
        return ConditionResult(
            not result.matched,
            ()
            if not result.matched
            else (
                {
                    "operator": "not",
                    "reason": "negated_condition_matched",
                },
            ),
        )
    return _compare(node, context)


def _as_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
        except ValueError:
            return None
    return None


def evaluate_policies(
    *,
    policies: list[dict[str, Any]],
    tenant_id: str,
    resource: dict[str, Any],
    action: str,
    subject: dict[str, Any],
    request_context: dict[str, Any] | None = None,
    now: datetime | None = None,
) -> PolicyDecision:
    """Evaluate policies for one tenant/resource/action with explicit DENY precedence."""
    instant = now or datetime.now(UTC)
    if instant.tzinfo is None:
        instant = instant.replace(tzinfo=UTC)
    evaluated_at = instant.astimezone(UTC).isoformat()
    resource_tenant = resource.get("tenant_id")
    if resource_tenant is not None and str(resource_tenant) != str(tenant_id):
        return PolicyDecision("DENY", (), (), "CROSS_TENANT_RESOURCE", (), evaluated_at)

    matched: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = []
    versions: list[dict[str, Any]] = []
    invalid = False
    ordered = sorted(
        policies,
        key=lambda item: (-int(item.get("priority", 100)), str(item.get("id", ""))),
    )
    context = {
        "subject": subject,
        "tenant": {"id": str(tenant_id)},
        "resource": resource,
        "action": action,
        "request": request_context or {},
        "time": {"now": evaluated_at},
    }
    for policy in ordered:
        if policy.get("status", "active") != "active":
            continue
        policy_tenant = policy.get("tenant_id")
        if policy_tenant is not None and str(policy_tenant) != str(tenant_id):
            continue
        if policy.get("resource") != resource.get("type") or policy.get("action") != action:
            continue
        start = _as_datetime(policy.get("effective_from"))
        end = _as_datetime(policy.get("effective_until"))
        if (start and instant < start) or (end and instant >= end):
            continue
        version = policy.get("version", 1)
        try:
            if not isinstance(version, int) or isinstance(version, bool) or version < 1:
                raise PolicyValidationError("Policy version must be a positive integer")
            effect = str(policy.get("effect", "")).lower()
            if effect not in {"allow", "deny"}:
                raise PolicyValidationError("Policy effect must be allow or deny")
            priority = policy.get("priority", 100)
            if not isinstance(priority, int) or isinstance(priority, bool):
                raise PolicyValidationError("Policy priority must be an integer")
            if not isinstance(policy.get("resource"), str) or not isinstance(
                policy.get("action"), str
            ):
                raise PolicyValidationError("Policy resource and action must be strings")
            result = evaluate_condition(policy.get("conditions", {}), context)
        except (PolicyValidationError, KeyError, TypeError, ValueError) as exc:
            invalid = True
            failed.append(
                {
                    "policy_id": str(policy.get("id", "unknown")),
                    "reason": "invalid_policy",
                    "message": str(exc),
                }
            )
            continue
        versions.append({"policy_id": str(policy.get("id", "unknown")), "version": version})
        if result.matched:
            matched.append(
                {
                    "policy_id": str(policy.get("id", "unknown")),
                    "effect": effect.upper(),
                    "priority": priority,
                    "version": version,
                }
            )
        else:
            failed.extend(
                {
                    "policy_id": str(policy.get("id", "unknown")),
                    **detail,
                }
                for detail in result.failed
            )

    if invalid:
        decision, reason = "DENY", "INVALID_POLICY"
    elif any(item["effect"] == "DENY" for item in matched):
        decision, reason = "DENY", "EXPLICIT_DENY"
    elif any(item["effect"] == "ALLOW" for item in matched):
        decision, reason = "ALLOW", "POLICY_ALLOWED"
    else:
        decision, reason = "DENY", "NO_MATCHING_ALLOW_POLICY"

    return PolicyDecision(
        decision=decision,
        matched_policies=tuple(matched),
        failed_conditions=tuple(failed),
        reason_code=reason,
        policy_versions=tuple(versions),
        evaluated_at=evaluated_at,
    )
