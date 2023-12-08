import typing
import pathlib

import importlib.metadata
import importlib.resources

from deephaven.plugin.js import JsPlugin


class ExpressJsPlugin(JsPlugin):
    def distribution_path(self) -> typing.Generator[pathlib.Path, None, None]:
        # todo: better location
        # todo: need to make sure this works w/ 3.8+
        # todo: should rename this method in JsPlugin?
        return importlib.resources.as_file(
            importlib.resources.files("js").joinpath("plotly-express")
        )

    @property
    def name(self) -> str:
        # note: should this be NPM name?
        return "@deephaven/js-plugin-plotly-express"

    @property
    def version(self) -> str:
        # note: this vs NPM version?
        # should it be combo of both?
        return importlib.metadata.version("deephaven-plugin-plotly-express")

    @property
    def main(self) -> str:
        # todo: source from package.json?
        return "dist/bundle/index.js"
