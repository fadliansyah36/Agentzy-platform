from unittest import TestCase

from app.core.redaction import redact_audit_value


class AuditRedactionTests(TestCase):
    def test_redacts_nested_camel_case_and_snake_case_fields(self):
        value = {
            "request": {
                "accessToken": "access-secret",
                "refresh_token": "refresh-secret",
                "email_address": "person@example.com",
                "phoneNumber": "+628123456789",
                "nested": [{"client_secret": "secret"}],
            }
        }
        result = redact_audit_value(value)
        self.assertEqual(result["request"]["accessToken"], "[REDACTED]")
        self.assertEqual(result["request"]["refresh_token"], "[REDACTED]")
        self.assertEqual(result["request"]["email_address"], "[REDACTED]")
        self.assertEqual(result["request"]["phoneNumber"], "[REDACTED]")
        self.assertEqual(result["request"]["nested"][0]["client_secret"], "[REDACTED]")

    def test_redacts_bearer_tokens_and_jwt_embedded_in_text(self):
        bearer = "Bearer " + "a" * 40
        jwt = "eyJ" + "a" * 20 + "." + "b" * 20 + "." + "c" * 12
        result = redact_audit_value({"message": f"header {bearer}; token {jwt}"})
        self.assertNotIn(bearer, result["message"])
        self.assertNotIn(jwt, result["message"])
        self.assertEqual(result["message"].count("[REDACTED]"), 2)

    def test_preserves_non_sensitive_values_and_handles_tuples(self):
        result = redact_audit_value({\n            "status": "active",\n            "items": ("ok", {"ip_address": "127.0.0.1"}),\n        })
        self.assertEqual(result["status"], "active")
        self.assertEqual(result["items"], ["ok", {"ip_address": "[REDACTED]"}])
