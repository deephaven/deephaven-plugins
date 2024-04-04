from deephaven.plugin import Registration, Callback
from plotly import io as pio


def _init_theme():
    # Set the Deephaven style globally
    from . import theme_deephaven

    pio.templates.default = "deephaven"
    # Disable default renderer to ignore figure.show()
    pio.renderers.default = None


class PlotlyRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        _init_theme()
        from . import figure_type

        callback.register(figure_type.FigureType)
