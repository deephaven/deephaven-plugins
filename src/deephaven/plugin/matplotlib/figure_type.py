from io import BytesIO
from matplotlib.figure import Figure

NAME = "matplotlib.figure.Figure"

def name() -> str:
    return NAME

def is_type(object) -> bool:
    return isinstance(object, Figure)

def to_bytes(figure: Figure) -> bytes:
    buf = BytesIO()
    figure.savefig(buf, format='PNG')
    return buf.getvalue()
