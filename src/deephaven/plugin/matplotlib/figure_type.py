from io import BytesIO
from matplotlib.figure import Figure
from deephaven.plugin.object import Exporter, ObjectType

NAME = "matplotlib.figure.Figure"

class FigureType(ObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object) -> bool:
        return isinstance(object, Figure)

    def to_bytes(self, exporter: Exporter, figure: Figure) -> bytes:
        buf = BytesIO()
        figure.savefig(buf, format='PNG')
        return buf.getvalue()
