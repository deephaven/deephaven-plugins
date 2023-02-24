from __future__ import annotations

from copy import copy

from deephaven.table import Table

from .json_conversion import json_link_mapping


class DataMapping:
    def __init__(self, table: Table, data_mapping: list[dict[str, str]], start_index: int):
        # keep track of function that called this and it's args
        self.table = table
        self.data_mapping = data_mapping
        self.start_index = start_index

    def get_links(self, exporter):
        return json_link_mapping(
            self.data_mapping,
            exporter.reference(self.table)._index,
            self.start_index)

    def copy(self, offset):
        # we only need a shallow copy as the underlying data mappings are
        # never modified, only the start_index is
        new_copy = copy(self)
        new_copy.start_index += offset
        return new_copy
