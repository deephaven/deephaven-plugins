from collections.abc import Generator
from math import floor, ceil
from typing import Callable

from pandas import DataFrame
import plotly.graph_objects as go
from plotly.graph_objects import Figure

from deephaven import pandas as dhpd
from deephaven.table import Table
from deephaven import empty_table

from .deephaven_figure import DeephavenFigure
from .data_mapping import extract_data_mapping

# TODO: this is not comprehensive
TYPE_NULL_MAPPING = {
    "int": "NULL_INT",
    "double": "NULL_DOUBLE",
    "long": "NULL_LONG"
}

# these are args that hold data that needs to be overriden on the client
DATA_ARGS = {
    "x", "y", "z",
    "r", "theta",
    "a", "b", "c",
    "open", "high", "low", "close"
}

# these args map a marginal argument to what variable the data should be
# pulled from in the corresponding figure data
MARGINAL_ARGS = {
    "marginal_x": "x",
    "marginal_y": "y",
}

# these are a type of custom args (see CUSTOM_ARGS)
SEQUENCE_ARGS = {
    "xaxis_sequence",
    "yaxis_sequence"
}

# any custom args should be specified here to prevent them from being passed
# to plotly express
# Note that table is not here because it is pulled off and converted to a
# pandas data frame separately
CUSTOM_ARGS = {
    "callback",
}
CUSTOM_ARGS.update(SEQUENCE_ARGS)


def col_null_mapping(
        table: Table, cols: set[str]
) -> Generator[tuple[str, str]]:
    """
    For every column in the table, check if it is in the provided cols,
    then yield a tuple with the column name and associated null value.

    :param table: The table to pull columns from
    :param cols: The column set to check against
    :return: tuple of the form (column name, associated null value)
    """
    # TODO: use deephaven data types directly rather than convert to string?
    for col in table.columns:
        if col.name in cols:
            yield col.name, TYPE_NULL_MAPPING[str(col.data_type)]


def construct_min_dataframe(table: Table,
                            data_cols: list[str]
                            ) -> DataFrame:
    """
    Construct a pandas dataframe that can be passed to plotly express with as
    little data as possible but maintaining the same plotly figure data
    structure. Currently, this results in a dataframe with columns containing
    a single null data entry.

    :param table: The table to construct the dataframe from
    :param data_cols: A list of columns that are needed in the final dataframe
    :return: The minimal dataframe
    """
    # add null valued columns as placeholders for plotly express
    update_result = empty_table(1).update([f"{col} = {null}" for col, null
                                           in col_null_mapping(table, set(data_cols))])

    return dhpd.to_pandas(update_result)


def get_data_cols(call_args: dict[any]) -> dict[str | list[str]]:
    """
    Pull out all arguments that contain columns from the table. These need to
    be overriden on the client.

    For example, "x": ["Col1", "Col2"] would end up in the resulting dictionary
    because x needs to be overriden with data from Col1 and Col2 in the table.

    :param call_args: A dictionary containing arguments that were passed to
    the chart creation call.
    :return: A dictionary containing a key of argument name and a value of
    column or list of columns
    """
    # get columns that need to be added to dataset
    return {k: v for k, v in call_args.items() if k in DATA_ARGS}


def get_marginals(call_args: dict[any]) -> list[str]:
    """
    Pull out any arguments that create marginal plots then map these arguments
    to what arg the data comes from.

    :param call_args: A dictionary containing arguments that were passed to
    the chart creation call.
    :return: a list containing any marginals that are needed
    """
    return [v for k, v in MARGINAL_ARGS.items()
            if k in call_args and call_args[k]]


def split_custom_args(
        call_args: dict[any]
) -> tuple[dict[str, any], dict[str, any]]:
    """
    Remove any custom args that are not supported in plotly express.
    Add these custom args to a separate object, then return both arg dicts

    :param call_args: The initial call args
    :return: A tuple containing (call_args, custom_call_args), where any
    custom arguments have been removed from call_args and are now in
    custom_call_args
    """

    new_call_args = {}
    custom_call_args = {}
    # TODO: here add check for list or not in error bars
    # needs to be in call args if just a string, and in custom args if custom
    for k in call_args:
        if k in CUSTOM_ARGS:
            custom_call_args[k] = call_args[k]
        else:
            new_call_args[k] = call_args[k]

    return new_call_args, custom_call_args


