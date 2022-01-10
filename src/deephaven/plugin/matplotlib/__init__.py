from deephaven.plugin import Registration

__version__ = "0.0.1.dev5"

class MatplotlibRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        from . import figure_type
        callback.register(figure_type.FigureType)
