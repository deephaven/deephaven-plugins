from __future__ import annotations

from typing import Any

from deephaven.table import Table

from .StyleManager import StyleManager
from ..shared import get_unique_names
from ..types import AttachedTransforms


class AttachedPreprocessor:
    """A AttachedPreprocessor that adds styles to "always_attached" plot tables
    such as treemap and pie.

    Attributes:
        args: Args used to create the plot
        attached_transforms: The dict mapping the arg and column
          to the style map, dictionary, and new column name, to be used for
          AttachedProcessor when dealing with an "always_attached" plot
    """

    def __init__(
        self,
        args: dict[str, Any],
        attached_transforms: AttachedTransforms,
    ):
        self.args = args
        self.attached_transforms = attached_transforms

    def attach_styles(self, table: Table) -> Table:
        for (by_col, new_col, style_list, style_map) in self.attached_transforms:
            manager_col = get_unique_names(table, [f"{new_col}_manager"])[
                f"{new_col}_manager"
            ]
            style_manager = StyleManager(map=style_map, ls=style_list)

            table = table.update_view(
                [
                    f"{manager_col}=style_manager",
                    f"{new_col}={manager_col}.assign_style({by_col})",
                ]
            )

        return table

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str | None = None
    ):
        """
        Preprocess the attached styles

        Args:
            tables: The tables to process
            column:

        Returns:
            A tuple containing (the new table, an update to make to the args)
        """
        for table in tables:
            yield self.attach_styles(table), {}
