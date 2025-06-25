from __future__ import annotations

from functools import partial
from typing import Any, Callable, cast, Tuple, TypedDict
from deephaven.execution_context import make_user_exec_ctx

from plotly.graph_objs import Figure

from ..deephaven_figure import DeephavenFigure
from ..shared import default_callback, unsafe_figure_update_wrapper


class LayerSpecDict(TypedDict, total=False):
    x: list[float] | None
    y: list[float] | None
    xaxis_update: dict[str, Any] | None
    yaxis_update: dict[str, Any] | None
    wipe_layout: bool | None
    matched_xaxis: str | int | None
    matched_yaxis: str | int | None


def normalize_position(
    position: float, chart_start: float, chart_range: float
) -> float:
    """Normalize a position so that it falls between 0 and 1 (inclusive)

    Args:
      position: The current position
      chart_start: The start of the domain the existing chart has
      chart_range: The range the existing chart has

    Returns:
      float: The normalized position
    """
    return (position - chart_start) / chart_range


def get_new_positions(
    new_domain: list[float], positions: list[float], chart_domain: list[float]
) -> list[float]:
    """Get positions within the new domain of an arbitrary list of positions
    The positions will first be normalized to fall between 0 and 1 inclusive
    using the current chart_domain. Then, the positions are mapped onto
    new_domain.
    For example, if a position is at 0.5, chart_domain is [0, 1] and new_domain
    is [0, 0.6], the new position is 0.3.

    Args:
      new_domain: The new domain to map the points to
      positions: The current positions of the points
      chart_domain: The current domain of the whole chart

    Returns:
      The new positions
    """
    if not isinstance(positions, list):
        positions = [positions]
    new_positions = []
    new_range = new_domain[1] - new_domain[0]
    for position in positions:
        chart_range = chart_domain[1] - chart_domain[0]
        normalized = normalize_position(position, chart_domain[0], chart_range)
        new_position = new_domain[0] + normalized * new_range
        new_positions.append(new_position)
    return new_positions


def resize_domain(obj: dict, new_domain: LayerSpecDict) -> None:
    """Resize the domain of the given object

    Args:
      obj: The object to resize. It should have a "domain" key that
        references a dict that has "x" and "y" keys.
      new_domain: The new domain the map the figure to.
        Contains keys of x and y and values of domains, such as [0,0.5]

    """
    new_domain_x = new_domain.get("x")
    new_domain_y = new_domain.get("y")
    obj_domain_x = obj["domain"]["x"]
    obj_domain_y = obj["domain"]["y"]
    domain_update = {}
    try:
        # assuming that the whole chart spans [0,1] in both directions as
        # passing a subplot is currently not supported
        if new_domain_x:
            domain_update["x"] = get_new_positions(new_domain_x, obj_domain_x, [0, 1])
        if new_domain_y:
            domain_update["y"] = get_new_positions(new_domain_y, obj_domain_y, [0, 1])
        if domain_update:
            obj.update({"domain": domain_update})
    except ValueError:
        # the obj might not have a domain to resize
        pass


def resize_xy_axis(axis: dict, new_domain: LayerSpecDict, which: str) -> None:
    """Resize either an x or y axis.

    Args:
      axis: The axis object to resize.
      new_domain: The new domain the map the figure to.
        Contains keys of x and y and values of domains, such as [0,0.5]
      which: Either "x" or "y"

    """
    new_domain_x = new_domain.get("x")
    new_domain_y = new_domain.get("y")
    # the existing domain is assumed to be 0, 1 if not set
    axis_domain = axis.get("domain", [0, 1])
    axis_position = axis.get("position")
    axis_update = {}
    try:
        if which == "x":
            if new_domain_x:
                axis_update["domain"] = get_new_positions(
                    new_domain_x, axis_domain, [0, 1]
                )
            if new_domain_y and axis_position is not None:
                axis_update["position"] = get_new_positions(
                    new_domain_y, axis_position, [0, 1]
                )[0]
        else:
            if new_domain_y:
                axis_update["domain"] = get_new_positions(
                    new_domain_y, axis_domain, [0, 1]
                )
            if new_domain_x and axis_position is not None:
                axis_update["position"] = get_new_positions(
                    new_domain_x, axis_position, [0, 1]
                )[0]

        axis.update(axis_update)
    except ValueError:
        # the obj might not have an axis to resize
        pass


