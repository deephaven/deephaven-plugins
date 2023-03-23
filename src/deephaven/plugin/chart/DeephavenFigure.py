from __future__ import annotations
import json
from collections.abc import Generator
from typing import Callable

from plotly.graph_objects import Figure

from deephaven.plugin.object import Exporter

from .DataMapping import DataMapping


class DeephavenFigure:
    """
    A DeephavenFigure that contains a plotly figure and mapping from Deephaven
    data tables to the plotly figure
    """
    def __init__(
            self: DeephavenFigure,
            fig: Figure = None,
            call: Callable = None,
            call_args: dict[any] = None,
            data_mappings: list[DataMapping] = None,
            # TODO: fix so template isn't just a string but can be a provided template
            template: str = None,
            has_color: bool = False,
            trace_generator: Generator[dict[str, any]] = None
    ):
        """
        Initialize a DeephavenFigure

        :param fig: The underlying plotly fig
        :param call_args: The arguments that were used to call px
        :param call: The (usually) px drawing function
        :param data_mappings:A list of data mappings from table column to
        corresponding plotly variable
        :param template: A template that is used
        :param has_color: True if color was manually applied via
        discrete_color_sequence
        :param trace_generator: A generator for modifications to traces
        """
        # keep track of function that called this and it's args
        self.fig = fig
        self.call = call
        self.call_args = call_args
        self.trace_generator = trace_generator

        self.template = None
        if template:
            self.template = template
        elif call_args and "template" in call_args:
            self.template = call_args["template"]

        self.has_color = None
        if has_color:
            self.template = template
        elif call_args and "color_discrete_sequence" in call_args:
            self.has_color = call_args["color_discrete_sequence"] is not None

        self._data_mappings = data_mappings if data_mappings else []

    def copy_mappings(
            self: DeephavenFigure,
            offset: int = 0
    ) -> list[DataMapping]:
        """
        Copy all DataMappings within this figure, adding a specific offset

        :param offset: The offset to offset the copy by
        :return: The new DataMappings
        """
        return [mapping.copy(offset) for mapping in self._data_mappings]

    def get_json_links(
            self: DeephavenFigure,
            exporter: Exporter
    ) -> list[dict[str, str]]:
        """
        Convert the internal data mapping to the JSON data mapping with tables
        and proper plotly indices attached

        :param exporter: The exporter to use to send tables
        :return: The list of json links that map table columns to the plotly figure
        """
        return [links for mapping in self._data_mappings
                for links in mapping.get_links(exporter)]

    def to_json(
            self: DeephavenFigure,
            exporter: Exporter
    ) -> str:
        """
        Convert the DeephavenFigure to JSON

        :param exporter: The exporter to use to send tables
        :return: The DeephavenFigure as a JSON string
        """
        plotly = json.loads(self.fig.to_json())
        mappings = self.get_json_links(exporter)
        template = True if self.template else False
        color = True if self.has_color else False
        deephaven = {
            "mappings": mappings,
            "is_user_set_template": template,
            "is_user_set_color": color
        }
        payload = {
            "plotly": plotly,
            "deephaven": deephaven
        }
        return json.dumps(payload)
