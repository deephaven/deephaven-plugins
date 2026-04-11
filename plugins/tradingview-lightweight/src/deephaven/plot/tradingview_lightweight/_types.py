"""Internal type aliases."""

from __future__ import annotations

from typing import Any, Union

try:
    from deephaven.table import Table, PartitionedTable

    TableLike = Union[Table, PartitionedTable]
except ImportError:
    TableLike = Any
