from __future__ import annotations

import json
from typing import Any, List
from unittest.mock import Mock, patch

from .BaseTest import BaseTestCase


def _sent_messages(connection: Mock) -> List[Any]:
    return [json.loads(call.args[0]) for call in connection.on_data.call_args_list]


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
