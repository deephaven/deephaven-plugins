from __future__ import annotations

from unittest.mock import Mock

from .BaseTest import BaseTestCase


class ElementMessageStreamTestCase(BaseTestCase):
    def _make_stream(self):
        from deephaven.ui.object_types.ElementMessageStream import ElementMessageStream

        stream = ElementMessageStream(Mock(), Mock())
        # Run queued work inline instead of on the render thread.
        stream.on_queue_render = lambda fn: fn()
        return stream

    def test_call_callable_injects_table_reference(self):
        stream = self._make_stream()
        received: list = []
        stream._callable_dict["cb"] = received.append
        stream._pending_references = ["model-table"]

        stream._call_callable("cb", [{"value": 1}])

        self.assertEqual(received[0], {"value": 1, "_table": "model-table"})

    def test_call_callable_without_references_adds_no_table(self):
        stream = self._make_stream()
        received: list = []
        stream._callable_dict["cb"] = received.append
        stream._pending_references = []

        stream._call_callable("cb", [{"value": 1}])

        self.assertEqual(received[0], {"value": 1})

    def test_on_data_exposes_then_clears_references(self):
        stream = self._make_stream()
        seen: list = []
        stream._manager = Mock()
        stream._manager.handle.side_effect = lambda *_: seen.append(
            list(stream._pending_references)
        )

        stream.on_data(b"{}", ["model-table"])

        self.assertEqual(seen[0], ["model-table"])
        self.assertEqual(stream._pending_references, [])

    def test_on_data_clears_references_on_exception(self):
        stream = self._make_stream()
        stream._manager = Mock()
        stream._manager.handle.side_effect = RuntimeError("boom")

        with self.assertRaises(RuntimeError):
            stream.on_data(b"{}", ["model-table"])

        self.assertEqual(stream._pending_references, [])
