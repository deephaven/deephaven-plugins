from __future__ import annotations

from functools import partial
from collections.abc import Callable
from typing import Any

import plotly.express as px

from deephaven.table import Table, PartitionedTable
from deephaven.execution_context import make_user_exec_ctx

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


def validate_common_args(args: dict) -> None:
    """Validate common args amongst plots

    Args:
      args: dict: The args to validate

    """

    if not isinstance(args["table"], (Table, PartitionedTable)):
        raise ValueError("Argument table is not of type Table")


def remap_scene_args(args: dict) -> None:
    """Remap layout scenes args so that they are not converted to a list

    Args:
      args: dict: The args to remap

    """
    for arg in ["range_x", "range_y", "range_z", "log_x", "log_y", "log_z"]:
        args[arg + "_scene"] = args.pop(arg)


def calculate_mode(base_mode: str, args: dict[str, Any]) -> str:
    """Calculate the mode of the traces based on the arguments

    Args:
      base_mode: str: The mode that this trace definitely has, either lines or markers
      args: dict[str, Any]: The args to use to figure out the mode
      base_mode: str:
      args: dict[str, Any]:

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
        args: list[str]: The args in sync_dict to rename
        suffixes: list[str]: The suffixes to add to the specified args
        sync_dict: SyncDict: The SyncDict that the args are in
    """
    for arg in args:
        for suffix in suffixes:
            if arg in sync_dict:
                sync_dict.d[f"{arg}_{suffix}"] = sync_dict.will_pop(arg)


def apply_args_groups(args: dict[str, Any], groups: set[str]) -> None:
    """Transform args depending on groups

    Args:
      args: dict[str, Any]: A dictionary of args to transform
      groups: set[str]: A set of groups used to transform the args

    """
    groups = groups if isinstance(groups, set) else {groups}

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

    sync_dict.sync_pop()


def create_deephaven_figure(
    args: dict[str, Any],
    groups: set[str] = None,
    add: dict[str, Any] = None,
    pop: list[str] = None,
    remap: dict[str, str] = None,
    px_func: Callable = None,
) -> tuple[DeephavenFigure, Table | PartitionedTable, Table, dict[str, Any]]:
    """Process the provided args

    Args:
      args: dict[str, Any]: A dictionary of args to process
      groups: set[str]:  (Default value = None)
        A set of groups that apply transformations to the args
      add: dict[str, Any] (Default value = None)
        A dictionary to add to the args
      pop: list[str]:  (Default value = None)
        A list of keys to remove from the args
      remap: dict[str, str]:  (Default value = None)
        A dictionary mapping of keys to keys
      px_func: Callable: the function (generally from px) to use to create the figure

    Returns:
      tuple[DeephavenFigure, Table | PartitionedTable]: A tuple of the figure, the table, a table to listen to, and an
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

    list_var = partitioned.list_var
    pivot_col = partitioned.pivot_vars["value"] if partitioned.pivot_vars else None
    by = partitioned.by

    update = {}

    if by:
        # by needs to be updated as if there is a list variable but by is None, the pivot column is used as the by
        update["by"] = by

    if list_var:
        # if there is a list variable, update the list variable to the pivot column
        update[list_var] = pivot_col

    return (
        update_wrapper(partitioned.create_figure()),
        partitioned.partitioned_table,
        partitioned.key_column_table,
        update,
    )


def process_args(
    args: dict[str, Any],
    groups: set[str] = None,
    add: dict[str, Any] = None,
    pop: list[str] = None,
    remap: dict[str, str] = None,
    px_func: Callable = None,
) -> DeephavenFigure:
    """Process the provided args

    Args:
      args: dict[str, Any]: A dictionary of args to process
      groups: set[str]:  (Default value = None)
        A set of groups that apply transformations to the args
      add: dict[str, Any] (Default value = None)
        A dictionary to add to the args
      pop: list[str]:  (Default value = None)
        A list of keys to remove from the args
      remap: dict[str, str]:  (Default value = None)
        A dictionary mapping of keys to keys
      px_func: Callable: the function (generally from px) to use to create the figure

    Returns:
        DeephavenFigure: The new figure

    """
    use_args = locals()
    orig_process_args = args_copy(use_args)
    orig_process_func = lambda **local_args: create_deephaven_figure(**local_args)[0]

    new_fig, table, key_column_table, update = create_deephaven_figure(**use_args)

    orig_process_args["args"].update(update)

    exec_ctx = make_user_exec_ctx()

    # these are needed for when partitions are added
    new_fig.add_figure_to_graph(
        exec_ctx, orig_process_args, table, key_column_table, orig_process_func
    )

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
            d: dict: The dictionary to wrap
        """
        self.d = d
        self.pop_set = set()

    def __contains__(self, item: Any) -> bool:
        """
        Check if the item is in the dictionary

        Args:
            item: Any: The item to check

        Returns:
            bool: True if the item is in the dictionary, False otherwise

        """
        return item in self.d

    def will_pop(self, key: Any) -> Any:
        """Add a key to the set of keys that will eventually be popped

        Args:
          key: The key to add to the set

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
        args: dict[str, Any]: The args to set the pairs on
        pairs: dict[str, Any]: The pairs to set
    """
    for k, v in pairs.items():
        args.get(k, v)


