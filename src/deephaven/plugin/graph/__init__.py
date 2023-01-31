from collections.abc import Generator
from typing import Callable

import plotly.express as px
from plotly.graph_objects import Figure
from pandas import DataFrame

from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType
from deephaven import pandas as dhpd
from deephaven.table import Table
from deephaven import empty_table

from .deephaven_figure import DeephavenFigure

__version__ = "0.0.1.dev0"

NAME = "deephaven.plugin.graph.DeephavenFigure"


# TODO: keep keys seperate
def _export_figure(exporter: Exporter, figure: Figure) -> bytes:
    return figure.to_json(exporter).encode()


class DeephavenFigureType(ObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object: any) -> bool:
        return isinstance(object, DeephavenFigure)

    def to_bytes(self, exporter: Exporter, figure: DeephavenFigure) -> bytes:
        return _export_figure(exporter, figure)


class GraphRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        callback.register(DeephavenFigureType)


# TODO: this is not comprehensive
type_null_mapping = {
    "int": "NULL_INT",
    "double": "NULL_DOUBLE"
}


# TODO: use deephaven data types directly rather than convert to string?
# map types of data cols to the matching null value
def col_null_mapping(table: Table, cols: set[str]) -> Generator[tuple[str, str]]:
    for col in table.columns:
        if col.name in cols:
            yield col.name, type_null_mapping[str(col.data_type)]


def construct_min_dataframe(table: Table,
                            data_cols: list[str]
                            ) -> DataFrame:
    # add null valued columns as placeholders for plotly express
    update_result = empty_table(1).update([f"{col} = {null}" for col, null
                                           in col_null_mapping(table, set(data_cols))])

    return dhpd.to_pandas(update_result)


# track original table for reference
def modify_scatter(table: Table = None,
                   orig_table: Table = None,
                   x: str | list[str] = None,
                   y: str | list[str] = None,
                   px_draw: Callable = None) -> DeephavenFigure:
    call_args = locals()

    data_frame = construct_min_dataframe(table, data_cols=prepare_cols(x, y))

    plot = px_draw(data_frame=data_frame, x=x, y=y)

    fig = DeephavenFigure(plot, call_args=call_args, call=modify_scatter)

    fig.add_data_mapping(extract_data_mapping(x, y))

    return fig


def prepare_cols(*args: list[str] | str) -> list[str]:
    # merge the strings or list of strings passed into one list
    # note that when passing to this in preparation for get_min_dataframe,
    # the arguments should be in the same order as the plotly express call
    prepared_cols = []
    for arg in args:
        if isinstance(arg, list):
            prepared_cols += arg
        else:
            prepared_cols.append(arg)
    return prepared_cols


# assuming a min data_frame here already
def extract_data_mapping(
        x: str | list[str],
        y: str | list[str],
) -> list[dict[any]]:
    if isinstance(x, list):
        return [{"table": "ref", "data_columns": {"x": arg, "y": y}} for arg in x]
    elif isinstance(y, list):
        return [{"table": "ref", "data_columns": {"x": x, "y": arg}} for arg in y]
    return [{"table": "ref", "data_columns": {"x": x, "y": y}}]


def scatter(table: Table = None,
            x: str | list[str] = None,
            y: str | list[str] = None,
            ) -> DeephavenFigure:
    if isinstance(table, Table):
        return modify_scatter(**locals(), px_draw=px.scatter)
    else:
        return DeephavenFigure(
            px.scatter(
                data_frame=table,
                x=x,
                y=y
            ))


def line(table: Table = None,
         x: str | list[str] = None,
         y: str | list[str] = None
         ) -> DeephavenFigure:
    if isinstance(table, Table):
        return modify_scatter(**locals(), px_draw=px.line)
    else:
        return DeephavenFigure(
            px.line(
                data_frame=table,
                x=x,
                y=y
            ))
