from itertools import cycle, count
from collections.abc import Generator
from math import floor, ceil
from typing import Callable

from pandas import DataFrame
from plotly.graph_objects import Figure

from deephaven import pandas as dhpd
from deephaven.table import Table
from deephaven import empty_table

from .DeephavenFigure import DeephavenFigure
from ..data_mapping import create_data_mapping
from ..shared import combined_generator

TYPE_NULL_MAPPING = {
    "byte": "NULL_BYTE",
    "short": "NULL_SHORT",
    "int": "NULL_INT",
    "long": "NULL_LONG",
    "float": "NULL_FLOAT",
    "double": "NULL_DOUBLE",
    "io.deephaven.time.DateTime": "`2000-01-01`"
}

# these are data args that can always be safely converted to lists, mostly for
# convenience
DATA_LIST_ARGS = {
    "open", "high", "low", "close",
    "x_finance"
}

# these are args that hold data that needs to be overriden on the client
# note that ERROR_ARGS are not here because those args don't need to be
# processed in a specific way that preserves their type
DATA_ARGS = {
    "x", "y", "z",
    "r", "theta",
    "a", "b", "c",
    "names", "values",
    "parents", "ids",
    "x_start", "x_end",
}
DATA_ARGS.update(DATA_LIST_ARGS)

# these are a type of custom arg that must always be converted to a list
AXIS_SEQUENCE_ARGS = {
    "xaxis_sequence",
    "yaxis_sequence"
}

# these need to be applied to all in wide mode
SEQUENCE_ARGS_MAP = {
    "symbol_sequence": "marker_symbol",
    # area vs bar patterns are handled in different locations
    "pattern_shape_sequence_area": "fillpattern_shape",
    "pattern_shape_sequence_bar": "marker_pattern_shape",
    "line_dash_sequence": "line_dash",
    # px can handle multiple colors in wide mode, but not if new data is added
    # need separate keys for line and scatter color as they are written to
    # different locations
    "color_discrete_sequence_line": "line_color",
    "color_discrete_sequence_marker": "marker_color",
    "increasing_color_sequence": "increasing_line_color",
    "decreasing_color_sequence": "decreasing_line_color",
    "size_sequence": "marker_size"
}

# these args should always be converted to a list and only passed to custom
# args
CUSTOM_LIST_ARGS = {
    "log_x", "range_x",
    "log_y", "range_y",
    "xaxis_titles", "yaxis_titles",
    "x_diff"
}
CUSTOM_LIST_ARGS.update(AXIS_SEQUENCE_ARGS)

# any custom args should be specified here to prevent them from being passed
# to plotly express
# Note that table is not here because it is pulled off and converted to a
# pandas data frame separately
CUSTOM_ARGS = {
    "bargap",
    "marginal",
    "marginal_x",
    "marginal_y"
    #"rangemode"
}

# these are columns that are "attached" sequentially to the traces
ATTACHED_UPDATE_MAP = {
    "error_x": "error_x_array",
    "error_x_minus": "error_x_arrayminus",
    "error_y": "error_y_array",
    "error_y_minus": "error_y_arrayminus",
    "error_z": "error_z_array",
    "error_z_minus": "error_z_arrayminus",
    "size": "marker_size"
}


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
    # TODO: catch "unsupported" types
    for col in table.columns:
        if col.name in cols:
            type_ = col.data_type.j_name
            if type_ in TYPE_NULL_MAPPING:
                yield col.name, TYPE_NULL_MAPPING[type_]
            else:
                yield col.name, "`None`"


