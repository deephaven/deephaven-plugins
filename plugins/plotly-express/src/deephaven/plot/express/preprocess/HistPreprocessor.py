from __future__ import annotations

from typing import Any, Generator

from deephaven import agg, new_table
from deephaven.table import Table

from .UnivariateAwarePreprocessor import UnivariateAwarePreprocessor
from ..shared import get_unique_names
from deephaven.column import long_col
from deephaven.updateby import cum_sum
from .utilities import create_range_table, HISTFUNC_AGGS


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


class HistPreprocessor(UnivariateAwarePreprocessor):
    """
    Preprocessor for histograms.

    Attributes:
        range_table: The range table, calculated over the whole original table
        names: A mapping of ideal name to unique names
        nbins: the number of bins in the histogram
        range_bins: The range the bins are created over
        histfunc: The histfunc to create the histogram with
        barnorm: The barnorm to create the histogram with
        histnorm: The histnorm to create the histogram with
        cumulative: If True, the bins are cumulative
    """

    def __init__(
        self,
        args: dict[str, Any],
        stacked_column_names: dict[str, str],
        list_param: str | None = None,
    ):
        super().__init__(args, stacked_column_names, list_param)
        self.range_table = None
        self.names = {}
        self.nbins = args.pop("nbins", 10)
        self.range_bins = args.pop("range_bins", None)
        # plotly express defaults to sum if both x and y are set, count if only one is set
        self.histfunc = self.determine_histfunc()
        self.barnorm = args.pop("barnorm", None)
        self.histnorm = args.pop("histnorm", None)
        self.cumulative = args.pop("cumulative", False)
        self.prepare_preprocess()

    def determine_histfunc(self) -> str:
        """
        Determine the histfunc to use based on the arguments passed in

        Returns:
            The histfunc to use
        """
        histfunc = self.args.pop("histfunc", None)
        if histfunc is None:
            histfunc = (
                "count"
                if self.args.get("x") is None or self.args.get("y") is None
                else "sum"
            )
        return histfunc

    def prepare_preprocess(self) -> None:
        """
        Prepare for preprocessing by creating a range table over all values
        """
        self.names = get_unique_names(
            self.args["table"],
            ["range_index", "range", "bin_min", "bin_max", "bin_mid", "total"],
        )
        self.range_table = create_range_table(
            self.args["table"],
            self.bin_col,
            self.range_bins,
            self.nbins,
            self.names["range"],
        )

    def create_count_tables(
        self, tables: list[Table], bin_col: str, agg_col: str
    ) -> Generator[tuple[Table, str], None, None]:
        """
        Create count tables that aggregate up values.

        Args:
            tables: List of tables to create counts for
            bin_col: The column to compute indices for
            agg_col: The column to compute an aggregation over

        Yields:
            A tuple containing the table and a temporary column

        """
        range_index, range_ = self.names["range_index"], self.names["range"]
        agg_func = HISTFUNC_AGGS[self.histfunc]
        if not self.range_table:
            raise ValueError("Range table not created")
        for i, table in enumerate(tables):
            # the column needs to be temporarily renamed to avoid collisions
            tmp_bin_col_base = f"tmpbin{i}"
            tmp_agg_col_base = f"tmpbar{i}"
            tmp_col_names = get_unique_names(
                table, [tmp_bin_col_base, tmp_agg_col_base]
            )
            tmp_bin_col, tmp_agg_col = (
                tmp_col_names[tmp_bin_col_base],
                tmp_col_names[tmp_agg_col_base],
            )
            count_table = (
                table.view(
                    [
                        f"{tmp_agg_col} = {agg_col}",
                        f"{tmp_bin_col} = {bin_col}",
                    ]
                )
                .join(self.range_table)
                .update_view(f"{range_index} = {range_}.index({tmp_bin_col})")
                .where(f"!isNull({range_index})")
                .drop_columns(range_)
                .agg_by([agg_func(tmp_agg_col)], range_index)
            )
            yield count_table, tmp_agg_col

    def create_hist_agg_label(self) -> str:
        """
        Create the agg column name displayed.
        This mirrors the logic in plotly express.

        Returns:
            The agg column name displayed
        """
        # in the case where only one column is aggregated on, the label should reflect the histfunc used
        hist_agg_label = self.histfunc

        # it's possible that the user has relabeled the columns, and it's difficult to do it later
        labels = self.args.get("labels", {})
        relabeled_agg_col = (
            labels.get(self.agg_col, self.agg_col) if labels else self.agg_col
        )

        if self.histfunc != "count" and self.bin_col != self.agg_col:
            # if a different column is aggregated on, the label name should reflect that
            # plotly express will not do this in case of count because the value of count is the same
            # whether aggregating on the same column or a different one
            # note that plotly express also does not allow histfunc to be anything other than count
            # if only one column is aggregated on but we do, hence our extra check for column names
            hist_agg_label = f"{self.histfunc} of {relabeled_agg_col}"

        if self.histnorm:
            if self.histfunc == "count":
                hist_agg_label = self.histnorm
            elif self.histfunc == "sum":
                if self.histnorm == "probability":
                    hist_agg_label = f"fraction of {hist_agg_label}"
                elif self.histnorm == "percent":
                    hist_agg_label = f"percent of {hist_agg_label}"
                else:
                    # in this case, plotly express uses the original column name
                    hist_agg_label = f"{self.histnorm} weighted by {relabeled_agg_col}"
            elif self.histnorm == "probability":
                hist_agg_label = f"fraction of sum of {hist_agg_label}"
            elif self.histnorm == "percent":
                hist_agg_label = f"percent of sum of {hist_agg_label}"
            else:
                hist_agg_label = f"{self.histnorm} of {hist_agg_label}"

        if self.barnorm:
            hist_agg_label = f"{hist_agg_label} (normalized as {self.barnorm})"

        return hist_agg_label

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str | None = None
    ) -> Generator[tuple[Table, dict[str, str | None]], None, None]:
        """
        Preprocess tables into histogram tables

        Args:
            tables: List of tables to preprocess
            column: the column used

        Yields:
            A tuple containing the table and a mapping of metadata

        """

        bin_col = self.bin_col
        agg_col = self.agg_col

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

        new_agg_cols = []
        for count_table, count_col in self.create_count_tables(
            tables, bin_col, agg_col
        ):
            bin_counts = bin_counts.natural_join(
                count_table, on=[range_index], joins=[count_col]
            )
            new_agg_cols.append(count_col)

        bin_mid = self.names["bin_mid"]

        hist_agg_label = self.create_hist_agg_label()

        if not self.range_table:
            raise ValueError("Range table not created")

        bin_counts = bin_counts.join(self.range_table).update_view(
            [
                f"{bin_min} = {range_}.binMin({range_index})",
                f"{bin_max} = {range_}.binMax({range_index})",
                f"{bin_mid}=0.5*({bin_min}+{bin_max})",
            ]
        )

        if self.histnorm in {"percent", "probability", "probability density"}:
            mult_factor = 100 if self.histnorm == "percent" else 1

            sums = [f"{col}_sum = {col}" for col in new_agg_cols]

            normed = [
                f"{col} = {col} * {mult_factor} / {col}_sum" for col in new_agg_cols
            ]

            # range_ and bin cols need to be kept for probability density
            # agg_var_name needs to be kept for plotting
            bin_counts = (
                bin_counts.agg_by(
                    [
                        agg.sum_(sums),
                        agg.group(new_agg_cols + [bin_mid, range_, bin_min, bin_max]),
                    ]
                )
                .update_view(normed)
                .ungroup()
            )

        if self.cumulative:
            bin_counts = bin_counts.update_by(cum_sum(new_agg_cols))

            # with plotly express, cumulative=True will ignore density (including
            # the density part of probability density, but not the probability
            # part)
            if self.histnorm:
                self.histnorm = self.histnorm.replace("density", "").strip()

        if self.histnorm in {"density", "probability density"}:
            bin_counts = bin_counts.update_view(
                [f"{col} = {col} / ({bin_max} - {bin_min})" for col in new_agg_cols]
            )

        if self.barnorm:
            mult_factor = 100 if self.barnorm == "percent" else 1
            sum_form = f"sum({','.join(new_agg_cols)})"
            bin_counts = bin_counts.update_view(
                [f"{total}={sum_form}"]
                + [f"{col}={col} * {mult_factor} / {total}" for col in new_agg_cols]
            )

        for new_agg_col in new_agg_cols:
            yield bin_counts.view([f"{bin_col} = {bin_mid}", new_agg_col]), {
                self.agg_var: new_agg_col,
                self.bin_var: bin_col,
                f"hist_agg_label": hist_agg_label,
                f"hist_orientation": self.orientation,
            }
