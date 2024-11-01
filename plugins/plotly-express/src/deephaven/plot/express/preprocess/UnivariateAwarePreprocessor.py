from __future__ import annotations

from typing import Any


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
        value_var: The other var.
        col_val: str: The value column, which is the value in pivot_var if
          there is a list, otherwise the arg passed to var
        cols: list[str]: The columns that are being used
    """

    def __init__(self, args: dict[str, Any], pivot_vars: dict[str, str] | None = None):
        self.args = args
        self.table = args["table"]
        self.orientation = self.calculate_orientation()
        self.args["orientation"] = self.orientation
        self.axis_var = "x" if args.get("x") else "y"
        self.value_var = "y" if self.axis_var == "x" else "x"
        self.axis_col: str = (
            pivot_vars["variable"] if pivot_vars else args[self.axis_var]
        )
        self.axis_cols = (
            self.axis_col if isinstance(self.axis_col, list) else [self.axis_col]
        )

        # if value_var is not set, the value column is the same as the axis column because both the axis bins and value
        # are computed from the same inputs
        if self.args.get(self.value_var):
            self.value_col: str = (
                pivot_vars["value"] if pivot_vars else args[self.value_var]
            )
            self.value_cols = (
                self.value_col if isinstance(self.value_col, list) else [self.value_col]
            )
        else:
            self.value_col = self.axis_col
            self.value_cols = self.axis_cols

    def calculate_orientation(self):
        """
        Calculate the orientation of the plot
        """
        orientation = self.args.get("orientation")
        x = self.args.get("x")
        y = self.args.get("y")
        if orientation:
            return orientation
        elif x and y:
            # TODO: more sophisticated orientation calculation like plotly express, which calculates based on data types
            return "v"
        elif x:
            return "v"
        elif y:
            return "y"

        raise ValueError("Could not determine orientation")