def reassign_axes(trace: dict, axes_remapping: dict[str, str]) -> None:
    """Update the trace with its new axes using with the remapping

    Args:
      trace: The trace to remap axes within
      axes_remapping: The mapping of old to new axes

    """
    if "xaxis" in trace:
        trace.update(xaxis=axes_remapping[trace["xaxis"]])

    if "yaxis" in trace:
        trace.update(yaxis=axes_remapping[trace["yaxis"]])

    if "scene" in trace:
        trace.update(scene=axes_remapping[trace["scene"]])

    if "subplot" in trace:
        trace.update(subplot=axes_remapping[trace["subplot"]])

    if "ternary" in trace:
        trace.update(ternary=axes_remapping[trace["ternary"]])


def reassign_attributes(axis: dict, axes_remapping: dict[str, str]) -> None:
    """Reassign attributes of a layout object using with the remapping

    Args:
      axis: The axis object to remap attributes from
      axes_remapping: The mapping of old to new axes

    """
    # anchor can also be free, which does not need to be modified
    if "anchor" in axis and axis["anchor"] in axes_remapping:
        axis.update(anchor=axes_remapping[axis["anchor"]])

    if "overlaying" in axis and axis["overlaying"] in axes_remapping:
        axis.update(overlaying=axes_remapping[axis["overlaying"]])


def resize_axis(
    type_: str, old_axis: str, axis: dict, num: str, new_domain: LayerSpecDict
) -> tuple[str, str, str]:
    """Maps the specified axis to new_domain and returns info to help remap axes

    Args:
      type_: The type of axis to resize
      old_axis: The old axis name
      axis: The axis object to resize
      num: The number (possibly empty) of this axis within the new chart
      new_domain: The new domain the map the figure to.
        Contains keys of x and y and values of domains, such as [0,0.5]

    Returns:
      A tuple of new axis name, old axis name (for trace
        remapping), new axis name (for trace remapping). The new axis name
        isn't always the same within the trace as it is in the layout (such as
        in the case of xaxis or yaxis), hence the need for both of the names.

    """
    new_axis = f"{type_}{num}"
    if type_ == "xaxis" or type_ == "yaxis":
        which = type_[0]
        resize_xy_axis(axis, new_domain, which)
        old_trace_axis = old_axis.replace(type_, which)
        return new_axis, old_trace_axis, f"{which}{num}"
    else:
        resize_domain(axis, new_domain)
        return new_axis, old_axis, new_axis


def get_axis_update(spec: LayerSpecDict, type_: str) -> dict[str, Any] | None:
    """Retrieve an axis update from the spec

    Args:
      spec: The full spec object
      type_: The type of axis to retrieve the update of

    Returns:
      A dictionary of updates to make to the x or y-axis

    """
    if "xaxis_update" in spec and type_ == "xaxis":
        return spec["xaxis_update"]
    if "yaxis_update" in spec and type_ == "yaxis":
        return spec["yaxis_update"]
    return {}


def match_axes(
    type_: str,
    spec: LayerSpecDict,
    matches_axes: dict[Any, dict[int, str]],
    axis_indices: dict[str, int],
    new_trace_axis: str,
) -> dict[str, str]:
    """
    Create an update to the axis if this axis matches another axis

    Args:
        type_: The type of the axis
        spec:
          The spec to retrieve matching axes from
        matches_axes:
          A dictionary with keys that are unique per matching dictionary group.
          The value is a dictionary that maps an axis index to a specific
        axis_indices:
          The index of the axes within the figure
        new_trace_axis:
          The new trace axes to add to matches_axes if there is
          not currently an axis at the index defined by axis_indices

    Returns:
        A dictionary with a key of "matches" and a value of the axis matched to
          if there is a dictionary to match to

    """
    match_axis_key = spec.get(f"matched_{type_}")
    axis_index = axis_indices.get(type_)

    if match_axis_key is not None:
        # add type to key to ensure uniqueness per axis
        match_axis_key = (match_axis_key, type_)
        if match_axis_key not in matches_axes:
            matches_axes[match_axis_key] = {}
        if (
            matches_axes[match_axis_key]
            and axis_index is not None
            and not matches_axes[match_axis_key].get(axis_index)
        ):
            # this is the base axis to match to, so matches is not added
            return {}
        if axis_index is not None:
            if axis_index not in matches_axes[match_axis_key]:
                # this is the first axis to match to, so add it
                matches_axes[match_axis_key][axis_index] = new_trace_axis
            return {"matches": matches_axes[match_axis_key][axis_index]}

    return {}


