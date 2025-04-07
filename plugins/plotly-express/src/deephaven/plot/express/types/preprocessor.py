from __future__ import annotations

# todo: make sure TypedDict is imported correctly by version, or just don't use typeddict

from typing import Any, Generator, TypedDict


class HierarchicalTransform(TypedDict):
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


class HierarchicalTransforms:
    def __init__(self):
        self.transforms = []

    def add(
        self,
        by_col: str,
        new_col: str,
    ) -> None:
        self.transforms.append(
            HierarchicalTransform(by_col=by_col, new_col_name=new_col)
        )

    def __bool__(self):
        return bool(self.transforms)

    def __iter__(self) -> Generator[tuple[str, str], None, None]:
        for transform in self.transforms:
            yield transform.values()


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
    new_col: str
    style_list: list[str]
    style_map: dict[str, str]


class AttachedTransforms:
    def __init__(self):
        self.transforms = []

    def add(
        self,
        by_col: str,
        new_col: str,
        style_map: dict[str, str] | None = None,
        style_list: list[str] | None = None,
    ) -> None:
        self.transforms.append(
            AttachedTransform(
                by_col=by_col,
                new_col=new_col,
                style_list=style_list or [],
                style_map=style_map or {},
            )
        )

    def __bool__(self):
        return bool(self.transforms)

    def __iter__(
        self,
    ) -> Generator[tuple[str, str, list[str], dict[str, str]], None, None]:
        for transform in self.transforms:
            yield transform.values()
