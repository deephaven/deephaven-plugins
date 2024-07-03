from __future__ import annotations

from typing import Any, Generator

from deephaven import new_table
from deephaven.column import long_col

from ..shared import get_unique_names
from .utilities import (
    create_range_table,
    validate_heatmap_histfunc,
    create_tmp_view,
    aggregate_heatmap_bins,
    calculate_bin_locations,
)
from deephaven.table import Table


class HeatmapPreprocessor:
    """
    Preprocessor for heatmaps.

    Attributes:
        args: dict[str, Any]: The arguments used to create the plot
        range_table: The range table, calculated over the whole original table

    """

    def __init__(self, args: dict[str, Any]):
        self.args = args
        self.histfunc = args.pop("histfunc")
        self.nbinsx = args.pop("nbinsx")
        self.nbinsy = args.pop("nbinsy")
        self.range_bins_x = args.pop("range_bins_x")
        self.range_bins_y = args.pop("range_bins_y")
        # create unique names for the columns to ensure no collisions
        self.names = get_unique_names(
            self.args["table"],
            [
                "range_index_x",
                "range_index_y",
                "range_x",
                "range_y",
                "bin_min_x",
                "bin_max_x",
                "bin_min_y",
                "bin_max_y",
                "tmp_x",
                "tmp_y",
                "agg_col",
                self.histfunc,
            ],
        )

        # add the column names to names as well for ease of use
        self.names.update(
            {
                "x": self.args["x"],
                "y": self.args["y"],
                "z": self.args["z"],
            }
        )

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str | None = None
    ) -> Generator[tuple[Table, dict[str, str | None]], None, None]:
        """
        Preprocess params into an appropriate table

        Args:
            tables: a list of tables to preprocess
            column: the column to aggregate on

        Returns:
            A tuple containing (the new table, an update to make to the args)

        """

        range_index_x = self.names["range_index_x"]
        range_index_y = self.names["range_index_y"]
        range_x = self.names["range_x"]
        range_y = self.names["range_y"]
        histfunc_col = self.names[self.histfunc]
        x = self.names["x"]
        y = self.names["y"]
        z = self.names["z"]

        validate_heatmap_histfunc(z, self.histfunc)

        # there will only be one table, so we can just grab the first one
        table = tables[0]

        range_table_x = create_range_table(
            table, x, self.range_bins_x, self.nbinsx, range_name=range_x
        )
        range_table_y = create_range_table(
            table, y, self.range_bins_y, self.nbinsy, range_name=range_y
        )
        range_table = range_table_x.join(range_table_y)

        # ensure that all possible bins are created so that the rendered chart draws spaces for empty bins
        bin_counts_x = new_table(
            [long_col(range_index_x, [i for i in range(self.nbinsx)])]
        )
        bin_counts_y = new_table(
            [long_col(range_index_y, [i for i in range(self.nbinsy)])]
        )
        bin_counts = bin_counts_x.join(bin_counts_y)

        tmp_view = create_tmp_view(self.names)

        # filter to only the tmp (data) columns, and join the range table to the tmp
        ranged_tmp_view = table.view(tmp_view).join(range_table)

        agg_table = aggregate_heatmap_bins(ranged_tmp_view, self.names, self.histfunc)

        # join the aggregated values to the already created comprehensive bin table
        bin_counts = bin_counts.natural_join(
            agg_table, on=[range_index_x, range_index_y], joins=[self.names["agg_col"]]
        )

        # join the range table to the bin counts - this is needed because the ranges were dropped in the aggregation
        ranged_bin_counts = bin_counts.join(range_table)

        bin_counts_with_midpoint = calculate_bin_locations(
            ranged_bin_counts, self.names, histfunc_col
        )

        heatmap_title = f"{self.histfunc} of {z}" if z else self.histfunc

        yield bin_counts_with_midpoint.view([x, y, histfunc_col]), {
            "z": histfunc_col,
            "heatmap_title": heatmap_title,
        }
