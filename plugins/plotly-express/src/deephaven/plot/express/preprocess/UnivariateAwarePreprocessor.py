from __future__ import annotations

from typing import Any
from .utilities import has_all_numeric_columns


class UnivariateAwarePreprocessor:
    """
    A preprocessor that stores useful args for plots where possibly one of x or y or both can be specified,
    which impacts the orientation of the plot in ways that affect the preprocessing.
    Should be inherited from.

    Args:
        args: Figure creation args
        pivot_vars: Pivot vars that have the new column names

    Attributes:
        args: dict[str, str]: Figure creation args
        table: Table: The table to use
        axis_var: str: The main var. The list of vars was passed to this arg.
        bar_var: The other var.
        col_val: str: The value column, which is the value in pivot_var if
          there is a list, otherwise the arg passed to var
        cols: list[str]: The columns that are being used
    """

    def __init__(
        self,
        args: dict[str, Any],
        pivot_vars: dict[str, str] | None = None,
        list_var: str | None = None,
    ):
        self.args = args
        self.table = args["table"]
        self.orientation = self.calculate_bar_orientation()
        self.args["orientation"] = self.orientation
        self.axis_var = "x" if args.get("x") else "y"
        self.bar_var = "y" if self.axis_var == "x" else "x"
        self.axis_col: str = (
            pivot_vars["value"]
            if pivot_vars and list_var and list_var == self.axis_var
            else args[self.axis_var]
        )
        self.axis_cols = (
            self.axis_col if isinstance(self.axis_col, list) else [self.axis_col]
        )

        # if value_var is not set, the value column is the same as the axis column because both the axis bins and value
        # are computed from the same inputs
        if self.args.get(self.bar_var):
            self.bar_col: str = (
                pivot_vars["value"]
                if pivot_vars and list_var and list_var == self.bar_var
                else args[self.bar_var]
            )
            self.bar_cols = (
                self.bar_col if isinstance(self.bar_col, list) else [self.bar_col]
            )
        else:
            self.bar_col = self.axis_col
            self.bar_cols = self.axis_cols

    def calculate_bar_orientation(self):
        """
        Calculate the orientation of the plot
        """
        orientation = self.args.get("orientation")
        x = self.args.get("x")
        y = self.args.get("y")

        if orientation:
            return orientation
        elif x and y:
            numeric_x = has_all_numeric_columns(
                self.table, x if isinstance(x, list) else [x]
            )
            numeric_y = has_all_numeric_columns(
                self.table, y if isinstance(y, list) else [y]
            )
            if numeric_x and not numeric_y:
                # if both x and y are specified, the only case plotly sets orientation to 'h' by default is when x is
                # numeric and y is not
                return "h"
            return "v"
        elif x:
            return "v"
        elif y:
            return "h"

        raise ValueError("Could not determine orientation")
