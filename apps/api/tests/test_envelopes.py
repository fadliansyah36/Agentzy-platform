import unittest

from app.core.envelopes import success_envelope


class SuccessEnvelopeTests(unittest.TestCase):
    def setUp(self):
        self.context = {
            "request_id": "req-12345678",
            "correlation_id": "cor-12345678",
            "trace_id": "trace-12345678",
        }

    def test_wraps_legacy_object_payload(self):
        result = success_envelope({"id": "tenant-1"}, self.context)
        self.assertEqual(result["data"], {"id": "tenant-1"})
        self.assertEqual(result["meta"]["envelope_version"], 1)
        self.assertEqual(result["meta"]["request_id"], "req-12345678")

    def test_preserves_existing_paginated_envelope(self):
        payload = {"data": [{"id": "one"}], "meta": {"has_more": False}}
        self.assertIs(success_envelope(payload, self.context), payload)

    def test_preserves_existing_error_payload(self):
        payload = {"error": {"code": "DENIED"}}
        self.assertIs(success_envelope(payload, self.context), payload)

    def test_wraps_list_payload(self):
        result = success_envelope([1, 2], self.context)
        self.assertEqual(result["data"], [1, 2])


if __name__ == "__main__":
    unittest.main()
