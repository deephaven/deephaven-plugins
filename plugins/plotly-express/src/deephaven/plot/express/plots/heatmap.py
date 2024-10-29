from __future__ import annotations

from typing import Callable, Literal

from deephaven.plot.express.shared import default_callback

from ._private_utils import process_args
from ..deephaven_figure import DeephavenFigure, draw_density_heatmap
from ..types import TableLike


def density_heatmap(
    table: TableLike,
    x: str | None = None,
    y: str | None = None,
    z: str | None = None,
    labels: dict[str, str] | None = None,
    color_continuous_scale: str | list[str] | None = None,
    range_color: list[float] | None = None,
    color_continuous_midpoint: float | None = None,
    opacity: float = 1.0,
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[float] | None = None,
    range_y: list[float] | None = None,
    range_bins_x: list[float | None] | None = None,
    range_bins_y: list[float | None] | None = None,
    histfunc: str = "count",
    nbinsx: int = 10,
    nbinsy: int = 10,
    empty_bin_default: float | Literal["NaN"] | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """
    A density heatmap creates a grid of colored bins. Each bin represents an aggregation of data points in that region.

    Args:
      table: A table to pull data from.
      x: A column that contains x-axis values.
      y: A column that contains y-axis values.
      z: A column that contains z-axis values. If not provided, the count of joint occurrences of x and y will be used.
      labels: A dictionary of labels mapping columns to new labels.
      color_continuous_scale: A color scale or list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      log_x: A boolean that specifies if the corresponding axis is a log axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log axis or not.
      range_x: A list of two numbers that specify the range of the x axes.
        None can be specified for no range
      range_y: A list of two numbers that specify the range of the y axes.
        None can be specified for no range
      range_bins_x: A list of two numbers that specify the range of data that is used for x.
        None can be specified to use the min and max of the data.
        None can also be specified for either of the list values to use the min or max of the data, respectively.
      range_bins_y: A list of two numbers that specify the range of data that is used for y.
        None can be specified to use the min and max of the data.
        None can also be specified for either of the list values to use the min or max of the data, respectively.
      histfunc: The function to use when aggregating within bins. One of
        'abs_sum', 'avg', 'count', 'count_distinct', 'max', 'median', 'min', 'std',
        'sum', or 'var'
      nbinsx: The number of bins to use for the x-axis
      nbinsy: The number of bins to use for the y-axis
      empty_bin_default: The value to use for bins that have no data.
        If None and histfunc is 'count' or 'count_distinct', 0 is used.
        Otherwise, if None or 'NaN', NaN is used.
        'NaN' forces the bin to be NaN if no data is present, even if histfunc is 'count' or 'count_distinct'.
        Note that if multiple points are required to color a bin, such as the case for a histfunc of 'std' or var,
        the bin will still be NaN if less than the required number of points are present.
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
