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
            call: Callable = None,
            call_args: dict[any] = None,
            data_mappings: list[DataMapping] = None,
            #TODO: fix so template isn't just a string but can be a provided template
            template: str = None,
            has_subplots: bool = False
    ):
        # keep track of function that called this and it's args
        self.fig = fig
        self.call = call
        self.call_args = call_args
        self.has_subplots = has_subplots

        if template:
            self.template = template
        else:
            self.template = call_args["template"] if "template" in call_args else None

        self._data_mappings = data_mappings if data_mappings else []


    # def add_data_mapping(self, new: DataMapping) -> None:
    # self._data_mappings.append(new)

    # def add_traces(self, data: dict[any]) -> None:
    #    self.fig.add_traces(data)


    def copy_mappings(self, offset=0):
        return [mapping.copy(offset) for mapping in self._data_mappings]

    """
    def add_subplot(
            self: DeephavenFigure,
            sub_fig: Figure | DeephavenFigure,
            row: int,
            col: int):
        if not self.has_subplots:
            raise ValueError("DeephavenFigure does not contain subplots")

        new_fig = Figure(self.fig)
        new_data_mappings = self.copy_mappings()

        if isinstance(sub_fig, Figure):
                new_fig.add_traces(
                    sub_fig.select_traces(),
                    rows=row,
                    cols=col
                )

        else:


        offset = len(self.fig.select_traces())

        self._data_mappings.append()

        new_data_mappings = self.copy_mappings()

        new_data_mappings.append()
     """






    def get_json_links(self, exporter):
        return [links for mapping in self._data_mappings
                for links in mapping.get_links(exporter)]

    def to_json(self, exporter) -> str:
        figure_json = f'"plotly": {self.fig.to_json()}'
        mapping_json = f'"mappings": {json.dumps(self.get_json_links(exporter))}'
        template_json = f', "is_user_set_template": {"true" if self.template else "false"}'
        dh_json = '"deephaven": {' + mapping_json + template_json + '}'
        # todo: figure out f string - the curly brackets make it tricky
        return '{' + figure_json + ', ' + dh_json + '}'