def resize_fig(
    fig_data: dict,
    fig_layout: dict,
    spec: LayerSpecDict,
    new_axes_start: dict[str, int],
    matches_axes: dict[Any, dict[int, str]],
) -> tuple[dict, dict]:
    """Resize a figure into new_domain, reindexing with the indices specified in
    new_axes_start

    Args:
      fig_data: The current figure data
      fig_layout: The current figure layout
      spec:
        A dictionary that contains keys of "x" and "y"
        that have values that are lists of two floats from 0 to 1. The chart
        that corresponds with a domain will be resized to that domain. Either
        x or y can be excluded if only resizing on one axis. Can also specify
        xaxis_update or yaxis_update with a dictionary value to update all axes
        with that dict.
      new_axes_start: A dictionary containing the start of
        new indices to ensure there is no reindexing collisions
      matches_axes:
          A dictionary with keys that are unique per matching dictionary group.
          The value is a dictionary that maps an axis index to a specific

    Returns:
      tuple[dict, dict]: A tuple of the new figure data, the new figure layout

    """
    if not spec:
        # if there is no spec, nothing needs to be done
        return fig_data, fig_layout

    axes_remapping = {}
    new_axes = {}
    old_axes = []
    type_ = None

    # keep track of the axis number within the chart so these axes can be
    # appropriately linked across charts
    axis_indices = {"xaxis": 0, "yaxis": 0}

    for name, obj in fig_layout.items():
        # todo: coloraxis; thickness, len, x, y
        if name.startswith("xaxis"):
            axis_indices["xaxis"] += 1
            type_ = "xaxis"

        elif name.startswith("yaxis"):
            axis_indices["yaxis"] += 1
            type_ = "yaxis"

        elif name.startswith("scene"):
            type_ = "scene"

        elif name.startswith("polar"):
            type_ = "polar"

        elif name.startswith("ternary"):
            type_ = "ternary"

        if type_:
            # axes start at 1, and the 1 is dropped
            num = "" if new_axes_start[type_] == 1 else new_axes_start[type_]
            new_axes_start[type_] += 1
            old_axes.append(name)

            update = get_axis_update(spec, type_)

            new_axis, old_trace_axis, new_trace_axis = resize_axis(
                type_, name, obj, str(num), spec
            )

            matches_update = match_axes(
                type_, spec, matches_axes, axis_indices, new_trace_axis
            )

            obj.update(**update, **matches_update)

            new_axes[new_axis] = obj
            axes_remapping[old_trace_axis] = new_trace_axis

        type_ = None

    if spec.get("wipe_layout", False):
        # completely wipe out the layout (and axes will be added back)
        fig_layout = {}
    else:
        # need to remove old axes in case there is one with a very high number
        for axis in old_axes:
            fig_layout.pop(axis)

    fig_layout.update(new_axes)

    for trace in fig_data:
        reassign_axes(trace, axes_remapping)
        if "domain" in trace:
            resize_domain(trace, spec)

    for axis in fig_layout.values():
        if isinstance(axis, dict):
            reassign_attributes(axis, axes_remapping)

    return fig_data, fig_layout


def fig_data_and_layout(
    fig: Figure,
    i: int,
    specs: list[LayerSpecDict] | None,
    which_layout: int | None,
    new_axes_start: dict[str, int],
    matches_axes: dict[Any, dict[int, str]],
) -> tuple[tuple | dict, dict]:
    """Get new data and layout for the specified figure

    Args:
      fig: The current figure
      i: The index of the figure, used for which_layout
      specs:
        A list of dictionaries that contains keys of "x" and "y"
        that have values that are lists of two floats from 0 to 1. The chart
        that corresponds with a domain will be resized to that domain. Either
        x or y can be excluded if only resizing on one axis. Can also specify
        xaxis_update or yaxis_update with a dictionary value to update all axes
        with that dict.
      which_layout: None to layer layouts, or an index of which arg to
        take the layout from
      new_axes_start: A dict that keeps track of starting
       points when recreating axes
      matches_axes:
          A dictionary with keys that are unique per matching dictionary group.
          The value is a dictionary that maps an axis index to a specific

    Returns:
      tuple[tuple | dict, dict]: A tuple of figure data, figure layout

    """
    if specs:
        return resize_fig(
            fig.to_dict()["data"],
            fig.to_dict()["layout"],
            specs[i],
            new_axes_start,
            matches_axes,
        )

    fig_layout = {}
    if which_layout is None or which_layout == i:
        fig_layout.update(fig.to_dict()["layout"])

    return cast(Tuple, fig.data), fig_layout


