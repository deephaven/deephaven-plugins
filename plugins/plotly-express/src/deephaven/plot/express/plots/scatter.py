from __future__ import annotations

from numbers import Number

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ._update_wrapper import default_callback
from ..deephaven_figure import DeephavenFigure


def scatter(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    error_x: str = None,
    error_x_minus: str = None,
    error_y: str = None,
    error_y_minus: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str | list[str] = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    color_continuous_scale: list[str] = None,
    range_color: list[Number] = None,
    color_continuous_midpoint: Number = None,
    xaxis_sequence: list[int] = None,
    yaxis_sequence: list[int] = None,
    opacity: float = None,
    marginal_x: str = None,
    marginal_y: str = None,
    log_x: bool | list[bool] = False,
    log_y: bool | list[bool] = False,
    range_x: list[int] | list[list[int]] = None,
    range_y: list[int] | list[list[int]] = None,
    yaxis_titles: list[str] = None,
    xaxis_titles: list[str] = None,
    title: str = None,
    template: str = None,
    render_mode: str = "webgl",
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a scatter chart

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
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
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
      error_y_minus: str :  (Default value = None)
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
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
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
        symbols, sizes will be reused. This is overriden is "size" is specified.
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
      color_continuous_scale: list[str]: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number]: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      marginal_x: str:  (Default value = None)
        The type of x-axis marginal; histogram, violin, rug, box
      marginal_y: str:  (Default value = None)
        The type of y-axis marginal; histogram, violin, rug, box
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
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      render_mode: str (Default value = "webgl")
        Either "svg" or "webgl". The default is "webgl" as it leads to a more
        performant plot but there may be graphical bugs, in which case it is
        recommended to switch to "svg"
      unsafe_update_figure:  callable:  (Default value = default_callback)
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
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    color_continuous_scale: list[str] = None,
    range_color: list[Number] = None,
    color_continuous_midpoint: Number = None,
    opacity: float = None,
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
    """Returns a 3D scatter chart

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
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
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
        is not specified.
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
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
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
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str]: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number]: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float:  (Default value = None)
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
      A DeephavenFigure that contains the 3D scatter chart

    """
    args = locals()

    return process_args(args, {"scatter", "scene"}, px_func=px.scatter_3d)


def scatter_polar(
    table: Table = None,
    r: str = None,
    theta: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    color_continuous_scale: list[str] = None,
    range_color: list[Number] = None,
    color_continuous_midpoint: Number = None,
    opacity: float = None,
    direction: str = "clockwise",
    start_angle: int = 90,
    range_r: list[int] = None,
    range_theta: list[int] = None,
    log_r: bool = False,
    title: str = None,
    template: str = None,
    render_mode="webgl",
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
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
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
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
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
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str]: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number]: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      direction: (Default value = 'clockwise')
        Which direction points are drawn. Can be 'clockwise' or
        'counterclockwise'
      start_angle: int:  (Default value = 90)
        Sets start angle.
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
      render_mode: str (Default value = "webgl")
        Either "svg" or "webgl". The default is "webgl" as it leads to a more
        performant plot but there may be graphical bugs, in which case it is
        recommended to switch to "svg"
      unsafe_update_figure:  callable:  (Default value = default_callback)
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
    table: Table = None,
    a: str = None,
    b: str = None,
    c: str = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    symbol: str | list[str] = None,
    size: str = None,
    text: str = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    symbol_sequence: list[str] = None,
    symbol_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    size_sequence: list[int] = None,
    size_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str] = None,
    color_continuous_scale: list[str] = None,
    range_color: list[Number] = None,
    color_continuous_midpoint: Number = None,
    opacity: float = None,
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a ternary scatter chart

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
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: str | list[str]: (Default value = None)
        A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
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
      color_discrete_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
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
        symbols, sizes will be reused. This is overriden is "size" is specified.
      size_map:
        str | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]] | dict[
            str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      color_continuous_scale: list[str]: (Default value = None)
        A list of colors for a continuous scale
      range_color: list[Number]: (Default value = None)
        A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: Number: (Default value = None)
        A number that is the midpoint of the color axis
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
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
      A DeephavenFigure that contains the ternary scatter chart

    """
    args = locals()

    return process_args(args, {"scatter"}, px_func=px.scatter_ternary)


def _scatter_matrix():
    """ """
    # todo: not yet implemented
    pass
