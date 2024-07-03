from __future__ import annotations

from typing import Callable

from deephaven.plot.express.shared import default_callback

from ._private_utils import process_args
from ..deephaven_figure import DeephavenFigure, draw_density_heatmap
from deephaven.table import Table


def density_heatmap(
    table: Table,
    x: str | None = None,
    y: str | None = None,
    z: str | None = None,
    labels: dict[str, str] = None,
    color_continuous_scale: str = "Viridis",
    range_color: list[float] = None,
    color_continuous_midpoint: float = None,
    opacity: float = 1.0,
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[float] | None = None,
    range_y: list[float] | None = None,
    range_bins_x: list[float | None] = None,
    range_bins_y: list[float | None] = None,
    histfunc: str = "count",
    nbinsx: int = 10,
    nbinsy: int = 10,
    title: str = None,
    template: str = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """
    Create a density heatmap

    Args:
      table: A table to pull data from.
      x: A column that contains x-axis values.
      y: A column that contains y-axis values.
      z: A column that contains z-axis values. If not provided, the count of joint occurrences of x and y will be used.
      labels: A dictionary of labels mapping columns to new labels.
      color_continuous_scale: A list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      log_x: A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      log_y: A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      range_x: A list of two numbers that specify the range of the x axes.
        None can be specified for no range
      range_y: A list of two numbers that specify the range of the y axes.
        None can be specified for no range
      range_bins_x: A list of two numbers that specify the range of data that is used for x.
      range_bins_y: A list of two numbers that specify the range of data that is used for y.
      histfunc: The function to use when aggregating within bins. One of
        'abs_sum', 'avg', 'count', 'count_distinct', 'max', 'median', 'min', 'std',
        'sum', or 'var'
      nbinsx: The number of bins to use for the x-axis
      nbinsy: The number of bins to use for the y-axis
      title: The title of the chart
      template: The template for the chart.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.



    Returns:
        DeephavenFigure: A DeephavenFigure that contains the density heatmap
    """
    args = locals()

    return process_args(args, {"preprocess_heatmap"}, px_func=draw_density_heatmap)
