from __future__ import annotations

from typing import Any

from .StyleManager import StyleManager
from ..shared import get_unique_names
from ..types import AttachedTransforms


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
        attached_transforms: AttachedTransforms,
        path: str | list[str] | None = None,
    ):
        self.args = args
        self.attached_transforms = attached_transforms
        self.path = path
        self.prepare_preprocess()

    def attach_styles(self):
        table = self.args["table"]
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

        # it is safe to modify the table in-place because columns are only added
        self.args["table"] = table

    def prepare_preprocess(self):
        """
        Create a table with styles attached
        """
        self.attach_styles()
