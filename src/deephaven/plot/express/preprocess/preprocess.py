from collections.abc import Generator

from deephaven.table import Table
from deephaven import agg, empty_table, new_table
from deephaven.column import long_col
from deephaven.time import nanos_to_millis, diff_nanos
from deephaven.updateby import cum_sum

from ..shared import get_unique_names

# Used to aggregate within histogram bins
HISTFUNC_MAP = {
    'avg': agg.avg,
    'count': agg.count_,
    'count_distinct': agg.count_distinct,
    'max': agg.max_,
    'median': agg.median,
    'min': agg.min_,
    'std': agg.std,
    'sum': agg.sum_,
    'var': agg.var
}


def preprocess_aggregate(
        table: Table,
        names: str,
        values: str
) -> Table:
    """Preprocess a table passed to pie or funnel_area to ensure it only has
     1 row per name

    Args:
      table: Table:
        The table to preprocess
      names:  str:
        The column to use for names
      values:  str:
        The column to use for names

    Returns:
      Table: A new table that contains a single row per name and columns of
      specified names and values

    """
    return table.view([names, values]).sum_by(names)


def create_count_tables(
        table: Table,
        columns: list[str],
        range_table: Table,
        histfunc: str,
        range_: str,
        range_index: str
) -> Generator[tuple[Table, str]]:
    """Generate count tables per column

    Args:
      table: Table:
        The table to pull data from
      columns: list[str]:
        A list of columns to create histograms over
      range_table: Table:
        A table containing ranges to calculate the bin for each
        value in the column
      histfunc: str:
        The function to aggregate values within each bin
      range_: str:
        The name of the range column. Generally range.
      range_index: str:
        The name of the range_index column. Generally range_index

    Yields:
      tuple[Table, str]]: tuple containing (a new count_table, the column name)

    """
    agg_func = HISTFUNC_MAP[histfunc]
    for column in columns:
        count_table = table.view(column) \
            .join(range_table) \
            .update_view(f"{range_index} = {range_}.index({column})") \
            .where(f"!isNull({range_index})") \
            .drop_columns(range_) \
            .agg_by([agg_func(column)], range_index)
        yield count_table, column


