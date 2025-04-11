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

    def preprocess_paths(self, table: Table, names) -> Table:
        """
        Preprocess the path
        The path is a list of columns that should be used to create the hierarchy
        The columns are transformed so that there are only Names and Parent columns,
        dep
        Values are aggregated by sum up the hierarchy.
        Other columns that have a meaningful numeric value are aggregated by weighted average.
        These numeric columns are pulled from hierarchical_transforms.
        Any other columns are aggregated by last in case they are needed.

        Args:
            table: The table to preprocess

        Returns:
            The preprocessed table
        """
        # sometimes there are columns that need to be aggregated along with the Value column
        # the weighted average is used to get the correct value for the parent
        numeric_cols = {self.args["values"]}
        sum_cols = set()
        print("testingeee", self.hierarchical_transforms)
        for (sum_col,) in self.hierarchical_transforms:
            sum_cols.add(sum_col)

        ids = f"{' + `/` + '.join(self.path)}"
        table = table.update_view(f"{names['Ids']} = {ids}")

        table_columns = set(table.column_names)
        # any numeric columns should be a sum, all others should be last
        # others need to be kept for color, etc.
        other_cols = table_columns - numeric_cols - sum_cols

        new_table = None

        path_rev = list(reversed(self.path))

        prev_table = table

        def trim_id(id_: str) -> str:
            """
            Trim the ids to remove the last part of the id
            """
            return id_.rsplit("/", 1)[0]

        for i, p in enumerate(path_rev):
            by_col = p

            aggs = (
                [agg.last(col) for col in other_cols]
                + [agg.sum_(col) for col in numeric_cols]
                # plotly uses weighted average for the sum_cols such as color
                + [agg.weighted_avg(self.args["values"], col) for col in sum_cols]
            )
            # update the view because the other columns might need to be kept for color, etc.
            # the parents are the first part of the id
            # if the value of the ID column is A/B/C here, the parent is A because we took last_by

            newest_table = prev_table.agg_by(aggs, by=[by_col]).update_view(
                [
                    f"{names['Names']}={by_col}",
                ]
            )

            if i == 0:
                # on the first iteration, the id doesn't need to be trimmed
                # so the parent is the id trimmed once
                newest_table = newest_table.update_view(
                    f"{names['Parents']}=trim_id({names['Ids']})"
                )
            else:
                # on subsequent iterations, the id needs to be trimmed
                # because the id at this point is of an arbitrary child from agg.last
                # then the id is trimmed to get the parent
                # if on the last iteration, the parent needs to be empty for plotly to work
                parent_op = (
                    f"trim_id({names['Ids']})" if i != len(path_rev) - 1 else '""'
                )
                newest_table = newest_table.update_view(
                    [
                        f"{names['Ids']}=trim_id({names['Ids']})",
                        f"{names['Parents']}={parent_op}",
                    ]
                )

            if not new_table:
                new_table = newest_table
            else:
                new_table = merge([new_table, newest_table])

            prev_table = newest_table

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
                names = get_unique_names(table, ["Names", "Parents", "Ids"])

                print(self.preprocess_paths(table, names))

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
