import logging
from typing import Callable, List
from deephaven import Table
from .Element import Element
from .._internal import RenderContext

logger = logging.getLogger(__name__)


class TableElement(Element):
    def __init__(self, table: Table, props: dict = None):
        """
        Create a TableElement from the passed in table. TableElement provides an [immutable fluent interface](https://en.wikipedia.org/wiki/Fluent_interface#Immutability) for adding UI hints to a table.

        Args:
            table: The table to wrap
        """
        self._table = table

        # Store the extra props that are added by each method
        self._props = {}

    @property
    def name(self):
        return "deephaven.ui.elements.TableElement"

    def _with_attribute(self, key: str, value):
        return TableElement(self._table, {**self._props, key: value})

    def render(self, context: RenderContext) -> List[Element]:
        return {**self._props, "children": self._table}

    def on_row_clicked(self, callback: Callable[[int], None]):
        """
        Add a callback to be invoked when a row is clicked.
        """
        return self._with_attribute("on_row_clicked", callback)
