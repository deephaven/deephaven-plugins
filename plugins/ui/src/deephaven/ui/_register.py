from . import DashboardType, ElementType
from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

from ._js_plugin import UiJsPlugin

PACKAGE_NAMESPACE = "deephaven.ui"
JS_NAME = "_js"
PLUGIN_CLASS = UiJsPlugin


class UIRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:

        callback = DheSafeCallbackWrapper(callback)

        callback.register(DashboardType)
        callback.register(ElementType)

        js_plugin = create_js_plugin(
            PACKAGE_NAMESPACE,
            JS_NAME,
            PLUGIN_CLASS,
        )

        callback.register(js_plugin)
