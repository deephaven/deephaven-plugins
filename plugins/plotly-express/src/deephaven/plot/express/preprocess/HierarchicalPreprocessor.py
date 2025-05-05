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
        color: The color column to use
        color_mask: The column to use for the color mask, which controls if a categorical
        color is valid at this level
    """

    def __init__(
        self,
        args: dict[str, Any],
        hierarchical_transforms: HierarchicalTransforms,
        path: str | list[str],
        color: str | None,
        color_mask: str,
    ):
        self.args = args
        self.hierarchical_transforms = hierarchical_transforms

        if isinstance(path, str):
            path = [path]
        self.path = path

        self.color = color
        self.color_mask = color_mask

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

        # Parents is a new columns that is added to the table
        other_cols.update([names["Parents"], self.color_mask])

        level_tables = []

        prev_table = table

        child_count = get_unique_names(table, ["ChildCount"])["ChildCount"]

        aggs = (
            [agg.last(col) for col in other_cols]
            + [agg.sum_(col) for col in sum_cols]
            # plotly uses weighted average for the sum_cols such as color
            + [agg.weighted_avg(self.args["values"], col) for col in avg_cols]
            # if there is more than one child, the color mask is false for the parent
            + [agg.count_(child_count)]
        )

        # since we start from the bottom of the hierarchy, all levels should
        # be styled until we hit the color column
        in_color_mask = "true"

        # reverse the path to aggregate from the bottom up
        for i, by_col in enumerate(list(reversed(self.path))):
            if i == 0:
                # on the first iteration, the id doesn't need to be trimmed
                # so the parent is the id trimmed once
                level_table = prev_table.update_view(
                    [
                        f"{names['Parents']}=trim_id({names['Ids']})",
                        # need to add the color mask to the first iteration
                        # so it is "aggregated" up even if in_color_mask is False
                        f"{self.color_mask}={in_color_mask}",
                    ]
                )
            else:
                # on subsequent iterations, the id needs to be trimmed
                # because the id at this point is of an arbitrary child from agg.last
                # then the id is trimmed to get the parent
                # if on the last iteration, the parent needs to be empty for plotly to work
                get_parent = (
                    f"trim_id({names['Ids']})" if i != len(self.path) - 1 else '""'
                )
                level_table = prev_table.update_view(
                    [
                        f"{names['Ids']}={names['Parents']}",
                        f"{names['Parents']}={get_parent}",
                    ]
                )

            level_table = level_table.agg_by(aggs, by=[names["Ids"]]).update_view(
                [
                    f"{names['Names']}={by_col}",
                ]
            )

            # recalculate the color mask with respect to the child count and child mask
            level_table = level_table.update_view(
                f"{self.color_mask}={in_color_mask} || ({self.color_mask} && {child_count} <= 1)"
            )

            level_tables.append(level_table)
            prev_table = level_table

            if by_col == self.color:
                # if this is the color column, any aggregation above this should not
                # have the color applied based on a value in by_col unless the child count is 1
                in_color_mask = "false"

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