def create_hist_tables(
        table: Table,
        columns: list[str],
        nbins: int = 10,
        range_bins: list[int] = None,
        histfunc: str = 'count',
        barnorm: str = None,
        histnorm: str = None,
        cumulative: bool = False
) -> tuple[Table, str, list[str]]:
    """Create the histogram table that contains aggregated bin counts

    Args:
      table: Table:
        The table to pull data from
      columns: list[str]
        A list of columns to create histograms over
      nbins: int: (Default value = 10)
        The number of bins, shared between all histograms
      range_bins: list[int]:  (Default value = None)
        The range that the bins are drawn over. If none, the range
        will be over all data
      histfunc: str:  (Default value = 'count')
        The function to use when aggregating within bins. One of
        'avg', 'count', 'count_distinct', 'max', 'median', 'min', 'std', 'sum',
        or 'var'
      barnorm: str:  (Default value = None)
        If 'fraction', the value of the bar is
        divided by all bars at that location. If 'percentage', the result is the
        same but multiplied by 100.
      histnorm: str:  (Default value = None)
        If 'probability', the value at this bin is
        divided out of the total of all bins in this column. If 'percent',
        result is the same as 'probability' but multiplied by 100. If
        'density', the value is divided by the width of the bin. If
        'probability density', the value is divided out of the total of all
        bins in this column and the width of the bin.
      cumulative: bool:  (Default value = False)
        If True, values are cumulative.

    Returns:
      tuple[Table, str, list[str]]:
        A tuple containing (the new counts table,
        the column of the midpoint, the columns that contain counts)

    """
    names = get_unique_names(table, ["range_index", "range",
                                     "bin_min", "bin_max",
                                     "value", "total"])
    range_index, bin_min, bin_max, range_, total = (
        names["range_index"], names["bin_min"], names["bin_max"],
        names["range"], names["total"]
    )

    columns = list(set(columns))

    range_table = create_range_table(table, columns, nbins, range_bins, names["range"])
    bin_counts = new_table([
        long_col(names[range_index], [i for i in range(nbins)])
    ])

    count_cols = []

    for count_table, count_col in \
            create_count_tables(table, columns, range_table, histfunc,
                                range_, range_index):
        bin_counts = bin_counts.natural_join(
            count_table,
            on=[range_index],
            joins=[count_col]
        )
        count_cols.append(count_col)

    # this name also ends up on the chart if there is a list of cols
    var_axis_name = names["value"]

    bin_counts = bin_counts.join(range_table) \
        .update_view([f"{bin_min} = {range_}.binMin({range_index})",
                      f"{bin_max} = {range_}.binMax({range_index})",
                      f"{var_axis_name}=0.5*({bin_min}+{bin_max})"])

    if histnorm in {'percent', 'probability', 'probability density'}:
        mult_factor = 100 if histnorm == 'percent' else 1

        sums = [f"{col}_sum = {col}" for col in count_cols]

        normed = [f"{col} = {col} * {mult_factor} / {col}_sum"
                  for col in count_cols]

        # range_ and bin cols need to be kept for probability density
        # var_axis_name needs to be kept for plotting
        bin_counts = bin_counts.agg_by([
            agg.sum_(sums),
            agg.group(count_cols +
                      [var_axis_name, range_, bin_min, bin_max])
        ]).update_view(normed).ungroup()

    if cumulative:
        bin_counts = bin_counts.update_by(
            cum_sum(count_cols)
        )

        # with plotly express, cumulative=True will ignore density (including
        # the density part of probability density, but not the probability
        # part)
        if histnorm:
            histnorm = histnorm.replace("density", "").strip()

    if histnorm in {'density', 'probability density'}:
        bin_counts = bin_counts.update_view(
            [f"{col} = {col} / ({bin_max} - {bin_min})" for col in count_cols]
        )

    if barnorm:
        mult_factor = 100 if barnorm == 'percent' else 1
        sum_form = f"sum({','.join(count_cols)})"
        bin_counts = bin_counts.update_view(
            [f"{total}={sum_form}"] +
            [f"{col}={col} * {mult_factor} / {total}" for col in count_cols]
        )

    return bin_counts, var_axis_name, count_cols


def get_aggs(
        base: str,
        columns: list[str],
) -> tuple[list[str], str]:
    """Create aggregations over all columns

    Args:
      base: str:
        The base of the new columns that store the agg per column
      columns: list[str]:
        All columns joined for the sake of taking min or max over
        the columns

    Returns:
      tuple[list[str], str]:
        A tuple containing (a list of the new columns,
        a joined string of "NewCol, NewCol2...")

    """
    return ([f"{base}{column}={column}" for column in columns],
            ', '.join([f"{base}{column}" for column in columns]))


def create_range_table(
        table: Table,
        columns: list[str],
        nbins: int,
        range_bins: list[int],
        range_: str
) -> Table:
    """Create a table that contains the bin ranges

    Args:
      table: Table:
        The table to pull data from
      columns: list[str]
        A list of columns to create histograms over
      nbins: int: (Default value = 10)
        The number of bins, shared between all histograms
      range_bins: list[int]:  (Default value = None)
        The range that the bins are drawn over. If none, the range
        will be over all data
      range_: str:
        The name of the range column. Generally "range"

    Returns:
      A new table that contains a range object in a Range column

    """
    if range_bins:
        range_min = range_bins[0]
        range_max = range_bins[1]
        table = empty_table(1)
    else:
        range_min = "RangeMin"
        range_max = "RangeMax"
        # need to find range across all columns
        min_aggs, min_cols = get_aggs("RangeMin", columns)
        max_aggs, max_cols = get_aggs("RangeMax", columns)
        table = table.agg_by([agg.min_(min_aggs), agg.max_(max_aggs)]) \
            .update([f"RangeMin = min({min_cols})", f"RangeMax = max({max_cols})"])

    return table.update(
        f"{range_} = new io.deephaven.plot.datasets.histogram."
        f"DiscretizedRangeEqual({range_min},{range_max}, "
        f"{nbins})").view(range_)


