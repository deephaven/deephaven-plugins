import typing
import pathlib

import importlib.metadata
import importlib.resources
import json
import sys
from typing import Callable, ContextManager

from deephaven.plugin.js import JsPlugin


class ExpressJsPlugin(JsPlugin):
    def __init__(
        self,
        name: str,
        version: str,
        main: str,
        root_provider: Callable[[], ContextManager[pathlib.Path]],
    ) -> None:
        self._name = name
        self._version = version
        self._main = main
        self._root_provider = root_provider

    @property
    def name(self) -> str:
        return self._name

    @property
    def version(self) -> str:
        return self._version

    @property
    def main(self) -> str:
        return self._main

    def distribution_path(self) -> ContextManager[pathlib.Path]:
        # TODO: Finalize JsPlugin
        # https://github.com/deephaven/deephaven-plugin/issues/15
        return self._root_provider()


def _create_from_npm_package_json(
    root_provider: Callable[[], ContextManager[pathlib.Path]]
) -> JsPlugin:
    with root_provider() as root, (root / "package.json").open("rb") as f:
        package_json = json.load(f)
    return ExpressJsPlugin(
        package_json["name"],
        package_json["version"],
        package_json["main"],
        root_provider,
    )


def _production_root() -> ContextManager[pathlib.Path]:
    # TODO: Js content should be in same package directory
    # https://github.com/deephaven/deephaven-plugins/issues/139
    if sys.version_info < (3, 9):
        return importlib.resources.path("js", "plotly-express")
    else:
        return importlib.resources.as_file(
            importlib.resources.files("js").joinpath("plotly-express")
        )


def _development_root() -> ContextManager[pathlib.Path]:
    raise NotImplementedError("TODO")


def create_js_plugin() -> JsPlugin:
    # TODO: Include developer instructions for installing in editable mode
    # https://github.com/deephaven/deephaven-plugins/issues/93
    # TBD what editable mode looks like for JsPlugin
    return _create_from_npm_package_json(_production_root)
