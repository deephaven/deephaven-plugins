from . import DeephavenAgGridType
from ._js import create_js_plugin

from deephaven.plugin import Registration, Callback


class AgGridRegistration(Registration):
    """
    Register the DeephavenAgGridType and a JsPlugin

    """

    @classmethod
    def register_into(cls, callback: Callback) -> None:
        """
        Register the DeephavenAgGridType and a JsPlugin

        Args:
          Registration.Callback:
            A function to call after registration

        """
        callback.register(DeephavenAgGridType)
        callback.register(create_js_plugin())
