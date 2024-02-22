import importlib.resources
import json
import pathlib
import sys
from typing import Callable, ContextManager

from deephaven.plugin.js import JsPlugin


class ExpressJsPlugin(JsPlugin):
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


def _create_from_npm_package_json(
    path_provider: Callable[[], ContextManager[pathlib.Path]]
) -> JsPlugin:
    with path_provider() as tmp_js_path:
        js_path = tmp_js_path
    if not js_path.exists():
        raise Exception(
            f"Package is not installed in a normal python filesystem, '{js_path}' does not exist"
        )
    with (js_path / "package.json").open("rb") as f:
        package_json = json.load(f)
    return ExpressJsPlugin(
        package_json["name"],
        package_json["version"],
        package_json["main"],
        js_path,
    )


def _resource_js_path() -> ContextManager[pathlib.Path]:
    namespace = "deephaven.plot.express"
    name = "_js"
    if sys.version_info < (3, 9):
        return importlib.resources.path(namespace, name)
    else:
        return importlib.resources.as_file(
            importlib.resources.files(namespace).joinpath(name)
        )


def create_js_plugin() -> JsPlugin:
    # TODO: Include developer instructions for installing in editable mode
    # https://github.com/deephaven/deephaven-plugins/issues/93
    # TBD what editable mode looks like for JsPlugin
    return _create_from_npm_package_json(_resource_js_path)
