from __future__ import annotations

from typing import Generator, Literal

from deephaven import agg, empty_table
from deephaven.plot.express.shared import get_unique_names
from deephaven.table import PartitionedTable, Table

# Used to aggregate within bins
HISTFUNC_AGGS = {
    "abs_sum": agg.abs_sum,
    "avg": agg.avg,
    "count": agg.count_,
    "count_distinct": agg.count_distinct,
    "max": agg.max_,
    "median": agg.median,
    "min": agg.min_,
    "std": agg.std,
    "sum": agg.sum_,
    "var": agg.var,
}


def get_aggs(
    base: str,
    columns: list[str],
) -> tuple[list[str], str]:
    """Create aggregations over all columns

    Args:
      base:
        The base of the new columns that store the agg per column
      columns:
        All columns joined for the sake of taking min or max over
        the columns

    Returns:
        A tuple containing (a list of the new columns,
        a joined string of "NewCol, NewCol2...")

    """
    return (
        [f"{base}{column}={column}" for column in columns],
        ", ".join([f"{base}{column}" for column in columns]),
    )


def single_table(table: Table | PartitionedTable) -> Table:
    """
    Merge a table if it is partitioned table

    Args:
        table: The table to merge

    Returns:
        The table if it is not a partitioned table, otherwise the merged table
    """
    return table.merge() if isinstance(table, PartitionedTable) else table


def discretized_range_view(
    table: Table,
    range_min: float | str,
    range_max: float | str,
    nbins: int,
    range_name: str,
) -> Table:
    """
    Create a discretized range view that can be joined with a table to compute indices

    Args:
        table: The table to create the range view from
        range_min: The minimum value of the range. Can be a number or a column name
        range_max: The maximum value of the range. Can be a number or a column name
        nbins: The number of bins to create
        range_name: The name of the range object in the resulting table

    Returns:
        A table that contains the range object for the given table
    """

    return table.update(
        f"{range_name} = new io.deephaven.plot.datasets.histogram."
        f"DiscretizedRangeEqual({range_min},{range_max}, "
        f"{nbins})"
    ).view(range_name)


def create_range_table(
    table: Table | PartitionedTable,
    cols: str | list[str],
    range_bins: list[float | None] | None,
    nbins: int,
    range_name: str,
) -> Table:
    """
    Create single row tables with range objects that can compute bin membership

    Args:
        table: The table to create the range table from
        cols: The columns to create the range table from. The resulting range table will have
            its range calculated over all of these columns.
        range_bins: The range to create the bins over.
            If None, the range will be calculated over the columns.
            If a list of two numbers, the range will be set to these numbers.
            The values within this list can also be None, in which case the range will be calculated over the columns
            for whichever value is None.
        nbins: The number of bins to create
        range_name: The name of the range object in the resulting table

    Returns:
        A table that contains the range object for the given
    """
    table = single_table(table)

    cols = [cols] if isinstance(cols, str) else cols

    range_min = (
        range_bins[0] if range_bins and range_bins[0] is not None else "RangeMin"
    )
    range_max = (
        range_bins[1] if range_bins and range_bins[1] is not None else "RangeMax"
    )

    min_table = empty_table(1)
    max_table = empty_table(1)

    if range_min == "RangeMin":
        min_aggs, min_cols = get_aggs("RangeMin", cols)
        min_table = table.agg_by([agg.min_(min_aggs)]).update(
            [f"RangeMin = min({min_cols})"]
        )
    if range_max == "RangeMax":
        max_aggs, max_cols = get_aggs("RangeMax", cols)
        max_table = table.agg_by([agg.max_(max_aggs)]).update(
            [f"RangeMax = max({max_cols})"]
        )

    return discretized_range_view(
        min_table.join(max_table), range_min, range_max, nbins, range_name
    )


def validate_heatmap_histfunc(z: str | None, histfunc: str) -> None:
    """
    Check if the histfunc is valid

    Args:
        z: The column that contains z-axis values.
        histfunc: The function to use when aggregating within bins. Should be 'count' if z is None.

    Raises:
        ValueError: If the histfunc is not valid
    """
    if z is None and histfunc != "count":
        raise ValueError("z must be specified for histfunc other than count")
    elif histfunc not in HISTFUNC_AGGS:
        raise ValueError(f"{histfunc} is not a valid histfunc")


