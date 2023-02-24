from __future__ import annotations
import json
from typing import Callable

from plotly.graph_objects import Figure

from deephaven.table import Table
from deephaven.plugin.object import Reference

from .DataMapping import DataMapping


class DeephavenFigure:
    def __init__(
            self,
            fig: Figure = None,
            table: Table = None,
            call: Callable = None,
            call_args: dict[any] = None,
            data_mappings: list[DataMapping] = None
    ):
        # keep track of function that called this and it's args
        self.fig = fig
        self.call = call
        self.call_args = call_args

        self._data_mappings = data_mappings if data_mappings else []

    #def add_data_mapping(self, new: DataMapping) -> None:
        #self._data_mappings.append(new)

    # def add_traces(self, data: dict[any]) -> None:
    #    self.fig.add_traces(data)

    def get_json_links(self, exporter):
        return [links for mapping in self._data_mappings
                for links in mapping.get_links(exporter)]

    def to_json(self, exporter) -> str:
        figure_json = f'"plotly": {self.fig.to_json()}'
        dh_json = f'"deephaven": {json.dumps(self.get_json_links(exporter))}'
        # todo: figure out f string - the curly brackets make it tricky
        dh_figure_json = '{' + figure_json + ', ' + dh_json + '}'
        return dh_figure_json
