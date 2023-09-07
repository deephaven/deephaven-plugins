from plotly.graph_objects import Figure
from deephaven.plugin.object_type import Exporter, FetchOnlyObjectType

# Name of the plotly figure object that was exported
NAME = "plotly.figure"


def _export_figure(figure):
    return figure.to_json().encode()


class FigureType(FetchOnlyObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, obj) -> bool:
        return isinstance(obj, Figure)

    def to_bytes(self, exporter: Exporter, figure: Figure) -> bytes:
        return _export_figure(figure)