def atomic_layer(
    *figs: DeephavenFigure | Figure,
    which_layout: int | None = None,
    specs: list[LayerSpecDict] | None = None,
    unsafe_update_figure: Callable = default_callback,
    remove_legend_title: bool = False,
) -> DeephavenFigure:
    """
    Layers the provided figures. This is an atomic version of layer, so the
    figures will be layered immediately and not added to the graph. This is
    used by plot by.
    See layer for more details about arguments.

    Args:
        *figs: The charts to layer
        which_layout:
            See layer
        specs:
            See layer
        unsafe_update_figure:
            See layer
        remove_legend_title:
            If True, the legend title will be removed from the resulting figure.
            This shouldn't always happen as plot by calls atomic_layer and the title
            should be kept, but is necessary for other layering and subplotting as
            they may not use the same plot by (and similar) columns, so the legend
            title would be incorrect.

    Returns:
        The layered chart
    """
    if len(figs) == 0:
        raise ValueError("No figures provided to compose")

    new_data = []
    new_layout = {}
    new_data_mappings = []
    new_has_template = False
    new_has_color = False
    new_calendar = False

    # when recreating axes, need to keep track of start of new axes
    new_axes_start = {"xaxis": 1, "yaxis": 1, "scene": 1, "polar": 1, "ternary": 1}

    matches_axes = {}

    for i, arg in enumerate(figs):
        if not arg:
            continue

        elif isinstance(arg, Figure):
            fig_data, fig_layout = fig_data_and_layout(
                arg, i, specs, which_layout, new_axes_start, matches_axes
            )

        elif isinstance(arg, DeephavenFigure):
            offset = len(new_data)
            if arg.get_has_subplots():
                raise NotImplementedError(
                    "Cannot currently add figure with subplots as a subplot"
                )

            plotly_fig = arg.get_plotly_fig()
            if plotly_fig is None:
                raise ValueError("Figure does not have a plotly figure, cannot layer")

            fig_data, fig_layout = fig_data_and_layout(
                plotly_fig,
                i,
                specs,
                which_layout,
                new_axes_start,
                matches_axes,
            )
            new_data_mappings += arg.copy_mappings(offset=offset)
            new_has_template = arg.get_has_template() or new_has_template
            new_has_color = arg.get_has_color() or new_has_color

            if which_layout is None or which_layout == i:
                # since calendar is translated to rangebreaks which are within the layout,
                # treat it similarly
                new_calendar = arg.calendar or new_calendar

        else:
            raise TypeError("All arguments must be of type Figure or DeephavenFigure")

        new_data += fig_data
        new_layout.update(fig_layout)

    new_fig = Figure(data=new_data, layout=new_layout)

    if remove_legend_title:
        new_fig.update_layout(legend_title_text=None)

    update_wrapper = partial(unsafe_figure_update_wrapper, unsafe_update_figure)

    return update_wrapper(
        DeephavenFigure(
            fig=new_fig,
            data_mappings=new_data_mappings,
            has_template=new_has_template,
            has_color=new_has_color,
            has_subplots=True if specs else False,
            calendar=new_calendar,
        )
    )


def layer(
    *figs: DeephavenFigure | Figure,
    which_layout: int | None = None,
    specs: list[LayerSpecDict] | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Layers the provided figures. Be default, the layouts are sequentially
    applied, so the layouts of later figures will override the layouts of early
    figures.

    Args:
      *figs: The charts to layer
      which_layout: None to layer layouts, or an
        index of which arg to take the layout from. Currently only valid if
        domains are not specified.
      specs: A list of dictionaries that contains keys of "x" and "y"
        that have values that are lists of two floats from 0 to 1. The chart
        that corresponds with a domain will be resized to that domain. Either
        x or y can be excluded if only resizing on one axis.
        Can also specify "xaxis_update" or "yaxis_update" with a dictionary
        value to update all axes with that dict.
        Can also specify "matched_xaxis" or "matched_yaxis" to add this figure
        to a match group. All figures with the same value of this group will
        have matching axes.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is not
        returned, the plotly figure passed will be assumed to be the return value.
        Used to add any custom changes to the underlying plotly figure. Note that
        the existing data traces should not be removed. This may lead to unexpected
        behavior if traces are modified in a way that break data mappings.

    Returns:
      The layered chart

    """

    args = locals()

    func = atomic_layer

    new_fig = atomic_layer(
        *figs,
        which_layout=which_layout,
        specs=specs,
        # remove the legend title as it is likely incorrect
        remove_legend_title=True,
        unsafe_update_figure=unsafe_update_figure,
    )

    exec_ctx = make_user_exec_ctx()

    new_fig.add_layer_to_graph(func, args, exec_ctx)

    return new_fig