def new_x_axis_obj(
        num: int,
        bottom: bool,
        domain: list[float],
        position: float
):
    """
    Return a new x-axis object, to be added to a figure layout

    :param num: The axis to create
    :param bottom: Where we are adding a new axis to the bottom or not
    :return: The new axis object
    """
    return {f"xaxis{num}": {
        "anchor": "y",
        "overlaying": "x",
        "side": "bottom" if bottom else "top",
        "domain": domain,
        "position": position
    }}


def new_y_axis_obj(
        num: int,
        left: bool,
        domain: list[float],
        position: float
):
    """
    Return a new y-axis object, to be added to a figure layout

    :param num: The axis to create
    :param left: Where we are adding a new axis to the left side or not
    :return: The new axis object
    """
    return {f"yaxis{num}": {
        "anchor": "x",
        "overlaying": "y",
        "side": "left" if left else "right",
        "domain": domain,
        "position": position
    }}


def new_axis_dict(
        is_x: bool,
        new_axis: int
):
    """
    Create a dictionary used to modify the axis for a trace.

    :param is_x: Whether we are adjusting the x-axis or not
    :param new_axis: The new axis this trace will use
    :return: A dictionary containing a key of which axis to modify and a value
    of the new axis.
    """
    var = "x" if is_x else "y"
    # don't number the first axis as it's already created without numbering
    new_axis = "" if new_axis == 1 else new_axis
    return {
        f"{var}axis": f"{var}{new_axis}"
    }


def update_trace_axes(
        fig: Figure,
        axes: list[int],
        step: int,
        is_x: bool,
):
    """
    Update the axis of plotly traces with new axis

    :param fig: The Plotly figure to modify
    :param axes: A list of axes to be applied, in order.
    :param step: How many traces to skip when applying the new axis. Useful if
    marginals have been specified, as they should be skipped
    :param is_x: Whether we are adjusting the x axes or not
    """
    trace_index = 0
    vals_index = 0
    while trace_index < len(fig.data):
        fig.update_traces(
            new_axis_dict(is_x, axes[vals_index]),
            selector=trace_index)
        trace_index += step
        vals_index = (vals_index + 1) % len(axes)


def calculate_position(
        other_domain,
        num
):
    """
    Calculate the position of this axis. Uses the domain of the other variable
    (x with y or y with x) since the position is relative to that domain.

    :param other_domain: The domain of the other dimension
    :param num: The number the axis is. Will be odd if on left/bottom, right
    if on right/top
    :return: The position the axis is at
    """
    # increment each axis 0.05 further from the initial axis
    offset = ceil(max(0, (num - 2)) / 2) / 20

    # if odd, adding to left/bottom
    # position is calculated on other domain since the other domain is
    # shrunk when an axis are added on this dimension
    if num % 2 == 1:
        position = other_domain[0] - offset
    else:
        position = other_domain[1] + offset
    return position

def update_layout_axes(
        fig: Figure,
        axes: list[int],
        is_x: bool,
        x_domain: list[float],
        y_domain: list[float]

):
    """
    Update existing axis and add any new axes to layout if needed.

    :param fig: The Plotly figure to modify
    :param axes: A list of axes to be applied, in order.
    :param is_x: Whether we are adjusting the x axes or not
    :param x_domain: The domain of all x axes
    :param y_domain: The domain of all y-axes
    """

    if is_x:
        new_axis_obj = new_x_axis_obj
        this_domain = x_domain
        other_domain = y_domain
        update = {"xaxis_domain": x_domain,
                  "xaxis_position": y_domain[0]}
    else:
        new_axis_obj = new_y_axis_obj
        this_domain = y_domain
        other_domain = x_domain
        update = {"yaxis_domain": y_domain,
                  "yaxis_position": x_domain[0]}

    # update the initial axis with domain and position as it already exists
    fig.update_layout(update)

    # skip the first axis as that's done
    for num in range(2, max(axes) + 1):
        position = calculate_position(other_domain, num)

        fig.update_layout(
            new_axis_obj(num,
                         num % 2 == 1,
                         this_domain,
                         position)
        )


