from datetime import UTC, datetime, timedelta
from unittest import TestCase

from app.core.abac import (
    PolicyValidationError,
    evaluate_condition,
    evaluate_policies,
    validate_condition,
)


class AbacEvaluatorTests(TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 18, 7, 0, tzinfo=UTC)
        self.tenant = "tenant-a"
        self.resource = {
            "id": "r-1", "tenant_id": self.tenant,
            "type": "work_order", "status": "open",
        }
        self.subject = {"id": "u-1", "roles": ["technician"], "department_id": "d-1"}

    def policy(self, **overrides):
        value = {
            "id": "p-1",
            "tenant_id": self.tenant,
            "resource": "work_order",
            "action": "read",
            "effect": "allow",
            "conditions": {"path": "subject.roles", "op": "contains", "value": "technician"},
            "priority": 100,
            "status": "active",
            "version": 1,
        }
        value.update(overrides)
        return value

    def decide(self, policies, resource=None):
        return evaluate_policies(
            policies=policies,
            tenant_id=self.tenant,
            resource=resource or self.resource,
            action="read",
            subject=self.subject,
            now=self.now,
        )

    def test_valid_allow_policy(self):
        result = self.decide([self.policy()])
        self.assertEqual(result.decision, "ALLOW")
        self.assertEqual(result.reason_code, "POLICY_ALLOWED")
        self.assertEqual(result.matched_policies[0]["policy_id"], "p-1")

    def test_valid_deny_policy(self):
        result = self.decide([self.policy(effect="deny")])
        self.assertEqual(result.decision, "DENY")
        self.assertEqual(result.reason_code, "EXPLICIT_DENY")

    def test_deny_precedes_allow_regardless_of_priority(self):
        result = self.decide([
            self.policy(id="allow", effect="allow", priority=1),
            self.policy(id="deny", effect="deny", priority=999),
        ])
        self.assertEqual(result.decision, "DENY")
        self.assertEqual(result.reason_code, "EXPLICIT_DENY")

    def test_no_matching_policy_denies(self):
        result = self.decide([])
        self.assertEqual(result.decision, "DENY")
        self.assertEqual(result.reason_code, "NO_MATCHING_ALLOW_POLICY")

    def test_missing_attribute_fails_closed(self):
        result = self.decide([self.policy(conditions={
            "path": "subject.manager_id", "op": "equals", "value": "u-9"
        })])
        self.assertEqual(result.decision, "DENY")
        self.assertTrue(result.failed_conditions)

    def test_invalid_operator_is_rejected(self):
        with self.assertRaises(PolicyValidationError):
            validate_condition({"path": "subject.id", "op": "execute", "value": "x"})

    def test_invalid_condition_structure_is_rejected(self):
        with self.assertRaises(PolicyValidationError):
            validate_condition({"all": {"path": "subject.id", "op": "equals", "value": "u-1"}})

    def test_expired_policy_is_ignored(self):
        result = self.decide([self.policy(
            effective_until=(self.now - timedelta(seconds=1)).isoformat()
        )])
        self.assertEqual(result.reason_code, "NO_MATCHING_ALLOW_POLICY")

    def test_disabled_policy_is_ignored(self):
        result = self.decide([self.policy(status="inactive")])
        self.assertEqual(result.reason_code, "NO_MATCHING_ALLOW_POLICY")

    def test_cross_tenant_resource_is_denied(self):
        result = self.decide([], resource={**self.resource, "tenant_id": "tenant-b"})
        self.assertEqual(result.reason_code, "CROSS_TENANT_RESOURCE")

    def test_nested_all_any_and_not(self):
        condition = {
            "all": [
                {"path": "subject.id", "op": "equals", "value": "u-1"},
                {"any": [
                    {"path": "resource.status", "op": "equals", "value": "closed"},
                    {"path": "resource.status", "op": "equals", "value": "open"},
                ]},
                {"not": {"path": "subject.roles", "op": "contains", "value": "suspended"}},
            ]
        }
        self.assertTrue(evaluate_condition(condition, {
            "subject": self.subject, "resource": self.resource,
        }).matched)

    def test_policy_conflict_is_denied(self):
        result = self.decide([
            self.policy(id="allow", effect="allow"),
            self.policy(id="deny", effect="deny"),
        ])
        self.assertEqual(result.decision, "DENY")
        self.assertEqual(result.reason_code, "EXPLICIT_DENY")

    def test_invalid_policy_version_denies_entire_evaluation(self):
        result = self.decide([self.policy(version=0)])
        self.assertEqual(result.decision, "DENY")
        self.assertEqual(result.reason_code, "INVALID_POLICY")

    def test_wrong_tenant_policy_is_not_applied(self):
        result = self.decide([self.policy(tenant_id="tenant-b")])
        self.assertEqual(result.reason_code, "NO_MATCHING_ALLOW_POLICY")

    def test_exists_operator_supports_absent_attribute(self):
        result = evaluate_condition(
            {"path": "subject.manager_id", "op": "exists", "value": False},
            {"subject": self.subject},
        )
        self.assertTrue(result.matched)

    def test_not_does_not_turn_missing_attribute_into_allow(self):
        result = evaluate_condition(
            {"not": {"path": "subject.manager_id", "op": "equals", "value": "u-9"}},
            {"subject": self.subject},
        )
        self.assertFalse(result.matched)
        self.assertEqual(result.failed[0]["reason"], "attribute_missing")

    def test_invalid_effect_denies_evaluation(self):
        result = self.decide([self.policy(effect="permit")])
        self.assertEqual(result.reason_code, "INVALID_POLICY")

    def test_invalid_effective_timestamp_denies_evaluation(self):
        result = self.decide([self.policy(effective_from="not-a-timestamp")])
        self.assertEqual(result.reason_code, "INVALID_POLICY")
