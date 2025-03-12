from __future__ import annotations

from typing import Any, Generator

from deephaven.table import Table

from .StyleManager import StyleManager
from ..shared import get_unique_names


class AttachedPreprocessor:
    """A AttachedPreprocessor that adds styles to "always_attached" plot tables
    such as treemap and pie.

    Attributes:
        args: Args used to create the plot
        always_attached: The dict mapping the arg and column
          to the style map, dictionary, and new column name, to be used for
          AttachedProcessor when dealing with an "always_attached" plot
    """

    def __init__(
            self,
            args: dict[str, Any],
            always_attached: dict[tuple[str, str], tuple[dict[str, str], list[str], str]],
            path: str | list[str] | None = None,
    ):
        self.args = args
        self.always_attached = always_attached
        self.path = path
        self.prepare_preprocess()

    def preprocess_paths(self, table):
        from deephaven import agg
        from deephaven import merge

        # sometimes there are columns that need to be aggregated along with the Value column
        numeric_cols = {self.args["values"]}
        for (arg, col), (map, ls, new_col, numeric_col) in self.always_attached.items():
            if numeric_col:
                numeric_cols.add(numeric_col)

        table_columns = set(table.column_names)
        # any numeric columns should be a sum, all others should be last
        other_cols = table_columns - numeric_cols

        new_table = None

        path_rev = list(reversed(self.path))

        for i, p in enumerate(path_rev[:-1]):

            by_col = p
            parent_col = path_rev[i + 1]

            aggs = [agg.last(col) for col in other_cols] + [
                agg.sum_(col) for col in numeric_cols
            ]
            # update the view because the other columns might need to be kept for color, etc.
            newest_table = table.agg_by(aggs, by=[by_col]).update_view(
                [f"Names={by_col}", f"Parent={parent_col}"]
            )

            if not new_table:
                new_table = newest_table
            else:
                new_table = merge([new_table, newest_table])

        return new_table

    def attach_styles(self):
        table = self.args["table"]
        for (arg, col), (map, ls, new_col, style_col) in self.always_attached.items():
            if not style_col:
                manager_col = get_unique_names(table, [f"{new_col}_manager"])[
                    f"{new_col}_manager"
                ]
                style_manager = StyleManager(map=map, ls=ls)

                table = table.update_view(
                    [
                        f"{manager_col}=style_manager",
                        f"{new_col}={manager_col}.assign_style({col})",
                    ]
                )

        self.args["table"] = table

    def prepare_preprocess(self):
        """
        Create a table with styles attached
        """
        if self.always_attached:
            self.attach_styles()

    def preprocess_partitioned_tables(
            self, tables: list[Table] | None, column: str | None = None
    ) -> Generator[
        Table | tuple[Table, dict[str, str | None]] | tuple[Table, dict[str, str]],
        None,
        None,
    ]:
        """
        Preprocess tables into Attached tables

        Args:
            tables: List of tables to preprocess
            column: the column used
        """
        print(self.path)
        if self.path:
            for table in tables:
                print(table)
                yield self.preprocess_paths(table), {"parents": "Parent", "names": "Names"}
        else:
            for table in tables:
                yield table, {}
