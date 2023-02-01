import itertools
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

NAME = "deephaven.plugin.chart.DeephavenFigure"


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


class ChartRegistration(Registration):
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


def get_data_cols(call_args: dict[any]) -> dict[str | list[str]]:
    # get columns that need to be added to dataset
    data_args = ["x", "y", "z", "r", "theta", "a", "b", "c"]
    return {k: v for k, v in call_args.items() if k in data_args}


def generate_figure(
        px_draw: Callable,
        call_args: dict[any],
) -> DeephavenFigure:
    table = call_args["table"]

    data_cols = get_data_cols(call_args)

    data_frame = construct_min_dataframe(table, data_cols=merge_cols(list(data_cols.values())))

    call_args.pop("table")

    plot = px_draw(data_frame=data_frame, **call_args)

    fig = DeephavenFigure(plot, table, call_args=call_args, call=px_draw)

    fig.add_data_mapping(extract_data_mapping(data_cols))

    return fig


def merge_cols(args: list[str | list[str]]) -> list[str]:
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


def json_link(i, keys):
    # create json links to link deephaven to plotly data
    for key in keys:
        yield f'/plotly/data/{i}/{key}'


def column_link_dict(col_dict, i, keys):
    # get a dict that maps column to a json link
    return dict(zip(col_dict, json_link(i, keys)))

def column_product(data_cols: dict[str | list[str]]) -> dict[str, any]:
    # generate a product of all column groupings for the data mapping
    col_names = []
    for val in data_cols.values():
        if isinstance(val, str):
            col_names.append([val])
        else:
            col_names.append(val)

    col_name_groups = itertools.product(*col_names)

    for i, col_dict in enumerate(col_name_groups):
        yield column_link_dict(col_dict, i, data_cols.keys())


def extract_data_mapping(
        data_cols: dict[str | list[str]]
) -> list[dict[any]]:
    return [{"table": "ref", "data_columns": col_dict} for col_dict in column_product(data_cols)]


def scatter(table: Table = None,
            x: str | list[str] = None,
            y: str | list[str] = None
            ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter, call_args=locals())


def scatter_3d(table: Table = None,
               x: str = None,
               y: str = None,
               z: str = None
               ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter_3d, call_args=locals())


def scatter_polar(table: Table = None,
                  r: str = None,
                  theta: str = None,
                  ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter_polar, call_args=locals())
    pass


def scatter_ternary(table: Table = None,
                    a: str = None,
                    b: str = None,
                    c: str = None,
                    ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter_ternary, call_args=locals())
    pass


def line(table: Table = None,
         x: str | list[str] = None,
         y: str | list[str] = None
         ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line, call_args=locals())


def line_3d(table: Table = None,
            x: str = None,
            y: str = None,
            z: str = None
            ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line_3d, call_args=locals())
    pass


def line_polar(table: Table = None,
               r: str = None,
               theta: str = None,
               ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line_polar, call_args=locals())
    pass


def line_ternary(table: Table = None,
                 a: str = None,
                 b: str = None,
                 c: str = None,
                 ) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line_ternary, call_args=locals())
    pass
