from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType
from deephaven import pandas as dhpd
import plotly.express as px
from deephaven.table import Table
from plotly.graph_objects import Figure
from .params import ParamGetterCollection
from plotly.subplots import make_subplots
import itertools
from deephaven import empty_table
import json

# todo: add types

__version__ = "0.0.1.dev0"

NAME = "deephaven.plugin.graph.DeephavenFigure"


def get_new_data(data_frame, column):
    # get all data that matches this
    return data_frame[data_frame[column].isin(data_frame[column].unique())]


class DeephavenFigure:
    def __init__(self, fig, call=None, call_args=None):
        # keep track of function that called this and it's args
        self.fig = fig
        self.call = call
        self.call_args = call_args

        self.data_mapping = []

    def add_data(self, table):
        # only need to override existing data_frame with new data
        self.call_args["table"] = table
        self.call_args["fig"] = self
        self.call(**self.call_args)
        return self

    def add_data_mapping(self, new):
        self.data_mapping += new

    def add_traces(self, data):
        self.fig.add_traces(data)

    def to_json(self):
        figure_json = f'"plotly": {self.fig.to_json()}'
        dh_json = f'"deephaven": {json.dumps(self.data_mapping)}'
        # todo: figure out f string - the curly brackets make it tricky
        dh_figure_json = '{' + figure_json + ', ' + dh_json + '}'
        return dh_figure_json


# TODO: keep keys seperate
def _export_figure(figure):
    return figure.to_json().encode()


class DeephavenFigureType(ObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object) -> bool:
        return isinstance(object, DeephavenFigure)

    def to_bytes(self, exporter: Exporter, figure: DeephavenFigure) -> bytes:
        return _export_figure(figure)


class GraphRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        callback.register(DeephavenFigureType)


def simple_scatter(data_frame, x, y, color_discrete_sequence):
    # maybe this is simpler doing directly from go.scatter?
    return px.scatter(data_frame, x, y, color_discrete_sequence=color_discrete_sequence)


# get unique items while preserving order

def get_xy_increment(x, y):
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


# map types of data cols to the matching null value
def col_null_mapping(table, cols):
    # TODO: use deephaven data types directly rather than convert to string?
    for col in table.columns:
        if col.name in cols:
            yield col.name, type_null_mapping[str(col.data_type)]


# create a minimal dataframe that can be passed to px plotting functions
# while maintaining order
# assumes data_cols and category_cols are in a flat list
# these columns should be in the same order they are in when passed as
# params to plotly express
# TODO: does this have race conditions if data is ticking? probably?
# will need some way to freeze the data
def construct_min_dataframe(table, data_cols, category_cols):
    # TODO:
    # improve how this is done as retrieving all possible pairs
    # will likely be overkill in many cases
    # need to maintain order in which values occur by category_cols order
    # (NOT n-tuple order)

    distinct_val_cols = [table.select_distinct(col) for col in category_cols]

    # calculate all possible n-tuples of categories needed for ordering
    # TODO: if a category_col is numerical, don't multiply in some cases
    cross_product = empty_table(1)
    for right in distinct_val_cols:
        cross_product = cross_product.join(right)

    filter_cols = table.select_distinct(category_cols)

    join_result = cross_product.join(filter_cols, on=category_cols)

    # add null valued columns as placeholders for plotly express
    update_result = join_result.update([f"{col} = {null}" for col, null
                                        in col_null_mapping(table, data_cols)])

    return dhpd.to_pandas(update_result)


# TODO
# first, select distinct values from each columns - select_distinct
# then, take cartesian product of resulting values above (left)
# second, take all distint n-tuples of columns (same cols as above) (right)
# left.join(right, on=same cols as aboe)
# should use filter for above
# make list of columns already in the table
# then, add x,y,z,theta,r, etc. cols as needed to finish out table
# note that numeric columns should be ignored for cartesian product for color

# done2 = done.update(formulas=["Floats = NULL_FLOAT"])

# TODO:
# to support multiple columns, must support listening on groups of columns
# must also track which values have already had attributes assigned to them
# for example, if red is assigned to value "Yes" and square is assigned to
# value "First", then a new pair ("Yes", "Second") comes in, you need to
# assign it the color red but the next symbol
def scatter_group(table=None, x=None, y=None,
                  color=None, color_discrete_sequence=None,
                  pgc=None, fig=None):
    if not pgc:
        pgc = ParamGetterCollection(color_discrete_sequence=color_discrete_sequence)

    # call locals here so the DeephavenFigure has access to the pgc
    if not fig:
        fig = DeephavenFigure(make_subplots(), call_args=locals(), call=scatter_group)

    data_frame = construct_min_dataframe(table, data_cols=prepare_cols(x, y),
                                         category_cols=prepare_cols(color))

    fig.add_data_mapping(extract_data_mapping(data_frame, x, y, color))

    fig.add_traces(px.scatter(data_frame=data_frame, x=x, y=y, color=color,
                              **pgc.get_next_group())
                   .data)

    # need to increment params based on how many were just used to ensure
    # that this is ready for the next set of data
    # TODO: check if color is numerical
    # TODO: for above, construct a list of categorical columns (facet_row, facet_col, maybe color, definitely symbol)
    if color:
        pgc.increment(count=data_frame[color].nunique(), key="color_discrete_sequence")
    else:
        pgc.increment(get_xy_increment(x, y))

    return fig


def prepare_cols(*args):
    # assuming just strings or list of strings
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


# todo: generalize (that's also a general statement...)
# todo: will need to pass table here too to get ref
# assuming a min data_frame here already
def extract_data_mapping(data_frame, x, y, color):
    vals = list(data_frame[color])

    return [{"table": "ref",
             "x": x, "y": y,
             "filters": {color: val}} for val in vals]


def scatter(table=None,
            x=None,
            y=None,
            color=None,
            color_discrete_sequence=None):
    if isinstance(table, Table):
        return scatter_group(table=table, x=x, y=y, color=color,
                             color_discrete_sequence=color_discrete_sequence)

    else:
        return DeephavenFigure(px.scatter(data_frame=table, x=x, y=y, color=color,
                                          color_discrete_sequence=color_discrete_sequence))
    pass
