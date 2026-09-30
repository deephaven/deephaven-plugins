from __future__ import annotations

from unittest.mock import Mock
from typing import Any, Callable, Dict, List
from deephaven.ui._internal import RootRenderContextProtocol
from deephaven.ui.types import QueryParams
from .BaseTest import BaseTestCase


class _TestRoot(RootRenderContextProtocol):
    """Minimal RootRenderContextProtocol implementation for tests."""

    def __init__(self, on_change_fn, on_queue_fn):
        self._on_change = on_change_fn
        self._on_queue_render_fn = on_queue_fn
        self._url: str = ""

    def on_change(self, update: Callable[[], None]) -> None:
        self._on_change(update)

    def on_queue_render(self, update: Callable[[], None]) -> None:
        self._on_queue_render_fn(update)

    def get_url(self) -> str:
        return self._url

    def set_url(self, url: str) -> None:
        self._url = url

    def get_query_params(self) -> QueryParams:
        """Get the current URL query parameters."""
        return dict()

    def set_query_params(self, query_params: QueryParams) -> None:
        """Update the URL query parameters."""
        pass


class UITableTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import empty_table

        self.source = empty_table(100).update(["X = i", "Y = i * 2"])

    def expect_render(self, ui_table, expected_props: dict[str, Any]):
        from deephaven.ui._internal import RenderContext

        on_change = Mock()
        on_queue = Mock()
        context = RenderContext(_TestRoot(on_change, on_queue))
        result = ui_table.render()

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

    def test_sorts(self):
        import deephaven.ui as ui

        t = ui.table(self.source, sorts="X")

        self.expect_render(
            t,
            {
                "sorts": [
                    {
                        "column": "X",
                        "direction": "ASC",
                        "isAbs": False,
                    }
                ]
            },
        )

        t = ui.table(self.source, sorts=ui.TableSort(column="X"))

        self.expect_render(
            t,
            {
                "sorts": [
                    {
                        "column": "X",
                        "direction": "ASC",
                        "isAbs": False,
                    }
                ]
            },
        )

        t = ui.table(
            self.source,
            sorts=ui.TableSort(column="X", direction="DESC", is_abs=True),
        )

        self.expect_render(
            t,
            {
                "sorts": [
                    {
                        "column": "X",
                        "direction": "DESC",
                        "isAbs": True,
                    }
                ]
            },
        )

    def test_sorts_list(self):
        import deephaven.ui as ui

        t = ui.table(self.source, sorts=["X", "Y"])

        self.expect_render(
            t,
            {
                "sorts": [
                    {
                        "column": "X",
                        "direction": "ASC",
                        "isAbs": False,
                    },
                    {
                        "column": "Y",
                        "direction": "ASC",
                        "isAbs": False,
                    },
                ]
            },
        )

        t = ui.table(
            self.source,
            sorts=[
                "X",
                ui.TableSort(column="X", direction="DESC", is_abs=True),
                ui.TableSort(column="Y", direction="ASC", is_abs=False),
            ],
        )

        self.expect_render(
            t,
            {
                "sorts": [
                    {
                        "column": "X",
                        "direction": "ASC",
                        "isAbs": False,
                    },
                    {
                        "column": "X",
                        "direction": "DESC",
                        "isAbs": True,
                    },
                    {
                        "column": "Y",
                        "direction": "ASC",
                        "isAbs": False,
                    },
                ]
            },
        )

    def test_sorts_invalid_direction(self):
        import deephaven.ui as ui

        self.assertRaises(
            ValueError,
            lambda: ui.table(
                self.source,
                sorts=ui.TableSort(column="X", direction="UP"),
            ),
        )

    def test_sorts_invalid_type(self):
        import deephaven.ui as ui

        self.assertRaises(
            ValueError,
            lambda: ui.table(self.source, sorts=1),
        )

        self.assertRaises(
            ValueError,
            lambda: ui.table(self.source, sorts=["X", 1]),
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

    def _column_values(self, tbl, name: str = "X") -> list:
        import deephaven.pandas as dhpd

        return dhpd.to_pandas(tbl)[name].tolist()

    def _resolve_ranged(self, ranges: list[dict]):
        from deephaven.ui.components.table import _resolve_selection

        return _resolve_selection(ranges, self.source)

    def test_resolve_selection_single_range(self):
        result = self._resolve_ranged([{"start_row": 2, "end_row": 4}])

        self.assertEqual(self._column_values(result), [2, 3, 4])

    def test_resolve_selection_multiple_ranges(self):
        # Ranges arrive already sorted ascending from the JS side.
        result = self._resolve_ranged(
            [
                {"start_row": 0, "end_row": 1},
                {"start_row": 5, "end_row": 6},
            ]
        )

        self.assertEqual(self._column_values(result), [0, 1, 5, 6])

    def test_resolve_selection_empty_preserves_schema(self):
        result = self._resolve_ranged([])

        self.assertEqual(result.size, 0)
        self.assertEqual(
            [c.name for c in result.columns], [c.name for c in self.source.columns]
        )

    def test_resolve_selection_skips_none_bounds(self):
        result = self._resolve_ranged(
            [
                {"start_row": 1, "end_row": 2},
                {"start_row": None, "end_row": None},
            ]
        )

        self.assertEqual(self._column_values(result), [1, 2])

    def _resolve_keyed(self, selected_keys: dict, tbl=None):
        from deephaven.ui.components.table import _resolve_keyed_selection

        return _resolve_keyed_selection(
            selected_keys, self.source if tbl is None else tbl
        )

    def test_resolve_keyed_selection(self):
        # X is an int column; inferring the key dtype from the JSON values yields
        # long, which where_in rejects as a key type mismatch.
        result = self._resolve_keyed(
            {"key_columns": ["X"], "key_values": [[3], [7]], "inverted": False}
        )

        self.assertEqual(self._column_values(result), [3, 7])

    def test_resolve_keyed_selection_inverted(self):
        result = self._resolve_keyed(
            {"key_columns": ["X"], "key_values": [[3], [7]], "inverted": True}
        )

        values = self._column_values(result)
        self.assertEqual(len(values), 98)
        self.assertNotIn(3, values)
        self.assertNotIn(7, values)

    def test_resolve_keyed_selection_empty_keys(self):
        # Mirrors createFilteredByKeysTable: empty means "none" unless inverted.
        none_selected = self._resolve_keyed(
            {"key_columns": ["X"], "key_values": [], "inverted": False}
        )
        self.assertEqual(none_selected.size, 0)

        all_selected = self._resolve_keyed(
            {"key_columns": ["X"], "key_values": [], "inverted": True}
        )
        self.assertEqual(all_selected.size, self.source.size)

    def test_resolve_keyed_selection_multiple_key_columns(self):
        from deephaven import empty_table

        source = empty_table(5).update(["Name = `row` + i", "Amount = (long) i * 10"])

        result = self._resolve_keyed(
            {
                "key_columns": ["Name", "Amount"],
                "key_values": [["row1", 10], ["row3", 30]],
                "inverted": False,
            },
            source,
        )

        self.assertEqual(self._column_values(result, "Name"), ["row1", "row3"])
        self.assertEqual(self._column_values(result, "Amount"), [10, 30])

    def test_resolve_keyed_selection_null_key(self):
        from deephaven import empty_table

        # A null among the values makes dtype inference produce PyObject, which
        # where_in rejects against the source String column.
        source = empty_table(3).update(["Key = i == 1 ? (String) null : `k` + i"])

        result = self._resolve_keyed(
            {"key_columns": ["Key"], "key_values": [[None]], "inverted": False},
            source,
        )

        # Only row 1 is null, so a single match means where_in is null-safe.
        self.assertEqual(result.size, 1)
