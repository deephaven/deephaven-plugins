from __future__ import annotations

import json

from deephaven.plugin import Registration, Callback
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

__version__ = "0.2.0"

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
            str: The name of the plugin

        """
        return NAME

    def is_type(self, obj: any) -> bool:
        """
        Check if an object is a DeephavenFigure

        Args:
          obj: any: The object to check

        Returns:
            bool: True if the object is of the correct type, False otherwise
        """
        return isinstance(obj, DeephavenFigure)

    def create_client_connection(
        self, obj: DeephavenFigure, connection: MessageStream
    ) -> MessageStream:
        """
        Create a client connection for the DeephavenFigure.
        This sends an initial figure to the client.

        Args:
          obj: object: The object to create the connection for
          connection: MessageStream: The connection to use

        Returns:
            MessageStream: The client connection
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


class ChartRegistration(Registration):
    """
    Register the DeephavenFigureType

    """

    @classmethod
    def register_into(cls, callback: Callback) -> None:
        """
        Register the DeephavenFigureType

        Args:
          callback: Registration.Callback:
            A function to call after registration

        """
        callback.register(DeephavenFigureType)
