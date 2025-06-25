from __future__ import annotations

from functools import partial
from collections.abc import Callable
from typing import Any

from deephaven.plot.express.deephaven_figure import Calendar
from pandas import DataFrame

import plotly.express as px

from deephaven.table import Table, PartitionedTable
from deephaven.execution_context import make_user_exec_ctx
import deephaven.pandas as dhpd

from ._layer import atomic_layer
from .PartitionManager import PartitionManager
from ..deephaven_figure import generate_figure, DeephavenFigure
from ..shared import args_copy, unsafe_figure_update_wrapper
from ..shared.distribution_args import (
    SHARED_DEFAULTS,
    VIOLIN_DEFAULTS,
    BOX_DEFAULTS,
    STRIP_DEFAULTS,
    HISTOGRAM_DEFAULTS,
    SPREAD_GROUPS,
)
from ..types import PartitionableTableLike, FilterColumn


def validate_common_args(args: dict) -> None:
    """Validate common args amongst plots

    Args:
      args: The args to validate

    """

    if not isinstance(args["table"], (Table, PartitionedTable)):
        raise ValueError("Argument table is not of type Table")


def remap_scene_args(args: dict) -> None:
    """Remap layout scenes args so that they are not converted to a list

    Args:
      args: The args to remap

    """
    for arg in ["range_x", "range_y", "range_z", "log_x", "log_y", "log_z"]:
        args[arg + "_scene"] = args.pop(arg)


def calculate_mode(base_mode: str, args: dict[str, Any]) -> str:
    """Calculate the mode of the traces based on the arguments

    Args:
      base_mode: The mode that this trace definitely has, either lines or markers
      args: The args to use to figure out the mode

    Returns:
      The mode. Some combination of markers, lines, text, joined by '+'.

    """
    modes = [base_mode]
    if base_mode == "lines" and any(
        [
            args.get("markers", None),
            args.get("symbol", None),
            args.get("symbol_sequence", None),
            args.get("symbol_map", None),
            args.get("text", None),
            args.get("size", None),
            args.get("size_sequence", None),
            args.get("size_map", None),
            "symbol" in args.get("by_vars", []),
            "size" in args.get("by_vars", []),
        ]
    ):
        modes.append("markers")
    if args.get("text", None):
        modes.append("text")
    return "+".join(modes)


def append_suffixes(args: list[str], suffixes: list[str], sync_dict: SyncDict) -> None:
    """
    Append the suffixes in the list to the specified arg names. The args should be in sync_dict.

    Args:
        args: The args in sync_dict to rename
        suffixes: The suffixes to add to the specified args
        sync_dict: The SyncDict that the args are in
    """
    for arg in args:
        for suffix in suffixes:
            if arg in sync_dict:
                sync_dict.d[f"{arg}_{suffix}"] = sync_dict.will_pop(arg)


