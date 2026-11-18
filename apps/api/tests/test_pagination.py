from datetime import UTC, datetime
from unittest import TestCase
from uuid import uuid4

from fastapi import HTTPException

from app.core.pagination import (
    decode_key_cursor,
    decode_time_id_cursor,
    encode_key_cursor,
    encode_time_id_cursor,
)


class CursorPaginationTests(TestCase):
    def test_time_id_cursor_round_trip(self):
        created_at = datetime(2026, 11, 18, 12, 30, tzinfo=UTC)
        row_id = uuid4()
        self.assertEqual(decode_time_id_cursor(encode_time_id_cursor(created_at, row_id)), (created_at, row_id))

    def test_key_cursor_round_trip(self):
        key = "platform.security.events.read"
        self.assertEqual(decode_key_cursor(encode_key_cursor(key)), key)

    def test_rejects_invalid_or_oversized_cursors(self):
        for cursor in ("not-a-cursor", "x" * 513):
            with self.subTest(cursor_length=len(cursor)):
                with self.assertRaises(HTTPException) as raised:
                    decode_time_id_cursor(cursor)
                self.assertEqual(raised.exception.status_code, 422)