def set_shared_defaults(args: dict[str, Any]) -> None:
    """
    Set shared defaults amongst distribution figures

    Args:
        args: dict[str, str]: The args to set the shared defaults on
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
    is_marginal=True,
    **args: Any,
) -> DeephavenFigure:
    """
    Create a violin figure

    Args:
        is_marginal: bool:  (Default value = True) Whether this is a marginal figure or not
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, VIOLIN_DEFAULTS)

    func = px.violin
    groups = SPREAD_GROUPS

    return shared_marginal(is_marginal, func, groups, **args)


def shared_box(is_marginal=True, **args: Any) -> DeephavenFigure:
    """
    Create a box figure

    Args:
        is_marginal: bool:  (Default value = True) Whether this is a marginal figure or not
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, BOX_DEFAULTS)

    func = px.box
    groups = SPREAD_GROUPS

    return shared_marginal(is_marginal, func, groups, **args)


def shared_strip(is_marginal=True, **args: Any) -> DeephavenFigure:
    """
    Create a strip figure

    Args:
        is_marginal: bool:  (Default value = True) Whether this is a marginal figure or not
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, STRIP_DEFAULTS)

    func = px.strip
    groups = SPREAD_GROUPS

    return shared_marginal(is_marginal, func, groups, **args)


def shared_histogram(is_marginal=True, **args: Any) -> DeephavenFigure:
    """
    Create a histogram figure

    Args:
        is_marginal: bool:  (Default value = True) Whether this is a marginal figure or not
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    set_all(args, HISTOGRAM_DEFAULTS)

    args["bargap"] = 0
    args["hist_val_name"] = args.get("histfunc", "count")

    func = px.bar
    groups = {"bar", "preprocess_hist", "supports_lists"}

    return shared_marginal(is_marginal, func, groups, **args)


def marginal_axis_update(matches: str = None) -> dict[str, Any]:
    """Create an update to a marginal axis so it hides much of the axis info

    Args:
      matches: str:  (Default value = None)
        An optional axis, such as x, y, x2 to match this axis to

    Returns:
      dict[str, Any]: The update

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
      marginal: str: The type of marginal; histogram, violin, rug, box
      args: dict[str, Any] The args to pass to the marginal function
      which: str: x or y depending on which marginal is being drawn

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
    fig_marg.get_plotly_fig().update_traces(showlegend=False)

    if marginal == "rug":
        symbol = "line-ns-open" if which == "x" else "line-ew-open"
        fig_marg.get_plotly_fig().update_traces(marker_symbol=symbol, jitter=0)

    return fig_marg


def attach_marginals(
    fig: DeephavenFigure,
    args: dict[str, Any],
    marginal_x: str = None,
    marginal_y: str = None,
) -> DeephavenFigure:
    """Create and attach marginals to the provided figure.

    Args:
      fig: DeephavenFigure: The figure to attach marginals to
      args: dict[str, Any]: The data args to use
      marginal_x: str:  (Default value = None)
        The type of marginal; histogram, violin, rug, box
      marginal_y: str:  (Default value = None)
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
      args: dict[str, Any]: The args to split

    Returns:
      tuple[dict[str, Any], dict[str, Any]]: A tuple of
        (data args dict, style args dict)

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
