from __future__ import annotations

import json
from typing import Any, List
from unittest.mock import Mock, patch

from .BaseTest import BaseTestCase


def _sent_messages(connection: Mock) -> List[Any]:
    return [json.loads(call.args[0]) for call in connection.on_data.call_args_list]


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


class ElementMessageStreamRestoreTestCase(BaseTestCase):
    def _make_stream(self, element: Any):
        from deephaven.ui.object_types.ElementMessageStream import (
            ElementMessageStream,
        )

        connection = Mock()
        return ElementMessageStream(element, connection), connection

    def test_render_error_without_restore_is_sent(self):
        import deephaven.ui as ui

        @ui.component
        def broken():
            raise ValueError("broken")

        stream, connection = self._make_stream(broken())
        stream._render()

        self.assertEqual(
            [m["method"] for m in _sent_messages(connection)], ["documentError"]
        )

    def test_failed_restore_render_retries_without_saved_state(self):
        import deephaven.ui as ui
        from deephaven.ui.object_types.ElementMessageStream import (
            ElementMessageStream,
        )

        @ui.component
        def region_text():
            region, _ = ui.use_state("Americas")
            if region not in ("Americas", "Asia"):
                raise KeyError(region)
            return ui.text(region)

        stream, _ = self._make_stream(region_text())
        stream._render()
        saved = stream._context.export_state()
        saved["state"][0] = "Europe"
        saved = json.loads(json.dumps(saved))

        restored, connection = self._make_stream(region_text())
        with patch.object(ElementMessageStream, "_queue_render"):
            restored._set_state(saved)
        with self.assertLogs(
            "deephaven.ui.object_types.ElementMessageStream", level="WARNING"
        ) as logs:
            restored._render()
        self.assertIn("KeyError('Europe')", logs.output[0])

        messages = _sent_messages(connection)
        self.assertEqual([m["method"] for m in messages], ["documentPatched"])
        self.assertEqual(
            json.loads(messages[0]["params"][1])["state"], {"0": "Americas"}
        )

    def test_old_format_state_in_the_wrong_hook_renders_without_saved_state(self):
        import deephaven.ui as ui
        from deephaven.ui.object_types.ElementMessageStream import (
            ElementMessageStream,
        )

        regions = ["Americas", "Europe", "Asia"]

        @ui.component
        def region_text():
            for region in regions:
                ui.use_memo(lambda r=region: r.upper(), [region])
            region, _ = ui.use_state("Americas")
            return ui.text(region)

        # Saved before call sites were recorded, when there were two regions
        saved = {"state": {"4": "Europe"}}

        restored, connection = self._make_stream(region_text())
        with patch.object(ElementMessageStream, "_queue_render"):
            restored._set_state(saved)
        with self.assertLogs(
            "deephaven.ui.object_types.ElementMessageStream", level="WARNING"
        ) as logs:
            restored._render()
        self.assertIn("'str' object has no attribute 'current'", logs.output[0])

        messages = _sent_messages(connection)
        self.assertEqual([m["method"] for m in messages], ["documentPatched"])
        self.assertEqual(
            json.loads(messages[0]["params"][1])["state"], {"6": "Americas"}
        )

    def test_restore_with_different_hook_count_discards_only_the_mismatched_value(
        self,
    ):
        import deephaven.ui as ui
        from deephaven.ui.object_types.ElementMessageStream import (
            ElementMessageStream,
        )

        regions = ["Americas", "Europe"]

        @ui.component
        def region_text():
            for region in regions:
                ui.use_memo(lambda r=region: r.upper(), [region])
            region, _ = ui.use_state("Americas")
            return ui.text(region)

        @ui.component
        def app():
            name, _ = ui.use_state("default name")
            return ui.flex(ui.text(name), region_text())

        stream, _ = self._make_stream(app())
        stream._render()
        saved = json.loads(
            json.dumps(stream._context.export_state())
            .replace('"default name"', '"saved name"')
            .replace('"Americas"', '"Europe"')
        )

        regions.append("Asia")
        restored, connection = self._make_stream(app())
        with patch.object(ElementMessageStream, "_queue_render"):
            restored._set_state(saved)
        # Rendering again without any saved state would also lose the parent's value
        with patch.object(
            restored._context, "import_state", wraps=restored._context.import_state
        ) as import_state:
            restored._render()
        import_state.assert_not_called()

        messages = _sent_messages(connection)
        self.assertEqual([m["method"] for m in messages], ["documentPatched"])
        state = messages[0]["params"][1]
        self.assertIn('"saved name"', state)
        self.assertIn('"Americas"', state)
        self.assertNotIn('"Europe"', state)

    def test_failed_restore_render_cleans_up_sibling_effects_before_retry(self):
        import deephaven.ui as ui
        from deephaven.ui.object_types.ElementMessageStream import (
            ElementMessageStream,
        )

        events: List[str] = []

        @ui.component
        def tracker():
            def effect():
                events.append("mount")
                return lambda: events.append("cleanup")

            ui.use_effect(effect, [])
            return ui.text("tracker")

        @ui.component
        def region_text():
            region, _ = ui.use_state("Americas")
            if region not in ("Americas", "Asia"):
                raise KeyError(region)
            return ui.text(region)

        @ui.component
        def app():
            return ui.flex(tracker(), region_text())

        stream, _ = self._make_stream(app())
        stream._render()
        saved = json.loads(
            json.dumps(stream._context.export_state()).replace('"Americas"', '"Europe"')
        )

        events.clear()
        restored, _ = self._make_stream(app())
        with patch.object(ElementMessageStream, "_queue_render"):
            restored._set_state(saved)
        with self.assertLogs(
            "deephaven.ui.object_types.ElementMessageStream", level="WARNING"
        ):
            restored._render()

        # The sibling's effect already ran in the failed pass; the retry unmounts it before mounting it again
        self.assertEqual(events, ["mount", "cleanup", "mount"])

    def test_cleanup_failure_during_restore_retry_is_sent_as_error(self):
        import deephaven.ui as ui
        from deephaven.ui.object_types.ElementMessageStream import (
            ElementMessageStream,
        )

        is_cleanup_failing = False

        def failing_cleanup():
            if is_cleanup_failing:
                raise RuntimeError("cleanup failed")

        @ui.component
        def tracker():
            ui.use_effect(lambda: failing_cleanup, [])
            return ui.text("tracker")

        @ui.component
        def region_text():
            region, _ = ui.use_state("Americas")
            if region not in ("Americas", "Asia"):
                raise KeyError(region)
            return ui.text(region)

        @ui.component
        def app():
            return ui.flex(tracker(), region_text())

        stream, _ = self._make_stream(app())
        stream._render()
        saved = json.loads(
            json.dumps(stream._context.export_state()).replace('"Americas"', '"Europe"')
        )

        restored, connection = self._make_stream(app())
        with patch.object(ElementMessageStream, "_queue_render"):
            restored._set_state(saved)
        is_cleanup_failing = True
        with self.assertLogs(
            "deephaven.ui.object_types.ElementMessageStream", level="WARNING"
        ):
            restored._render()
        # Streams are never closed here, so cleanups also run when they're garbage collected
        is_cleanup_failing = False

        self.assertEqual(
            [m["method"] for m in _sent_messages(connection)], ["documentError"]
        )

    def test_send_failure_after_restore_keeps_saved_state(self):
        import deephaven.ui as ui
        from deephaven.ui.object_types.ElementMessageStream import (
            ElementMessageStream,
        )

        @ui.component
        def region_text():
            region, _ = ui.use_state("Americas")
            return ui.text(region)

        stream, _ = self._make_stream(region_text())
        stream._render()
        saved = stream._context.export_state()
        saved["state"][0] = "Asia"
        saved = json.loads(json.dumps(saved))

        restored, connection = self._make_stream(region_text())
        connection.on_data.side_effect = [ConnectionError("send failed"), None]
        with patch.object(ElementMessageStream, "_queue_render"):
            restored._set_state(saved)
        restored._render()

        self.assertEqual(restored._context.export_state()["state"], {0: "Asia"})
