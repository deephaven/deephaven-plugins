from io import BytesIO
from matplotlib.figure import Figure

NAME = "matplotlib.figure.Figure"

class FigureType:
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object) -> bool:
        return isinstance(object, Figure)

    def to_bytes(self, exporter, figure: Figure) -> bytes:
        buf = BytesIO()
        figure.savefig(buf, format='PNG')
        return buf.getvalue()
