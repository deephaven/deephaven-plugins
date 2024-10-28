from typing import Union
from pandas import DataFrame
from deephaven.table import Table, PartitionedTable

TableData = Union[Table, DataFrame]
TableDataBy = Union[PartitionedTable, TableData]
