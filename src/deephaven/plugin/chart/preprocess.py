from deephaven.table import Table
from deephaven import agg as agg
from deephaven import empty_table

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

def calc_hist(
        table,
        column,
        nbins,
        range_
):
    bin_counts = table.join(range_hist(table, column, nbins, range_)) \
        .update_view(f"RangeIndex = Range.index({column})") \
        .where("!isNull(RangeIndex)") \
        .agg_by([agg.count_("Count"), agg.last("Range")], "RangeIndex") \
        .update_view(["BinMin = Range.binMin(RangeIndex)",
                      "BinMax = Range.binMax(RangeIndex)",
                      "BinMid=0.5*(BinMin+BinMax)"])

    return bin_counts, "BinMid", "Count"

def range_hist(
        table,
        column,
        nbins,
        range,
):
    if range:
        range_min = range[0]
        range_max = range[1]
        table = empty_table(1)
    else:
        range_min = "RangeMin"
        range_max = "RangeMax"
        table = table.agg_by([agg.min_(f"RangeMin={column}"),
                         agg.max_(f"RangeMax={column}"),
                         agg.count_("NSamples")])

    return table.update(f"Range = new io.deephaven.plot.datasets.histogram."
                f"DiscretizedRangeEqual("
                        f"{range_min}, "
                        f"{range_max}, "
                        f"{nbins})").view("Range")


"""
    private static Table range(final Table t, final int nbins) {
        return t.aggBy(List.of(AggMin("RangeMin=X"), AggMax("RangeMax=X"), AggCount("NSamples")))
                .update("Range = new io.deephaven.plot.datasets.histogram.DiscretizedRangeEqual(RangeMin, RangeMax, "
                        + nbins + ")")
                .view("Range");
    }
"""