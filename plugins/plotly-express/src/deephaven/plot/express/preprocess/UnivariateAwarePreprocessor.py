from __future__ import annotations

import abc
from typing import Any, Generator

from deephaven.table import Table


class UnivariateAwarePreprocessor(abc.ABC):
    """
    A preprocessor that stores useful args for plots where possibly one of x or y or both can be specified,
    which impacts the orientation of the plot in ways that affect the preprocessing.
    Should be inherited from.

    Args:
        args: Figure creation args
        stacked_column_names: A dictionary that stores the "real" column
            names if there is a list_param. This is needed in case the column names
            used are already in the table.
        list_param: The param that was passed in as a list

    Attributes:
        args: dict[str, str]: Figure creation args
        table: Table: The table to use
        bin_var: str: The arg that the bins are calculated on. Should be x or y.
        agg_var: str: The arg that the values are aggregated on. Should be y or x.
        bin_col: str: The column that the bins are calculated on.
            Generally will be whatever column is specified by bin_var,
            but can be different if a list was passed in.
        agg_col: str: The column that the values are aggregated on.
            Generally will be whatever column is specified by agg_var,
            but can be different if a list was passed in.
        orientation: str: The orientation of the plot. Should be 'v' or 'h'.
    """

    def __init__(
        self,
        args: dict[str, Any],
        stacked_column_names: dict[str, str] | None = None,
        list_param: str | None = None,
    ):
        self.args = args
        self.table = args["table"]
        self.orientation = self.calculate_bar_orientation()
        self.args["orientation"] = self.orientation
        self.bin_var = "x" if self.orientation == "v" else "y"
        self.agg_var = "y" if self.bin_var == "x" else "x"
        self.bin_col: str = (
            stacked_column_names["value"]
            if stacked_column_names and list_param and list_param == self.bin_var
            else args[self.bin_var]
        )

        if self.args.get(self.agg_var):
            self.agg_col: str = (
                stacked_column_names["value"]
                if stacked_column_names and list_param and list_param == self.agg_var
                else args[self.agg_var]
            )
        else:
            # if agg_var is not set, the value column is the same as the axis column
            # because both the axis bins and value are computed from the same inputs
            self.agg_col = self.bin_col

    def calculate_bar_orientation(self):
        """
        Calculate the orientation of the plot.
        """
        orientation = self.args.get("orientation")
        x = self.args.get("x")
        y = self.args.get("y")

        if orientation:
            return orientation
        elif x:
            # Note that this will also be the default if both are specified
            # plotly express does some more sophisticated checking for data types
            # when both are specified but categorical data will fail due to the
            # engine preprocessing in our implementation so just assume verticals
            return "v"
        elif y:
            return "h"

        raise ValueError("Could not determine orientation")

    @abc.abstractmethod
    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str | None = None
    ) -> Generator[tuple[Table, dict[str, str | None]], None, None]:
        """
        Preprocess the tables into the appropriate format for the plot.

        Args:
            tables: A list of tables to preprocess
            column: The column to aggregate on

        Returns:
            A tuple containing (the new table, an update to make to the args)
        """
        raise NotImplementedError
