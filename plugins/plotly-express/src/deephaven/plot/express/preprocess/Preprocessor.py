from __future__ import annotations

from collections.abc import Generator
from typing import Any

from deephaven.table import Table

from .AttachedPreprocessor import AttachedPreprocessor
from .FreqPreprocessor import FreqPreprocessor
from .HistPreprocessor import HistPreprocessor
from .TimePreprocessor import TimePreprocessor


class Preprocessor:
    """
    Preprocessor for tables

    Attributes:
    pivot_vars: dict[str, str]: A dictionary that stores the "real" column
      names if there is a list_var. This is needed in case the column names
      used are already in the table.
    always_attached: dict[tuple[str, str],
      tuple[dict[str, str], list[str], str]: The dict mapping the arg and column
      to the style map, dictionary, and new column name, to be used for
      AttachedProcessor when dealing with an "always_attached" plot
    args: dict[str, Any]: Args used to create the plot
    groups: set[str]: The special groups that apply to this plot


    """

    def __init__(
        self,
        args: dict[str, Any],
        groups: set[str],
        always_attached: dict[tuple[str, str], tuple[dict[str, str], list[str], str]],
        pivot_vars: dict[str, str],
    ):
        self.args = args
        self.groups = groups
        self.preprocesser = None
        self.always_attached = always_attached
        self.pivot_vars = pivot_vars
        self.prepare_preprocess()
        pass

    def prepare_preprocess(self) -> None:
        """
        Prepare for preprocessing by capturing information needed

        """
        if "preprocess_hist" in self.groups:
            self.preprocesser = HistPreprocessor(self.args, self.pivot_vars)
        elif "preprocess_freq" in self.groups:
            self.preprocesser = FreqPreprocessor(self.args)
        elif "always_attached" in self.groups and self.always_attached:
            AttachedPreprocessor(self.args, self.always_attached)
        elif "preprocess_time" in self.groups:
            self.preprocesser = TimePreprocessor(self.args)

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str = None
    ) -> Generator[Table]:
        """
        Preprocess the passed table, depending on the type of preprocessor used

        Args:
            tables: list[Table]
            column: column: str: The column to use

        Yields:
            Table: the preprocessed table
        """
        if self.preprocesser:
            yield from self.preprocesser.preprocess_partitioned_tables(tables, column)
        else:
            yield from tables
