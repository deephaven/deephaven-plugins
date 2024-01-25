from __future__ import annotations

from numbers import Number
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure

# The functions in this file are exempt from the styleguide rule that types should not be in the description if there
# is a type annotation.


def scatter(
    table: Table | None = None,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    error_x: str | None = None,
    error_x_minus: str | None = None,
    error_y: str | None = None,
    error_y_minus: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    size: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
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
    color_continuous_scale: list[str] | None = None,
    range_color: list[Number] | None = None,
    color_continuous_midpoint: Number | None = None,
    xaxis_sequence: list[int] | None = None,
    yaxis_sequence: list[int] | None = None,
    opacity: float | None = None,
    marginal_x: str | None = None,
    marginal_y: str | None = None,
    log_x: bool | list[bool] | None = False,
    log_y: bool | list[bool] = False,
    range_x: list[int] | list[list[int]] | None = None,
    range_y: list[int] | list[list[int]] | None = None,
    yaxis_titles: list[str] | None = None,
    xaxis_titles: list[str] | None = None,
    title: str | None = None,
    template: str | None = None,
    render_mode: str = "webgl",
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a scatter chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      x: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain x-axis values.
      y: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain y-axis values.
      by: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str] | None: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      error_x: str | None:  (Default value = None)
        A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_x_minus is not specified, and the error bars in
        only the positive direction if error_x_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_x_minus: str | None:  (Default value = None)
        A column with x error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_x is not specified.
      error_y: str | None:  (Default value = None)
        A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_y_minus is not specified, and the error bars in
        only the positive direction if error_y_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_y_minus: str | None:  (Default value = None)
        A column with y error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_y is not specified.
      text: str | None:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      symbol_sequence: list[str] | None:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      symbol_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
        If "identity", the values are taken as literal symbols.
        If "by" or ("by", dict) where dict is as described above, the symbols are forced to by
      size_sequence: list[str] | None:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      xaxis_sequence: list[str] | None:  (Default value = None)
        A list of x axes to assign series to. Odd numbers
        starting with 1 are created on the bottom x axis and even numbers starting
        with 2 are created on the top x axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
      yaxis_sequence: list[str] | None:  (Default value = None)
        A list of y axes to assign series to. Odd numbers
        starting with 1 are created on the left y axis and even numbers starting
        with 2 are created on the top y axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
      color_continuous_scale: list[str] | None: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number] | None: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number | None: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float | None:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      marginal_x: str | None:  (Default value = None)
        The type of x-axis marginal; histogram, violin, rug, box
      marginal_y: str | None:  (Default value = None)
        The type of y-axis marginal; histogram, violin, rug, box
      log_x: bool | list[bool]:  (Default value = False)
        A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      log_y: bool | list[bool]:  (Default value = False)
        A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      range_x: list[int] | list[list[int]] | None:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      range_y: list[int] | list[list[int]] | None:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the y axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      yaxis_titles: list[str] | None:  (Default value = None)
        A list of titles to sequentially apply to the y axes. The titles do not
          loop.
      xaxis_titles: list[str] | None:  (Default value = None)
        A list of titles to sequentially apply to the x axes. The titles do not
          loop.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
        The template for the chart.
      render_mode: str (Default value = "webgl")
        Either "svg" or "webgl". The default is "webgl" as it leads to a more
        performant plot but there may be graphical bugs, in which case it is
        recommended to switch to "svg"
      unsafe_update_figure:  Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the scatter chart

    """

    args = locals()

    return process_args(args, {"scatter", "supports_lists"}, px_func=px.scatter)


def scatter_3d(
    table: Table | None = None,
    x: str | None = None,
    y: str | None = None,
    z: str | None = None,
    error_x: str | None = None,
    error_x_minus: str | None = None,
    error_y: str | None = None,
    error_y_minus: str | None = None,
    error_z: str | None = None,
    error_z_minus: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    size: str | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
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
    color_continuous_scale: list[str] | None = None,
    range_color: list[Number] | None = None,
    color_continuous_midpoint: Number | None = None,
    opacity: float | None = None,
    log_x: bool = False,
    log_y: bool = False,
    log_z: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    range_z: list[int] | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a 3D scatter chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      x: str | None:  (Default value = None)
        A column that contains x-axis values.
      y: str | None:  (Default value = None)
        A column that contains y-axis values.
      z: str | None:  (Default value = None)
        A column that contains z-axis values.
      by: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str] | None: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      error_x: str | None:  (Default value = None)
        A column with x error bar values. These form the error
        bars in both the positive and negative direction if error_x_minus
        is not specified, and the error bars in only the positive direction if
        error_x_minus is specified.
      error_x_minus: str | None:  (Default value = None)
        A column with x error bar values. These form
        the error bars in the negative direction, and are ignored if error_x
        is not specified.
      error_y: str | None:  (Default value = None)
        A column with y error bar values. These form the error
        bars in both the positive and negative direction if error_y_minus
        is not specified, and the error bars in only the positive direction if
        error_y_minus is specified.
      error_y_minus: str | None:  (Default value = None)
        A column with y error bar values. These form
        the error bars in the negative direction, and are ignored if error_y
        is not specified.
      error_z: str | None:  (Default value = None)
        A column with z error bar values. These form the error
        bars in both the positive and negative direction if error_z_minus
        is not specified, and the error bars in only the positive direction if
        error_z_minus is specified.
      error_z_minus: str | None:  (Default value = None)
        A column with z error bar values. These form
        the error bars in the negative direction, and are ignored if error_z
        is not specified.
      text: str | None:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      symbol_sequence: list[str] | None:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      symbol_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
        If "identity", the values are taken as literal symbols.
        If "by" or ("by", dict) where dict is as described above, the symbols are forced to by
      size_sequence: list[str] | None:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str] | None: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number] | None: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number | None: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float | None:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      log_x: bool:  (Default value = False)
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: bool:  (Default value = False)
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_z: bool:  (Default value = False)
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: list[int] | None:  (Default value = None)
        A list of two numbers that specify the range of the x axis.
      range_y: list[int] | None:  (Default value = None)
        A list of two numbers that specify the range of the y axis.
      range_z: list[int] | None:  (Default value = None)
        A list of two numbers that specify the range of the z axis.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
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
      A DeephavenFigure that contains the 3D scatter chart

    """
    args = locals()

    return process_args(args, {"scatter", "scene"}, px_func=px.scatter_3d)


