from __future__ import annotations

from collections.abc import Generator
from typing import Any

from deephaven.table import Table

from .AttachedPreprocessor import AttachedPreprocessor
from .FreqPreprocessor import FreqPreprocessor
from .HistPreprocessor import HistPreprocessor
from .TimePreprocessor import TimePreprocessor
from .HeatmapPreprocessor import HeatmapPreprocessor
from .HierarchialPreprocessor import HierarchialPreprocessor

from ..types import AttachedTransform, HierarchicalTransform


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
        attached_transforms: list[AttachedTransform],
        hierarchial_transforms: list[HierarchicalTransform],
        pivot_vars: dict[str, str],
    ):
        self.args = args
        self.groups = groups
        self.preprocesser = None
        self.attached_transforms = attached_transforms
        self.hierarchial_transforms = hierarchial_transforms
        self.pivot_vars = pivot_vars
        self.path = self.args.pop("path", None)
        self.prepare_preprocess()


    def prepare_preprocess(self) -> None:
        """
        Prepare for preprocessing by capturing information needed
        """
        if "preprocess_hist" in self.groups:
            self.preprocesser = HistPreprocessor(self.args, self.pivot_vars)
        elif "preprocess_freq" in self.groups:
            self.preprocesser = FreqPreprocessor(self.args)
        elif "preprocess_time" in self.groups:
            self.preprocesser = TimePreprocessor(self.args)
        elif "preprocess_heatmap" in self.groups:
            self.preprocesser = HeatmapPreprocessor(self.args)
        if "always_attached" in self.groups:
            if self.attached_transforms:
                # currently the AttachedPreprocessor only calls prepare_preprocess
                # so it doesn't need to be stored
                AttachedPreprocessor(
                    self.args, self.attached_transforms, self.always_attached
                )
            if self.path:
                self.preprocesser = HierarchialPreprocessor(
                    self.args, self.hierarchial_transforms, self.path
                )


    def preprocess_partitioned_tables(
        self, tables: list[Table] | None, column: str | None = None
    ) -> Generator[
        Table | tuple[Table, dict[str, str | None]] | tuple[Table, dict[str, str]],
        None,
        None,
    ]:
        """
        Preprocess the passed table, depending on the type of preprocessor used

        Args:
            tables: The tables to preprocess
            column: The column to use

        Yields:
            Table: the preprocessed table
        """
        tables = tables or []
        if self.preprocesser:
            yield from self.preprocesser.preprocess_partitioned_tables(tables, column)
        else:
            yield from tables