def apply_args_groups(args: dict[str, Any], possible_groups: set[str] | None) -> None:
    """Transform args depending on groups

    Args:
      args: A dictionary of args to transform
      possible_groups: A set of groups used to transform the args

    """
    groups: set = (
        possible_groups if isinstance(possible_groups, set) else {possible_groups}
    )

    sync_dict = SyncDict(args)

    if "scatter" in groups:
        args["mode"] = calculate_mode("markers", args)
        append_suffixes(
            ["color_discrete_sequence", "attached_color"], ["marker"], sync_dict
        )

    if "line" in groups:
        args["mode"] = calculate_mode("lines", args)
        append_suffixes(
            ["color_discrete_sequence", "attached_color"], ["marker", "line"], sync_dict
        )

    if "ecdf" in groups:
        # ecdf should be forced to lines even if both "lines" and "markers" are False
        base_mode = "lines" if args["lines"] or not args["markers"] else "markers"
        args["mode"] = calculate_mode(base_mode, args)
        append_suffixes(
            ["color_discrete_sequence", "attached_color"], ["marker", "line"], sync_dict
        )

    if "scene" in groups:
        for arg in ["range_x", "range_y", "range_z", "log_x", "log_y", "log_z"]:
            args[arg + "_scene"] = args.pop(arg)

    if "bar" in groups:
        append_suffixes(
            ["color_discrete_sequence", "attached_color"], ["marker"], sync_dict
        )
        append_suffixes(
            ["pattern_shape_sequence", "attached_pattern_shape"], ["bar"], sync_dict
        )

    if "marker" in groups:
        append_suffixes(
            ["color_discrete_sequence", "attached_color"], ["marker"], sync_dict
        )

    if "always_attached" in groups:
        append_suffixes(
            [
                "color_discrete_sequence",
                "attached_color",
                "pattern_shape_sequence",
                "attached_pattern_shape",
            ],
            ["markers"],
            sync_dict,
        )

    if "area" in groups:
        append_suffixes(
            ["pattern_shape_sequence", "attached_pattern_shape"], ["area"], sync_dict
        )

    if "webgl" in groups:
        args["render_mode"] = "webgl"

    if "indicator" in groups:
        append_suffixes(
            [
                "increasing_color_sequence",
                "attached_increasing_color",
                "decreasing_color_sequence",
                "attached_decreasing_color",
                "text",
            ],
            ["indicator"],
            sync_dict,
        )

    sync_dict.sync_pop()


def create_deephaven_figure(
    args: dict[str, Any],
    groups: set[str] | None = None,
    add: dict[str, Any] | None = None,
    pop: list[str] | None = None,
    remap: dict[str, str] | None = None,
    px_func: Callable = lambda: None,
) -> tuple[DeephavenFigure, Table | PartitionedTable, Table | None, dict[str, Any]]:
    """Process the provided args

    Args:
      args: A dictionary of args to process
      groups:
        A set of groups that apply transformations to the args
      add:
        A dictionary to add to the args
      pop:
        A list of keys to remove from the args
      remap:
        A dictionary mapping of keys to keys
      px_func: the function (generally from px) to use to create the figure

    Returns:
      A tuple of the figure, the table, a table to listen to, and an
      update that needs to be applied to all calls that regenerate this figure. If "by" is set, there is a plot by
      column. If "x" or "y" are set, there is a list variable which needs to be replaced.

    """
    validate_common_args(args)

    marg_args = None
    if any(arg in args for arg in ["marginal", "marginal_x", "marginal_y"]):
        marg_args = get_marg_args(args)
        if "marginal" in args:
            var = "x" if args["x"] else "y"
            args[f"marginal_{var}"] = args.pop("marginal")

    draw_figure = partial(generate_figure, draw=px_func)
    partitioned = PartitionManager(
        args, draw_figure, groups, marg_args, attach_marginals
    )

    apply_args_groups(args, groups)

    if add:
        args.update(add)

    if pop:
        for arg in pop:
            args.pop(arg)

    if remap:
        for old_arg, new_arg in remap.items():
            args[new_arg] = args.pop(old_arg)

    if "unsafe_update_figure" in args:
        update_wrapper = partial(
            unsafe_figure_update_wrapper, args["unsafe_update_figure"]
        )
    else:
        # this is a marginal, so provide an empty update function
        update_wrapper = lambda x: x

    list_param = partitioned.list_param
    pivot_col = (
        partitioned.stacked_column_names["value"]
        if partitioned.stacked_column_names
        else None
    )
    by = partitioned.by

    update = {}

    if by:
        # by needs to be updated as if there is a list variable but by is None, the pivot column is used as the by
        update["by"] = by

    if list_param:
        # if there is a list variable, update the list variable to the pivot column
        update[list_param] = pivot_col

    return (
        update_wrapper(partitioned.create_figure()),
        partitioned.partitioned_table,
        partitioned.key_column_table,
        update,
    )


