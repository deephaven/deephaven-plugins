from __future__ import annotations

from unittest.mock import Mock
from typing import Any
from .BaseTest import BaseTestCase


class UITableTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import empty_table

        self.source = empty_table(100).update(["X = i", "Y = i * 2"])

    def expect_render(self, ui_table, expected_props: dict[str, Any]):
        from deephaven.ui._internal import RenderContext

        on_change = Mock()
        on_queue = Mock()
        context = RenderContext(on_change, on_queue)
        result = ui_table.render(context)

        self.assertDictEqual(result, result | expected_props)

    def test_empty_ui_table(self):
        import deephaven.ui as ui

        t = ui.table(self.source)

        self.expect_render(t, {"table": self.source})

    def test_on_row_double_press(self):
        import deephaven.ui as ui

        def callback(row):
            pass

        t = ui.table(self.source, on_row_double_press=callback)

        self.expect_render(
            t,
            {
                "onRowDoublePress": callback,
            },
        )

    def test_always_fetch_columns(self):
        import deephaven.ui as ui

        ui_table = ui.table(self.source)

        t = ui.table(self.source, always_fetch_columns="X")

        self.expect_render(
            t,
            {
                "alwaysFetchColumns": "X",
            },
        )

        t = ui.table(self.source, always_fetch_columns=["X", "Y"])

        self.expect_render(
            t,
            {
                "alwaysFetchColumns": ["X", "Y"],
            },
        )

        t = ui.table(self.source, always_fetch_columns=True)

        self.expect_render(
            t,
            {
                "alwaysFetchColumns": True,
            },
        )

    def test_quick_filters(self):
        import deephaven.ui as ui

        t = ui.table(self.source, quick_filters={"X": "X > 1"})

        self.expect_render(
            t,
            {
                "quickFilters": {"X": "X > 1"},
            },
        )

        t = ui.table(self.source, quick_filters={"X": "X > 1", "Y": "Y < 2"})

        self.expect_render(
            t,
            {
                "quickFilters": {"X": "X > 1", "Y": "Y < 2"},
            },
        )

    def test_show_quick_filters(self):
        import deephaven.ui as ui

        t = ui.table(self.source)

        self.expect_render(
            t,
            {
                "showQuickFilters": False,
            },
        )

        t = ui.table(self.source, show_quick_filters=True)

        self.expect_render(
            t,
            {
                "showQuickFilters": True,
            },
        )

        t = ui.table(self.source, show_quick_filters=False)

        self.expect_render(
            t,
            {
                "showQuickFilters": False,
            },
        )

    def test_show_search(self):
        import deephaven.ui as ui

        t = ui.table(self.source)

        self.expect_render(
            t,
            {
                "showSearch": False,
            },
        )

        t = ui.table(self.source, show_search=True)

        self.expect_render(
            t,
            {
                "showSearch": True,
            },
        )

        t = ui.table(self.source, show_search=False)

        self.expect_render(
            t,
            {
                "showSearch": False,
            },
        )

    def test_front_columns(self):
        import deephaven.ui as ui

        t = ui.table(self.source, front_columns=["X"])

        self.expect_render(
            t,
            {
                "frontColumns": ["X"],
            },
        )

    def test_back_columns(self):
        import deephaven.ui as ui

        t = ui.table(self.source, back_columns=["X"])

        self.expect_render(
            t,
            {
                "backColumns": ["X"],
            },
        )

    def test_frozen_columns(self):
        import deephaven.ui as ui

        t = ui.table(self.source, frozen_columns=["X"])

        self.expect_render(
            t,
            {
                "frozenColumns": ["X"],
            },
        )

    def test_hidden_columns(self):
        import deephaven.ui as ui

        t = ui.table(self.source, hidden_columns=["X"])

        self.expect_render(
            t,
            {
                "hiddenColumns": ["X"],
            },
        )

    def test_column_groups(self):
        import deephaven.ui as ui

        t = ui.table(
            self.source,
            column_groups=[{"name": "Group", "children": ["X"], "color": "red"}],
        )

        self.expect_render(
            t,
            {
                "columnGroups": [
                    {
                        "name": "Group",
                        "children": ["X"],
                        "color": "red",
                    }
                ],
            },
        )

    def test_on_selection_change(self):
        import deephaven.ui as ui

        on_change = Mock()

        self.assertRaises(
            ValueError,
            lambda: ui.table(
                self.source,
                on_selection_change=on_change,
            ),
        )

        t = ui.table(
            self.source,
            on_selection_change=on_change,
            always_fetch_columns=["X"],
        )

        self.expect_render(
            t,
            {
                "alwaysFetchColumns": ["X"],
                "onSelectionChange": on_change,
            },
        )

    def test_databar_full_options(self):
        import deephaven.ui as ui
        from deephaven.ui.components.table import TableFormat, TableDatabar

        t = ui.table(
            self.source,
            format_=TableFormat(
                cols="X",
                mode=TableDatabar(
                    value_column="Y",
                    min=0,
                    max=100,
                    axis="middle",
                    direction="LTR",
                    value_placement="overlap",
                    color="blue",
                    opacity=0.7,
                    markers=[{"value": 50, "color": "red"}],
                ),
            ),
        )

        self.expect_render(
            t,
            {
                "format_": TableFormat(
                    cols="X",
                    mode=TableDatabar(
                        value_column="Y",
                        min=0,
                        max=100,
                        axis="middle",
                        direction="LTR",
                        value_placement="overlap",
                        color="blue",
                        opacity=0.7,
                        markers=[{"value": 50, "color": "red"}],
                    ),
                ),
            },
        )

    def test_databar_multiple_columns(self):
        import deephaven.ui as ui
        from deephaven.ui.components.table import TableFormat, TableDatabar

        t = ui.table(
            self.source,
            format_=[
                TableFormat(
                    cols=["X", "Y"],
                    mode=TableDatabar(
                        color="positive", markers=[{"value": 50, "color": "red"}]
                    ),
                ),
            ],
        )

        self.expect_render(
            t,
            {
                "format_": [
                    TableFormat(
                        cols=["X", "Y"],
                        mode=TableDatabar(
                            color="positive",
                            markers=[{"value": 50, "color": "red"}],
                        ),
                    ),
                ],
            },
        )

    def test_databar_conditional(self):
        import deephaven.ui as ui
        from deephaven.ui.components.table import TableFormat, TableDatabar

        t = ui.table(
            self.source,
            format_=TableFormat(
                cols="X",
                if_="X > 50",
                mode=TableDatabar(color="positive"),
            ),
        )

        self.expect_render(
            t,
            {
                "format_": TableFormat(
                    cols="X",
                    if_="X > 50",
                    mode=TableDatabar(color="positive"),
                ),
            },
        )

    def test_databar_mixed_formatting(self):
        import deephaven.ui as ui
        from deephaven.ui.components.table import TableFormat, TableDatabar

        t = ui.table(
            self.source,
            format_=[
                TableFormat(cols="X", background_color="accent-100"),
                TableFormat(cols="Y", mode=TableDatabar(color="blue")),
                TableFormat(cols="X", if_="X > 50", color="positive"),
            ],
        )

        self.expect_render(
            t,
            {
                "format_": [
                    TableFormat(cols="X", background_color="accent-100"),
                    TableFormat(cols="Y", mode=TableDatabar(color="blue")),
                    TableFormat(cols="X", if_="X > 50", color="positive"),
                ],
            },
        )
