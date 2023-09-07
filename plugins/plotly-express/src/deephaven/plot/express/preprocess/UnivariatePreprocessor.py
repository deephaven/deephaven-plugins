from __future__ import annotations

from typing import Any


class UnivariatePreprocessor:
    """
    A univariate preprocessor that stores useful args. Should be inherited from.

    Args:
        args: dict[str, str]: Figure creation args
        pivot_vars: dict[str, str]: Pivot vars that have the new column names

    Attributes:
        args: dict[str, str]: Figure creation args
        table: Table: The table to use
        var: str: The main var. The list of vars was passed to this arg.
        other_var: The other var.
        col_val: str: The value column, which is the value in pivot_var if
          there is a list, otherwise the arg passed to var
        cols: list[str]: The columns that are being used
    """

    def __init__(self, args: dict[str, Any], pivot_vars: dict[str, str] = None):
        self.args = args
        self.table = args["table"]
        self.var = "x" if args["x"] else "y"
        self.other_var = "y" if self.var == "x" else "x"
        self.args["orientation"] = "h" if self.var == "y" else "v"
        self.col_val = pivot_vars["value"] if pivot_vars else args[self.var]
        self.cols = self.col_val if isinstance(self.col_val, list) else [self.col_val]