def create_tmp_view(
    names: dict[str, str],
) -> list[str]:
    """
    Create a temporary view that avoids column name collisions

    Args:
        names: The names used for columns so that they don't collide

    Returns:
        A list of strings that are used to create a temporary view
    """

    x = names["x"]
    y = names["y"]
    z = names["z"]
    tmp_x = names["tmp_x"]
    tmp_y = names["tmp_y"]
    agg_col = names["agg_col"]

    tmp_view = [f"{tmp_x} = {x}", f"{tmp_y} = {y}"]

    if z is not None:
        tmp_view.append(f"{agg_col} = {z}")
    else:
        # if z is not specified, just count the number of occurrences, so tmp_x or tmp_y can be used
        names["agg_col"] = tmp_x

    return tmp_view


def aggregate_heatmap_bins(
    table: Table,
    names: dict[str, str],
    histfunc: str,
) -> Table:
    """
    Create count tables that aggregate up values into bins

    Args:
        table: The table to aggregate. Should contain the tmp data columns and the range columns
        names: The names used for columns so that they don't collide
        histfunc: The function to use when aggregating within bins. Should be 'count' if z is None.

    Yields:
        A tuple containing the table and a temporary column that contains the aggregated values
    """

    range_x = names["range_x"]
    range_y = names["range_y"]
    range_index_x = names["range_index_x"]
    range_index_y = names["range_index_y"]

    tmp_x = names["tmp_x"]
    tmp_y = names["tmp_y"]
    agg_col = names["agg_col"]

    count_table = (
        table.update_view(
            [
                f"{range_index_x} = {range_x}.index({tmp_x})",
                f"{range_index_y} = {range_y}.index({tmp_y})",
            ]
        )
        .where([f"!isNull({range_index_x})", f"!isNull({range_index_y})"])
        .agg_by([HISTFUNC_AGGS[histfunc](agg_col)], [range_index_x, range_index_y])
    )
    return count_table


def calculate_bin_locations(
    ranged_bin_counts: Table,
    names: dict[str, str],
    histfunc_col: str,
    empty_bin_default: float | Literal["NaN"] | None,
) -> Table:
    """
    Compute the center of the bins for the x and y axes
    plotly requires the center of the bins to plot the heatmap and will calculate the width automatically

    Args
        bin_counts_ranged: A table that contains the bin counts and the range columns
        names: The names used for columns so that they don't collide
        histfunc_col: The column that contains the aggregated values
        empty_bin_default: The default value to use for bins that have no data

    Returns:
        A table that contains the bin counts and the center of the bins
    """
    range_index_x = names["range_index_x"]
    range_index_y = names["range_index_y"]
    range_x = names["range_x"]
    range_y = names["range_y"]
    bin_min_x = names["bin_min_x"]
    bin_max_x = names["bin_max_x"]
    bin_min_y = names["bin_min_y"]
    bin_max_y = names["bin_max_y"]
    x = names["x"]
    y = names["y"]
    agg_col = names["agg_col"]

    # both "NaN" and None require no replacement
    # it is assumed that default_bin_value has already been set to a number
    # if needed, such as in the case of a histfunc of count or count_distinct

    if isinstance(empty_bin_default, str) and empty_bin_default != "NaN":
        raise ValueError("empty_bin_default must be 'NaN' if it is a string")

    if empty_bin_default not in {"NaN", None}:
        ranged_bin_counts = ranged_bin_counts.update_view(
            f"{agg_col} = replaceIfNull({agg_col}, {empty_bin_default})"
        )

    return ranged_bin_counts.update_view(
        [
            f"{bin_min_x} = {range_x}.binMin({range_index_x})",
            f"{bin_max_x} = {range_x}.binMax({range_index_x})",
            f"{x}=0.5*({bin_min_x}+{bin_max_x})",
            f"{bin_min_y} = {range_y}.binMin({range_index_y})",
            f"{bin_max_y} = {range_y}.binMax({range_index_y})",
            f"{y}=0.5*({bin_min_y}+{bin_max_y})",
            f"{histfunc_col} = {agg_col}",
        ]
    )
