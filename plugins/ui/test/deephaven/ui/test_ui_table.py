from typing import Any
from .BaseTest import BaseTestCase


class UITableTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import empty_table

        self.source = empty_table(100).update(["X = i", "Y = i * 2"])

    def expect_render(self, ui_table, expected_props: dict[str, Any]):
        from deephaven.ui._internal import RenderContext

        context = RenderContext()
        result = ui_table.render(context)

        self.assertDictEqual(result, expected_props)

    def test_empty_ui_table(self):
        import deephaven.ui as ui

        t = ui.table(self.source)

        self.expect_render(t, {"children": self.source})

    def test_on_row_double_click(self):
        import deephaven.ui as ui

        def callback(row):
            pass

        t = ui.table(self.source).on_row_double_click(callback)

        self.expect_render(
            t,
            {
                "children": self.source,
                "on_row_double_click": callback,
            },
        )
