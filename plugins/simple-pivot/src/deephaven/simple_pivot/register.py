from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

# The namespace that the Python plugin will be registered under.
PACKAGE_NAMESPACE = "deephaven.simple_pivot"
# Where the Javascript plugin is. This is set in setup.py.
JS_NAME = "_js"


class SimplePivotRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        callback = DheSafeCallbackWrapper(callback)

        # The JavaScript plugin requires a special registration process, which is handled here
        js_plugin = create_js_plugin(PACKAGE_NAMESPACE, JS_NAME)

        callback.register(js_plugin)
