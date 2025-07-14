from __future__ import annotations

from typing import Callable

from plotly import express as px

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure, Calendar
from ..types import PartitionableTableLike


def line(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    error_x: str | None = None,
    error_x_minus: str | None = None,
    error_y: str | None = None,
    error_y_minus: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    size: str | list[str] | None = None,
    line_dash: str | list[str] | None = None,
    width: str | list[str] | None = None,
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    line_dash_sequence: list[str] | None = None,
    line_dash_map: dict[str | tuple[str], str] | None = None,
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
    width_sequence: list[int] | None = None,
    width_map: dict[str | tuple[str], str] | None = None,
    xaxis_sequence: list[str] | None = None,
    yaxis_sequence: list[str] | None = None,
    markers: bool = False,
    log_x: bool | list[bool] = False,
    log_y: bool | list[bool] = False,
    range_x: list[int] | list[list[int]] | None = None,
    range_y: list[int] | list[list[int]] | None = None,
    yaxis_titles: list[str] | None = None,
    xaxis_titles: list[str] | None = None,
    line_shape: str = "linear",
    title: str | None = None,
    template: str | None = None,
    render_mode: str = "webgl",
    calendar: Calendar = False,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a line chart

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
      y: A column or list of columns that contain y-axis values.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
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
      size: A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      error_x: A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_x_minus is not specified, and the error bars in
        only the positive direction if error_x_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_x_minus: A column with x error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_x is not specified.
      error_y: A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_y_minus is not specified, and the error bars in
        only the positive direction if error_y_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_y_minus: A column with y error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_y is not specified.
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      line_dash_sequence: A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      symbol_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to symbols.
        If "identity", the values are taken as literal symbols.
        If "by" or ("by", dict) where dict is as described above, the symbols are forced to by
      size_sequence:A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused.
      size_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to sizes.
        If "identity", the values are taken as literal sizes.
        If "by" or ("by", dict) where dict is as described above, the sizes are forced to by
      width_sequence: A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
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
      render_mode: Either "svg" or "webgl". The default is "webgl" as it leads to a more
        performant plot but there may be graphical bugs, in which case it is
        recommended to switch to "svg"
      calendar: A boolean, BusinessCalendar or string that specifies a calendar to use for the chart.
        By default, False and no calendar is used. If True, the default calendar is used.
        If a string, the calendar with that name is used. If a BusinessCalendar is passed,
        that calendar is used.
        Note that if this is provided, `render_mode` is forced to "svg" as "webgl" is not supported.
      unsafe_update_figure: An update function that takes a plotly figure
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
    table: PartitionableTableLike,
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
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    size: str | None = None,
    line_dash: str | list[str] | None = None,
    width: str | list[str] | None = None,
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    line_dash_sequence: list[str] | None = None,
    line_dash_map: dict[str | tuple[str], str] | None = None,
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
    width_sequence: list[int] | None = None,
    width_map: dict[str | tuple[str], str] | None = None,
    markers: bool = False,
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
    """Returns a 3D line chart

    Args:
      table: A table to pull data from.
      x: A column that contains x-axis values.
      y: A column that contains y-axis values.
      z: A column that contains z-axis values.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
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
      size: A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      error_x: A column with x error bar values. These form the error
        bars in both the positive and negative direction if error_x_minus
        is not specified, and the error bars in only the positive direction if
        error_x_minus is specified.
      error_x_minus: A column with x error bar values. These form
        the error bars in the negative direction, and are ignored if error_x
        is not specified.
      error_y: A column with y error bar values. These form the error
        bars in both the positive and negative direction if error_y_minus
        is not specified, and the error bars in only the positive direction if
        error_y_minus is specified.
      error_y_minus: A column with y error bar values. These form
        the error bars in the negative direction, and are ignored if error_y
        is not specified.
      error_z: A column with z error bar values. These form the error
        bars in both the positive and negative direction if error_z_minus
        is not specified, and the error bars in only the positive direction if
        error_z_minus is specified.
      error_z_minus: A column with z error bar values. These form
        the error bars in the negative direction, and are ignored if error_z
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      line_dash_sequence: A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
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
      width_sequence: A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
      markers: True to draw markers on the line, False to not. Default False
      log_x: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_z: A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: A list of two numbers that specify the range of the x axis.
      range_y: A list of two numbers that specify the range of the y axis.
      range_z: A list of two numbers that specify the range of the z axis.
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
      DeephavenFigure: A DeephavenFigure that contains the 3D line chart

    """
    args = locals()

    return process_args(args, {"line", "scene"}, px_func=px.line_3d)


def line_polar(
    table: PartitionableTableLike,
    r: str | None = None,
    theta: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    size: str | None = None,
    line_dash: str | list[str] | None = None,
    width: str | list[str] | None = None,
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    line_dash_sequence: list[str] | None = None,
    line_dash_map: dict[str | tuple[str], str] | None = None,
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
    width_sequence: list[int] | None = None,
    width_map: dict[str | tuple[str], str] | None = None,
    markers: bool = False,
    direction: str = "clockwise",
    start_angle: int = 90,
    line_close: bool = False,
    line_shape: str = "linear",
    range_r: list[int] | None = None,
    range_theta: list[int] | None = None,
    log_r: bool = False,
    title: str | None = None,
    template: str | None = None,
    render_mode: str = "svg",
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a polar scatter chart

    Args:
      table: A table to pull data from.
      r: A column that contains r values.
      theta: A column that contains theta values.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
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
      size: A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      line_dash_sequence: A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
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
      width_sequence: A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
      markers: True to draw markers on the line, False to not. Default False
      direction: Which direction points are drawn. Can be 'clockwise' or
        'counterclockwise'
      start_angle: Sets start angle.
      line_close: True draw a line between first and last point, False to not.
      line_shape: The line shape for all lines created. One of 'linear', 'spline'.
      range_r: A list of two numbers that specify the range of r.
      range_theta: A list of two numbers that specify the range of theta.
      log_r: A boolean that specifies if the corresponding axis is a log
        axis or not.
      title: The title of the chart
      template: The template for the chart.
      render_mode: Either "svg" or "webgl". Setting to "webgl" will lead to a more
        performant plot but there may be graphical bugs.
      unsafe_update_figure: An update function that takes a plotly figure
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
    table: PartitionableTableLike,
    a: str | None = None,
    b: str | None = None,
    c: str | None = None,
    by: str | None | list[str] = None,
    by_vars: str | list[str] = "color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    size: str | None = None,
    line_dash: str | list[str] | None = None,
    width: str | list[str] | None = None,
    color: str | list[str] | None = None,
    symbol: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    line_dash_sequence: list[str] | None = None,
    line_dash_map: dict[str | tuple[str], str] | None = None,
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
    width_sequence: list[int] | None = None,
    width_map: dict[str | tuple[str], str] | None = None,
    markers: bool = False,
    line_shape: str = "linear",
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a ternary line chart

    Args:
      table: A table to pull data from.
      a: A column that contains a-axis values.
      b: A column that contains b-axis values.
      c: A column that contains c-axis values.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain size, line_dash, width, color, and symbol.
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
      size: A column or list of columns that contain size values.
        If only one column is passed, and it contains numeric values, the value
        is used as a size. Otherwise, the value is used for a plot by on size.
        See size_map for additional behaviors.
      line_dash: A column or list of columns that contain line_dash values.
        The value is used for a plot by on line_dash.
        See line_dash_map for additional behaviors.
      width: A column or list of columns that contain width values.
        The value is used for a plot by on width.
        See width_map for additional behaviors.
      color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      symbol: A column or list of columns that contain symbol values.
        The value is used for a plot by on symbol.
        See color_discrete_map for additional behaviors.
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      line_dash_sequence: A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      line_dash_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to line_dash.
      symbol_sequence: A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
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
      width_sequence: A list of widths to sequentially apply to
        the series. The widths loop, so if there are more series than widths,
        widths will be reused.
      width_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to width.
      markers: True to draw markers on the line, False to not. Default False
      line_shape: The line shape for all lines created. One of 'linear', 'spline'.
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
      DeephavenFigure: A DeephavenFigure that contains the ternary line chart

    """
    args = locals()

    return process_args(args, {"line"}, px_func=px.line_ternary)
