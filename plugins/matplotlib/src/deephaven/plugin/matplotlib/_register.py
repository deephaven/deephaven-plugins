from importlib import resources
import matplotlib.pyplot as plt
from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper
from ._js_plugin import MatplotlibJsPlugin

PACKAGE_NAMESPACE = "deephaven.plugin.matplotlib"
JS_NAME = "_js"
PLUGIN_CLASS = MatplotlibJsPlugin


def _init_theme():
    # Set the Deephaven style globally.
    # We use the savefig function to export the Figure, and that uses the Figure's properties for colours rather than temporary styling.
    # The Figure's properties are set on creation time of the Figure, rather than when the Figure is exported
    # We do not have hooks into when a user creates a new Figure, so we set the theme globally ahead of time
    # https://github.com/matplotlib/matplotlib/issues/6592/
    with resources.path(__package__, "deephaven.mplstyle") as p:
        plt.style.use(["dark_background", p])


class MatplotlibRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        _init_theme()
        plt.switch_backend("AGG")
        from . import figure_type

        callback = DheSafeCallbackWrapper(callback)

        callback.register(figure_type.FigureType)

        js_plugin = create_js_plugin(
            PACKAGE_NAMESPACE,
            JS_NAME,
            PLUGIN_CLASS,
        )

        callback.register(js_plugin)
