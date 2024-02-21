from __future__ import annotations

from typing import Any

from .StyleManager import StyleManager
from ..shared import get_unique_names


class AttachedPreprocessor:
    """A AttachedPreprocessor that adds styles to "always_attached" plot tables
    such as treemap and pie.

    Attributes:
        args: Args used to create the plot
        always_attached: The dict mapping the arg and column
          to the style map, dictionary, and new column name, to be used for
          AttachedProcessor when dealing with an "always_attached" plot
    """

    def __init__(
        self,
        args: dict[str, Any],
        always_attached: dict[tuple[str, str], tuple[dict[str, str], list[str], str]],
    ):
        self.args = args
        self.always_attached = always_attached
        self.prepare_preprocess()

    def prepare_preprocess(self):
        """
        Create a table with styles attached
        """
        # create new columns
        table = self.args["table"]
        for (arg, col), (map, ls, new_col) in self.always_attached.items():
            manager_col = get_unique_names(table, [f"{new_col}_manager"])[
                f"{new_col}_manager"
            ]
            style_manager = StyleManager(map=map, ls=ls)

            table = table.update_view(
                [
                    f"{manager_col}=style_manager",
                    f"{new_col}={manager_col}.assign_style({col})",
                ]
            )

        self.args["table"] = table
