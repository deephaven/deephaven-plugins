from . import DeephavenFigureType
from ._js import create_js_plugin

from deephaven.plugin import Registration, Callback


class ExpressRegistration(Registration):
    """
    Register the DeephavenFigureType and a JsPlugin

    """

    @classmethod
    def register_into(cls, callback: Callback) -> None:
        """
        Register the DeephavenFigureType and a JsPlugin

        Args:
          Registration.Callback:
            A function to call after registration

        """
        callback.register(DeephavenFigureType)
        callback.register(create_js_plugin())
