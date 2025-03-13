from __future__ import annotations

# todo: make sure TypedDict is imported correctly by version, or just don't use typeddict

from typing import Any, Generator, TypedDict


class HierarchicalTransforms:
    """
    A dictionary with info about an attached transformation that should be applied to a table

    Attributes:
        col: str: The by column that the style should be computed from
        map: dict[str, str]: The map of values within col to styles
        ls: list[str]: The list of styles to use
        new_col: str: The new column name to store the style
        sum_col: bool: True if this column should be summed if a path is present.
            For example, if the column is numeric and is used for color,
    """
    by_col: str
    new_col_name: str

    def __init__(self):
        self.transforms = []

    @classmethod
    def add(
            cls,
            by_col: str,
            new_col_name: str | None = None,
    ) -> HierarchicalTransform:
        self.transforms.append({
            by_col: by_col,
            new_col_name=new_col_name,
        }


class AttachedTransform(TypedDict):
    """
    A dictionary with info about an attached transformation that should be applied to a table

    Attributes:
        col: str: The by column that the style should be computed from
        map: dict[str, str]: The map of values within col to styles
        ls: list[str]: The list of styles to use
        new_col: str: The new column name to store the style
        sum_col: bool: True if this column should be summed if a path is present.
            For example, if the column is numeric and is used for color,
    """
    by_col: str
    style_map: dict[str, str]
    style_list: list[str]
    new_col_name: str

    @classmethod
    def create(
            cls,
            by_col: str,
            new_col_name: str | None = None,
            style_map: dict[str, str] | None = None,
            style_list: list[str] | None = None,
    ) -> AttachedTransform:
        return cls(
            by_col=by_col,
            style_map=style_map or {},
            style_list=style_list or [],
            new_col_name=new_col_name,
        )