def calculate_domain(
        count: int,
        is_x: bool
):
    """
    Calculate a domain for an axis, based on the count of axes in the other
    dimension and whether we're calculating the domain for an x-axis or not.

    :param count: The number of axis that exist in the other dimension
    :param is_x: If True, take into account the legend
    :return: The domain

    """
    # if calculating domain for x-axis, need to take into account legend
    offset = 0.05 if is_x and count >= 2 else 0
    start = floor((count - 1) / 2) / 20
    end = 1 - offset - (floor(count / 2) / 20)
    return [start, end]


def get_domain(axes, is_x):
    """
    Get a domain from a list of axes and whether this is the x-axis or not

    :param axes: A list of axes (from the other dimension) to calculate a
    :param is_x: Whether this is the x-axis or not
    :return: The domain
    """
    if not axes:
        return [0, 1]
    return calculate_domain(max(axes), is_x)


def handle_custom_args(
        fig: Figure,
        custom_call_args: dict[str, any],
        step: int = 1
):
    """
    Modify plotly traces with the specified custom arguments.

    :param fig: The plotly figure to modify
    :param custom_call_args: Custom arguments to process
    :param step: Optional, default 1. How many steps to skip when applying any
    changes to traces.
    """
    # todo: this might be better moved to a param getter once we can add figure data

    # the domain is calculated based on the other sequence
    # for example, a new y-axis shrinks the x-axis domain
    x_domain = get_domain(custom_call_args.get("yaxis_sequence", None), True)
    y_domain = get_domain(custom_call_args.get("xaxis_sequence", None), False)

    for arg, val in custom_call_args.items():
        if arg in SEQUENCE_ARGS:
            is_x = arg == "xaxis_sequence"

            # even if val is not specified, the domain may need to be updated
            # for this axis
            if not val:
                val = [1]

            # todo: make it so a list of log axis and ranges can be specified
            update_trace_axes(fig, val, step, is_x)

            update_layout_axes(fig, val, is_x, x_domain, y_domain)


def generate_figure(
        draw: Callable,
        call_args: dict[str, any],
) -> DeephavenFigure:
    """
    Generate a figure using a plotly express function as well as any args that
    should be used

    :param draw: The plotly express function to use to generate the figure
    :param call_args: Call arguments to use, either passing to plotly express
    or handled seperately
    :return: a Deephaven figure
    """
    table = call_args.pop("table")

    call_args, custom_call_args = split_custom_args(call_args)

    data_cols = get_data_cols(call_args)

    data_frame = construct_min_dataframe(table,
                                         data_cols=merge_cols(
                                             list(data_cols.values())
                                         ))

    pxFig = draw(data_frame=data_frame, **call_args)

    # get the marginals here as the length is needed so that axis arguments
    # are not applied to the marginals
    marginal_vars = get_marginals(call_args)

    handle_custom_args(pxFig, custom_call_args, step=len(marginal_vars) + 1)

    plot = custom_call_args['callback'](pxFig)

    dhFig = DeephavenFigure(plot, table, call_args=call_args, call=draw)

    dhFig.add_data_mapping(extract_data_mapping(data_cols, marginal_vars))

    return dhFig


def merge_cols(args: list[str | list[str]]) -> list[str]:
    """
    Merge the strings or list of strings passed into one list.

    :param args: A list contain strings and list of strings to merge
    :return: A flattened list with all columns
    """
    prepared_cols = []
    for arg in args:
        if isinstance(arg, list):
            prepared_cols += arg
        else:
            prepared_cols.append(arg)
    return prepared_cols


def draw_ohlc(
        data_frame: DataFrame,
        x: str,
        open_: str,
        high: str,
        low: str,
        close: str
):
    """
    Create a plotly OHLC chart.

    :param data_frame: The data frame to draw with
    :param x: The name of the column containing x-axis values
    :param open_: The name of the column containing open values
    :param high: The name of the column containing high values
    :param low: The name of the column containing low values
    :param close: The name of the column containing close values
    :return:
    """
    return go.Figure(data=go.Ohlc(x=data_frame[x],
                                  open=data_frame[open_],
                                  high=data_frame[high],
                                  low=data_frame[low],
                                  close=data_frame[close]))
