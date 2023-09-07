from __future__ import annotations

from itertools import cycle


class StyleManager:
    """
    This is embedded into a table to generate styles on demand for
      always_attached type charts.

    Args:
        ls: list[str]: The list of styles
        map: dict[str, str]: The mapping of value to style

    Attributes:
        ls: list[str]: The list of styles
        map: dict[str | tuple[str], str]: The mapping of value to style
        cycled: Generator[str]: The cycled list
        found: dict[str | tuple[str], str]: The mapping of found values to style

    """

    def __init__(
        self,
        ls: list[str] = None,
        map: dict[str, str] = None,
    ):
        self.ls = ls if isinstance(ls, list) else [ls]
        self.map = map

        self.cycled = cycle(self.ls)
        self.found = {}

    def assign_style(self, val: str) -> str:
        """
        Assign and return a style for the specified value.

        Args:
            val: str: The val to assign

        Returns:
            str: The assigned style
        """
        if val not in self.found:
            new_val = next(self.cycled)
            if self.map and val in self.map:
                new_val = self.map[val]
            elif self.map and len(val) == 1 and val[0] in self.map:
                new_val = self.map[val[0]]
            self.found[val] = new_val
        return self.found[val]
