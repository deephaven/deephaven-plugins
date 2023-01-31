from __future__ import annotations
import json
from typing import Callable

from plotly.graph_objects import Figure

from deephaven.table import Table
from deephaven.plugin.object import Reference

class DeephavenFigure:
    def __init__(self, fig: Figure, call: Callable = None, call_args: dict[any] = None):
        # keep track of function that called this and it's args
        self.fig = fig
        self.call = call
        self.call_args = call_args
        # store original table so it can be referenced later
        self.call_args["orig_table"] = call_args["table"]

        self.data_mapping = []

    def add_data(self, table: Table) -> None:
        # this is not currently supported
        return
        # only need to override existing data_frame with new data
        self.call_args["table"] = table
        self.call_args["fig"] = self
        self.call(**self.call_args)
        return self

    def add_data_mapping(self, new: list[any]) -> None:
        self.data_mapping += new

    def add_traces(self, data: dict[any]) -> None:
        self.fig.add_traces(data)

    def attach_ref(self, ref: int) -> None:
        for data in self.data_mapping:
            data["table"] = ref

    def to_json(self, exporter) -> str:
        #todo: make this work when combining figures. Will have to keep track
        # of all the tables data comes from
        self.attach_ref(exporter.reference(self.call_args["orig_table"])._index)
        figure_json = f'"plotly": {self.fig.to_json()}'
        dh_json = f'"deephaven": {json.dumps(self.data_mapping)}'
        # todo: figure out f string - the curly brackets make it tricky
        dh_figure_json = '{' + figure_json + ', ' + dh_json + '}'
        return dh_figure_json
