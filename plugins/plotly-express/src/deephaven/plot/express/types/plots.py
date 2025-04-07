from __future__ import annotations

from typing import Union, Literal, Tuple, Dict
from pandas import DataFrame
from deephaven.table import Table, PartitionedTable

TableLike = Union[Table, DataFrame]
PartitionableTableLike = Union[PartitionedTable, TableLike]
Orientation = Literal["v", "h"]
Gauge = Literal["angular", "bullet"]

# StyleDict is a dictionary that maps column values to style values.
StyleDict = Dict[Union[str, Tuple[str]], str]

# In addition to StyleDict, StyleMap can also be a string literal "identity" or "by"
# that specifies how to map column values to style values.
# If "identity", the column values are taken as literal style values.
# If "by", the column values are used to map to style values.
# "by" is only used to override parameters that default to numeric mapping on a continuous scale, such as scatter color.
# Providing a tuple of "by" and a StyleDict is equivalent to providing a StyleDict.
StyleMap = Union[
    Literal["identity"], Literal["by"], Tuple[Literal["by"], StyleDict], StyleDict
]
