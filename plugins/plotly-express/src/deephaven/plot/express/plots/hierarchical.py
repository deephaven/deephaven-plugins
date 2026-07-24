from __future__ import annotations

from typing import Callable

from plotly import express as px

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure
from ..types import TableLike, ChartPreventableEventCallback, ChartEventCallback


def treemap(
    table: TableLike,
    names: str | None = None,
    values: str | None = None,
    parents: str | None = None,
    ids: str | None = None,
    path: str | list[str] | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[float] | None = None,
    color_continuous_midpoint: float | None = None,
    labels: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    branchvalues: str | None = None,
    maxdepth: int | None = None,
    unsafe_update_figure: Callable = default_callback,
    on_click: ChartPreventableEventCallback | None = None,
    on_press: ChartPreventableEventCallback | None = None,
    on_double_click: ChartEventCallback | None = None,
    on_double_press: ChartEventCallback | None = None,
    on_selected: ChartEventCallback | None = None,
    on_deselect: ChartEventCallback | None = None,
    on_relayout: ChartEventCallback | None = None,
    on_legend_click: ChartPreventableEventCallback | None = None,
    on_legend_double_click: ChartPreventableEventCallback | None = None,
    on_click_annotation: ChartEventCallback | None = None,
    on_web_gl_context_lost: ChartEventCallback | None = None,
) -> DeephavenFigure:
    """Returns a treemap chart

    Args:
      table: A table to pull data from.
      names: The column containing names of the sections
      values: The column containing values of the sections
      parents: The column containing parents of the sections
      ids: The column containing ids of the sections. Unlike values, these
        must be unique. Values are used for ids if ids are not specified.
      path: A column or list of columns that describe the hierarchy.
        The first column is the root, the second column contains the children
        of the root, and so on. The last column is the leaf.
      color: A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        If path is provided, only a single color column is allowed.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      color_continuous_scale: A list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      title: The title of the chart
      template: The template for the chart.
      branchvalues: Set to 'total' to take the value at a level to include
        all descendants and 'remainder' to the value as the remainder after
        subtracting leaf values.
      maxdepth: Sets the total number of visible levels. Set to -1 to
        render all levels.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.
      on_click: A callback function that is called when a point is clicked.
        The function receives a dict with 'points' (list of clicked point data)
        and 'modifiers' (keyboard state). On hierarchical charts (sunburst,
        treemap, icicle), return False to prevent drill-down. The return value
        is ignored on other chart types.
      on_press: Alias for on_click.
      on_double_click: A callback function that is called on double-click.
        The function receives a dict with 'modifiers' (keyboard state).
        Fires in zoom/pan mode only; in select mode, on_deselect fires instead.
      on_double_press: Alias for on_double_click.
      on_selected: A callback function that is called when a box or lasso
        selection completes. The function receives a dict with 'points' (list
        of selected point data), 'range' (for box select), and 'modifiers'.
      on_deselect: A callback function that is called when the selection is
        cleared (e.g., by double-clicking on an empty area).
      on_relayout: A callback function that is called when the chart layout
        changes due to user interaction (pan, zoom, axis reset, etc.). The
        function receives a dict of the layout keys that changed.
      on_legend_click: A callback function that is called when a legend item
        is clicked. Return False to prevent the default trace visibility toggle.
        Return True or None to allow it.
      on_legend_double_click: A callback function that is called when a legend
        item is double-clicked. Return False to prevent the default
        isolate/show-all toggle. Return True or None to allow it.
      on_click_annotation: A callback function that is called when an
        annotation is clicked. The function receives a dict with 'index',
        'annotation', and 'modifiers'.
      on_web_gl_context_lost: A callback function that is called when the
        WebGL rendering context is lost (e.g., GPU reclaims resources).

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the treemap chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.treemap)


def sunburst(
    table: TableLike,
    names: str | None = None,
    values: str | None = None,
    parents: str | None = None,
    ids: str | None = None,
    path: str | list[str] | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[float] | None = None,
    color_continuous_midpoint: float | None = None,
    labels: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    branchvalues: str | None = None,
    maxdepth: int | None = None,
    unsafe_update_figure: Callable = default_callback,
    on_click: ChartPreventableEventCallback | None = None,
    on_press: ChartPreventableEventCallback | None = None,
    on_double_click: ChartEventCallback | None = None,
    on_double_press: ChartEventCallback | None = None,
    on_selected: ChartEventCallback | None = None,
    on_deselect: ChartEventCallback | None = None,
    on_relayout: ChartEventCallback | None = None,
    on_legend_click: ChartPreventableEventCallback | None = None,
    on_legend_double_click: ChartPreventableEventCallback | None = None,
    on_click_annotation: ChartEventCallback | None = None,
    on_web_gl_context_lost: ChartEventCallback | None = None,
) -> DeephavenFigure:
    """Returns a sunburst chart

    Args:
      table: A table to pull data from.
      names: The column containing names of the sections
      values: The column containing values of the sections
      parents: The column containing parents of the sections
      ids: The column containing ids of the sections. Unlike values, these
        must be unique. Values are used for ids if ids are not specified.
      path: A column or list of columns that describe the hierarchy.
        The first column is the root, the second column contains the children
        of the root, and so on. The last column is the leaf.
      color: A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        If path is provided, only a single color column is allowed.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contains names to bold in the hover tooltip.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      color_continuous_scale: A list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      labels: A dictionary of labels mapping columns to new labels.
      title: The title of the chart
      template: The template for the chart.
      branchvalues: Set to 'total' to take the value at a level to include
        all descendants and 'remainder' to the value as the remainder after
        subtracting leaf values.
      maxdepth: Sets the total number of visible levels. Set to -1 to
        render all levels.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.
      on_click: A callback function that is called when a point is clicked.
        The function receives a dict with 'points' (list of clicked point data)
        and 'modifiers' (keyboard state). On hierarchical charts (sunburst,
        treemap, icicle), return False to prevent drill-down. The return value
        is ignored on other chart types.
      on_press: Alias for on_click.
      on_double_click: A callback function that is called on double-click.
        The function receives a dict with 'modifiers' (keyboard state).
        Fires in zoom/pan mode only; in select mode, on_deselect fires instead.
      on_double_press: Alias for on_double_click.
      on_selected: A callback function that is called when a box or lasso
        selection completes. The function receives a dict with 'points' (list
        of selected point data), 'range' (for box select), and 'modifiers'.
      on_deselect: A callback function that is called when the selection is
        cleared (e.g., by double-clicking on an empty area).
      on_relayout: A callback function that is called when the chart layout
        changes due to user interaction (pan, zoom, axis reset, etc.). The
        function receives a dict of the layout keys that changed.
      on_legend_click: A callback function that is called when a legend item
        is clicked. Return False to prevent the default trace visibility toggle.
        Return True or None to allow it.
      on_legend_double_click: A callback function that is called when a legend
        item is double-clicked. Return False to prevent the default
        isolate/show-all toggle. Return True or None to allow it.
      on_click_annotation: A callback function that is called when an
        annotation is clicked. The function receives a dict with 'index',
        'annotation', and 'modifiers'.
      on_web_gl_context_lost: A callback function that is called when the
        WebGL rendering context is lost (e.g., GPU reclaims resources).

    Returns:
      A DeephavenFigure that contains the sunburst chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.sunburst)


