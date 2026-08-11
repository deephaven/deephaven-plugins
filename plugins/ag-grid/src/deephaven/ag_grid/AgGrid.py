from __future__ import annotations

from typing import Any, Dict, Optional

from deephaven.table import Table


class AgGrid:
    """
    AgGrid class for plugin registration
    """

    _table: Table
    _column_defs: Dict[str, Dict[str, Any]]

    def __init__(
        self, table: Table, column_defs: Optional[Dict[str, Dict[str, Any]]] = None
    ):
        """
        Create a new AgGrid.

        Args:
            table: The table to display in the grid
            column_defs: Optional map from column name to a partial AG Grid column definition.
                The provided properties are merged on top of the column definitions generated
                from the table schema on the client.
                For example, to make the filter for a column case sensitive:
                ``column_defs={"Column_X": {"filterParams": {"caseSensitive": True}}}``
        """
        self._table = table
        self._column_defs = column_defs if column_defs is not None else {}

    @property
    def table(self) -> Table:
        """
        Returns the table for the AgGrid

        Returns:
            The table for the AgGrid
        """
        return self._table

    @property
    def column_defs(self) -> Dict[str, Dict[str, Any]]:
        """
        Returns the column definition overrides for the AgGrid

        Returns:
            Map from column name to a partial AG Grid column definition
        """
        return self._column_defs
