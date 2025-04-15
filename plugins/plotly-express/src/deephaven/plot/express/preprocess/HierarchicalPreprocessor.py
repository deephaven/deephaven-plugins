from __future__ import annotations

from typing import Any, Generator

from deephaven.table import Table
from deephaven import agg
from deephaven import merge

from ..shared import get_unique_names
from ..types import HierarchicalTransforms


def trim_id(id_: str) -> str:
    """
    Trim the ids to remove the last part of the id
    """
    return id_.rsplit("/", 1)[0]


class HierarchicalPreprocessor:
    """A HierarchicalPreprocessor that transforms the path into columns that can be used
    directly.

    Attributes:
        args: Args used to create the plot
        hierarchical_transforms: The transforms that should be applied to the table
        path: The path defining the hierarchy
    """

    def __init__(
        self,
        args: dict[str, Any],
        hierarchical_transforms: HierarchicalTransforms,
        path: str | list[str] | None = None,
    ):
        self.args = args
        self.hierarchical_transforms = hierarchical_transforms

        if isinstance(path, str):
            path = [path]
        self.path = path if path is not None else []

    def preprocess_paths(self, table: Table, names: dict[str, str]) -> Table:
        """
        Preprocess the path
        The path is a list of columns that should be used to create the hierarchy
        The path columns are transformed to Names and Parent columns.
        Values are aggregated by sum up the hierarchy.
        Other columns that have a meaningful numeric value are aggregated by weighted average.
        These numeric columns are pulled from hierarchical_transforms.
        Any other columns are aggregated by last in case they are needed.

        Args:
            table: The table to preprocess
            names: The names of the columns to use for the hierarchy

        Returns:
            The preprocessed table
        """
        sum_cols = {self.args["values"]}

        # sometimes there are columns that need to be aggregated along with the Value column
        avg_cols = set()
        for (avg_col,) in self.hierarchical_transforms:
            avg_cols.add(avg_col)

        ids = f"{' + `/` + '.join(self.path)}"
        table = table.update_view(f"{names['Ids']} = {ids}")

        table_columns = set(table.column_names)

        # values columns should be a sum, all others should be last
        # others need to be kept for color, etc.
        other_cols = table_columns - sum_cols - avg_cols

        level_tables = []

        prev_table = table

        aggs = (
            [agg.last(col) for col in other_cols]
            + [agg.sum_(col) for col in sum_cols]
            # plotly uses weighted average for the sum_cols such as color
            + [agg.weighted_avg(self.args["values"], col) for col in avg_cols]
        )

        # reverse the path to aggregate from the bottom up
        for i, by_col in enumerate(list(reversed(self.path))):
            # update the view because the other columns might need to be kept for color, etc.
            # the parents are the first part of the id
            # if the value of the ID column is A/B/C here, the parent is A because we took last_by
            level_table = prev_table.agg_by(aggs, by=[by_col]).update_view(
                [
                    f"{names['Names']}={by_col}",
                ]
            )

            if i == 0:
                # on the first iteration, the id doesn't need to be trimmed
                # so the parent is the id trimmed once
                level_table = level_table.update_view(
                    f"{names['Parents']}=trim_id({names['Ids']})"
                )
            else:
                # on subsequent iterations, the id needs to be trimmed
                # because the id at this point is of an arbitrary child from agg.last
                # then the id is trimmed to get the parent
                # if on the last iteration, the parent needs to be empty for plotly to work
                parent_op = (
                    f"trim_id({names['Ids']})" if i != len(self.path) - 1 else '""'
                )
                level_table = level_table.update_view(
                    [
                        f"{names['Ids']}=trim_id({names['Ids']})",
                        f"{names['Parents']}={parent_op}",
                    ]
                )

            level_tables.append(level_table)
            prev_table = level_table

        return merge(level_tables)

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str | None = None
    ) -> Generator[
        Table | tuple[Table, dict[str, str | None]] | tuple[Table, dict[str, str]],
        None,
        None,
    ]:
        """
        Preprocess tables into Attached tables

        Args:
            tables: List of tables to preprocess
            column: the column used (ignored)
        """

        if self.path:
            for table in tables:
                names = get_unique_names(table, ["Names", "Parents", "Ids"])

                yield self.preprocess_paths(table, names), {
                    "parents": names["Parents"],
                    "names": names["Names"],
                    "ids": names["Ids"],
                    # always use total for branch values if a path is present
                    # because the values are summed
                    "branchvalues": "total",
                }
        else:
            for table in tables:
                yield table, {}
