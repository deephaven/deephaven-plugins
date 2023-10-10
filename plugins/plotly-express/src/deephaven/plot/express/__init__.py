from deephaven.plugin import Registration, Callback
from deephaven.plugin.object_type import Exporter, FetchOnlyObjectType

from .deephaven_figure import DeephavenFigure, export_figure

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
)

from .data import data_generators

__version__ = "0.1.0"

NAME = "deephaven.plot.express.DeephavenFigure"


class DeephavenFigureType(FetchOnlyObjectType):
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

    def to_bytes(self, exporter: Exporter, figure: DeephavenFigure) -> bytes:
        """
        Converts a DeephavenFigure to bytes

        Args:
          exporter: Exporter: The exporter to use
          figure: DeephavenFigure: The figure to convert

        Returns:
            bytes: The Figure as bytes
        """
        return export_figure(exporter, figure)


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
