from __future__ import annotations

from typing import Callable

from plotly import express as px

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure, Calendar
from ..types import PartitionableTableLike


def area(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] | None = "color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    pattern_shape: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    size: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    pattern_shape_sequence: list[str] | None = None,
    pattern_shape_map: dict[str | tuple[str], str] | None = None,
    symbol_sequence: list[str] | None = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
    size_sequence: list[int] | None = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
    xaxis_sequence: list[str] | None = None,
    yaxis_sequence: list[str] | None = None,
    markers: bool = False,
    groupnorm: str | None = None,
    log_x: bool | list[bool] = False,
    log_y: bool | list[bool] = False,
    range_x: list[int] | list[list[int]] | None = None,
    range_y: list[int] | list[list[int]] | None = None,
    yaxis_titles: list[str] | None = None,
    xaxis_titles: list[str] | None = None,
    line_shape: str = "linear",
    title: str | None = None,
    template: str | None = None,
    calendar: Calendar = False,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns an area chart

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
      y: A column or list of columns that contain y-axis values.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain size, color, pattern_shape, and symbol.
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
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      pattern_shape: A column or list of columns that contain pattern shape values.
        The value is used for a plot by on pattern shape.
        See pattern_shape_map for additional behaviors.
      symbol: A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See symbol_map for additional behaviors.
      size: A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      pattern_shape_sequence: A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      pattern_shape_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to patterns.
      symbol_sequence: A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series
        than symbols, symbols will be reused.
      symbol_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
        If "identity", the values are taken as literal symbols.
        If "by" or ("by", dict) where dict is as described above, the symbols are forced to by
      size_sequence: A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused.
      size_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      xaxis_sequence: A list of x axes to assign series to. Odd numbers
        starting with 1 are created on the bottom x axis and even numbers starting
        with 2 are created on the top x axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
      yaxis_sequence: A list of y axes to assign series to. Odd numbers
        starting with 1 are created on the left y axis and even numbers starting
        with 2 are created on the top y axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
      markers: True to draw markers on the line, False to not. Default False
      groupnorm:  Set to 'fraction' to plot the fraction out of
        the total value of all points at that x value, 'percent' to take the
        fraction and multiply by 100. Note that if multiple y axes are
        specified, the groupnorm is taken per axis.
      log_x: A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      log_y: A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      range_x: A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      range_y: A list of two numbers or a list of lists of two numbers
        that specify the range of the y axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      yaxis_titles: A list of titles to sequentially apply to the y axes. The titles do not
        loop.
      xaxis_titles: A list of titles to sequentially apply to the x axes. The titles do not
        loop.
      line_shape: The line shape for all lines created. One of 'linear',
        'spline', 'vhv', 'hvh', 'vh', 'hv'. Default 'linear'
      title: The title of the chart
      template: The template for the chart.
      calendar: A boolean, BusinessCalendar or string that specifies a calendar to use for the chart.
        By default, False and no calendar is used. If True, the default calendar is used.
        If a string, the calendar with that name is used. If a BusinessCalendar is passed,
        that calendar is used.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the area chart

    """
    args = locals()

    return process_args(args, {"area", "line", "supports_lists"}, px_func=px.area)
