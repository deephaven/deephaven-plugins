import os
from . import DeephavenFigureType
from ._js_plugin import create_js_plugin
from plotly import io as pio
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
        # Disable default renderer to ignore figure.show()
        pio.renderers.default = None

        callback.register(DeephavenFigureType)

        # Only register the JS plugins if the environment variable is set
        if os.getenv("DEEPHAVEN_ENABLE_PY_JS", "False").lower() in ("true", "1"):
            callback.register(create_js_plugin())
