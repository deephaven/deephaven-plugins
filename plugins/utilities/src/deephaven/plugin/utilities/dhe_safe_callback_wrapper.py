from __future__ import annotations

from typing import Type
import logging
from deephaven.plugin import Callback, Plugin
from deephaven.plugin.js import JsPlugin
from .utils import is_enterprise_environment

logger = logging.getLogger(__name__)

__all__ = ["DheSafeCallbackWrapper"]


class DheSafeCallbackWrapper(Callback):
    """

    A wrapper around the Callback class that provides a safe way to register plugins.

    """

    def __init__(self, callback: Callback):
        self._callback = callback

    def register(self, plugin: Plugin | Type[Plugin]) -> None:
        """
        Register a plugin with the provided callback

        Args:
            plugin: The plugin to register

        """
        if isinstance(plugin, JsPlugin) or (
            isinstance(plugin, type) and issubclass(plugin, JsPlugin)
        ):
            self._register_js(plugin)
        else:
            self._callback.register(plugin)

    def _register_js(self, js_plugin: JsPlugin | Type[JsPlugin]) -> None:
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
            if is_enterprise_environment():
                logger.debug(
                    f"Failed to register {js_plugin} embedded in Python plugin. Skipping."
                )
            else:
                raise RuntimeError(
                    f"Failed to register {js_plugin} embedded in Python plugin: {e}"
                )
