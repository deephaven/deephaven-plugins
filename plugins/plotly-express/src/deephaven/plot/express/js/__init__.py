import typing
import pathlib

import importlib.metadata
import importlib.resources
import json
from typing import Callable

from deephaven.plugin.js import JsPlugin


class ExpressJsPlugin(JsPlugin):
    def __init__(
        self,
        name: str,
        version: str,
        main: str,
        root_provider: Callable[[], typing.Generator[pathlib.Path, None, None]],
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

    def distribution_path(self) -> typing.Generator[pathlib.Path, None, None]:
        # todo: should rename this method in JsPlugin
        return self._root_provider()


def create_from_npm(
    root_provider: Callable[[], typing.Generator[pathlib.Path, None, None]]
) -> JsPlugin:
    with root_provider() as root, (root / "package.json").open("rb") as f:
        package_json = json.load(f)
    return ExpressJsPlugin(
        package_json["name"],
        package_json["version"],
        package_json["main"],
        root_provider,
    )


def production_root() -> typing.Generator[pathlib.Path, None, None]:
    # todo: better location
    # todo: need to make sure this works w/ 3.8+
    return importlib.resources.as_file(
        importlib.resources.files("js").joinpath("plotly-express")
    )


def development_root() -> typing.Generator[pathlib.Path, None, None]:
    raise NotImplementedError("TODO")


def create_js_plugin() -> JsPlugin:
    # todo: some mode to switch into development mode / editable mode?
    # or, some may to skip creating JsPlugin, and have developer add deephaven configuration property
    return create_from_npm(production_root)