def convert_to_table(table: PartitionableTableLike) -> Table | PartitionedTable:
    """
    Convert a Dataframe to a Table if it is one

    Args:
      table: The PartitionableTableData to convert

    Returns:
        The Table or PartitionedTable
    """
    if isinstance(table, DataFrame):
        return dhpd.to_table(table)
    return table


def retrieve_calendar(render_args: dict[str, Any]) -> Calendar:
    """
    Retrieve the calendar from the render args

    Args:
        render_args: The render args to retrieve the calendar from

    Returns:
        The calendar
    """
    calendar = render_args["args"].pop("calendar", False)

    # rangebreaks (which a calendar is converted to) are not supported in webgl
    if calendar is not False and "render_mode" in render_args["args"]:
        render_args["args"]["render_mode"] = "svg"

    return calendar


def get_filter_columns(
    table: PartitionableTableLike, filter_by: bool | str | list[str] | None
) -> list[str]:
    """
    Convert the filter_by argument to a list of columns to filter by.

    Args:
        table: if the table is a PartitionedTable, the key columns may be the filter
        filter_by: the filter by before conversion

    Returns:
        A list of columns to filter by
    """
    if filter_by is True and isinstance(table, PartitionedTable):
        # if the table is already partitioned and filter_by is True,
        # use the key columns as the filter
        # this is a replacement for one_click_partitioned_table
        filter_by = table.key_columns
    elif filter_by is None or isinstance(filter_by, bool):
        filter_by = []
    elif isinstance(filter_by, str):
        filter_by = [filter_by]

    return filter_by


def retrieve_input_filter_columns(
    render_args: dict[str, Any]
) -> tuple[set[FilterColumn], list[str], list[str]]:
    """
    Retrieve the input filter columns from the render args

    Args:
        render_args: The render args to retrieve the input filter columns from

    Returns:
        The input filter columns
    """
    table = render_args["args"]["table"]

    if isinstance(table, PartitionedTable):
        columns = table.constituent_table_columns
    else:
        columns = table.columns

    filter_by = get_filter_columns(table, render_args["args"].get("filter_by", []))
    required_filter_by = get_filter_columns(
        table, render_args["args"].get("required_filter_by", [])
    )

    filter_columns = set(
        [
            FilterColumn(column.name, str(column.data_type), False)
            for column in columns
            if column.name in filter_by
        ]
    )

    required_filter_columns = set(
        [
            FilterColumn(column.name, str(column.data_type), True)
            for column in columns
            if column.name in required_filter_by
        ]
    )

    filter_name_set = set([column.name for column in filter_columns])

    required_name_set = set([column.name for column in required_filter_columns])

    filter_union = filter_name_set.intersection(required_name_set)
    if filter_union:
        # filter columns and required filter columns are mutually exclusive
        raise ValueError(
            f"Overlapping filter_by and required_filter_by columns found: {filter_union}"
        )

    all_filter_column = filter_columns.union(required_filter_columns)

    return all_filter_column, filter_by, required_filter_by


def process_args(
    args: dict[str, Any],
    groups: set[str] | None = None,
    add: dict[str, Any] | None = None,
    pop: list[str] | None = None,
    remap: dict[str, str] | None = None,
    px_func: Callable = lambda: None,
) -> DeephavenFigure:
    """Process the provided args

    Args:
      args: A dictionary of args to process
      groups:
        A set of groups that apply transformations to the args
      add:
        A dictionary to add to the args
      pop:
        A list of keys to remove from the args
      remap:
        A dictionary mapping of keys to keys
      px_func: the function (generally from px) to use to create the figure

    Returns:
        DeephavenFigure: The new figure

    """
    render_args = locals()
    render_args["args"]["table"] = convert_to_table(render_args["args"]["table"])

    # Calendar is directly sent to the client for processing
    calendar = retrieve_calendar(render_args)

    filter_columns, filter_by, required_filter_by = retrieve_input_filter_columns(
        render_args
    )
    render_args["args"]["filter_by"] = filter_by
    render_args["args"]["required_filter_by"] = required_filter_by

    orig_process_args = args_copy(render_args)
    orig_process_func = lambda **local_args: create_deephaven_figure(**local_args)[0]

    new_fig, table, key_column_table, update = create_deephaven_figure(**render_args)

    orig_process_args["args"].update(update)

    exec_ctx = make_user_exec_ctx()

    # these are needed for when partitions are added
    new_fig.add_figure_to_graph(
        exec_ctx,
        orig_process_args,
        table,
        key_column_table,
        orig_process_func,
        filter_columns,
    )

    new_fig.calendar = calendar

    return new_fig


