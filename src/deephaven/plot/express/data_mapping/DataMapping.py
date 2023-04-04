from __future__ import annotations

from copy import copy

from deephaven.table import Table
from deephaven.plugin.object import Exporter

from .json_conversion import json_link_mapping


class DataMapping:
    """
    A DataMapping that maps plotly variables to table columns
    """
    def __init__(
            self: DataMapping,
            table: Table,
            data_mapping: list[dict[str, str]],
            start_index: int
    ):
        """
        Create a DataMapping

        :param table: The table to use for this data mapping
        :param data_mapping: The variable to column dictionaries used in this
        mapping. They should map plotly variables to table columns. One of
        these maps to one data trace.
        :param start_index: The index (which is an index in the plotly data)
        that this DataMapping starts at
        """
        self._table = table
        self._data_mapping = data_mapping
        self._start_index = start_index

    def get_links(
            self: DataMapping,
            exporter: Exporter
    ) -> list[dict[any]]:
        """
        Get the json links for this data mapping

        :param exporter: The exporter, used to get the index of the table
        :return: The column to json link mapping for this DataMapping
        """
        return json_link_mapping(
            self._data_mapping,
            exporter.reference(self._table)._index,
            self._start_index)

    def copy(
            self: DataMapping,
            offset: int
    ) -> DataMapping:
        """
        Copy this DataMapping, adding a specific offset to the start_index

        :param offset: The offset to offset the copy by
        :return: The new DataMapping
        """
        # only need a shallow copy as the underlying data mappings are
        # never modified, only the start_index is
        new_copy = copy(self)
        new_copy._start_index += offset
        return new_copy