def construct_min_dataframe(
        table: Table,
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
    update = [f"{col} = {null}" for col, null
              in col_null_mapping(table, set(data_cols))]

    update_result = empty_table(1).update(update)

    return dhpd.to_pandas(update_result)


def get_data_cols(
        call_args: dict[any]
) -> dict[str | list[str]]:
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
    return {k: v for k, v in call_args.items() if k in DATA_ARGS and v}


def split_args(
        call_args: dict[str, any]
) -> tuple[dict[str, any], dict[str, any]]:
    """
    Remove any custom args that are not supported in plotly express.
    Add these custom args to a separate object, then return both arg dicts

    :param call_args: The initial call args
    :return: A tuple containing (call_args, custom_call_args, data_map_args),
    where any custom arguments have been removed from call_args and are
    now in custom_call_args and any arguments needed for the data mapping are
    in data_map_args
    """

    # and use the existing ones as custom
    new_call_args = {}
    custom_call_args = {}

    for arg, val in call_args.items():
        if val is not None:
            if arg in CUSTOM_ARGS:
                custom_call_args[arg] = val
            elif arg.endswith('_scene'):
                # this scene check needs to be before the range check to
                # ensure scene args don't get converted to a list
                new_call_args[arg.removesuffix('_scene')] = val
            elif arg.startswith("range_"):
                # range is a special case as ranges are a list
                # None can be specified for no range within a list of ranges
                custom_call_args[arg] = val if \
                    (isinstance(val[0], list) or val[0] is None) else [val]
            elif any([arg in mappable for mappable in
                      [ATTACHED_UPDATE_MAP, SEQUENCE_ARGS_MAP, CUSTOM_LIST_ARGS]]):
                # some of these args should always be lists, so the check is
                # redundant, but useful if a single valid value is passed
                custom_call_args[arg] = val if isinstance(val, list) else [val]
            elif arg in DATA_LIST_ARGS:
                new_call_args[arg] = val if isinstance(val, list) else [val]
            else:
                new_call_args[arg] = val

    return new_call_args, custom_call_args


def base_x_axis_generator(
        update_titles: bool = False
) -> Generator[dict]:
    """
    Generates a dict to update anchor, overlaying, side, and a default title
    for the x axis

    :param update_titles: If this is true, update the titles
    :returns: Generated dict
    """
    bottom = True
    for num in count(start=1):
        update = {
            "anchor": "free" if num >= 2 else "y",
            "overlaying": "x" if num >= 2 else None,
            "side": "bottom" if bottom else "top"
        }
        # only update the title if there is an axis arg
        if update_titles:
            update["title"] = None #{"text": f"X Values {num}"}
        yield update
        bottom = not bottom


def base_y_axis_generator(
    update_titles: bool = False
) -> Generator[dict]:
    """
    Generates a dict to update anchor, overlaying, side, and a default title
    for the y axis

    :param update_titles: If this is true, update the titles
    :returns: Generated dict
    """
    left = True
    for num in count(start=1):
        update = {
            "anchor": "free" if num >= 2 else "x",
            "overlaying": "y" if num >= 2 else None,
            "side": "left" if left else "right"
        }
        # only update the title if there is an axis arg
        if update_titles:
            update["title"] = None #{"text": f"Y Values {num}"}
        yield update
        left = not left


def key_val_generator(  # this can handle log, range, title, domain (once calculated)
        key: str,
        vals: list[any]
) -> Generator[str, any]:
    """
    A simple generator that loops over the provided vals and returns key, value
    for updates

    :param key: The key to update
    :param vals: A list to return as a value pair
    :returns: Generates a tuple of (key, specific value in vals)
    """
    for val in cycle(vals):
        yield key, val


def new_axis_generator(
        is_x: bool,
        new_axes: list[int],
) -> Generator[tuple[str, str]]:
    """
    Create a dictionary used to modify the axis for a trace.

    :param is_x: Whether we are adjusting the x-axis or not
    :param new_axes: The new axis this trace will use
    :return: A dictionary containing a key of which axis to modify and a value
    of the new axis.
    """
    var = "x" if is_x else "y"

    for new_axis in cycle(new_axes):
        # don't number the first axis as it's already created without numbering
        new_axis = "" if new_axis == 1 else new_axis
        yield f"{var}axis", f"{var}{new_axis}"


def attached_generator(
        arg: str,
        attached_cols: list[str]
) -> Generator[tuple[str, list]]:
    """
    Generate key, value pairs for error bar updates. If an error column is
    None, then there is no error bar drawn for the corresponding trace.

    :param arg: The error bar to map to an update
    :param attached_cols: A list of error columns to determine what the value
    should be
    :returns: Generates a list of key, value pairs of (error update, value)
    """
    for error_col in cycle(attached_cols):
        yield ATTACHED_UPDATE_MAP[arg], [] if error_col else None


def update_traces(
        fig: Figure,
        generator: Generator[dict],
        step: int = 1,
) -> None:
    """
    Update the plotly traces with a generator

    :param fig: The Plotly figure to modify
    :param generator: A generator that yields updates to apply
    :param step: How many traces to skip when applying the new changes. Useful
    if marginals have been specified, as they should be skipped
    """
    for trace_index, update in zip(range(0, len(fig.data), step), generator):
        fig.update_traces(
            update,
            selector=trace_index)


def position_generator(
        other_domain: list[float]
) -> Generator[str, float]:
    """
    Calculate the position of this axis. Uses the domain of the other variable
    (x with y or y with x) since the position is relative to that domain.

    :param other_domain: The domain of the other dimension
    :return: Generates the position the axis is at
    """
    for num in count(start=1):
        # increment each axis 0.05 further from the initial axis
        offset = ceil(max(0, (num - 2)) / 2) / 10

        # if odd, adding to left/bottom
        # position is calculated on other domain since the other domain is
        # shrunk when an axis are added on this dimension
        if num % 2 == 1:
            position = other_domain[0] - offset
        else:
            position = other_domain[1] + offset

        yield "position", position


def calculate_domain(
        other_total: int,
        is_x: bool
) -> list[float, float]:
    """
    Calculate a domain for an axis, based on the count of axes in the other
    dimension and whether we're calculating the domain for an x-axis or not.

    :param other_total: The number of axis that exist in the other dimension
    :param is_x: If True, take into account the legend
    :return: The domain
    """
    # if calculating domain for x-axis, need to take into account legend
    offset = 0.01 if is_x and other_total >= 2 else 0
    start = floor((other_total - 1) / 2) / 10
    end = 1 - offset - (floor(other_total / 2) / 10)
    return [start, end]


def get_domain(
        axes: list[int],
        is_x: bool
) -> list[float, float]:
    """
    Get a domain from a list of axes and whether this is the x-axis or not

    :param axes: A list of axes (from the other dimension) to calculate a
    :param is_x: Whether this is the x-axis or not
    :return: The domain
    """
    if not axes:
        return [0, 1]
    return calculate_domain(max(axes), is_x)


def sequence_generator(
        arg: str,
        ls: list[str]
) -> Generator[tuple[str, str]]:
    """
    Loops over the provided list to update the argument provided

    :param arg: The arg to update
    :param ls: The list of values to use
    """
    for val in cycle(ls):
        yield SEQUENCE_ARGS_MAP[arg], val


def log_generator(
        is_log: list[bool]
) -> Generator[dict | tuple[str, str]]:
    """
    Given a boolean list, cycle through it. If the list value is True, convert
    that axis to a log. Otherwise, do nothing.

    :param is_log: The list of booleans to loop over
    :returns: Generates either a tuple ("type", "log") or an empty dictionary
    """
    for val in cycle(is_log):
        if val:
            yield "type", "log"
        else:
            yield {}


def title_generator(
        titles: list[str]
) -> Generator[str]:
    """
    Generate changes to a layout's titles. This will not loop, so if the length
    of the title list is shorter than the number of axes the axes will keep the
    default title.

    :param titles: The titles to use
    :returns: Generates the titles
    """
    for title in titles:
        yield {"title": {"text": title}}

    while True:
        yield {}


def update_layout_axis(
        fig: Figure,
        axis: str,
        generator: Generator[dict],
        last: int
) -> None:
    """
    Loop through the generator to update all axis of the specified type.

    :param fig: The figure to update
    :param axis: The axis (yaxis or xaxis) to update
    :param generator: The generator to use for updates
    :param last: The last index to update
    """
    for num in range(1, last + 1):
        num = "" if num == 1 else num
        update = {f"{axis}{num}": next(generator)}
        fig.update_layout(update)


def handle_custom_args(
        fig: Figure,
        custom_call_args: dict[str, any],
        step: int = 1,
        trace_generator: Generator[dict[str, any]] = None
) -> Generator[dict[str, any]]:
    """
    Modify plotly traces with the specified custom arguments.

    :param fig: The plotly figure to modify
    :param custom_call_args: Custom arguments to process
    :param step: Optional, default 1. How many steps to skip when applying any
    changes to traces.
    :param trace_generator: Optional, if provided then only use this trace
    generator and return (as layout should already be created)
    :returns: A trace generator, to be used if adding more traces
    """
    # if there is a specified trace generator, use that instead since it
    # accurately reflects with color, pattern, etc. is next
    # don't need to adjust layout as that will not change
    if trace_generator:
        update_traces(fig, trace_generator, step)
        return trace_generator

    # the domain is calculated based on the other sequence
    # for example, a new y-axis shrinks the x-axis domain
    x_domain = get_domain(custom_call_args.get("yaxis_sequence", None), True)
    y_domain = get_domain(custom_call_args.get("xaxis_sequence", None), False)

    # gather up generators to update traces and axes all at once
    trace_generators = []

    # Only update titles if dealing with a plot that has an axis sequence
    # specified as this should otherwise preserve plotly express behavior
    x_axis_generators = [base_x_axis_generator(
        "xaxis_sequence" in custom_call_args
        and custom_call_args["xaxis_sequence"]
    )]
    y_axis_generators = [base_y_axis_generator(
        "yaxis_sequence" in custom_call_args
        and custom_call_args["yaxis_sequence"]
    )]

    # set last axis to zero so no changes are made unless an axis sequence is specified
    # this ensures nothing will be done if dealing with a chart type that doesn't support axis
    last_x_axis = 0
    last_y_axis = 0

    for arg, val in custom_call_args.items():
        if val is not None:
            if arg in AXIS_SEQUENCE_ARGS:
                is_x = arg == "xaxis_sequence"

                trace_generators.append(new_axis_generator(is_x, val))

                if is_x:
                    x_axis_generators.append(position_generator(y_domain))
                    last_x_axis = max(val)
                    # need to make sure the other domain is updated,
                    # so set max to at least 1
                    last_y_axis = max(1, last_y_axis)
                    y_axis_generators.append(key_val_generator("domain", [y_domain]))
                else:
                    y_axis_generators.append(position_generator(x_domain))
                    last_y_axis = max(val)
                    last_x_axis = max(1, last_x_axis)
                    x_axis_generators.append(key_val_generator("domain", [x_domain]))

            elif arg in ATTACHED_UPDATE_MAP:
                trace_generators.append(attached_generator(arg, val))

            elif arg in SEQUENCE_ARGS_MAP:
                trace_generators.append(sequence_generator(arg, val))

            elif arg == "log_x":
                last_x_axis = max(1, last_x_axis)
                x_axis_generators.append(log_generator(val))

            elif arg == "log_y":
                last_y_axis = max(1, last_y_axis)
                y_axis_generators.append(log_generator(val))

            elif arg == "range_x":
                last_x_axis = max(1, last_x_axis)
                x_axis_generators.append(key_val_generator("range", val))

            elif arg == "range_y":
                last_y_axis = max(1, last_y_axis)
                y_axis_generators.append(key_val_generator("range", val))

            elif arg == "xaxis_title_sequence":
                x_axis_generators.append(title_generator(val))

            elif arg == "yaxis_title_sequence":
                y_axis_generators.append(title_generator(val))

            elif arg == "bargap" or arg == "rangemode":
                fig.update_layout({arg: val})
                # x_axis_generators.append(key_val_generator("bargap", [val]))
                # y_axis_generators.append(key_val_generator("bargap", [val]))

    trace_generator = combined_generator(trace_generators)

    update_traces(fig, trace_generator, step)

    update_layout_axis(fig,
                       "xaxis",
                       combined_generator(x_axis_generators),
                       last_x_axis)
    update_layout_axis(fig,
                       "yaxis",
                       combined_generator(y_axis_generators),
                       last_y_axis)

    return trace_generator


def generate_figure(
        draw: Callable,
        call_args: dict[str, any],
        start_index: int = 0,
        trace_generator: Generator[dict] = None,
) -> DeephavenFigure:
    """
    Generate a figure using a plotly express function as well as any args that
    should be used

    :param draw: The plotly express function to use to generate the figure
    :param call_args: Call arguments to use, either passing to plotly express
    or handled separately
    :param start_index: Optional argument. Only needed if there are existing
    traces that this figure is being added to. In that case, the data mapping
    needs to start at the end of the existing traces.
    :param trace_generator: Optional, if provided then only use this trace
    generator and return (as layout should already be created)
    :return: a Deephaven figure
    """
    table = call_args.pop("table")

    filtered_call_args, custom_call_args = split_args(call_args)

    data_cols = get_data_cols(filtered_call_args)

    data_frame = construct_min_dataframe(table,
                                         data_cols=merge_cols(
                                             list(data_cols.values())
                                         ))

    px_fig = draw(data_frame=data_frame, **filtered_call_args)

    trace_generator = handle_custom_args(px_fig,
                                         custom_call_args,
                                         step=1,
                                         trace_generator=trace_generator)

    data_mapping = create_data_mapping(
        data_cols,
        custom_call_args,
        table,
        start_index
    )

    dh_fig = DeephavenFigure(
        px_fig,
        call_args=call_args,
        call=draw,
        data_mappings=[data_mapping],
        trace_generator=trace_generator
    )

    return dh_fig


def merge_cols(
        args: list[str | list[str]]
) -> list[str]:
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
