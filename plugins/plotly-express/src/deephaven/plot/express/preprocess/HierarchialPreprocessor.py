from __future__ import annotations

from typing import Any, Generator, TypedDict

from deephaven.table import Table
from deephaven import agg
from deephaven import merge

from ..shared import get_unique_names
from ..types import HierarchicalTransforms


class HierarchicalPreprocessor:
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
        hierarchical_transforms: HierarchicalTransforms,
        path: str | list[str] | None = None,
    ):
        self.args = args
        self.hierarchical_transforms = hierarchical_transforms
        self.path = path
        self.names = get_unique_names(self.args["table"], ["Names", "Parent"])

    def preprocess_paths(self, table):
        # sometimes there are columns that need to be aggregated along with the Value column
        numeric_cols = {self.args["values"]}
        for (by_col, new_col) in self.hierarchical_transforms:
            numeric_cols.add(by_col)

        table_columns = set(table.column_names)
        # any numeric columns should be a sum, all others should be last
        # others need to be kept for color, etc.
        other_cols = table_columns - numeric_cols

        new_table = None

        path_rev = list(reversed(self.path))

        for i, p in enumerate(path_rev[:-1]):

            by_col = p
            parent_col = path_rev[i + 1]

            aggs = [agg.last(col) for col in other_cols] + [
                agg.avg(col) for col in numeric_cols
            ]
            # update the view because the other columns might need to be kept for color, etc.
            newest_table = table.agg_by(aggs, by=[by_col]).update_view(
                [
                    f"{self.names['Names']}={by_col}",
                    f"{self.names['Parent']}={parent_col}",
                ]
            )

            if not new_table:
                new_table = newest_table
            else:
                new_table = merge([new_table, newest_table])

        return new_table

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
        if self.path:
            for table in tables:
                yield self.preprocess_paths(table), {
                    "parents": "Parent",
                    "names": "Names",
                    # always use total for branch values if a path is present
                    # because the values are summed
                    "branchvalues": "total",
                }
        else:
            for table in tables:
                yield table, {}
