from __future__ import annotations

from itertools import cycle, count
from collections.abc import Generator
from math import floor, ceil
from typing import Any

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
    "java.time.Instant": "`2000-01-01`",
    "java.time.ZonedDateTime": "`2000-01-01`",
    "pandas.Timestamp": "`2000-01-01`",
    "numpy.datetime64": "`2000-01-01`",
    "python.datetime": "`2000-01-01`",
}

# these are data args that can always be safely converted to lists, mostly for
# convenience
DATA_LIST_ARGS = {"open", "high", "low", "close", "x_finance"}

# these are args that hold data that needs to be overriden on the client
# note that ERROR_ARGS are not here because those args don't need to be
# processed in a specific way that preserves their type
DATA_ARGS = {
    "x",
    "y",
    "z",
    "r",
    "theta",
    "a",
    "b",
    "c",
    "names",
    "values",
    "parents",
    "ids",
    "x_start",
    "x_end",
    # color itself is only a data arg when there is a color axis
    # in other cases, the color would already be calculated so this argument
    # would not be set
    "color",
    "lat",
    "lon",
    "locations",
}
DATA_ARGS.update(DATA_LIST_ARGS)

# these are a type of custom arg that must always be converted to a list
AXIS_SEQUENCE_ARGS = {"xaxis_sequence", "yaxis_sequence"}

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
    "color_discrete_sequence_markers": "marker_colors",
    "pattern_shape_sequence_markers": "marker_pattern_shape",
    "width_sequence": "line_width",
    "increasing_color_sequence": "increasing_line_color",
    "decreasing_color_sequence": "decreasing_line_color",
    "size_sequence": "marker_size",
    "mode": "mode",
}

# these args should always be converted to a list and only passed to custom
# args
CUSTOM_LIST_ARGS = {
    "log_x",
    "range_x",
    "log_y",
    "range_y",
    "xaxis_titles",
    "yaxis_titles",
    "x_diff",
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
    "marginal_y",
    "current_col",
    "current_var",
    "labels",
    "hist_val_name",
    "pivot_vars",
    "current_partition",
    "colors",
    "unsafe_update_figure",
}

# these are columns that are "attached" sequentially to the traces
ATTACHED_UPDATE_MAP = {
    "error_x": "error_x_array",
    "error_x_minus": "error_x_arrayminus",
    "error_y": "error_y_array",
    "error_y_minus": "error_y_arrayminus",
    "error_z": "error_z_array",
    "error_z_minus": "error_z_arrayminus",
    "size": "marker_size",
    "text": "text",
    "hover_name": "hovertext",
    "attached_pattern_shape_area": "fillpattern_shape",
    "attached_pattern_shape_bar": "marker_pattern_shape",
    "attached_color_line": "line_color",
    "attached_color_marker": "marker_color",
    "attached_color_markers": "marker_colors",
    "attached_pattern_shape_markers": "marker_pattern_shape",
}


def col_null_mapping(table: Table, cols: set[str]) -> Generator[tuple[str, str]]:
    """For every column in the table, check if it is in the provided cols,
    then yield a tuple with the column name and associated null value.

    Args:
      table: Table: The table to pull columns from
      cols: set[str]: The column set to check against

    Yields:
      tuple[str, str]: tuple of the form (column name, associated null value)
    """
    for col in table.columns:
        if col.name in cols:
            type_ = col.data_type.j_name
            if type_ in TYPE_NULL_MAPPING:
                yield col.name, TYPE_NULL_MAPPING[type_]
            else:
                yield col.name, "`None`"


def construct_min_dataframe(table: Table, data_cols: list[str]) -> DataFrame:
    """Construct a pandas dataframe that can be passed to plotly express with as
    little data as possible but maintaining the same plotly figure data
    structure. Currently, this results in a dataframe with columns containing
    a single null data entry.

    Args:
      table: Table: The table to construct the dataframe from
      data_cols: list[str]: A list of columns that are needed in the final dataframe

    Returns:
      DataFrame: The minimal dataframe

    """

    # add null valued columns as placeholders for plotly express
    update = [
        f"{col} = {null}" for col, null in col_null_mapping(table, set(data_cols))
    ]

    update_result = empty_table(1).update(update)

    return dhpd.to_pandas(update_result, dtype_backend=None, conv_null=False)


