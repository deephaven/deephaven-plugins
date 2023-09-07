from __future__ import annotations

from copy import copy
from typing import Any

from deephaven.table import Table
from deephaven.plugin.object_type import Exporter

from .json_conversion import json_link_mapping


class DataMapping:
    """A DataMapping that maps plotly variables to table columns

    Attributes:
      _table: Table: The table to use for this data mapping
      _data_mapping: list[dict[str, str]]: The variable to column
        dictionaries used in this mapping. They should map plotly variables
        to table columns. One of these maps to one data trace.
      _start_index: int: The index (which is an index in the plotly data)
        that this DataMapping starts at
    """

    def __init__(
        self: DataMapping,
        table: Table,
        data_mapping: list[dict[str, str]],
        start_index: int,
    ):
        self._table = table
        self._data_mapping = data_mapping
        self._start_index = start_index

    def get_links(self: DataMapping, exporter: Exporter) -> list[dict[Any]]:
        """Get the json links for this data mapping

        Args:
          exporter: Exporter: The exporter, used to get the index of the table

        Returns:
          list[dict[Any]]: The column to json link mapping for this DataMapping

        """
        return json_link_mapping(
            self._data_mapping, exporter.reference(self._table).index, self._start_index
        )

    def copy(self: DataMapping, offset: int) -> DataMapping:
        """Copy this DataMapping, adding a specific offset to the start_index

        Args:
          offset: int: The offset to offset the copy by

        Returns:
          DataMapping: The new DataMapping

        """
        # only need a shallow copy as the underlying data mappings are
        # never modified, only the start_index is
        new_copy = copy(self)
        new_copy._start_index += offset
        return new_copy
