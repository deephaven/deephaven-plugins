import abc
import logging
from functools import partial
from typing import Callable, ContextManager, Type
import importlib.resources
import json
import pathlib
import sys
from deephaven.plugin.js import JsPlugin

logger = logging.getLogger(__name__)

__all__ = ["is_enterprise_environment", "create_js_plugin"]


class CommonJsPlugin(JsPlugin):
    def __init__(
        self,
        name: str,
        version: str,
        main: str,
        path: pathlib.Path,
    ) -> None:
        self._name = name
        self._version = version
        self._main = main
        self._path = path

    @property
    def name(self) -> str:
        return self._name

    @property
    def version(self) -> str:
        return self._version

    @property
    def main(self) -> str:
        return self._main

    def path(self) -> pathlib.Path:
        return self._path


def is_enterprise_environment() -> bool:
    """
    Check if the environment is an enterprise environment.

    Returns:
        True if the environment is an enterprise environment, False otherwise
    """
    # TODO: better implementation after https://deephaven.atlassian.net/browse/DH-16573
    return any("coreplus" in path or "dnd" in path for path in sys.path)


def _create_from_npm_package_json(
    path_provider: Callable[[], ContextManager[pathlib.Path]]
) -> JsPlugin:
    """
    Create a JsPlugin from an npm package.json file.

    Args:
        path_provider:
            A function that returns a context manager that provides a pathlib.Path to the package.json file
        plugin_class:
            The class to create. It must be a subclass of JsPlugin.
    """
    with path_provider() as tmp_js_path:
        js_path = tmp_js_path
    if not js_path.exists():
        raise Exception(
            f"Package is not installed in a normal python filesystem, '{js_path}' does not exist"
        )
    with (js_path / "package.json").open("rb") as f:
        package_json = json.load(f)
    return CommonJsPlugin(
        package_json["name"],
        package_json["version"],
        package_json["main"],
        js_path,
    )


def _resource_js_path_provider(
    package_namespace: str, js_name: str
) -> Callable[[], ContextManager[pathlib.Path]]:
    """
    Get the path to a resource in a package.

    Args:
        package_namespace:
            The package namespace
        js_name:
            The resource name
    """
    return partial(_resource_js_path, package_namespace, js_name)


def _resource_js_path(
    package_namespace: str, js_name: str
) -> ContextManager[pathlib.Path]:
    """
    Get the path to a resource in a package.

    Args:
        package_namespace:
            The package namespace
        js_name:
            The resource name
    """

    if sys.version_info < (3, 9):
        return importlib.resources.path(package_namespace, js_name)
    else:
        return importlib.resources.as_file(
            importlib.resources.files(package_namespace).joinpath(js_name)
        )


def create_js_plugin(
    package_namespace: str,
    js_name: str,
    plugin_class: Type[CommonJsPlugin] = CommonJsPlugin,
) -> JsPlugin:
    """
    Create a JsPlugin from an npm package.json file.

    Args:
        package_namespace:
            The package namespace
        js_name:
            The resource name
        plugin_class:
            The class to create. It must be a subclass of CommonJsPlugin.

    Returns:
        The created JsPlugin
    """
    js_path = _resource_js_path_provider(package_namespace, js_name)
    return _create_from_npm_package_json(js_path)
