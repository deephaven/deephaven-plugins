from __future__ import annotations

from typing import Callable

from plotly import express as px

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure
from ..types import TableLike, ChartPreventableEventCallback, ChartEventCallback


def pie(
    table: TableLike,
    names: str | None = None,
    values: str | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    opacity: float | None = None,
    hole: float | None = None,
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
    """Returns a pie chart


    Args:
      table: A table to pull data from.
      names: The column containing names of the pie slices
      values: The column containing values of the pie slices
      color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contain names to bold in the hover tooltip..
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
      hole: Fraction of the radius to cut out of the center of the pie.
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
      A DeephavenFigure that contains the pie chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.pie)
