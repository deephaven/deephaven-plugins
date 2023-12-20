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
        context = RenderContext(on_change)
        result = ui_table.render(context)

        self.assertDictEqual(result, expected_props)

    def test_empty_ui_table(self):
        import deephaven.ui as ui

        t = ui.table(self.source)

        self.expect_render(t, {"table": self.source})

    def test_on_row_double_press(self):
        import deephaven.ui as ui

        def callback(row):
            pass

        t = ui.table(self.source).on_row_double_press(callback)

        self.expect_render(
            t,
            {
                "table": self.source,
                "onRowDoublePress": callback,
            },
        )

    def test_always_fetch_columns(self):
        import deephaven.ui as ui

        ui_table = ui.table(self.source)

        t = ui_table.always_fetch_columns("X")

        self.expect_render(
            t,
            {
                "table": self.source,
                "alwaysFetchColumns": ["X"],
            },
        )

        t = ui.table(self.source).always_fetch_columns(["X", "Y"])

        self.expect_render(
            t,
            {
                "table": self.source,
                "alwaysFetchColumns": ["X", "Y"],
            },
        )

        t = ui.table(self.source).always_fetch_columns("X").always_fetch_columns("Y")

        self.expect_render(
            t,
            {
                "table": self.source,
                "alwaysFetchColumns": ["X", "Y"],
            },
        )

    def test_can_search(self):
        import deephaven.ui as ui

        ui_table = ui.table(self.source)

        t = ui_table.can_search("SHOW")

        self.expect_render(
            t,
            {
                "table": self.source,
                "canSearch": True,
            },
        )

        t = ui_table.can_search("HIDE")

        self.expect_render(
            t,
            {
                "table": self.source,
                "canSearch": False,
            },
        )

        t = ui_table.can_search("DEFAULT")

        self.expect_render(
            t,
            {
                "table": self.source,
            },
        )

        t = ui_table.can_search("SHOW").can_search("DEFAULT")

        self.expect_render(
            t,
            {
                "table": self.source,
            },
        )

        t = ui_table.can_search("HIDE").can_search("DEFAULT")

        self.expect_render(
            t,
            {
                "table": self.source,
            },
        )

    def test_quick_filter(self):
        import deephaven.ui as ui

        ui_table = ui.table(self.source)

        t = ui_table.quick_filter({"X": "X > 1"})

        self.expect_render(
            t,
            {
                "table": self.source,
                "filters": {"X": "X > 1"},
            },
        )

        t = ui_table.quick_filter({"X": "X > 1"}).quick_filter({"X": "X > 2"})

        self.expect_render(
            t,
            {
                "table": self.source,
                "filters": {"X": "X > 2"},
            },
        )

        t = ui_table.quick_filter({"X": "X > 1", "Y": "Y < 2"})

        self.expect_render(
            t,
            {
                "table": self.source,
                "filters": {"X": "X > 1", "Y": "Y < 2"},
            },
        )

    def test_sort(self):
        import deephaven.ui as ui
        from deephaven import SortDirection

        ui_table = ui.table(self.source)

        t = ui_table.sort("X")
        self.expect_render(
            t,
            {
                "table": self.source,
                "sorts": [{"column": "X", "direction": "ASC", "is_abs": False}],
            },
        )

        t = ui_table.sort("X", SortDirection.DESCENDING)
        self.expect_render(
            t,
            {
                "table": self.source,
                "sorts": [{"column": "X", "direction": "DESC", "is_abs": False}],
            },
        )

        self.assertRaises(
            ValueError, ui_table.sort, ["X", "Y"], [SortDirection.ASCENDING]
        )

        self.assertRaises(
            ValueError,
            ui_table.sort,
            ["X"],
            [SortDirection.ASCENDING, SortDirection.DESCENDING],
        )

        t = ui_table.sort(
            ["X", "Y"], [SortDirection.ASCENDING, SortDirection.DESCENDING]
        )

        self.expect_render(
            t,
            {
                "table": self.source,
                "sorts": [
                    {"column": "X", "direction": "ASC", "is_abs": False},
                    {"column": "Y", "direction": "DESC", "is_abs": False},
                ],
            },
        )

        t = ui_table.sort(["X", "Y"], ["DESC", "ASC"])

        self.expect_render(
            t,
            {
                "table": self.source,
                "sorts": [
                    {"column": "X", "direction": "DESC", "is_abs": False},
                    {"column": "Y", "direction": "ASC", "is_abs": False},
                ],
            },
        )

        self.assertRaises(ValueError, ui_table.sort, ["X", "Y"], ["INVALID"])
