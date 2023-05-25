from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, process_args
from ..deephaven_figure import generate_figure, DeephavenFigure


# TODO: support line_shape as a list?
def line(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        size: str | list[str] = None,
        text: str | list[str] = None,
        hover_name: str | list[str] = None,
        labels: dict[str, str] = None,
        color_discrete_sequence: list[str] = None,
        line_dash_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        size_sequence: list[int] = None,
        xaxis_sequence: list[str] = None,
        yaxis_sequence: list[str] = None,
        markers: bool = False,
        log_x: bool | list[bool] = False,
        log_y: bool | list[bool] = False,
        range_x: list[int] | list[list[int]] = None,
        range_y: list[int] | list[list[int]] = None,
        yaxis_titles: list[str] = None,
        xaxis_titles: list[str] = None,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        unsafe_update_figure: callable = default_callback
) -> DeephavenFigure:
    """Returns a line chart

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column or list of columns that contain x-axis values.
      y: str | list[str]:  (Default value = None)
        A column or list of columns that contain y-axis values.
      error_x: str | list[str]:  (Default value = None)
        A column or list of columns with x error bar
        values. These form the error bars in both the positive and negative
        direction if error_x_minus is not specified, and the error bars in
        only the positive direction if error_x_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_x_minus: str | list[str]:  (Default value = None)
        A column or list of columns with x error
        bar values. These form the error bars in the negative direction,
        and are ignored if error_x is not specified.
      error_y: str | list[str]:  (Default value = None)
        A column or list of columns with x error bar
        values. These form the error bars in both the positive and negative
        direction if error_y_minus is not specified, and the error bars in
        only the positive direction if error_y_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_y_minus: str | list[str]:  (Default value = None)
        A column or list of columns with y error
        bar values. These form the error bars in the negative direction,
        and are ignored if error_y is not specified.
      size: str | list[str]:  (Default value = None)
        A column or list of columns that contain size values.
      text: str | list[str]:  (Default value = None)
        A column or list of columns that contain text annotations.
      hover_name: str | list[str]:  (Default value = None)
        A column or list of columns that contain names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      line_dash_sequence: list[str]:  (Default value = None)
        A list of line dashes to sequentially apply to
        the series. The dashes loop, so if there are more series than dashes,
        dashes will be reused.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
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

    update_wrapper = process_args(args, {"line"})

    return update_wrapper(
        generate_figure(draw=px.line, call_args=args)
    )


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
        size: str = None,
        text: str = None,
        hover_name: str = None,
        labels: dict[str, str] = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        size_sequence: list[int] = None,
        markers: bool = False,
        log_x: bool = False,
        log_y: bool = False,
        log_z: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_z: list[int] = None,
        title: str = None,
        template: str = None,
        unsafe_update_figure: callable = default_callback
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
      size: str:  (Default value = None)
        A column that contains size values.
      text: str:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | list[str]:  (Default value = None)
        A column that contains names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
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

    update_wrapper = process_args(args, {"line", "scene"})

    return update_wrapper(
        generate_figure(draw=px.line_3d, call_args=args)
    )


def line_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        size: str = None,
        text: str = None,
        hover_name: str = None,
        labels: dict[str, str] = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        size_sequence: list[int] = None,
        markers: bool = False,
        direction: str = 'clockwise',
        start_angle: int = 90,
        line_close: bool = False,
        line_shape: str = 'linear',
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        unsafe_update_figure: callable = default_callback
) -> DeephavenFigure:
    """Returns a polar scatter chart

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      r: str:  (Default value = None)
        A column that contains r values.
      theta: str:  (Default value = None)
        A column that contains theta values.
      size: str:  (Default value = None)
        A column that contains size values.
      text: str:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | list[str]:  (Default value = None)
        A column that contains names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
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

    update_wrapper = process_args(args, {"line"})

    return update_wrapper(
        generate_figure(draw=px.line_polar, call_args=args)
    )


def line_ternary(
        table: Table = None,
        a: str = None,
        b: str = None,
        c: str = None,
        size: str = None,
        text: str = None,
        hover_name: str = None,
        labels: dict[str, str] = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        size_sequence: list[int] = None,
        markers: bool = False,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        unsafe_update_figure: callable = default_callback
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
      size: str:  (Default value = None)
        A column that contains size values.
      text: str:  (Default value = None)
        A column that contains text annotations.
      hover_name: str | list[str]:  (Default value = None)
        A column that contains names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      symbol_sequence: list[str]:  (Default value = None)
        A list of symbols to sequentially apply to the
        markers in the series. The symbols loop, so if there are more series than
        symbols, symbols will be reused.
      size_sequence: list[str]:  (Default value = None)
        A list of sizes to sequentially apply to the
        markers in the series. The sizes loop, so if there are more series than
        symbols, sizes will be reused. This is overriden is "size" is specified.
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

    update_wrapper = process_args(args, {"line"})

    return update_wrapper(
        generate_figure(draw=px.line_ternary, call_args=args)
    )
