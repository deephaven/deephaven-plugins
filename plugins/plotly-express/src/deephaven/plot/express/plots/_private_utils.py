from __future__ import annotations

from functools import partial
from collections.abc import Callable
from typing import Any

import plotly.express as px

from deephaven.table import Table, PartitionedTable

from ._layer import layer
from .PartitionManager import PartitionManager
from ._update_wrapper import unsafe_figure_update_wrapper
from ..deephaven_figure import generate_figure, DeephavenFigure
from ._update_wrapper import default_callback


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


def process_args(
    args: dict[str, Any],
    groups: set[str] = None,
    add: dict[str, Any] = None,
    pop: list[str] = None,
    remap: dict[str, str] = None,
    px_func=Callable,
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
      partial: The new figure

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

    update_wrapper = partial(
        unsafe_figure_update_wrapper, args.pop("unsafe_update_figure")
    )

    return update_wrapper(partitioned.create_figure())


class SyncDict:
    """A dictionary wrapper that will queue up keys to remove and remove them
    all at once


    Args:
      d: dict: the dictionary to wrap


    """

    def __init__(self, d: dict):
        self.d = d
        self.pop_set = set()

    def __contains__(self, item):
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


def set_shared_defaults(args: dict[str, Any]) -> None:
    """
    Set shared defaults amongst distribution figures

    Args:
        args: dict[str, str]: The args to set the shared defaults on
    """
    args["by_vars"] = args.get("by_vars", ("color",))
    args["unsafe_update_figure"] = args.get("unsafe_update_figure", default_callback)
    args["x"] = args.get("x", None)
    args["y"] = args.get("y", None)


def shared_violin(**args: Any) -> DeephavenFigure:
    """

    Args:
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    args["violinmode"] = args.get("violinmode", "group")
    args["points"] = args.get("points", "outliers")
    return process_args(
        args, {"marker", "preprocess_violin", "supports_lists"}, px_func=px.violin
    )


def shared_box(**args: Any) -> DeephavenFigure:
    """

    Args:
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    args["boxmode"] = args.get("boxmode", "group")
    args["points"] = args.get("points", "outliers")
    return process_args(
        args, {"marker", "preprocess_violin", "supports_lists"}, px_func=px.box
    )


def shared_strip(**args: Any) -> DeephavenFigure:
    """

    Args:
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    args["stripmode"] = args.get("stripmode", "group")
    return process_args(
        args, {"marker", "preprocess_violin", "supports_lists"}, px_func=px.strip
    )


def shared_histogram(**args: Any) -> DeephavenFigure:
    """

    Args:
        **args: Any: The args used for the figure

    Returns:
        The DeephavenFigure created
    """
    set_shared_defaults(args)
    args["barmode"] = args.get("barmode", "relative")
    args["nbins"] = args.get("nbins", 10)
    args["histfunc"] = args.get("histfunc", "count")
    args["histnorm"] = args.get("histnorm", None)
    args["cumulative"] = args.get("cumulative", False)
    args["range_bins"] = args.get("range_bins", None)
    args["barnorm"] = args.get("barnorm", None)

    args["bargap"] = 0
    args["hist_val_name"] = args["histfunc"]

    return process_args(
        args, {"bar", "preprocess_hist", "supports_lists"}, px_func=px.bar
    )


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
    fig_marg.fig.update_traces(showlegend=False)

    if marginal == "rug":
        symbol = "line-ns-open" if which == "x" else "line-ew-open"
        fig_marg.fig.update_traces(marker_symbol=symbol, jitter=0)

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

    return layer(*figs, specs=specs) if specs else fig


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
