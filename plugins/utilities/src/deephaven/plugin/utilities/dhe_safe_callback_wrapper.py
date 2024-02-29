from deephaven.plugin import Callback, Plugin
import logging
from deephaven.plugin.js import JsPlugin
from .utils import in_enterprise_environment

logger = logging.getLogger(__name__)


class DheSafeCallbackWrapper:
    """

    A wrapper around the Callback class that provides a safe way to register plugins.

    """

    def __init__(self, callback: Callback):
        self._callback = callback

    def register(self, plugin: Plugin) -> None:
        """
        Register a plugin with the provided callback

        Args:
            plugin: The plugin to register

        """
        if isinstance(plugin, JsPlugin):
            self._register_js(plugin)
        else:
            self._callback.register(plugin)

    def _register_js(self, js_plugin: JsPlugin) -> None:
        """
        Attempt to register a JS plugin.
        If failed and enterprise is detected, a debug message will be logged.
        If failed and enterprise is not detected, an exception will be raised.

        Args:
            js_plugin:
                The JS plugin to register
        """
        try:
            self._callback.register(js_plugin)
        except RuntimeError as e:
            if in_enterprise_environment():
                logger.debug(
                    f"Failed to register {js_plugin} embedded in Python plugin. Skipping."
                )
            else:
                raise RuntimeError(
                    f"Failed to register {js_plugin} embedded in Python plugin: {e}"
                )