def time_length(
        start: str,
        end: str
) -> int:
    """Calculate the difference between the start and end times in milliseconds

    Args:
      start: str:
        The start time
      end: str:
        The end time

    Returns:
      int: The time in milliseconds

    """
    return nanos_to_millis(diff_nanos(start, end))


def preprocess_frequency_bar(
        table: Table,
        column: str
) -> tuple[Table, str, str]:
    """Preprocess frequency bar params into an appropriate table
    This just sums each value by count

    Args:
      table: Table:
        The table to pull data from
      column: str:
        The column that has counts applied

    Returns:
      tuple[Table, str, str]: A tuple containing
        (the new table, the original column name, the name of the count column)

    """
    names = get_unique_names(table, ["count"])

    return table.view([column]).count_by(names["count"], by=column), column, names["count"]


def preprocess_timeline(
        table: Table,
        x_start: str,
        x_end: str,
        y: str
) -> tuple[Table, str]:
    """Preprocess timeline params into an appropriate table
    The table should contain the Time_Diff, which is milliseconds between the
    provided x_start and x_end

    Args:
      table: Table:
        The table to pull data from
      x_start: str:
        The column that contains start dates
      x_end: str:
        The column that contains end dates
      y: str:
        The label for the row

    Returns:
      tuple[Table, str]: A tuple containing
        (the new table, the name of the new time_diff column)

    """

    names = get_unique_names(table, ["Time_Diff"])

    new_table = table.view([f"{x_start}",
                            f"{x_end}",
                            f"{names['Time_Diff']} = time_length({x_start}, {x_end})",
                            f"{y}"])
    return new_table, names['Time_Diff']


def preprocess_violin(
        table: Table,
        column: str
) -> tuple[Table, str, None]:
    """Preprocess the violin (or box or strip) params into an appropriate table
    For each column, the data needs to be reshaped so that there is a column
    that contains the column value.

    Args:
      table: Table:
        The table to pull data from
      column: str:
        The column to use for violin data

    Returns:
      tuple[Table, str, None]:
        A tuple of new_table, column values, and None

    """
    # also used for box and strip
    new_table = table.view([
        f"{column} = {column}"
    ])
    # The names are None as a third tuple value is required for
    # preprocess_and_layer but putting the names in the figure
    # breaks violinmode=overlay
    return new_table, column, None


def preprocess_ecdf(
        table,
        column
):
    """

    Args:
      table: 
      column: 

    Returns:

    """
    #TODO
    col_dup = f"{column}_2"
    tot_count_col = f"TOTAL_COUNT"
    tot_count_dup = f"{tot_count_col}_2"
    prob_col = "probability"

    # count up how many of each value occurs in the column,
    # ordered and cumulative
    cumulative_counts = table.view([column, f"{col_dup}={column}"]) \
        .count_by(col_dup, by=column) \
        .sort(column) \
        .update_by(
        cum_sum(f"{tot_count_col}={col_dup}")
    )

    # convert the counts to arrays to calculate the percentages then
    # convert back to columns
    probabilities = cumulative_counts \
        .update_view(f"{tot_count_dup}={tot_count_col}") \
        .agg_by([agg.last(cols=tot_count_col),
                 agg.group(cols=[tot_count_dup, column])]) \
        .update_view(f"{prob_col} = {tot_count_dup} / {tot_count_col}") \
        .view([column, prob_col]) \
        .ungroup([column, prob_col])

    return probabilities, column, prob_col
