from deephaven import Table
from ..elements import TableElement


def table(table: Table):
    """
    Add some extra methods to the Table class for giving hints to displaying a table
    """
    return TableElement(table)
