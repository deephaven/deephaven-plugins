from __future__ import annotations

from typing import Any

from deephaven.table import Table

from .UnivariatePreprocessor import UnivariatePreprocessor
from ..shared import get_unique_names


class FreqPreprocessor(UnivariatePreprocessor):
    """
    A type of univariate preprocessor for frequency bar plots

    Args:
        args: dict[str, Any]: The figure creation args

    """

    def __init__(self, args: dict[str, Any]):
        super().__init__(args)

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str = None
    ) -> tuple[Table, dict[str, str]]:
        """Preprocess frequency bar params into an appropriate table
        This just sums each value by count

        Args:
            tables: list[Table]: a list of tables to preprocess
            column: the column to aggregate on

        Returns:
          tuple[Table, dict[str, str]]: A tuple containing
            (the new table, an update to make to the args)

        """
        column = self.col_val if not column else column

        names = get_unique_names(self.table, ["count"])

        self.args[self.other_var] = names["count"]

        for table in tables:
            yield table.view([column]).count_by(names["count"], by=column), {
                self.var: column,
                self.other_var: names["count"],
            }
