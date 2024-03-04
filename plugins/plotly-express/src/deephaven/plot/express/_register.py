from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper
from . import DeephavenFigureType
from ._js_plugin import ExpressJsPlugin

PACKAGE_NAMESPACE = "deephaven.plot.express"
JS_NAME = "_js"
PLUGIN_CLASS = ExpressJsPlugin


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
        callback = DheSafeCallbackWrapper(callback)

        callback.register(DeephavenFigureType)

        js_plugin = create_js_plugin(
            PACKAGE_NAMESPACE,
            JS_NAME,
            PLUGIN_CLASS,
        )

        callback.register(js_plugin)
