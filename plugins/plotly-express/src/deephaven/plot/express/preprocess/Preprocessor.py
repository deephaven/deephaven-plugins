from __future__ import annotations

from collections.abc import Generator
from typing import Any

from deephaven.plot.express.shared import get_unique_names
from deephaven.table import Table

from .AttachedPreprocessor import AttachedPreprocessor
from .FreqPreprocessor import FreqPreprocessor
from .HistPreprocessor import HistPreprocessor
from .TimePreprocessor import TimePreprocessor
from .HeatmapPreprocessor import HeatmapPreprocessor
from .HierarchicalPreprocessor import HierarchicalPreprocessor

from ..types import AttachedTransforms, HierarchicalTransforms


class Preprocessor:
    """
    Preprocessor for tables

    Attributes:
    stacked_column_names: dict[str, str]: A dictionary that stores the "real" column
      names if there is a list_param. This is needed in case the column names
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
        attached_transforms: AttachedTransforms,
        hierarchical_transforms: HierarchicalTransforms,
        stacked_column_names: dict[str, str],
        list_param: str | None,
    ):
        self.args = args
        self.groups = groups
        self.preprocessors = []
        self.attached_transforms = attached_transforms
        self.hierarchical_transforms = hierarchical_transforms
        self.path = self.args.pop("path", None)
        self.stacked_column_names = stacked_column_names
        self.list_param = list_param
        self.prepare_preprocess()

    def prepare_preprocess(self) -> None:
        """
        Prepare for preprocessing by capturing information needed
        """
        if "preprocess_hist" in self.groups:
            self.preprocessors.append(
                HistPreprocessor(self.args, self.stacked_column_names, self.list_param)
            )
        elif "preprocess_freq" in self.groups:
            self.preprocessors.append(FreqPreprocessor(self.args))
        elif "preprocess_time" in self.groups:
            self.preprocessors.append(TimePreprocessor(self.args))
        elif "preprocess_heatmap" in self.groups:
            self.preprocessors.append(HeatmapPreprocessor(self.args))
        elif "always_attached" in self.groups:
            # this is an engine oddity - if maps to a boolean
            color_mask = "true"
            if self.path:
                # in the case of hierarchical plots with path, styles should only apply
                # at or below the hierarchy level
                color_mask = get_unique_names(
                    self.args["table"],
                    ["ColorMask"],
                )["ColorMask"]
                color = self.attached_transforms.get_style_col("color")
                self.preprocessors.append(
                    HierarchicalPreprocessor(
                        self.args,
                        self.hierarchical_transforms,
                        self.path,
                        color,
                        color_mask,
                    )
                )
            if self.attached_transforms:
                self.preprocessors.append(
                    AttachedPreprocessor(
                        self.args, self.attached_transforms, color_mask
                    )
                )

    def __bool__(self):
        """
        Check if there are preprocessors
        """
        return bool(self.preprocessors)

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
        if self.preprocessors:
            # make a copy of the tables to avoid modifying the original
            new_tables = [table for table in tables]
            new_updates = []
            for preprocessor in self.preprocessors:
                for i, (table, update) in enumerate(
                    preprocessor.preprocess_partitioned_tables(new_tables, column)
                ):
                    new_tables[i] = table
                    if len(new_updates) <= i:
                        new_updates.append({})
                    new_updates[i].update(update)
            yield from zip(new_tables, new_updates)
        else:
            yield from tables
