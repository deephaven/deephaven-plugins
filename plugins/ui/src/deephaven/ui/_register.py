from . import DashboardType, ElementType
from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper
from elements.plugin.ElementPlugin import register_element_plugins

PACKAGE_NAMESPACE = "deephaven.ui"
JS_NAME = "_js"


class UIRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:

        callback = DheSafeCallbackWrapper(callback)

        callback.register(DashboardType)
        callback.register(ElementType)

        js_plugin = create_js_plugin(PACKAGE_NAMESPACE, JS_NAME)

        callback.register(js_plugin)

        register_element_plugins()