class SyncDict:
    """A dictionary wrapper that will queue up keys to remove and remove them
    all at once

    Attributes:
      d: dict: the dictionary to wrap
      pop_set: set: the set of keys to pop

    """

    def __init__(self, d: dict):
        """
        Create a SyncDict
        Args:
            d: The dictionary to wrap
        """
        self.d = d
        self.pop_set = set()

    def __contains__(self, item: Any) -> bool:
        """
        Check if the item is in the dictionary

        Args:
            item: The item to check

        Returns:
            bool: True if the item is in the dictionary, False otherwise

        """
        return item in self.d

    def will_pop(self, key: Any) -> Any:
        """Add a key to the set of keys that will eventually be popped

        Args:
          The key to add to the set

        Returns:
          The value associated with the key that will be popped

        """
        self.pop_set.add(key)
        return self.d[key]

    def sync_pop(self):
        """Pop all elements from the dictionary that have been added to the pop
        set
        """
        for k in self.pop_set:
            self.d.pop(k)


def set_all(args: dict[str, Any], pairs: dict[str, Any]) -> None:
    """
    Set all the pairs in the args if they are not already set

    Args:
        args: The args to set the pairs on
        pairs: The pairs to set
    """
    for k, v in pairs.items():
        args.get(k, v)


def set_shared_defaults(args: dict[str, Any]) -> None:
    """
    Set shared defaults amongst distribution figures

    Args:
        args: The args to set the shared defaults on
    """
    set_all(args, SHARED_DEFAULTS)


def shared_marginal(
    is_marginal: bool, func: Callable, groups: set[str], **args: Any
) -> DeephavenFigure:
    """
    Create a marginal figure

    Args:
        is_marginal: True if this is a marginal figure, False otherwise
        func: The function to use to create the figure
        groups: The groups to apply to the figure
        **args: Other args to pass to the figure

    Returns:
        The DeephavenFigure created
    """
    if not is_marginal:
        return process_args(args, groups, px_func=func)
    return create_deephaven_figure(args, groups, px_func=func)[0]


def shared_violin(
    is_marginal: bool = True,
    **args: Any,
) -> DeephavenFigure:
    """
    Create a violin figure

    Args:
        is_marginal: Whether this is a marginal figure or not
        **args: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, VIOLIN_DEFAULTS)

    func = px.violin
    groups = SPREAD_GROUPS

    return shared_marginal(is_marginal, func, groups, **args)


def shared_box(is_marginal: bool = True, **args: Any) -> DeephavenFigure:
    """
    Create a box figure

    Args:
        is_marginal: Whether this is a marginal figure or not
        **args: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, BOX_DEFAULTS)

    func = px.box
    groups = SPREAD_GROUPS

    return shared_marginal(is_marginal, func, groups, **args)


def shared_strip(is_marginal: bool = True, **args: Any) -> DeephavenFigure:
    """
    Create a strip figure

    Args:
        is_marginal: Whether this is a marginal figure or not
        **args: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, STRIP_DEFAULTS)

    func = px.strip
    groups = SPREAD_GROUPS

    return shared_marginal(is_marginal, func, groups, **args)


def shared_histogram(is_marginal: bool = True, **args: Any) -> DeephavenFigure:
    """
    Create a histogram figure

    Args:
        is_marginal: Whether this is a marginal figure or not
        **args: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, HISTOGRAM_DEFAULTS)

    args["bargap"] = 0

    func = px.bar
    groups = {"bar", "preprocess_hist", "supports_lists"}

    return shared_marginal(is_marginal, func, groups, **args)


