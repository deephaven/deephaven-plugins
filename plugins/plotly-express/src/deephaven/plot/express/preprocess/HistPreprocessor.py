from __future__ import annotations

from typing import Any

from deephaven import agg, empty_table, new_table
from deephaven.table import PartitionedTable, Table

from .UnivariatePreprocessor import UnivariatePreprocessor
from ..shared import get_unique_names
from deephaven.column import long_col
from deephaven.updateby import cum_sum

# Used to aggregate within histogram bins
HISTFUNC_MAP = {
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
    return (
        [f"{base}{column}={column}" for column in columns],
        ", ".join([f"{base}{column}" for column in columns]),
    )


class HistPreprocessor(UnivariatePreprocessor):
    """
    Preprocessor for histograms.

    Attributes:
        range_table: Table: The range table, calculated over the whole original
            table
        names: dict[str, str]: A mapping of ideal name to unique names
        nbins: int: the number of bins in the histogram
        range_bins: list[Number, Number]: The range the bins are created over
        histfunc: str: The histfunc to create the histogram with
        barnorm: str: The barnorm to create the histogram with
        histnorm: str: The histnorm to create the histogram with
        cumulative: bool: If truek, the bins are cumulative
    """

    def __init__(self, args: dict[str, Any], pivot_vars: dict[str, str]):
        super().__init__(args, pivot_vars)
        self.range_table = None
        self.names = None
        self.nbins = args.pop("nbins", 10)
        self.range_bins = args.pop("range_bins")
        self.histfunc = args.pop("histfunc")
        self.barnorm = args.pop("barnorm")
        self.histnorm = args.pop("histnorm")
        self.cumulative = args.pop("cumulative")
        self.prepare_preprocess()

    def prepare_preprocess(self) -> None:
        """
        Prepare for preprocessing by creating a range table over all values

        """
        self.names = get_unique_names(
            self.args["table"],
            ["range_index", "range", "bin_min", "bin_max", self.histfunc, "total"],
        )
        self.range_table = self.create_range_table()

    def create_range_table(self) -> Table:
        """Create a table that contains the bin ranges"""
        # partitioned tables need range calculated on all
        table = (
            self.table.merge()
            if isinstance(self.table, PartitionedTable)
            else self.table
        )

        if self.range_bins:
            range_min = self.range_bins[0]
            range_max = self.range_bins[1]
            table = empty_table(1)
        else:
            range_min = "RangeMin"
            range_max = "RangeMax"
            # need to find range across all columns
            min_aggs, min_cols = get_aggs("RangeMin", self.cols)
            max_aggs, max_cols = get_aggs("RangeMax", self.cols)
            table = table.agg_by([agg.min_(min_aggs), agg.max_(max_aggs)]).update(
                [f"RangeMin = min({min_cols})", f"RangeMax = max({max_cols})"]
            )

        return table.update(
            f"{self.names['range']} = new io.deephaven.plot.datasets.histogram."
            f"DiscretizedRangeEqual({range_min},{range_max}, "
            f"{self.nbins})"
        ).view(self.names["range"])

    def create_count_tables(
        self, tables: list[Table], column: str = None
    ) -> tuple[Table, dict[str, str]]:
        """
        Create count tables that aggregate up values.

        Args:
            tables: list[Table]: List of tables to create counts for
            column: str: the column used
        """
        range_index, range_ = self.names["range_index"], self.names["range"]
        agg_func = HISTFUNC_MAP[self.histfunc]
        for i, table in enumerate(tables):
            # the column needs to be temporarily renamed to avoid collisions
            tmp_name = f"tmp{i}"
            tmp_col = get_unique_names(table, [tmp_name])[tmp_name]
            count_table = (
                table.view(f"{tmp_col} = {column}")
                .join(self.range_table)
                .update_view(f"{range_index} = {range_}.index({tmp_col})")
                .where(f"!isNull({range_index})")
                .drop_columns(range_)
                .agg_by([agg_func(tmp_col)], range_index)
            )
            yield count_table, tmp_col

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str = None
    ) -> tuple[Table, dict[str, str]]:
        """Preprocess tables into histogram tables"""
        # column will only be set if there's a pivot var, which means the table has been restructured
        column = self.col_val if not column else column

        range_index, range_, bin_min, bin_max, total = (
            self.names["range_index"],
            self.names["range"],
            self.names["bin_min"],
            self.names["bin_max"],
            self.names["total"],
        )

        bin_counts = new_table(
            [long_col(self.names["range_index"], [i for i in range(self.nbins)])]
        )

        count_cols = []
        for count_table, count_col in self.create_count_tables(tables, column):
            bin_counts = bin_counts.natural_join(
                count_table, on=[range_index], joins=[count_col]
            )
            count_cols.append(count_col)

        var_axis_name = self.names[self.histfunc]

        bin_counts = bin_counts.join(self.range_table).update_view(
            [
                f"{bin_min} = {range_}.binMin({range_index})",
                f"{bin_max} = {range_}.binMax({range_index})",
                f"{var_axis_name}=0.5*({bin_min}+{bin_max})",
            ]
        )

        if self.histnorm in {"percent", "probability", "probability density"}:
            mult_factor = 100 if self.histnorm == "percent" else 1

            sums = [f"{col}_sum = {col}" for col in count_cols]

            normed = [
                f"{col} = {col} * {mult_factor} / {col}_sum" for col in count_cols
            ]

            # range_ and bin cols need to be kept for probability density
            # var_axis_name needs to be kept for plotting
            bin_counts = (
                bin_counts.agg_by(
                    [
                        agg.sum_(sums),
                        agg.group(
                            count_cols + [var_axis_name, range_, bin_min, bin_max]
                        ),
                    ]
                )
                .update_view(normed)
                .ungroup()
            )

        if self.cumulative:
            bin_counts = bin_counts.update_by(cum_sum(count_cols))

            # with plotly express, cumulative=True will ignore density (including
            # the density part of probability density, but not the probability
            # part)
            if self.histnorm:
                self.histnorm = self.histnorm.replace("density", "").strip()

        if self.histnorm in {"density", "probability density"}:
            bin_counts = bin_counts.update_view(
                [f"{col} = {col} / ({bin_max} - {bin_min})" for col in count_cols]
            )

        if self.barnorm:
            mult_factor = 100 if self.barnorm == "percent" else 1
            sum_form = f"sum({','.join(count_cols)})"
            bin_counts = bin_counts.update_view(
                [f"{total}={sum_form}"]
                + [f"{col}={col} * {mult_factor} / {total}" for col in count_cols]
            )

        for count_col in count_cols:
            yield bin_counts.view([var_axis_name, f"{column} = {count_col}"]), {
                self.var: var_axis_name,
                self.other_var: column,
            }
