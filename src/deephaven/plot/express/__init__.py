from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType

from .deephaven_figure import DeephavenFigure, export_figure

from .plots import area, bar, frequency_bar, timeline, histogram, _ecdf, box, \
    violin, strip, ohlc, candlestick, treemap, sunburst, icicle, funnel, \
    funnel_area, line, line_polar, line_ternary, line_3d, scatter, scatter_3d, \
    scatter_polar, scatter_ternary, pie, layer

__version__ = "0.0.2"

NAME = "deephaven.plot.express.DeephavenFigure"


class DeephavenFigureType(ObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object: any) -> bool:
        return isinstance(object, DeephavenFigure)

    def to_bytes(self, exporter: Exporter, figure: DeephavenFigure) -> bytes:
        return export_figure(exporter, figure)


class ChartRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        callback.register(DeephavenFigureType)
