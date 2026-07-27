from __future__ import annotations
import unittest

from ..BaseTest import BaseTestCase


class DeephavenFigureCallbackTestCase(BaseTestCase):
    """Tests for event callback registration and serialization on DeephavenFigure"""

    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table([int_col("X", [1, 2, 3]), int_col("Y", [4, 5, 6])])

    def test_register_callback_assigns_incrementing_ids(self):
        """_register_callback assigns stable, incrementing IDs"""
        import src.deephaven.plot.express as dx

        fig = dx.scatter(self.source, x="X", y="Y")
        fig._register_callback("on_click", lambda e: None)
        fig._register_callback("on_selected", lambda e: None)

        self.assertEqual(fig._callback_ids["on_click"], "cb_0")
        self.assertEqual(fig._callback_ids["on_selected"], "cb_1")

    def test_to_json_includes_callbacks(self):
        """to_json includes deephaven.callbacks when callbacks are registered"""
        import src.deephaven.plot.express as dx
        import json

        fig = dx.scatter(self.source, x="X", y="Y")
        fig._register_callback("on_click", lambda e: None)

        result = json.loads(fig.to_json(self.exporter))
        self.assertIn("callbacks", result["deephaven"])
        self.assertEqual(result["deephaven"]["callbacks"]["on_click"], "cb_0")

    def test_to_json_omits_callbacks_when_none(self):
        """to_json omits deephaven.callbacks when no callbacks are registered"""
        import src.deephaven.plot.express as dx
        import json

        fig = dx.scatter(self.source, x="X", y="Y")

        result = json.loads(fig.to_json(self.exporter))
        self.assertNotIn("callbacks", result["deephaven"])

    def test_to_json_includes_preventable_callbacks_for_legend(self):
        """to_json includes preventable_callbacks for on_legend_click"""
        import src.deephaven.plot.express as dx
        import json

        fig = dx.scatter(self.source, x="X", y="Y")
        fig._register_callback("on_legend_click", lambda e: False)

        result = json.loads(fig.to_json(self.exporter))
        self.assertIn("preventable_callbacks", result["deephaven"])
        self.assertIn("cb_0", result["deephaven"]["preventable_callbacks"])

    def test_to_json_on_click_not_preventable_for_scatter(self):
        """on_click is NOT marked preventable on non-hierarchical charts"""
        import src.deephaven.plot.express as dx
        import json

        fig = dx.scatter(self.source, x="X", y="Y")
        fig._register_callback("on_click", lambda e: None)

        result = json.loads(fig.to_json(self.exporter))
        # on_click should NOT be in preventable_callbacks for scatter
        preventable = result["deephaven"].get("preventable_callbacks", [])
        self.assertNotIn("cb_0", preventable)

    def test_get_callback_by_id(self):
        """get_callback_by_id returns the correct function"""
        import src.deephaven.plot.express as dx

        handler = lambda e: "handled"
        fig = dx.scatter(self.source, x="X", y="Y")
        fig._register_callback("on_click", handler)

        retrieved = fig.get_callback_by_id("cb_0")
        self.assertIs(retrieved, handler)

    def test_get_callback_by_id_unknown(self):
        """get_callback_by_id returns None for unknown IDs"""
        import src.deephaven.plot.express as dx

        fig = dx.scatter(self.source, x="X", y="Y")
        self.assertIsNone(fig.get_callback_by_id("cb_999"))

    def test_copy_preserves_callbacks(self):
        """copy() preserves callback state"""
        import src.deephaven.plot.express as dx

        handler = lambda e: None
        fig = dx.scatter(self.source, x="X", y="Y")
        fig._register_callback("on_click", handler)

        copied = fig.copy()
        self.assertEqual(copied._callback_ids, fig._callback_ids)
        self.assertIs(copied._callbacks["on_click"], handler)

    def test_scatter_with_on_click_kwarg(self):
        """scatter() with on_click registers the callback"""
        import src.deephaven.plot.express as dx
        import json

        handler = lambda e: None
        fig = dx.scatter(self.source, x="X", y="Y", on_click=handler)

        self.assertIn("on_click", fig._callbacks)
        self.assertIs(fig._callbacks["on_click"], handler)

        result = json.loads(fig.to_json(self.exporter))
        self.assertIn("callbacks", result["deephaven"])
        self.assertIn("on_click", result["deephaven"]["callbacks"])

    def test_on_press_alias(self):
        """on_press resolves to on_click"""
        import src.deephaven.plot.express as dx

        handler = lambda e: None
        fig = dx.scatter(self.source, x="X", y="Y", on_press=handler)

        self.assertIn("on_click", fig._callbacks)
        self.assertIs(fig._callbacks["on_click"], handler)


class LayerCallbackMergingTestCase(BaseTestCase):
    """Tests for callback merging in layer()"""

    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col

        self.source = new_table([int_col("X", [1, 2, 3]), int_col("Y", [4, 5, 6])])

    def test_layer_direct_kwarg_wins(self):
        """layer() with direct on_click kwarg uses that callback"""
        import src.deephaven.plot.express as dx

        handler_a = lambda e: "a"
        handler_direct = lambda e: "direct"

        fig_a = dx.scatter(self.source, x="X", y="Y", on_click=handler_a)
        layered = dx.layer(fig_a, on_click=handler_direct)

        self.assertIs(layered._callbacks["on_click"], handler_direct)

    def test_layer_last_child_wins(self):
        """layer() with two figures uses last figure's callback"""
        import src.deephaven.plot.express as dx

        handler_a = lambda e: "a"
        handler_b = lambda e: "b"

        fig_a = dx.scatter(self.source, x="X", y="Y", on_click=handler_a)
        fig_b = dx.scatter(self.source, x="X", y="Y", on_click=handler_b)
        layered = dx.layer(fig_a, fig_b)

        self.assertIs(layered._callbacks["on_click"], handler_b)


if __name__ == "__main__":
    unittest.main()
