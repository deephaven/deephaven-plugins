from __future__ import annotations

from typing import Generator, TypedDict


class HierarchicalTransform(TypedDict):
    """
    A dictionary with info about a column that should be averaged up the hierarchy

    Attributes:
        avg_col: str: The column that should be averaged up the hierarchy
    """

    avg_col: str


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
        avg_col: str,
    ) -> None:
        """
        Add a new transform to the list of transforms

        Args:
            avg_col: The column to take the average of when aggregating up the hierarchy
        """
        self.transforms.append(HierarchicalTransform(avg_col=avg_col))

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
        self.transforms = {}

    def add(
        self,
        by_col: str,
        new_col: str,
        style_map: dict[str, str] | None,
        style_list: list[str] | None,
        style: str,
    ) -> None:
        """
        Add a new transform to the list of transforms

        Args:
            by_col: The column to use to compute the style
            new_col: The new column name to store the style
            style_map: A dictionary mapping the values in by_col to styles
            style_list: A list of styles to use
            style: which style this applies to, such as color
        """
        self.transforms[style] = AttachedTransform(
            by_col=by_col,
            new_col=new_col,
            style_list=style_list or [],
            style_map=style_map or {},
        )

    def get_style_col(self, style: str) -> str | None:
        """
        Get the column name for the style

        Args:
            style: The style to get the column for

        Returns:
            The column name for the style
        """
        if style not in self.transforms:
            return None
        return self.transforms[style]["by_col"]

    def __bool__(self):
        return bool(self.transforms)

    def __iter__(
        self,
    ) -> Generator[tuple[str, str, list[str], dict[str, str]], None, None]:
        for transform in self.transforms.values():
            yield transform.values()
