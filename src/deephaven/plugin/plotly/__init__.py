from deephaven.plugin import Registration
from plotly import io

__version__ = "0.0.1.dev1"

def _init_theme():
    # Set the Deephaven style globally
    io.templates.default = "plotly_dark"

class PlotlyRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        _init_theme()
        from . import figure_type
        callback.register(figure_type.FigureType)
