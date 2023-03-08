from deephaven.table import Table
from deephaven import agg, empty_table, new_table
from deephaven.column import long_col

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

def remap_args(args, remap):
    for k, v in enumerate(remap):
        if k in args:
            args[remap[k]] = args.pop(k)
    return args


def preprocess_pie(
        table: Table,
        names: str,
        values: str
) -> Table:
    """
    Preprocess a table passed to pie to ensure it only has 1 row per name

    :param table: The table to preprocess
    :param names: The column to use for names
    :param values: The column to sum up for values
    :return: A new table that contains a single row per name and columns of
    specified names and values
    """
    return table.view([names, values]).sum_by([names])


def create_count_tables(
        table: Table,
        columns: list[str],
        range_table: Table,
        histfunc: str
):
    agg_func = HISTFUNC_MAP[histfunc]
    for column in columns:
        count_table = table.view(column) \
            .join(range_table) \
            .update_view(f"RangeIndex = Range.index({column})") \
            .where("!isNull(RangeIndex)") \
            .drop_columns("Range") \
            .agg_by([agg_func(column)], "RangeIndex")
        yield count_table, column


def create_hist_tables(
        table: Table,
        columns: str | list[str],
        nbins: int,
        range_: list[int],
        histfunc: str
):
    columns = columns if isinstance(columns, list) else [columns]

    range_table = create_range_table(table, columns, nbins, range_)
    bin_counts = new_table([
        long_col("RangeIndex", [i for i in range(nbins)])
    ])

    count_cols = []

    for count_table, count_col in \
            create_count_tables(table, columns, range_table, histfunc):
        bin_counts = bin_counts.natural_join(count_table, on=["RangeIndex"], joins=[count_col])
        count_cols.append(count_col)

    bin_counts = bin_counts.join(range_table) \
        .update_view(["BinMin = Range.binMin(RangeIndex)",
                      "BinMax = Range.binMax(RangeIndex)",
                      "BinMid=0.5*(BinMin+BinMax)"])

    return bin_counts, "BinMid", count_cols


def get_aggs(
        base,
        columns,
):
    return ([f"{base}{column}={column}" for column in columns],
            ', '.join([f"{base}{column}" for column in columns]))


def create_range_table(
        table: Table,
        columns: list[str],
        nbins: int,
        range_: list[int]
):
    if range_:
        range_min = range_[0]
        range_max = range_[1]
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
        f"Range = new io.deephaven.plot.datasets.histogram."
        f"DiscretizedRangeEqual({range_min},{range_max}, "
        f"{nbins})").view("Range")
