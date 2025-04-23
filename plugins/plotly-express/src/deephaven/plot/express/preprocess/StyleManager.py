from __future__ import annotations

from itertools import cycle
from typing import cast


class StyleManager:
    """
    This is embedded into a table to generate styles on demand for
      always_attached type charts.

    Args:
        ls: The list of styles
        map: The mapping of value to style

    Attributes:
        ls: list[str]: The list of styles
        map: dict[str | tuple[str], str]: The mapping of value to style
        cycled: Generator[str]: The cycled list
        found: dict[str | tuple[str], str]: The mapping of found values to style

    """

    def __init__(
        self,
        ls: list[str] | None = None,
        map: dict[str, str] | None = None,
    ):
        self.ls = ls if isinstance(ls, list) else [ls]
        self.map = map

        self.cycled = cycle(self.ls)
        self.found = {}

        self.wildcard = None

    def assign_style(self, val: str, map_applies: bool) -> str:
        """
        Assign and return a style for the specified value.

        Args:
            val: The val to assign
            map_applies: Whether the map applies to this value

        Returns:
            The assigned style
        """

        if not map_applies:
            if self.wildcard is None:
                self.wildcard = next(self.cycled)
            assert self.wildcard is not None
            return self.wildcard
        if val not in self.found:
            new_val = next(self.cycled)
            if self.map and val in self.map:
                new_val = self.map[val]
            elif self.map and len(val) == 1 and val[0] in self.map:
                new_val = self.map[val[0]]
            self.found[val] = new_val
        return self.found[val]