def icicle(
    table: TableLike,
    names: str | None = None,
    values: str | None = None,
    parents: str | None = None,
    ids: str | None = None,
    path: str | list[str] | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[float] | None = None,
    color_continuous_midpoint: float | None = None,
    labels: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    branchvalues: str | None = None,
    maxdepth: int | None = None,
    unsafe_update_figure: Callable = default_callback,
    on_click: ChartPreventableEventCallback | None = None,
    on_press: ChartPreventableEventCallback | None = None,
    on_double_click: ChartEventCallback | None = None,
    on_double_press: ChartEventCallback | None = None,
    on_selected: ChartEventCallback | None = None,
    on_deselect: ChartEventCallback | None = None,
    on_relayout: ChartEventCallback | None = None,
    on_legend_click: ChartPreventableEventCallback | None = None,
    on_legend_double_click: ChartPreventableEventCallback | None = None,
    on_click_annotation: ChartEventCallback | None = None,
    on_web_gl_context_lost: ChartEventCallback | None = None,
) -> DeephavenFigure:
    """Returns a icicle chart

    Args:
      table: A table to pull data from.
      names: The column containing names of the sections
      values: The column containing values of the sections
      parents: The column containing parents of the sections
      ids: The column containing ids of the sections. Unlike values, these
        must be unique. Values are used for ids if ids are not specified.
      path: A column or list of columns that describe the hierarchy.
        The first column is the root, the second column contains the children
        of the root, and so on. The last column is the leaf.
      color: A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        If path is provided, only a single color column is allowed.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contains names to bold in the hover tooltip.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      color_continuous_scale: A list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      labels: A dictionary of labels mapping columns to new labels.
      title: The title of the chart
      template: The template for the chart.
      branchvalues: Set to 'total' to take the value at a level to include
        all descendants and 'remainder' to the value as the remainder after
        subtracting leaf values.
      maxdepth: Sets the total number of visible levels. Set to -1 to
        render all levels.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.
      on_click: A callback function that is called when a point is clicked.
        The function receives a dict with 'points' (list of clicked point data)
        and 'modifiers' (keyboard state). On hierarchical charts (sunburst,
        treemap, icicle), return False to prevent drill-down. The return value
        is ignored on other chart types.
      on_press: Alias for on_click.
      on_double_click: A callback function that is called on double-click.
        The function receives a dict with 'modifiers' (keyboard state).
        Fires in zoom/pan mode only; in select mode, on_deselect fires instead.
      on_double_press: Alias for on_double_click.
      on_selected: A callback function that is called when a box or lasso
        selection completes. The function receives a dict with 'points' (list
        of selected point data), 'range' (for box select), and 'modifiers'.
      on_deselect: A callback function that is called when the selection is
        cleared (e.g., by double-clicking on an empty area).
      on_relayout: A callback function that is called when the chart layout
        changes due to user interaction (pan, zoom, axis reset, etc.). The
        function receives a dict of the layout keys that changed.
      on_legend_click: A callback function that is called when a legend item
        is clicked. Return False to prevent the default trace visibility toggle.
        Return True or None to allow it.
      on_legend_double_click: A callback function that is called when a legend
        item is double-clicked. Return False to prevent the default
        isolate/show-all toggle. Return True or None to allow it.
      on_click_annotation: A callback function that is called when an
        annotation is clicked. The function receives a dict with 'index',
        'annotation', and 'modifiers'.
      on_web_gl_context_lost: A callback function that is called when the
        WebGL rendering context is lost (e.g., GPU reclaims resources).

    Returns:
      A DeephavenFigure that contains the icicle chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.icicle)


def funnel(
    table: TableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    opacity: float | None = None,
    orientation: str | None = None,
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
    on_click: ChartPreventableEventCallback | None = None,
    on_press: ChartPreventableEventCallback | None = None,
    on_double_click: ChartEventCallback | None = None,
    on_double_press: ChartEventCallback | None = None,
    on_selected: ChartEventCallback | None = None,
    on_deselect: ChartEventCallback | None = None,
    on_relayout: ChartEventCallback | None = None,
    on_legend_click: ChartPreventableEventCallback | None = None,
    on_legend_double_click: ChartPreventableEventCallback | None = None,
    on_click_annotation: ChartEventCallback | None = None,
    on_web_gl_context_lost: ChartEventCallback | None = None,
) -> DeephavenFigure:
    """Returns a funnel chart

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
      y: A column or list of columns that contain y-axis values.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color and pattern_shape.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      filter_by: A column or list of columns that contain values to filter the chart by.
        If a boolean is passed and the table is partitioned, all partition key columns used to
        create the partitions are used.
        If no filters are specified, all partitions are shown on the chart.
      required_filter_by: A column or list of columns that contain values to filter the chart by.
        Values set in input filters or linkers for the relevant columns determine the exact values to display.
        If a boolean is passed and the table is partitioned, all partition key columns used to
        create the partitions are used.
        All required input filters or linkers must be set for the chart to display any data.
      color: A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      orientation: "h" for horizontal or "v" for vertical
      log_x: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: A list of two numbers that specify the range of the x-axis.
      range_y: A list of two numbers that specify the range of the y-axis.
      title: The title of the chart
      template: The template for the chart.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.
      on_click: A callback function that is called when a point is clicked.
        The function receives a dict with 'points' (list of clicked point data)
        and 'modifiers' (keyboard state). On hierarchical charts (sunburst,
        treemap, icicle), return False to prevent drill-down. The return value
        is ignored on other chart types.
      on_press: Alias for on_click.
      on_double_click: A callback function that is called on double-click.
        The function receives a dict with 'modifiers' (keyboard state).
        Fires in zoom/pan mode only; in select mode, on_deselect fires instead.
      on_double_press: Alias for on_double_click.
      on_selected: A callback function that is called when a box or lasso
        selection completes. The function receives a dict with 'points' (list
        of selected point data), 'range' (for box select), and 'modifiers'.
      on_deselect: A callback function that is called when the selection is
        cleared (e.g., by double-clicking on an empty area).
      on_relayout: A callback function that is called when the chart layout
        changes due to user interaction (pan, zoom, axis reset, etc.). The
        function receives a dict of the layout keys that changed.
      on_legend_click: A callback function that is called when a legend item
        is clicked. Return False to prevent the default trace visibility toggle.
        Return True or None to allow it.
      on_legend_double_click: A callback function that is called when a legend
        item is double-clicked. Return False to prevent the default
        isolate/show-all toggle. Return True or None to allow it.
      on_click_annotation: A callback function that is called when an
        annotation is clicked. The function receives a dict with 'index',
        'annotation', and 'modifiers'.
      on_web_gl_context_lost: A callback function that is called when the
        WebGL rendering context is lost (e.g., GPU reclaims resources).

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the funnel chart

    """
    args = locals()

    return process_args(args, {"marker", "supports_lists"}, px_func=px.funnel)


def funnel_area(
    table: TableLike,
    names: str | None = None,
    values: str | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    title: str | None = None,
    template: str | None = None,
    opacity: float | None = None,
    unsafe_update_figure: Callable = default_callback,
    on_click: ChartPreventableEventCallback | None = None,
    on_press: ChartPreventableEventCallback | None = None,
    on_double_click: ChartEventCallback | None = None,
    on_double_press: ChartEventCallback | None = None,
    on_selected: ChartEventCallback | None = None,
    on_deselect: ChartEventCallback | None = None,
    on_relayout: ChartEventCallback | None = None,
    on_legend_click: ChartPreventableEventCallback | None = None,
    on_legend_double_click: ChartPreventableEventCallback | None = None,
    on_click_annotation: ChartEventCallback | None = None,
    on_web_gl_context_lost: ChartEventCallback | None = None,
) -> DeephavenFigure:
    """Returns a funnel area chart

    Args:
      table: A table to pull data from.
      names: The column containing names of the sections
      values: The column containing values of the sections
      color: A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      title: The title of the chart
      template: The template for the chart.
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.
      on_click: A callback function that is called when a point is clicked.
        The function receives a dict with 'points' (list of clicked point data)
        and 'modifiers' (keyboard state). On hierarchical charts (sunburst,
        treemap, icicle), return False to prevent drill-down. The return value
        is ignored on other chart types.
      on_press: Alias for on_click.
      on_double_click: A callback function that is called on double-click.
        The function receives a dict with 'modifiers' (keyboard state).
        Fires in zoom/pan mode only; in select mode, on_deselect fires instead.
      on_double_press: Alias for on_double_click.
      on_selected: A callback function that is called when a box or lasso
        selection completes. The function receives a dict with 'points' (list
        of selected point data), 'range' (for box select), and 'modifiers'.
      on_deselect: A callback function that is called when the selection is
        cleared (e.g., by double-clicking on an empty area).
      on_relayout: A callback function that is called when the chart layout
        changes due to user interaction (pan, zoom, axis reset, etc.). The
        function receives a dict of the layout keys that changed.
      on_legend_click: A callback function that is called when a legend item
        is clicked. Return False to prevent the default trace visibility toggle.
        Return True or None to allow it.
      on_legend_double_click: A callback function that is called when a legend
        item is double-clicked. Return False to prevent the default
        isolate/show-all toggle. Return True or None to allow it.
      on_click_annotation: A callback function that is called when an
        annotation is clicked. The function receives a dict with 'index',
        'annotation', and 'modifiers'.
      on_web_gl_context_lost: A callback function that is called when the
        WebGL rendering context is lost (e.g., GPU reclaims resources).

    Returns:
      A DeephavenFigure that contains the funnel area chart

    """

    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.funnel_area)
