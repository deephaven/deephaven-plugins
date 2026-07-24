from __future__ import annotations
import json
import unittest

from ..BaseTest import BaseTestCase


class DeephavenFigureListenerCallbackTestCase(BaseTestCase):
    """Tests for CALLABLE_EVENT message processing in DeephavenFigureListener"""

    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table([int_col("X", [1, 2, 3]), int_col("Y", [4, 5, 6])])

    def _create_listener(self, fig):
        """Create a DeephavenFigureListener for the given figure"""
        from unittest.mock import MagicMock
        from src.deephaven.plot.express.communication.DeephavenFigureListener import (
            DeephavenFigureListener,
        )

        connection = MagicMock()
        listener = DeephavenFigureListener(fig, connection)
        return listener

    def test_callable_event_fire_and_forget(self):
        """CALLABLE_EVENT without request_id calls callback and returns empty"""
        import src.deephaven.plot.express as dx
        from unittest.mock import MagicMock

        handler = MagicMock()
        fig = dx.scatter(self.source, x="X", y="Y", on_click=handler)

        listener = self._create_listener(fig)

        # Get the callback_id
        inner_fig = listener._get_figure()
        callback_id = inner_fig._callback_ids["on_click"]

        args = {
            "points": [{"x": 1, "y": 4}],
            "modifiers": {
                "shift": True,
                "ctrl": False,
                "alt": False,
                "meta": False,
            },
        }
        message = json.dumps(
            {
                "type": "CALLABLE_EVENT",
                "callback_id": callback_id,
                "args": args,
            }
        ).encode()

        result_payload, result_refs = listener.process_message(message, [])

        handler.assert_called_once()
        # The event args (including modifiers) are forwarded to the callback verbatim
        self.assertEqual(handler.call_args[0][0], args)
        self.assertEqual(result_payload, b"")
        self.assertEqual(result_refs, [])

    def test_callable_event_with_request_id_returns_response(self):
        """CALLABLE_EVENT with request_id returns CALLABLE_RESPONSE"""
        import src.deephaven.plot.express as dx

        def handler(event):
            return False

        fig = dx.scatter(self.source, x="X", y="Y", on_legend_click=handler)

        listener = self._create_listener(fig)

        inner_fig = listener._get_figure()
        callback_id = inner_fig._callback_ids["on_legend_click"]

        message = json.dumps(
            {
                "type": "CALLABLE_EVENT",
                "callback_id": callback_id,
                "args": {"trace_name": "DOG", "curve_number": 0},
                "request_id": "req-123",
            }
        ).encode()

        result_payload, result_refs = listener.process_message(message, [])

        # process_message returns empty; the preventable response is pushed to
        # the client via the connection, not the return value.
        self.assertEqual(result_payload, b"")
        listener._connection.on_data.assert_called_once()
        sent_payload = listener._connection.on_data.call_args[0][0]
        response = json.loads(sent_payload)
        self.assertEqual(response["type"], "CALLABLE_RESPONSE")
        self.assertEqual(response["request_id"], "req-123")
        self.assertEqual(response["result"], False)

    def test_callable_event_returning_true(self):
        """Preventable callback returning True returns True in response"""
        import src.deephaven.plot.express as dx

        def handler(event):
            return True

        fig = dx.scatter(self.source, x="X", y="Y", on_legend_click=handler)

        listener = self._create_listener(fig)

        inner_fig = listener._get_figure()
        callback_id = inner_fig._callback_ids["on_legend_click"]

        message = json.dumps(
            {
                "type": "CALLABLE_EVENT",
                "callback_id": callback_id,
                "args": {"trace_name": "DOG", "curve_number": 0},
                "request_id": "req-456",
            }
        ).encode()

        listener.process_message(message, [])

        sent_payload = listener._connection.on_data.call_args[0][0]
        response = json.loads(sent_payload)
        self.assertEqual(response["result"], True)

    def test_callable_event_returning_none(self):
        """Preventable callback returning None returns None in response"""
        import src.deephaven.plot.express as dx

        def handler(event):
            pass  # returns None implicitly

        fig = dx.scatter(self.source, x="X", y="Y", on_legend_click=handler)

        listener = self._create_listener(fig)

        inner_fig = listener._get_figure()
        callback_id = inner_fig._callback_ids["on_legend_click"]

        message = json.dumps(
            {
                "type": "CALLABLE_EVENT",
                "callback_id": callback_id,
                "args": {},
                "request_id": "req-789",
            }
        ).encode()

        listener.process_message(message, [])

        sent_payload = listener._connection.on_data.call_args[0][0]
        response = json.loads(sent_payload)
        self.assertIsNone(response["result"])

    def test_unknown_callback_id_does_not_raise(self):
        """Unknown callback_id does not raise"""
        import src.deephaven.plot.express as dx

        fig = dx.scatter(self.source, x="X", y="Y", on_click=lambda e: None)
        listener = self._create_listener(fig)

        message = json.dumps(
            {
                "type": "CALLABLE_EVENT",
                "callback_id": "cb_unknown",
                "args": {},
            }
        ).encode()

        # Should not raise
        result_payload, result_refs = listener.process_message(message, [])
        self.assertEqual(result_payload, b"")

    def test_exception_in_callback_does_not_crash(self):
        """Exception inside a callback does not crash the connection"""
        import src.deephaven.plot.express as dx

        def bad_handler(event):
            raise RuntimeError("callback error")

        fig = dx.scatter(self.source, x="X", y="Y", on_click=bad_handler)
        listener = self._create_listener(fig)

        inner_fig = listener._get_figure()
        callback_id = inner_fig._callback_ids["on_click"]

        message = json.dumps(
            {
                "type": "CALLABLE_EVENT",
                "callback_id": callback_id,
                "args": {},
            }
        ).encode()

        # Should not raise
        result_payload, result_refs = listener.process_message(message, [])
        self.assertEqual(result_payload, b"")


if __name__ == "__main__":
    unittest.main()
