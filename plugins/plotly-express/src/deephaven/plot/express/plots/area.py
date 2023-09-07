from __future__ import annotations

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ._update_wrapper import default_callback
from ..deephaven_figure import DeephavenFigure


def area(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    pattern_shape: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    pattern_shape_sequence: list[str] = None,
    pattern_shape_map: dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    xaxis_sequence: list[str] = None,
    yaxis_sequence: list[str] = None,
    markers: bool = False,
    groupnorm: str = None,
    log_x: bool | list[bool] = False,
    log_y: bool | list[bool] = False,
    range_x: list[int] | list[list[int]] = None,
    range_y: list[int] | list[list[int]] = None,
    yaxis_titles: list[str] = None,
    xaxis_titles: list[str] = None,
    line_shape: str = "linear",
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns an area chart

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column or list of columns that contain x-axis values.
      y: str | list[str]:  (Default value = None)
        A column or list of columns that contain y-axis values.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, color, pattern_shape, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      pattern_shape: str | list[str]: (Default value = None)
        A column or list of columns that contain pattern shape values.
        The value is used for a plot by on pattern shape.
        See pattern_shape_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See symbol_map for additional behaviors.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      text: str:  (Default value = None)
        A column that contains text annotations.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      pattern_shape_sequence: list[str]:  (Default value = None)
        A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      pattern_shape_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to patterns.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series
        than symbols, symbols will be reused.
      symbol_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
        If "identity", the values are taken as literal symbols.
        If "by" or ("by", dict) where dict is as described above, the symbols are forced to by
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      xaxis_sequence: list[str]:  (Default value = None)
        A list of x axes to assign series to. Odd numbers
        starting with 1 are created on the bottom x axis and even numbers starting
        with 2 are created on the top x axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
      yaxis_sequence: list[str]:  (Default value = None)
        A list of y axes to assign series to. Odd numbers
        starting with 1 are created on the left y axis and even numbers starting
        with 2 are created on the top y axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
      markers: bool:  (Default value = False)
        True to draw markers on the line, False to not. Default False
      groupnorm: str: (Default value = None)
        Set to 'fraction' to plot the fraction out of
        the total value of all points at that x value, 'percent' to take the
        fraction and multiply by 100. Note that if multiple y axes are
        specified, the groupnorm is taken per axis.
      log_x: bool | list[bool]:  (Default value = False)
        A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      log_y: bool | list[bool]:  (Default value = False)
        A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      range_x: list[int] | list[list[int]]:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      range_y: list[int] | list[list[int]]:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the y axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      yaxis_titles: list[str]:  (Default value = None)
        A list of titles to sequentially apply to the y axes. The titles do not
          loop.
      xaxis_titles: list[str]:  (Default value = None)
        A list of titles to sequentially apply to the x axes. The titles do not
          loop.
      line_shape: str:  (Default value = 'linear')
        The line shape for all lines created. One of 'linear',
        'spline', 'vhv', 'hvh', 'vh', 'hv'. Default 'linear'
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the area chart

    """
    args = locals()

    return process_args(args, {"area", "line", "supports_lists"}, px_func=px.area)