def marginal_axis_update(matches: str | None = None) -> dict[str, Any]:
    """Create an update to a marginal axis so it hides much of the axis info

    Args:
      matches:
        An optional axis, such as x, y, x2 to match this axis to

    Returns:
      The update

    """
    return {
        "matches": matches,
        "title": {},
        "showgrid": False,
        "showline": False,
        "showticklabels": False,
        "ticks": "",
    }


def create_marginal(marginal: str, args: dict[str, Any], which: str) -> DeephavenFigure:
    """Create a marginal figure

    Args:
      marginal: The type of marginal; histogram, violin, rug, box
      args: The args to pass to the marginal function
      which: x or y depending on which marginal is being drawn

    Returns:
      DeephavenFigure: The marginal figure

    """
    if marginal == "histogram":
        args["barmode"] = "overlay"
    marginal_map = {
        "histogram": shared_histogram,
        "violin": shared_violin,
        "rug": shared_strip,
        "box": shared_box,
    }

    fig_marg = marginal_map[marginal](**args)

    plotly_fig_marg = fig_marg.get_plotly_fig()

    if plotly_fig_marg is None:
        raise ValueError("Plotly figure is None, cannot create marginal figure")

    plotly_fig_marg.update_traces(showlegend=False)

    if marginal == "rug":
        symbol = "line-ns-open" if which == "x" else "line-ew-open"
        plotly_fig_marg.update_traces(marker_symbol=symbol, jitter=0)

    return fig_marg


def attach_marginals(
    fig: DeephavenFigure,
    args: dict[str, Any],
    marginal_x: str | None = None,
    marginal_y: str | None = None,
) -> DeephavenFigure:
    """Create and attach marginals to the provided figure.

    Args:
      fig: The figure to attach marginals to
      args: The data args to use
      marginal_x:
        The type of marginal; histogram, violin, rug, box
      marginal_y:
        The type of marginal; histogram, violin, rug, box

    Returns:
      DeephavenFigure: The figure, with marginals attached if marginal_x/y was
        specified

    """
    figs = [fig]

    data = {"x": args.pop("x"), "y": args.pop("y")}

    specs = []

    if marginal_x:
        x_args = {**args, "x": data["x"]}
        figs.append(create_marginal(marginal_x, x_args, "x"))
        specs = [
            {"y": [0, 0.74]},
            {
                "y": [0.75, 1],
                "xaxis_update": marginal_axis_update("x"),
                "yaxis_update": marginal_axis_update(),
            },
        ]

    if marginal_y:
        y_args = {**args, "y": data["y"]}
        figs.append(create_marginal(marginal_y, y_args, "y"))
        if specs:
            specs[0]["x"] = [0, 0.745]
            specs[1]["x"] = [0, 0.745]
            specs.append(
                {
                    "x": [0.75, 1],
                    "y": [0, 0.74],
                    "yaxis_update": marginal_axis_update("y"),
                    "xaxis_update": marginal_axis_update(),
                }
            )

        else:
            specs = [
                {"x": [0, 0.745]},
                {
                    "x": [0.75, 1],
                    "yaxis_update": marginal_axis_update("y"),
                    "xaxis_update": marginal_axis_update(),
                },
            ]

    return atomic_layer(*figs, specs=specs) if specs else fig


def get_marg_args(args: dict[str, Any]) -> dict[str, Any]:
    """Copy the required args into data and style for marginal creation

    Args:
      args: The args to split

    Returns:
      A tuple of (data args dict, style args dict)

    """
    marg_args = {
        "x",
        "y",
        "by",
        "by_vars",
        "color",
        "hover_name",
        "labels",
        "color_discrete_sequence",
        "color_discrete_map",
    }

    new_args = {}

    for arg in marg_args:
        if arg in args:
            new_args[arg] = args[arg]

    return new_args
