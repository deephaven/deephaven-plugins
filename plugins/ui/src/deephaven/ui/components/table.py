from deephaven.table import Table
from ..elements import UITable


def table(table: Table) -> UITable:
    """
    Add some extra methods to the Table class for giving hints to displaying a table
    """
    return UITable(table)