def scatter_polar(
    table: Table | None = None,
    r: str | None = None,
    theta: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    size: str | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
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
    color_continuous_scale: list[str] | None = None,
    range_color: list[Number] | None = None,
    color_continuous_midpoint: Number | None = None,
    opacity: float | None = None,
    direction: str = "clockwise",
    start_angle: int = 90,
    range_r: list[int] | None = None,
    range_theta: list[int] | None = None,
    log_r: bool = False,
    title: str | None = None,
    template: str | None = None,
    render_mode="webgl",
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a polar scatter chart

    Args:
      table: Table | None:  (Default value = None)
        A table to pull data from.
      r: str | None:  (Default value = None)
        A column that contains r values.
      theta: str | None:  (Default value = None)
        A column that contains theta values.
      by: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str] | None: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      text: str | None:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      symbol_sequence: list[str] | None:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      symbol_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
        If "identity", the values are taken as literal symbols.
        If "by" or ("by", dict) where dict is as described above, the symbols are forced to by
      size_sequence: list[str] | None:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str] | None: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number] | None: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number | None: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float | None:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      direction: (Default value = 'clockwise')
        Which direction points are drawn. Can be 'clockwise' or
        'counterclockwise'
      start_angle: int:  (Default value = 90)
        Sets start angle.
      range_r: list[int] | None:  (Default value = None)
        A list of two numbers that specify the range of r.
      range_theta: list[int] | None:  (Default value = None)
        A list of two numbers that specify the range of theta.
      log_r: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      title: str | None:: (Default value = None)
        The title of the chart
      template: str | None::  (Default value = None)
        The template for the chart.
      render_mode: str (Default value = "webgl")
        Either "svg" or "webgl". The default is "webgl" as it leads to a more
        performant plot but there may be graphical bugs, in which case it is
        recommended to switch to "svg"
      unsafe_update_figure:  Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the polar scatter chart

    """
    args = locals()

    return process_args(args, {"scatter"}, px_func=px.scatter_polar)


def scatter_ternary(
    table: Table | None = None,
    a: str | None = None,
    b: str | None = None,
    c: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    size: str | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
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
    color_continuous_scale: list[str] | None = None,
    range_color: list[Number] | None = None,
    color_continuous_midpoint: Number | None = None,
    opacity: float | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a ternary scatter chart

    Args:
      table: Table | None::  (Default value = None)
        A table to pull data from.
      a: str | None:  (Default value = None)
        A column that contains a-axis values.
      b: str | None:  (Default value = None)
        A column that contains b-axis values.
      c: str | None:  (Default value = None)
        A column that contains c-axis values.
      by: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str] | None:: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str] | None: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str] | None:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      text: str | None:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | None:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence | None: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      symbol_sequence: list[str] | None::  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      symbol_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
        If "identity", the values are taken as literal symbols.
        If "by" or ("by", dict) where dict is as described above, the symbols are forced to by
      size_sequence: list[str] | None:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str] | None: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number] | None: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number | None: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float | None:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
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
      A DeephavenFigure that contains the ternary scatter chart

    """
    args = locals()

    return process_args(args, {"scatter"}, px_func=px.scatter_ternary)


def _scatter_matrix():
    """ """
    # todo: not yet implemented
    pass