def get_data_cols(call_args: dict[Any]) -> dict[str | list[str]]:
    """Pull out all arguments that contain columns from the table. These need to
    be overriden on the client.

    Args:
      call_args: dict[Any]: A dictionary containing arguments that were passed
        to the chart creation call.

    Returns:
      dict[str | list[str]]: A dictionary containing a key of argument name and
        a value of column or list of columns

    Examples:
      For example, "x": ["Col1", "Col2"] would end up in the resulting dictionary
        because x needs to be overriden with data from Col1 and Col2 in the table.

    """
    # get columns that need to be added to dataset
    return {k: v for k, v in call_args.items() if k in DATA_ARGS and v}


def split_args(call_args: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Remove any custom args that are not supported in plotly express.
    Add these custom args to a separate object, then return both arg dicts

    Args:
      call_args: dict[str, Any]: The initial call args

    Returns:
      tuple[dict[str, Any], dict[str, Any] A tuple containing
        (call_args, custom_call_args, data_map_args), where any custom
        arguments have been removed from call_args and are now in
        custom_call_args and any arguments needed for the data mapping are in
        data_map_args

    """

    # and use the existing ones as custom
    new_call_args = {}
    custom_call_args = {}

    for arg, val in call_args.items():
        if val is not None:
            if arg in CUSTOM_ARGS:
                custom_call_args[arg] = val
                if arg == "labels":
                    # plotly express still handles most labeling
                    new_call_args[arg] = val
                elif arg == "colors":
                    # plotly needs this to create the color axis
                    new_call_args["color"] = val
            elif arg.endswith("_scene"):
                # this scene check needs to be before the range check to
                # ensure scene args don't get converted to a list
                # these are equivalent for removing _scene but removesuffix
                # was introduced in 3.9
                # new_call_args[arg.removesuffix('_scene')] = val
                new_call_args[arg[:-6]] = val
            elif arg.startswith("range_") and arg != "range_color":
                # range is a special case as ranges are a list
                # None can be specified for no range within a list of ranges
                custom_call_args[arg] = (
                    val if (isinstance(val[0], list) or val[0] is None) else [val]
                )
            elif any(
                [
                    arg in mappable
                    for mappable in [ATTACHED_UPDATE_MAP, CUSTOM_LIST_ARGS]
                ]
            ):
                # some of these args should always be lists, so the check is
                # redundant, but useful if a single valid value is passed
                custom_call_args[arg] = val if isinstance(val, list) else [val]
            elif arg in SEQUENCE_ARGS_MAP:
                custom_call_args[arg] = val
            elif arg in DATA_LIST_ARGS:
                new_call_args[arg] = val if isinstance(val, list) else [val]
            else:
                new_call_args[arg] = val

    return new_call_args, custom_call_args


def base_x_axis_generator(update_titles: bool = False) -> Generator[dict]:
    """Generates a dict to update anchor, overlaying, side, and a default title
    for the x-axis

    Args:
      update_titles: bool:  (Default value = False) If this is true, update the
        titles

    Yields:
      dict: Generated dict

    """
    bottom = True
    for num in count(start=1):
        update = {
            "anchor": "free" if num >= 2 else "y",
            "overlaying": "x" if num >= 2 else None,
            "side": "bottom" if bottom else "top",
        }
        # only update the title if there is an axis arg
        if update_titles:
            update["title"] = None  # {"text": f"X Values {num}"}
        yield update
        bottom = not bottom


def base_y_axis_generator(update_titles: bool = False) -> Generator[dict]:
    """Generates a dict to update anchor, overlaying, side, and a default title
    for the y-axis

    Args:
      update_titles: bool:  (Default value = False) If this is true, update the
        titles

    Yields:
      dict: Generated dict

    """
    left = True
    for num in count(start=1):
        update = {
            "anchor": "free" if num >= 2 else "x",
            "overlaying": "y" if num >= 2 else None,
            "side": "left" if left else "right",
        }
        # only update the title if there is an axis arg
        if update_titles:
            update["title"] = None  # {"text": f"Y Values {num}"}
        yield update
        left = not left


def key_val_generator(key: str, vals: list[Any]) -> Generator[tuple[str, Any]]:
    """A simple generator that loops over the provided vals and returns key, value
    for updates

    This can handle log, range, title, domain (once calculated)

    Args:
      key: str: The key to update
      vals: list[Any]: A list to return as a value pair

    Yields:
      tuple[str, Any]: A tuple of (key, specific value in vals)

    """
    for val in cycle(vals):
        yield key, val


def new_axis_generator(
    is_x: bool,
    new_axes: list[int],
) -> Generator[tuple[str, str]]:
    """Create a dictionary used to modify the axis for a trace.

    Args:
      is_x: bool: Whether x-axis is being adjusted or not
      new_axes: list[int]: The new axis this trace will use

    Yields:
      tuple[str, str]: A dictionary containing a key of which axis to modify
        and a value of the new axis.

    """
    var = "x" if is_x else "y"

    for new_axis in cycle(new_axes):
        # don't number the first axis as it's already created without numbering
        new_axis = "" if new_axis == 1 else new_axis
        yield f"{var}axis", f"{var}{new_axis}"


def attached_generator(
    arg: str, attached_cols: list[str]
) -> Generator[tuple[str, list]]:
    """Generate key, value pairs for error bar updates. If an error column is
    None, then there is no error bar drawn for the corresponding trace.

    Args:
      arg: str: The error bar to map to an update
      attached_cols: list[str]: A list of error columns to determine what the
        value should be

    Yields:
      tuple[str, list]: Generates a list of key, value pairs of
        (error update, value)

    """
    for error_col in cycle(attached_cols):
        yield ATTACHED_UPDATE_MAP[arg], [] if error_col else None


def update_traces(
    fig: Figure,
    generator: Generator[dict],
    step: int = 1,
) -> None:
    """Update the plotly traces with a generator

    Args:
      fig: Figure: The Plotly figure to modify
      generator: Generator[dict]: A generator that yields updates to apply
      step: int:  (Default value = 1) How many traces to skip when applying the
        new changes. Useful if marginals have been specified, as they should be
        skipped

    """
    for trace_index, update in zip(range(0, len(fig.data), step), generator):
        fig.update_traces(update, selector=trace_index)


def position_generator(other_domain: list[float]) -> Generator[tuple[str, float]]:
    """Calculate the position of this axis. Uses the domain of the other variable
    (x with y or y with x) since the position is relative to that domain.

    Args:
      other_domain: list[float]: The domain of the other dimension

    Yields:
      tuple[str, float]: A tuple of ("position", position)

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


def calculate_domain(other_total: int, is_x: bool) -> list[float, float]:
    """Calculate a domain for an axis, based on the count of axes in the other
    dimension and whether we're calculating the domain for an x-axis or not.

    Args:
      other_total: int: The number of axis that exist in the other dimension
      is_x: bool: If True, take into account the legend

    Returns:
      list[float, float]: The domain

    """
    # if calculating domain for x-axis, need to take into account legend
    offset = 0.01 if is_x and other_total >= 2 else 0
    start = floor((other_total - 1) / 2) / 10
    end = 1 - offset - (floor(other_total / 2) / 10)
    return [start, end]


def get_domain(axes: list[int], is_x: bool) -> list[float, float]:
    """Get a domain from a list of axes and whether this is the x-axis or not

    Args:
      axes: list[int]: A list of axes (from the other dimension) to calculate a
      is_x: bool: Whether this is the x-axis or not

    Returns:
      list[float, float]: The domain

    """
    if not axes:
        return [0, 1]
    return calculate_domain(max(axes), is_x)


def sequence_generator(
    arg: str,
    ls: str | list[str],
    map_: dict[str | tuple[str], str] = None,
    keys: list[tuple[str]] = None,
) -> Generator[tuple[str, str]]:
    """Loops over the provided list to update the argument provided

    Args:
      arg: str: The arg to update
      ls: list[str]: The list of values to use
      map_: dict[str | tuple[str], str]: The map to use to correspond specific keys with specific values
      keys: list[tuple[str]]: The tuple keys to keep track of what value is assigned to what key

    Yields:
      tuple[str, str]: A tuple of (the name from SEQUENCE_ARGS_MAP, the value)
    """

    ls = ls if isinstance(ls, list) else [ls]

    if arg.endswith("markers"):
        # if dealing with markers like pie just yield the whole list
        yield SEQUENCE_ARGS_MAP[arg], ls

    if keys:
        cycled = cycle(ls)
        found = {}
        for val in keys:
            if val not in found:
                new_val = next(cycled)
                if map_ and val in map_:
                    new_val = map_[val]
                elif map_ and len(val) == 1 and val[0] in map_:
                    new_val = map_[val[0]]
                found[val] = new_val
            yield SEQUENCE_ARGS_MAP[arg], found[val]

    # this should never be hit if keys are specified
    for val in cycle(ls):
        yield SEQUENCE_ARGS_MAP[arg], val


def log_generator(is_log: list[bool]) -> Generator[dict | tuple[str, str]]:
    """Given a boolean list, cycle through it. If the list value is True, convert
    that axis to a log. Otherwise, do nothing.

    Args:
      is_log: list[bool]: The list of booleans to loop over

    Yields:
      dict | tuple[str, str]: A tuple ("type", "log") or an empty dictionary

    """
    for val in cycle(is_log):
        if val:
            yield "type", "log"
        else:
            yield {}


def title_generator(titles: list[str]) -> Generator[str]:
    """Generate changes to a layout's titles. This will not loop, so if the length
    of the title list is shorter than the number of axes the axes will keep the
    default title.

    Args:
      titles: list[str]: The titles to use

    Yields:
      str: A dictionary, containing titles until they are exhausted, than an
        empty dictionary

    """
    for title in titles:
        yield {"title": {"text": title}}

    while True:
        yield {}


def update_layout_axis(
    fig: Figure, axis: str, generator: Generator[dict], last: int
) -> None:
    """Loop through the generator to update all axis of the specified type.

    Args:
      fig: Figure: The figure to update
      axis: str: The axis (yaxis or xaxis) to update
      generator: Generator[dict]: The generator to use for updates
      last: int: The last index to update
    """
    for num in range(1, last + 1):
        num = "" if num == 1 else num
        update = {f"{axis}{num}": next(generator)}
        fig.update_layout(update)


def handle_custom_args(
    fig: Figure,
    custom_call_args: dict[str, Any],
    step: int = 1,
    trace_generator: Generator[dict[str, Any]] = None,
    extra_generators: list[Generator[Any]] = None,
) -> Generator[dict[str, Any]]:
    """Modify plotly traces with the specified custom arguments.

    Args:
      fig: Figure: The plotly figure to modify
      custom_call_args: dict[str, Any]: Custom arguments to process
      step: int: (Default value = 1) How many steps to skip when applying any
        changes to traces.
      trace_generator: Generator[dict[str, Any]]: (Default value = None)
        Optional, if provided then only use this trace generator and return
        (as layout should already be created)
      extra_generators: list[Generator[Any]]: (Default value = None) Extra
        generators to always update the trace with.

    Yields:
      dict[str, Any]: Trace generator, to be used if adding more traces

    """
    if extra_generators:
        for generator in extra_generators:
            update_traces(fig, generator, step)

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
    x_axis_generators = [
        base_x_axis_generator(
            "xaxis_sequence" in custom_call_args and custom_call_args["xaxis_sequence"]
        )
    ]
    y_axis_generators = [
        base_y_axis_generator(
            "yaxis_sequence" in custom_call_args and custom_call_args["yaxis_sequence"]
        )
    ]

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
                if not isinstance(val, dict):
                    val = {"ls": val}
                val["arg"] = arg
                trace_generators.append(sequence_generator(**val))

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

            elif arg == "xaxis_titles":
                x_axis_generators.append(title_generator(val))

            elif arg == "yaxis_titles":
                y_axis_generators.append(title_generator(val))

            elif arg == "bargap" or arg == "rangemode":
                fig.update_layout({arg: val})
                # x_axis_generators.append(key_val_generator("bargap", [val]))
                # y_axis_generators.append(key_val_generator("bargap", [val]))

    trace_generator = combined_generator(trace_generators)

    update_traces(fig, trace_generator, step)

    update_layout_axis(fig, "xaxis", combined_generator(x_axis_generators), last_x_axis)
    update_layout_axis(fig, "yaxis", combined_generator(y_axis_generators), last_y_axis)

    return trace_generator


def get_list_var_info(data_cols: dict[str, str | list[str]]) -> set[str]:
    """Extract the variable that is a list.

    Args:
      data_cols: dict[str, str | list[str]]: The dictionary of data columns.
        Note this is only the main data columns and excludes "attached" columns

    Returns:
      tuple[list[str], str | None, set[str]]: A tuple of
        (list variable values, list variable name, set of types)

    """
    types = set()
    # gantt chart data mappings can be used for hover text with the exception
    # of x, hence the need for a flag
    types.add("gantt" if data_cols.get("x_start", False) else None)
    # finance chart data vars are always converted to lists (see
    # DATA_LIST_ARGS) but there is currently no additional hover text generated
    # for them
    types.add("finance" if data_cols.get("x_finance", False) else None)

    """for var, cols in data_cols.items():
        # there should only be at most one data list (with the filtered
        # exception of finance charts) so the first one encountered is the var
        if isinstance(cols, list):
            # the col name here might be overriden during data_mapping
            return cols, var, types"""

    return types


def relabel_columns(
    labels: dict[str, str],
    hover_mapping: list[dict[str, str]],
    types: set[str],
    current_partition: dict[str, str],
) -> None:
    """Relabel any columns found in data

    Args:
      labels: dict[str, str]: The dictionary of labels to use
      hover_mapping: list[dict[str, str]]: The mapping of variables to columns
      types: set[str]: Any types of this chart that require special processing
      current_partition: dict[str, str]: The columns that this figure is partitioned by

    Returns:
      str: The current column renamed
    """
    if labels:
        for current_mapping in hover_mapping:
            for var, col in current_mapping.items():
                if "gantt" in types:
                    current_mapping.pop("x")
                current_mapping[var] = labels.get(col, col)

        for i, (col, _) in enumerate(list(current_partition.items())):
            new_col = labels.get(col, col)
            current_partition[new_col] = current_partition.pop(col)


def get_hover_body(
    current_mapping: dict[str, str],
    current_partition: dict[str, str] = None,
) -> str:
    """Get the hovertext

    Args:
      current_mapping: dict[str, str]: The mapping of variables to columns
      current_partition: dict[str, str]: The columns that this figure is partitioned by

    Returns:
      str: The hovertext

    """
    hover_name = ""

    if "hovertext" in current_mapping:
        hover_name += "<b>%{hovertext}</b><br><br>"
        current_mapping.pop("hovertext")

    hover_body = []
    if current_partition:
        for col, val in current_partition.items():
            hover_body.append(f"{col}={val}")
    for var, data_col in current_mapping.items():
        # error bars are automatically displayed with the associated variable
        # attached values do not show up
        # attached style args should not show up
        if var.startswith("error") or "color" in var or "pattern" in var:
            continue
        # "plural" vars ending with s need the s removed in the hover mapping
        var = var[:-1] if var.endswith("s") else var
        # slashes are replaced with dots to lookup variables
        var = var.replace("/", ".")
        hover_body.append(f"{data_col}=%{{{var}}}")

    return hover_name + "<br>".join(hover_body) + "<extra></extra>"


def hover_text_generator(
    hover_mapping: list[dict[str, str]],
    # hover_data - todo, dependent on arrays supported in data mappings
    types: set[str] = None,
    current_partition: dict[str, str] = None,
) -> Generator[dict[str, Any]]:
    """Generate hovertext

    Args:
      hover_mapping: list[dict[str, str]]: The mapping of variables to columns
      types: set[str]:  (Default value = None) Any types of this chart that
        require special processing
      current_partition: dict[str, str]: The columns that this figure is partitioned by


    Yields:
      dict[str, Any]: A dictionary update

    """
    if "finance" in types:
        # finance has no hover text currently (besides the default)
        while True:
            yield {}

    if current_partition:
        name = ", ".join(map(str, current_partition.values()))

        yield {
            "name": name,
            "legendgroup": name,
            "hovertemplate": get_hover_body(
                hover_mapping[0],
                current_partition,
            ),
            "showlegend": True,
        }

    while True:
        yield {
            "hovertemplate": get_hover_body(hover_mapping[0]),
        }


def compute_labels(
    hover_mapping: list[dict[str, str]],
    hist_val_name: str,
    # hover_data - todo, dependent on arrays supported in data mappings
    types: set[str],
    labels: dict[str, str],
    current_partition: dict[str, str],
) -> None:
    """Compute the labels for this chart, relabling the axis and hovertext.
    Mostly, labels are taken directly from the labels with the exception of
    the histogram.

    Args:
      hover_mapping: list[dict[str, str]]: The mapping of variables to columns
      hist_val_name: str: The histogram name for the value axis, generally
        histfunc
      types: set[str]: Any types of this chart that require special processing
      labels: A dictionary of old column name to new column name mappings
      current_partition: dict[str, str]: The columns that this figure is partitioned by

    Returns:
        str: the renamed current_col

    """

    calculate_hist_labels(hist_val_name, hover_mapping[0])

    relabel_columns(labels, hover_mapping, types, current_partition)


def calculate_hist_labels(hist_val_name: str, current_mapping: dict[str, str]) -> None:
    """Calculate the histogram labels

    Args:
      hist_val_name: str: The histogram name for the value axis, generally
        histfunc
      current_mapping: dict[str, str]: The mapping of variables to columns

    """
    if hist_val_name:
        # swap the names
        current_mapping["x"], current_mapping["y"] = (
            current_mapping["y"],
            current_mapping["x"],
        )


def add_axis_titles(
    custom_call_args: dict[str, Any],
    hover_mapping: list[dict[str, str]],
    hist_val_name: str,
) -> None:
    """Add axis titles. Generally, this only applies when there is a list variable

    Args:
      custom_call_args: dict[str, Any]: The custom_call_args that are used to
        create hover and axis titles
      hover_mapping: list[dict[str, str]]: The mapping of variables to columns
      hist_val_name: str: The histogram name for the value axis, generally
        histfunc

    """
    # Although hovertext is handled above for all plot types, plotly still
    # handles axis labels outside of cases where lists are passed - all
    # non-cartesian axes and the non-list cases for cartesian axes
    new_xaxis_titles = None
    new_yaxis_titles = None

    if hist_val_name:
        # hist names are already set up in the mapping
        new_xaxis_titles = [hover_mapping[0].get("x", None)]
        new_yaxis_titles = [hover_mapping[0].get("y", None)]

    # a specified axis title update should override this
    if new_xaxis_titles:
        custom_call_args["xaxis_titles"] = custom_call_args.get(
            "xaxis_titles", new_xaxis_titles
        )

    if new_yaxis_titles:
        custom_call_args["yaxis_titles"] = custom_call_args.get(
            "yaxis_titles", new_yaxis_titles
        )


def create_hover_and_axis_titles(
    custom_call_args: dict[str, Any],
    data_cols: dict[str, str],
    hover_mapping: list[dict[str, str]],
) -> Generator[dict[str, Any]]:
    """Create hover text and axis titles. There are three main behaviors.
    First is "current_col", "current_var", and "pivot_vars" are specified in
    "custom_call_args".
    In this case, there is a list of variables, but they are layered outside
    the generate function.
    Second is none of the above is specified but there is a list of columns in
    data cols.
    These two above cases should have identical output, with a legend and the
    columns on the list axis (either x or y) assigned to a shared axis.
    Third is nether of the above. That is to say there is no list of columns at
    any level.
    Plotly express still handles these cases, with no legend as there is no
    shared axis. The column names are on the axis titles (unless overriden).

    Histogram is an exception to the above. If "hist_val_name" is specified,
    the value of this argument ends up on the other axis than the one specified
    (such as the y-axis if the x-axis is specified). Otherwise, there is a
    legend or not depending on if there is a list of columns or not.

    Args:
      custom_call_args: dict[str, Any]: The custom_call_args that are used to
        create hover and axis titles
      data_cols: dict[str, str]: The dictionary of data to column mappings
      hover_mapping: list[dict[str, str]]: The mapping of variables to columns

    Yields:
      dict[str, Any]: dicts containing hover updates

    """
    types = get_list_var_info(data_cols)

    labels = custom_call_args.get("labels", None)
    hist_val_name = custom_call_args.get("hist_val_name", None)

    current_partition = custom_call_args.get("current_partition", None)

    compute_labels(hover_mapping, hist_val_name, types, labels, current_partition)

    hover_text = hover_text_generator(hover_mapping, types, current_partition)

    add_axis_titles(custom_call_args, hover_mapping, hist_val_name)

    return hover_text


def generate_figure(
    draw: callable,
    call_args: dict[str, Any],
    start_index: int = 0,
    trace_generator: Generator[dict] = None,
) -> DeephavenFigure:
    """Generate a figure using a plotly express function as well as any args that
    should be used

    Args:
      draw: Callable: The plotly express function to use to generate the figure
      call_args: dict[str, Any]: Call arguments to use, either passing to
        plotly express or handled separately
      start_index: int: (Default value = 0) Only needed if there are existing
        traces that this figure is being added to. In that case, the data
        mapping needs to start at the end of the existing traces.
      trace_generator:  Generator[dict]:  (Default value = None) If provided
        then only use this trace generator and return (as layout should
        already be created)

    Returns:
      DeephavenFigure: a Deephaven figure

    """
    table = call_args.pop("table")

    filtered_call_args, custom_call_args = split_args(call_args)

    data_cols = get_data_cols(filtered_call_args)

    data_frame = construct_min_dataframe(
        table, data_cols=merge_cols(list(data_cols.values()))
    )

    px_fig = draw(data_frame=data_frame, **filtered_call_args)

    data_mapping, hover_mapping = create_data_mapping(
        data_cols, custom_call_args, table, start_index
    )

    hover_text = create_hover_and_axis_titles(
        custom_call_args, data_cols, hover_mapping
    )

    trace_generator = handle_custom_args(
        px_fig,
        custom_call_args,
        step=1,
        trace_generator=trace_generator,
        extra_generators=[hover_text],
    )

    dh_fig = DeephavenFigure(
        px_fig,
        call_args=call_args,
        data_mappings=[data_mapping],
        trace_generator=trace_generator,
    )

    return dh_fig


def merge_cols(args: list[str | list[str]]) -> list[str]:
    """Merge the strings or list of strings passed into one list.

    Args:
      args: list[str | list[str]]: A list contain strings and list of strings
        to merge

    Returns:
      list[str]: A flattened list with all columns

    """
    prepared_cols = []
    for arg in args:
        if isinstance(arg, list):
            prepared_cols += arg
        else:
            prepared_cols.append(arg)
    return prepared_cols
