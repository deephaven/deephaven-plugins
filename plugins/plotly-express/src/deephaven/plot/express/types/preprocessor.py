from __future__ import annotations

# todo: make sure TypedDict is imported correctly by version, or just don't use typeddict

from typing import Any, Generator, TypedDict


class HierarchicalTransform(TypedDict):
    """
    A dictionary with info about a column that should be summed up the hierarchy

    Attributes:
        sum_col: str: The sum column that should be aggregated up the hierarchy
    """

    sum_col: str


class HierarchicalTransforms:
    """
    A list of transforms that should be applied to a table.
    This is used for "hierarchical" plots such as sunburst and treemap.
    The transforms are columns that should be summed up the hierarchy.
    One example is
    """

    def __init__(self):
        self.transforms = []

    def add(
        self,
        sum_col: str,
    ) -> None:
        self.transforms.append(HierarchicalTransform(sum_col=sum_col))

    def __bool__(self):
        return bool(self.transforms)

    def __iter__(self) -> Generator[tuple[str], None, None]:
        for transform in self.transforms:
            yield transform.values()


class AttachedTransform(TypedDict):
    """
    A dictionary with info about an attached transformation that should be applied to a table

    Attributes:
        by_col: The column to use to compute the style
        new_col: The new column name to store the style
        style_map: A dictionary mapping the values in by_col to styles
        style_list: A list of styles to use
    """

    by_col: str
    new_col: str
    style_list: list[str]
    style_map: dict[str, str]


class AttachedTransforms:
    """
    A list of transforms that should be applied to a table.
    This is used for "always_attached" plots such as treemap and pie.
    The colors are attached to the table as a column that can be directly
    linked to in the client.
    """

    def __init__(self):
        self.transforms = []

    def add(
        self,
        by_col: str,
        new_col: str,
        style_map: dict[str, str] | None = None,
        style_list: list[str] | None = None,
    ) -> None:
        """
        Add a new transform to the list of transforms

        Args:
            by_col: The column to use to compute the style
            new_col: The new column name to store the style
            style_map: A dictionary mapping the values in by_col to styles
            style_list: A list of styles to use
        """
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
