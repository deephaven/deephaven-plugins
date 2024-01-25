from __future__ import annotations

import json
from typing import Any

from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream

from .communication.DeephavenFigureConnection import DeephavenFigureConnection
from .deephaven_figure import DeephavenFigure

from .plots import (
    area,
    bar,
    frequency_bar,
    timeline,
    histogram,
    box,
    violin,
    strip,
    ohlc,
    candlestick,
    treemap,
    sunburst,
    icicle,
    funnel,
    funnel_area,
    line,
    line_polar,
    line_ternary,
    line_3d,
    scatter,
    scatter_3d,
    scatter_polar,
    scatter_ternary,
    pie,
    layer,
    make_subplots,
    scatter_geo,
    scatter_mapbox,
    density_mapbox,
    line_geo,
    line_mapbox,
)

from .data import data_generators


NAME = "deephaven.plot.express.DeephavenFigure"


class DeephavenFigureType(BidirectionalObjectType):
    """
    DeephavenFigureType for plugin registration

    """

    @property
    def name(self) -> str:
        """
        Returns the name of the plugin

        Returns:
            The name of the plugin
        """
        return NAME

    def is_type(self, obj: Any) -> bool:
        """
        Check if an object is a DeephavenFigure

        Args:
          obj: The object to check

        Returns:
            True if the object is of the correct type, False otherwise
        """
        return isinstance(obj, DeephavenFigure)

    def create_client_connection(
        self, obj: DeephavenFigure, connection: MessageStream
    ) -> MessageStream:
        """
        Create a client connection for the DeephavenFigure.
        This sends an initial figure to the client.

        Args:
          obj: The object to create the connection for
          connection: The connection to use

        Returns:
            The client connection
        """
        figure_connection = DeephavenFigureConnection(obj, connection)
        initial_message = json.dumps(
            {
                "type": "RETRIEVE",
            }
        ).encode()
        payload, references = figure_connection.on_data(initial_message, [])
        connection.on_data(payload, references)
        return figure_connection
