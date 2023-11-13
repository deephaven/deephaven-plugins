from __future__ import annotations

import logging
from typing import Any, Callable, Dict
from deephaven.table import Table
from .Element import Element
from .._internal import dict_to_camel_case, RenderContext

logger = logging.getLogger(__name__)

RowIndex = int
RowDataMap = Dict[str, Any]


class UITable(Element):
    """
    Wrap a Table with some extra props for giving hints to displaying a table
    """

    _table: Table
    """
    The table that is wrapped with some extra props
    """

    _props: dict[str, Any]
    """
    The extra props that are added by each method
    """

    def __init__(self, table: Table, props: dict[str, Any] = {}):
        """
        Create a UITable from the passed in table. UITable provides an [immutable fluent interface](https://en.wikipedia.org/wiki/Fluent_interface#Immutability) for adding UI hints to a table.

        Args:
            table: The table to wrap
        """
        self._table = table

        # Store the extra props that are added by each method
        self._props = props

    @property
    def name(self):
        return "deephaven.ui.elements.UITable"

    def _with_prop(self, key: str, value: Any) -> "UITable":
        logger.debug("_with_prop(%s, %s)", key, value)
        return UITable(self._table, {**self._props, key: value})

    def render(self, context: RenderContext) -> dict[str, Any]:
        logger.debug("Returning props %s", self._props)
        return dict_to_camel_case({**self._props, "table": self._table})

    def on_row_double_press(
        self, callback: Callable[[RowIndex, RowDataMap], None]
    ) -> "UITable":
        """
        Add a callback to be invoked when a row is double-clicked.
        """
        return self._with_prop("on_row_double_press", callback)
