from __future__ import annotations

import json
from collections.abc import Generator
from typing import Callable, Any

from plotly.graph_objects import Figure

from deephaven.plugin.object_type import Exporter

from ..data_mapping import DataMapping


def export_figure(exporter: Exporter, figure: DeephavenFigure) -> bytes:
    """Helper to export a DeephavenFigure as json

    Args:
      exporter: Exporter: The exporter to use
      figure: DeephavenFigure: The figure to export

    Returns:
      bytes: The figure as bytes

    """
    return figure.to_json(exporter).encode()


def has_color_args(call_args: dict[str, Any]) -> bool:
    """Check if any of the color args are in call_args

    Args:
      call_args: dict[str, Any]: A dictionary of args

    Returns:
      bool: True if color args are in, false otherwise

    """
    for arg in ["color_discrete_sequence_line", "color_discrete_sequence_marker"]:
        # convert to bool to ensure empty lists don't prevent removal of
        # colors on traces
        if arg in call_args and bool(call_args[arg]):
            return True
    return False


def has_arg(call_args: dict[str, Any], check: str | Callable) -> bool:
    """Given either a string to check for in call_args or function to check,
    return True if the arg is in the call_args

    Args:
      call_args: dict[str, Any]: A dictionary of args
      check: str | Callable: Either a string or a function that takes call_args

    Returns:
        bool: True if the call_args passes the check, False otherwise
    """
    if call_args:
        if isinstance(check, str) and check in call_args:
            return bool(call_args[check])
        elif isinstance(check, Callable):
            return check(call_args)
    return False
    # check is either a function or string


class DeephavenFigure:
    """A DeephavenFigure that contains a plotly figure and mapping from Deephaven
    data tables to the plotly figure

    Attributes:
        fig: Figure: (Default value = None) The underlying plotly fig
        call: Callable: (Default value = None) The (usually) px drawing
          function
        call_args: dict[Any]: (Default value = None) The arguments that were
          used to call px
        _data_mappings: list[DataMapping]: (Default value = None) A list of data
          mappings from table column to corresponding plotly variable
        has_template: bool: (Default value = False) If a template is used
        has_color: bool: (Default value = False) True if color was manually
          applied via discrete_color_sequence
        trace_generator: Generator[dict[str, Any]]: (Default value = None)
          A generator for modifications to traces
        has_subplots: bool: (Default value = False) True if has subplots
    """

    def __init__(
        self: DeephavenFigure,
        fig: Figure = None,
        call: Callable = None,
        call_args: dict[Any] = None,
        data_mappings: list[DataMapping] = None,
        has_template: bool = False,
        has_color: bool = False,
        trace_generator: Generator[dict[str, Any]] = None,
        has_subplots: bool = False,
    ):
        # keep track of function that called this and it's args
        self.fig = fig
        self.call = call
        self.call_args = call_args
        self.trace_generator = trace_generator

        self.has_template = (
            has_template if has_template else has_arg(call_args, "template")
        )

        self.has_color = has_color if has_color else has_arg(call_args, has_color_args)

        self._data_mappings = data_mappings if data_mappings else []

        self.has_subplots = has_subplots

    def copy_mappings(self: DeephavenFigure, offset: int = 0) -> list[DataMapping]:
        """Copy all DataMappings within this figure, adding a specific offset

        Args:
          offset: int:  (Default value = 0) The offset to offset the copy by

        Returns:
          list[DataMapping]: The new DataMappings

        """
        return [mapping.copy(offset) for mapping in self._data_mappings]

    def get_json_links(
        self: DeephavenFigure, exporter: Exporter
    ) -> list[dict[str, str]]:
        """Convert the internal data mapping to the JSON data mapping with
        tables and proper plotly indices attached

        Args:
          exporter: Exporter: The exporter to use to send tables

        Returns:
          list[dict[str, str]]: The list of json links that map table columns
            to the plotly figure

        """
        return [
            links
            for mapping in self._data_mappings
            for links in mapping.get_links(exporter)
        ]

    def to_dict(self: DeephavenFigure, exporter: Exporter) -> dict[str, Any]:
        """Convert the DeephavenFigure to dict

        Args:
          exporter: Exporter: The exporter to use to send tables

        Returns:
          str: The DeephavenFigure as a dictionary

        """
        return json.loads(self.to_json(exporter))

    def to_json(self: DeephavenFigure, exporter: Exporter) -> str:
        """Convert the DeephavenFigure to JSON

        Args:
          exporter: Exporter: The exporter to use to send tables

        Returns:
          str: The DeephavenFigure as a JSON string

        """
        plotly = json.loads(self.fig.to_json())
        mappings = self.get_json_links(exporter)
        deephaven = {
            "mappings": mappings,
            "is_user_set_template": self.has_template,
            "is_user_set_color": self.has_color,
        }
        payload = {"plotly": plotly, "deephaven": deephaven}
        return json.dumps(payload)
