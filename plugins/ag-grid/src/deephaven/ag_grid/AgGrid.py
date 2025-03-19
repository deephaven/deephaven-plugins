from deephaven.table import Table


class AgGrid:
    """
    AgGrid class for plugin registration
    """

    _table: Table

    def __init__(self, table: Table):
        self._table = table

    @property
    def table(self) -> Table:
        """
        Returns the table for the AgGrid

        Returns:
            The table for the AgGrid
        """
        return self._table
