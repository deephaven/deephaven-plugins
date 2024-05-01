from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

from .js_plugin import {{ cookiecutter.__py_js_plugin_obj_name }}
from .{{ cookiecutter.__type_file_name }} import {{ cookiecutter.__type_name }}

# The namespace that the Python plugin will be registered under.
PACKAGE_NAMESPACE = "{{cookiecutter.__py_namespace}}"
# Where the Javascript plugin is. This is set in setup.py.
JS_NAME = "_js"
# The JsPlugin class that will be created and registered.
PLUGIN_CLASS = {{ cookiecutter.__py_js_plugin_obj_name }}


class {{ cookiecutter.__registration_name }}(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:

        # Register the Python plugin
        callback.register({{ cookiecutter.__type_name }})

        # The JavaScript plugin requires a special registration process, which is handled here
        js_plugin = create_js_plugin(
            PACKAGE_NAMESPACE,
            JS_NAME,
            PLUGIN_CLASS,
        )

        callback.register(js_plugin)
