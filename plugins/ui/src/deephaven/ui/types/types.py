from typing import Any, List, Dict, Literal

Sentinel = Any
ColumnName = str
ColumnData = List[Any]
RowData = Dict[ColumnName, Any]
TableData = Dict[ColumnName, ColumnData]
LockType = Literal["shared", "exclusive"]
