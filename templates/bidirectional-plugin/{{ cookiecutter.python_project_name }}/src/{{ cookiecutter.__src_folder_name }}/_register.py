from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

from ._js_plugin import {{ cookiecutter.__js_plugin_obj_name }}
from .{{ cookiecutter.__type_file_name }} import {{ cookiecutter.__type_name }}

PACKAGE_NAMESPACE = "{{cookiecutter.__py_namespace}}"
JS_NAME = "_js"
PLUGIN_CLASS = {{ cookiecutter.__js_plugin_obj_name }}


class {{ cookiecutter.__registration_name }}(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:

        callback = DheSafeCallbackWrapper(callback)

        callback.register({{ cookiecutter.__type_name }})

        js_plugin = create_js_plugin(
            PACKAGE_NAMESPACE,
            JS_NAME,
            PLUGIN_CLASS,
        )

        callback.register(js_plugin)
