from typing import Union
from pandas import DataFrame
from deephaven.table import Table, PartitionedTable

TableLike = Union[Table, DataFrame]
PartitionableTableLike = Union[PartitionedTable, TableLike]
