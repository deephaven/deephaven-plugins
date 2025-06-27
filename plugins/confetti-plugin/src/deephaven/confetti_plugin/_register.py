from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

PACKAGE_NAMESPACE = "deephaven.confetti_plugin"
JS_NAME = "_js"


class ConfettiPluginRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:

        callback = DheSafeCallbackWrapper(callback)

        js_plugin = create_js_plugin(PACKAGE_NAMESPACE, JS_NAME)

        callback.register(js_plugin)
