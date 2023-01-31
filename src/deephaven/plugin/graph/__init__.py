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

from .params import ParamGetterCollection
from .deephaven_figure import DeephavenFigure
from .arg_type import ArgType

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


# get unique items while preserving order

def get_xy_increment(x: list | list[str], y: list | list[str]) -> int:
    # assuming that a list must be of column names here
    if isinstance(x, list):
        return len(x)
    if isinstance(y, list):
        return len(y)
    return 1


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

# TODO: figure out defaults


#def get_data_type():
#    return source.meta_table.where(filters=["Name = `Strings`"]).select("DataType")

def get_distinct_values(table, col, arg_type):
    match arg_type:
        case ArgType.CONDITIONAL:
            # processing depends on if the column is categorical or numerical
            pass
        case ArgType.CATEGORICAL:
            # no matter what, ever unique item is a category
            return table.select_distinct(col)
        case ArgType.NUMERICAL:
            # no matter what, this must be numerical inpout
            pass


# create a minimal dataframe that can be passed to px plotting functions
# while maintaining order
# assumes data_cols and category_cols are in a flat list
# these columns should be in the same order they are in when passed as
# params to plotly express
# TODO: does this have race conditions if data is ticking? probably?
# will need some way to freeze the data
# TODO: support custom ordering
def construct_min_dataframe(table: Table,
                            data_cols: list[str],
                            category_cols: list[str]
                            ) -> DataFrame:
    # TODO:
    # improve how this is done as retrieving all possible pairs
    # will likely be overkill in many cases
    # need to maintain order in which values occur by category_cols order
    # (NOT n-tuple order)
    # use a query object?

    distinct_val_cols = [get_distinct_values(table, col, None) for col in category_cols]

    # calculate all possible n-tuples of categories needed for ordering
    # TODO: if a category_col is numerical, don't multiply in some cases
    join_result = empty_table(1)
    for right in distinct_val_cols:
        cross_product = cross_product.join(right)

    filter_cols = table.select_distinct(category_cols)

    join_result = cross_product.join(filter_cols, on=category_cols)

    # add null valued columns as placeholders for plotly express
    update_result = join_result.update([f"{col} = {null}" for col, null
                                        in col_null_mapping(table, set(data_cols))])

    return dhpd.to_pandas(update_result)

def override_args(call_args : dict[any],
                  pgc: ParamGetterCollection) -> None:
    #todo: override call args, but only if necessary
    # for example, override color_discrete_sequence as needed
    pass

# TODO:
# to support multiple columns, must support listening on groups of columns
# must also track which values have already had attributes assigned to them
# for example, if red is assigned to value "Yes" and square is assigned to
# value "First", then a new pair ("Yes", "Second") comes in, you need to
# assign it the color red but the next symbol

# track original table for reference
def modify_scatter(table: Table = None,
                   orig_table: Table = None,
                   x: str | list[str] = None,
                   y: str | list[str] = None,
                   color: str = None,
                   color_discrete_sequence: list[str] = None,
                   px_draw: Callable = None,
                   pgc: ParamGetterCollection = None,
                   fig: DeephavenFigure = None) -> DeephavenFigure:
    if not pgc:
        pgc = ParamGetterCollection(color_discrete_sequence=color_discrete_sequence)

    # call locals here so the DeephavenFigure has access to the pgc
    call_args = locals()

    override_args(call_args, pgc)

    data_frame = construct_min_dataframe(table, data_cols=prepare_cols(x, y)
                                         category_cols=prepare_cols(color))

    plot = px_draw(data_frame=data_frame, x=x, y=y, color=color,
                   **pgc.get_next_group())

    if not fig:
        fig = DeephavenFigure(plot, call_args=call_args, call=modify_scatter)
    else:
        fig.add_traces(plot.data)

    fig.add_data_mapping(extract_data_mapping(data_frame, x, y))#, color))

    # need to increment params based on how many were just used to ensure
    # that this is ready for the next set of data
    # TODO: check if color is numerical
    # TODO: for above, construct a list of categorical columns (facet_row, facet_col, maybe color, definitely symbol)
    if color:
        pgc.increment(count=data_frame[color].nunique(), key="color_discrete_sequence")
    else:
        pgc.increment(get_xy_increment(x, y))

    return fig


def prepare_cols(*args: list[str] | str) -> list[str]:
    # merge the strings or list of strings passed into one list
    # note that when passing to this in preparation for get_min_dataframe,
    # the arguments should be in the same order as the plotly express call
    # TODO: ordering by plotly express key to avoid managing this?
    prepared_cols = []
    for arg in args:
        if isinstance(arg, list):
            prepared_cols += arg
        else:
            prepared_cols.append(arg)
    return prepared_cols


# todo: generalize (that's also a general statement...)
# todo: will need to pass table here too to get ref
# assuming a min data_frame here already
def extract_data_mapping(data_frame: DataFrame,
                         x: str | list[str],
                         y: str | list[str],
                         color: str
                         ) -> list[dict[any]]:
    vals = list(data_frame[color])

    return [{"table": "ref", "data_columns": {"x": x, "y": y},
             "filters": {color: val}} for val in vals]


def scatter(table: Table = None,
            x: str | list[str] = None,
            y: str | list[str] = None,
            color: str = None,
            symbol: str = None,
            size: str = None,
            color_discrete_sequence: list[str] = None
            ) -> DeephavenFigure:
    if isinstance(table, Table):
        # todo: might want to do more validation checking here
        # conditional if numeric or categorical depending on column type
        # categorical regardless of column type
        # numerical i
        # todo: make enums?
        category_map = {
            "color": "conditional",
            "symbol": "categorical",
            "size": "numerical"
        }
        # TODO: facet columns here?

        return modify_scatter(**locals(), px_draw=px.scatter)
    else:
        return DeephavenFigure(
            px.scatter(
                data_frame=table,
                x=x,
                y=y,
                color=color,
                color_discrete_sequence=color_discrete_sequence))


def line(table: Table = None,
         x: str | list[str] = None,
         y: str | list[str] = None,
         line_group: str = None,
         color: str = None,
         line_dash: str = None,
         symbol: str = None,
         color_discrete_sequence: list[str] = None
         ) -> DeephavenFigure:
    if isinstance(table, Table):
        category_map = {
            "line_group": "categorical",
            "color": "categorical",
            "line_dash": "categorical",
            "symbol": "categorical"
        }
        # todo: might want to do more validation checking here
        return modify_scatter(**locals(), px_draw=px.line)
    else:
        return DeephavenFigure(
            px.line(
                data_frame=table,
                x=x,
                y=y,
                color=color,
                color_discrete_sequence=color_discrete_sequence
            ))
