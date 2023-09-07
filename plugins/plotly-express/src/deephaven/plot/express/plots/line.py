from __future__ import annotations

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ._update_wrapper import default_callback
from ..deephaven_figure import DeephavenFigure


def line(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    error_x: str = None,
    error_x_minus: str = None,
    error_y: str = None,
    error_y_minus: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    size: str | list[str] = None,
    line_dash: str | list[str] = None,
    width: str | list[str] = None,
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    line_dash_sequence: list[str] = None,
    line_dash_map: dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    width_sequence: list[int] = None,
    width_map: dict[str | tuple[str], str] = None,
    xaxis_sequence: list[str] = None,
    yaxis_sequence: list[str] = None,
    markers: bool = False,
    log_x: bool | list[bool] = False,
    log_y: bool | list[bool] = False,
    range_x: list[int] | list[list[int]] = None,
    range_y: list[int] | list[list[int]] = None,
    yaxis_titles: list[str] = None,
    xaxis_titles: list[str] = None,
    line_shape: str = "linear",
    title: str = None,
    template: str = None,
    render_mode="svg",
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a line chart

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
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: str | list[str]: (Default value = None)
        A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: str | list[str]: (Default value = None)
        A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      error_x: str:  (Default value = None)
        A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_x_minus is not specified, and the error bars in
        only the positive direction if error_x_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_x_minus: str:  (Default value = None)
        A column with x error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_x is not specified.
      error_y: str:  (Default value = None)
        A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_y_minus is not specified, and the error bars in
        only the positive direction if error_y_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_y_minus: str:  (Default value = None)
        A column with y error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_y is not specified.
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
      line_dash_sequence: list[str]:  (Default value = None)
        A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
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
      width_sequence: list[str]:  (Default value = None)
        A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
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
      render_mode: str (Default value = "svg")
        Either "svg" or "webgl". Setting to "webgl" will lead to a more
        performant plot but there may be graphical bugs.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.


    Returns:
      DeephavenFigure: A DeephavenFigure that contains the line chart

    """
    args = locals()

    return process_args(args, {"line", "supports_lists"}, px_func=px.line)


def line_3d(
    table: Table = None,
    x: str = None,
    y: str = None,
    z: str = None,
    error_x: str = None,
    error_x_minus: str = None,
    error_y: str = None,
    error_y_minus: str = None,
    error_z: str = None,
    error_z_minus: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    size: str = None,
    line_dash: str | list[str] = None,
    width: str | list[str] = None,
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    line_dash_sequence: list[str] = None,
    line_dash_map: dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    width_sequence: list[int] = None,
    width_map: dict[str | tuple[str], str] = None,
    markers: bool = False,
    log_x: bool = False,
    log_y: bool = False,
    log_z: bool = False,
    range_x: list[int] = None,
    range_y: list[int] = None,
    range_z: list[int] = None,
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a 3D line chart

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      x: str:  (Default value = None)
        A column that contains x-axis values.
      y: str:  (Default value = None)
        A column that contains y-axis values.
      z: str:  (Default value = None)
        A column that contains z-axis values.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: str | list[str]: (Default value = None)
        A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: str | list[str]: (Default value = None)
        A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      error_x: str:  (Default value = None)
        A column with x error bar values. These form the error
        bars in both the positive and negative direction if error_x_minus
        is not specified, and the error bars in only the positive direction if
        error_x_minus is specified.
      error_x_minus: str:  (Default value = None)
        A column with x error bar values. These form
        the error bars in the negative direction, and are ignored if error_x
        is not specified.
      error_y: str:  (Default value = None)
        A column with y error bar values. These form the error
        bars in both the positive and negative direction if error_y_minus
        is not specified, and the error bars in only the positive direction if
        error_y_minus is specified.
      error_y_minus: str:  (Default value = None)
        A column with y error bar values. These form
        the error bars in the negative direction, and are ignored if error_y
        is not specified.
      error_z: str:  (Default value = None)
        A column with z error bar values. These form the error
        bars in both the positive and negative direction if error_z_minus
        is not specified, and the error bars in only the positive direction if
        error_z_minus is specified.
      error_z_minus: str:  (Default value = None)
        A column with z error bar values. These form
        the error bars in the negative direction, and are ignored if error_z
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
      line_dash_sequence: list[str]:  (Default value = None)
        A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
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
      width_sequence: list[str]:  (Default value = None)
        A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
      markers: bool:  (Default value = False)
        True to draw markers on the line, False to not. Default False
      log_x: bool:  (Default value = False)
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: bool:  (Default value = False)
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_z: bool:  (Default value = False)
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the x axis.
      range_y: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the y axis.
      range_z: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the z axis.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the 3D line chart

    """
    args = locals()

    return process_args(args, {"line", "scene"}, px_func=px.line_3d)


def line_polar(
    table: Table = None,
    r: str = None,
    theta: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    size: str = None,
    line_dash: str | list[str] = None,
    width: str | list[str] = None,
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    line_dash_sequence: list[str] = None,
    line_dash_map: dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    width_sequence: list[int] = None,
    width_map: dict[str | tuple[str], str] = None,
    markers: bool = False,
    direction: str = "clockwise",
    start_angle: int = 90,
    line_close: bool = False,
    line_shape: str = "linear",
    range_r: list[int] = None,
    range_theta: list[int] = None,
    log_r: bool = False,
    title: str = None,
    template: str = None,
    render_mode="svg",
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a polar scatter chart

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      r: str:  (Default value = None)
        A column that contains r values.
      theta: str:  (Default value = None)
        A column that contains theta values.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: str | list[str]: (Default value = None)
        A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: str | list[str]: (Default value = None)
        A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
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
      line_dash_sequence: list[str]:  (Default value = None)
        A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
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
      width_sequence: list[str]:  (Default value = None)
        A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
      markers: bool:  (Default value = False)
        True to draw markers on the line, False to not. Default False
      direction: (Default value = 'clockwise')
        Which direction points are drawn. Can be 'clockwise' or
        'counterclockwise'
      start_angle: int:  (Default value = 90)
        Sets start angle.
      line_close: bool:  (Default value = False)
        True draw a line between first and last point, False to not.
      line_shape: str:  (Default value = 'linear')
        The line shape for all lines created. One of 'linear', 'spline'.
      range_r: list[int]:
        A list of two numbers that specify the range of r.
      range_theta: list[int]:
        A list of two numbers that specify the range of theta.
      log_r: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      render_mode: str (Default value = "svg")
        Either "svg" or "webgl". Setting to "webgl" will lead to a more
        performant plot but there may be graphical bugs.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.


    Returns:
      DeephavenFigure: A DeephavenFigure that contains the polar scatter chart

    """

    args = locals()

    return process_args(args, {"line"}, px_func=px.line_polar)


def line_ternary(
    table: Table = None,
    a: str = None,
    b: str = None,
    c: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    size: str = None,
    line_dash: str | list[str] = None,
    width: str | list[str] = None,
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    line_dash_sequence: list[str] = None,
    line_dash_map: dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    width_sequence: list[int] = None,
    width_map: dict[str | tuple[str], str] = None,
    markers: bool = False,
    line_shape: str = "linear",
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a ternary line chart

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      a: str:
        A column that contains a-axis values.
      b: str:
        A column that contains b-axis values.
      c: str:
        A column that contains c-axis values.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: str | list[str]: (Default value = None)
        A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: str | list[str]: (Default value = None)
        A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
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
      line_dash_sequence: list[str]:  (Default value = None)
        A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
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
      width_sequence: list[str]:  (Default value = None)
        A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
      markers: bool:  (Default value = False)
        True to draw markers on the line, False to not. Default False
      line_shape: str:  (Default value = 'linear')
        The line shape for all lines created. One of 'linear', 'spline'.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure:  callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the ternary line chart

    """
    args = locals()

    return process_args(args, {"line"}, px_func=px.line_ternary)
