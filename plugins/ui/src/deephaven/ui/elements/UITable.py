import logging
from typing import Any, Callable
from deephaven.table import Table
from .Element import Element
from .._internal import RenderContext

logger = logging.getLogger(__name__)


class UITable(Element):
    def __init__(self, table: Table, props: dict = {}):
        """
        Create a TableElement from the passed in table. TableElement provides an [immutable fluent interface](https://en.wikipedia.org/wiki/Fluent_interface#Immutability) for adding UI hints to a table.

        Args:
            table: The table to wrap
        """
        self._table = table

        # Store the extra props that are added by each method
        self._props = props

    @property
    def name(self):
        return "deephaven.ui.elements.TableElement"

    def _with_prop(self, key: str, value) -> "UITable":
        print(f"_with_prop({key}, {value})")
        return UITable(self._table, {**self._props, key: value})

    def render(self, context: RenderContext) -> list[Element]:
        print(f"Returning props {self._props}")
        return {**self._props, "children": self._table}

    def on_row_double_click(
        self, callback: Callable[[int, dict[str, Any]], None]
    ) -> "UITable":
        """
        Add a callback to be invoked when a row is double-clicked.
        """
        return self._with_prop("on_row_double_click", callback)
