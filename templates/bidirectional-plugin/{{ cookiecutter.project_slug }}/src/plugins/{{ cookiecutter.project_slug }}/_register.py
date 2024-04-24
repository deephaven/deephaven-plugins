from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

from ._js_plugin import {{ cookiecutter.py_pascal_case }}JsPlugin
from .{{ cookiecutter.project_slug }}_type import {{ cookiecutter.py_pascal_case }}Type

PACKAGE_NAMESPACE = "{{cookiecutter.py_namespace}}"
JS_NAME = "_js"
PLUGIN_CLASS = {{cookiecutter.py_pascal_case}}JsPlugin


class {{ cookiecutter.py_pascal_case }}Registration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:

        callback = DheSafeCallbackWrapper(callback)

        callback.register({{ cookiecutter.py_pascal_case }}Type)

        js_plugin = create_js_plugin(
            PACKAGE_NAMESPACE,
            JS_NAME,
            PLUGIN_CLASS,
        )

        callback.register(js_plugin)
