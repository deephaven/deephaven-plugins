from typing import Callable

import plotly.express as px
from plotly.graph_objects import Figure
from plotly import subplots

from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType
from deephaven.table import Table

from .generate import generate_figure, draw_ohlc, draw_candlestick
from .DeephavenFigure import DeephavenFigure

__version__ = "0.0.1.dev0"

from .preprocess import preprocess_pie, create_hist_tables, preprocess_frequency_bar, preprocess_timeline, \
    preprocess_violin

NAME = "deephaven.plugin.chart.DeephavenFigure"

# these args map a marginal argument to what variable the data should be
# pulled from in the corresponding figure data
MARGINAL_ARGS = {
    "marginal_x": "x",
    "marginal_y": "y",
}


def default_callback(fig):
    return fig


def _export_figure(exporter: Exporter, figure: DeephavenFigure) -> bytes:
    return figure.to_json(exporter).encode()


class DeephavenFigureType(ObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object: any) -> bool:
        return isinstance(object, DeephavenFigure)

    def to_bytes(self, exporter: Exporter, figure: DeephavenFigure) -> bytes:
        return _export_figure(exporter, figure)


class ChartRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        callback.register(DeephavenFigureType)


# todo: size sequence
def scatter(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        # labels: dict[str, str] = None
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        xaxis_sequence: list[int] = None,
        yaxis_sequence: list[int] = None,
        yaxis_title_sequence: list[str] = None,
        xaxis_title_sequence: list[str] = None,
        opacity: float = None,
        # marginal_x: str = None, #not supported at the moment, will probably be slow
        # marginal_y: str = None, #with lots of data
        log_x: bool | list[bool] = False,
        log_y: bool | list[bool] = False,
        range_x: list[int] | list[list[int]] = None,
        range_y: list[int] | list[list[int]] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a scatter chart

    :param table: A table to pull data from.
    :param x: A column or list of columns that contain x-axis values.
    :param y: A column or list of columns that contain y-axis values.
    :param error_x: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_x_minus is not specified, and the error bars in only the
    positive direction if error_x_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_x_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_x is not specified.
    :param error_y: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_y_minus is not specified, and the error bars in only the
    positive direction if error_y_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_y_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_y is not specified.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    series. The symbols loop, so if there are more series than symbols, symbols
    will be reused.
    :param xaxis_sequence: A list of x axes to assign series to. Odd numbers
    starting with 1 are created on the bottom x axis and even numbers starting
    with 2 are created on the top x axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_sequence: A list of y axes to assign series to. Odd numbers
    starting with 1 are created on the left y axis and even numbers starting
    with 2 are created on the top y axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_title_sequence: A list of titles to sequentially apply to the
    y axes. The titles do not loop.
    :param xaxis_title_sequence: A list of titles to sequentially apply to the
    x axes. The titles do not loop.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param log_x: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param log_y: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param range_x: A list of two numbers or a list of lists of two numbers
    that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param range_y: A list of two numbers or a list of lists of two numbers
     that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the scatter chart
    """
    if isinstance(table, Table):
        render_mode = "webgl"
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        fig = generate_figure(draw=px.scatter, call_args=args)

        return fig


def scatter_3d(
        table: Table = None,
        x: str = None,
        y: str = None,
        z: str = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        error_z: str | list[str] = None,
        error_z_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        log_x: bool = False,
        log_y: bool = False,
        log_z: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_z: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a 3D scatter chart

    :param table: A table to pull data from.
    :param x: A column that contains x-axis values.
    :param y: A column that contains y-axis values.
    :param z: A column that contains z-axis values.
    :param error_x: A column with x error bar values. These form the error
    bars in both the positive and negative direction if error_x_minus is not
    specified, and the error bars in only the positive direction if
    error_x_minus is specified.
    :param error_x_minus: A column with x error bar values. These form
    the error bars in the negative direction, and are ignored if error_x is not
    specified.
    :param error_y: A column with x error bar values. These form the error
    bars in both the positive and negative direction if error_z_minus is not
    specified, and the error bars in only the positive direction if
    error_x_minus is specified.
    :param error_y_minus: A column with y error bar values. These form
    the error bars in the negative direction, and are ignored if error_x is not
    specified.
    :param error_z: A column with x error bar values. These form the error
    bars in both the positive and negative direction if error_z_minus is not
    specified, and the error bars in only the positive direction if
    error_x_minus is specified.
    :param error_z_minus: A column with z error bar values. These form
    the error bars in the negative direction, and are ignored if error_x is not
    specified.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    series. The symbols loop, so if there are more series than symbols, symbols
    will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_z: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param range_z: A list of two numbers that specify the range of the z axis.
    :param title: The title of the chart.
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the 3D scatter chart
    """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        return generate_figure(draw=px.scatter_3d, call_args=args)


def scatter_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        direction: str = 'clockwise',
        start_angle: int = 90,
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a polar scatter chart

    :param table: A table to pull data from.
    :param r: A column that contains r values.
    :param theta: A column that contains theta values.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    series. The symbols loop, so if there are more series than symbols, symbols
    will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param direction: Which direction points are drawn. Default clockwise.
    :param start_angle: Sets start angle. Default 90.
    :param range_r: A list of two numbers that specify the range of r.
    :param range_theta: A list of two numbers that specify the range of theta.
    :param log_r: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param title: The title of the chart.
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the polar scatter chart
    """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        render_mode = "webgl"
        return generate_figure(draw=px.scatter_polar, call_args=args)


def scatter_ternary(
        table: Table = None,
        a: str = None,
        b: str = None,
        c: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a ternary scatter chart

    :param table: A table to pull data from.
    :param a: A column that contains a-axis values.
    :param b: A column that contains b-axis values.
    :param c: A column that contains c-axis values.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    series. The symbols loop, so if there are more series than symbols, symbols
    will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param title: The title of the chart.
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the ternary scatter chart
    """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        return generate_figure(draw=px.scatter_ternary, call_args=args)


# TODO: support line_shape as a list?
def line(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        line_dash_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        xaxis_sequence: list[str] = None,
        yaxis_sequence: list[str] = None,
        yaxis_title_sequence: list[str] = None,
        xaxis_title_sequence: list[str] = None,
        markers: bool = False,
        log_x: bool | list[bool] = False,
        log_y: bool | list[bool] = False,
        range_x: list[int] | list[list[int]] = None,
        range_y: list[int] | list[list[int]] = None,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a line chart

    :param table: A table to pull data from.
    :param x: A column or list of columns that contain x-axis values.
    :param y: A column or list of columns that contain y-axis values.
    :param error_x: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_x_minus is not specified, and the error bars in only the
    positive direction if error_x_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_x_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_x is not specified.
    :param error_y: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_y_minus is not specified, and the error bars in only the
    positive direction if error_y_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_y_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_y is not specified.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param line_dash_sequence: A list of line dashes to sequentially apply to
    the series. The dashes loop, so if there are more series than dashes,
    dashes will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    series. The symbols loop, so if there are more series than symbols, symbols
    will be reused.
    :param xaxis_sequence: A list of x axes to assign series to. Odd numbers
    starting with 1 are created on the bottom x axis and even numbers starting
    with 2 are created on the top x axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_sequence: A list of y axes to assign series to. Odd numbers
    starting with 1 are created on the left y axis and even numbers starting
    with 2 are created on the top y axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_title_sequence: A list of titles to sequentially apply to the
    y axes. The titles do not loop.
    :param xaxis_title_sequence: A list of titles to sequentially apply to the
    x axes. The titles do not loop.
    :param markers: True to draw markers on the line, False to not. Default
    False
    :param log_x: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param log_y: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param range_x: A list of two numbers or a list of lists of two numbers
    that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param range_y: A list of two numbers or a list of lists of two numbers
     that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param line_shape: The line shape for all lines created. One of 'linear',
    'spline', 'vhv', 'hvh', 'vh', 'hv'. Default 'linear'
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the line chart
    """
    if isinstance(table, Table):
        # render_mode = "webgl"
        args = locals()
        args["color_discrete_sequence_line"] = args.pop("color_discrete_sequence")

        return generate_figure(draw=px.line, call_args=args)


def line_3d(
        table: Table = None,
        x: str = None,
        y: str = None,
        z: str = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        error_z: str | list[str] = None,
        error_z_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        markers: bool = False,
        log_x: bool = False,
        log_y: bool = False,
        log_z: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_z: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a 3D line chart

    :param table: A table to pull data from.
    :param x: A column that contains x-axis values.
    :param y: A column that contains y-axis values.
    :param z: A column that contains z-axis values.
    :param error_x: A column with x error bar values. These form the error
    bars in both the positive and negative direction if error_x_minus is not
    specified, and the error bars in only the positive direction if
    error_x_minus is specified.
    :param error_x_minus: A column with x error bar values. These form
    the error bars in the negative direction, and are ignored if error_x is not
    specified.
    :param error_y: A column with x error bar values. These form the error
    bars in both the positive and negative direction if error_z_minus is not
    specified, and the error bars in only the positive direction if
    error_x_minus is specified.
    :param error_y_minus: A column with y error bar values. These form
    the error bars in the negative direction, and are ignored if error_x is not
    specified.
    :param error_z: A column with x error bar values. These form the error
    bars in both the positive and negative direction if error_z_minus is not
    specified, and the error bars in only the positive direction if
    error_x_minus is specified.
    :param error_z_minus: A column with z error bar values. These form
    the error bars in the negative direction, and are ignored if error_x is not
    specified.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    series. The symbols loop, so if there are more series than symbols, symbols
    will be reused.
    :param markers: True to draw markers on the line, False to not. Default
    False
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_z: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param range_z: A list of two numbers that specify the range of the z axis.
    :param title: The title of the chart.
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the 3D line chart
    """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_line"] = args.pop("color_discrete_sequence")

        return generate_figure(draw=px.line_3d, call_args=args)


def line_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
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
        callback: Callable = default_callback,
) -> DeephavenFigure:
    """
    Returns a polar scatter chart

    :param table: A table to pull data from.
    :param r: A column that contains r values.
    :param theta: A column that contains theta values.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    series. The symbols loop, so if there are more series than symbols, symbols
    will be reused.
    :param markers: True to draw markers on the line, False to not. Default
    False
    :param direction: Which direction points are drawn. Default clockwise.
    :param start_angle: Sets start angle. Default 90.
    :param line_close: True draw a line between first and last point, False to
    not. Default False
    :param line_shape: The line shape for all lines created. One of 'linear',
    'spline'. Default 'linear'
    :param range_r: A list of two numbers that specify the range of r.
    :param range_theta: A list of two numbers that specify the range of theta.
    :param log_r: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param title: The title of the chart.
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the polar scatter chart
    """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_line"] = args.pop("color_discrete_sequence")
        return generate_figure(draw=px.line_polar, call_args=args)


def line_ternary(
        table: Table = None,
        a: str = None,
        b: str = None,
        c: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        markers: bool = False,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
       Returns a ternary line chart

       :param table: A table to pull data from.
       :param a: A column that contains a-axis values.
       :param b: A column that contains b-axis values.
       :param c: A column that contains c-axis values.
       :param color_discrete_sequence: A list of colors to sequentially apply to
       the series. The colors loop, so if there are more series than colors,
       colors will be reused.
       :param symbol_sequence: A list of symbols to sequentially apply to the
       series. The symbols loop, so if there are more series than symbols, symbols
       will be reused.
       :param markers: True to draw markers on the line, False to not. Default
       False
       :param line_shape: The line shape for all lines created. One of 'linear',
       'spline'. Default 'linear'
       :param title: The title of the chart.
       :param template: The template for the chart.
       :param callback: A callback function that takes a figure as an argument and
       returns a figure. Used to add any custom changes to the underlying plotly
       figure. Note that the existing data traces should not be removed.
       :return: A DeephavenFigure that contains the ternary line chart
       """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_line"] = args.pop("color_discrete_sequence")

        return generate_figure(draw=px.line_ternary, call_args=args)


def area(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        xaxis_sequence: list[str] = None,
        yaxis_sequence: list[str] = None,
        yaxis_title_sequence: list[str] = None,
        xaxis_title_sequence: list[str] = None,
        markers: bool = False,
        # todo: groupnorm in engine
        groupnorm: str = None,
        log_x: bool | list[bool] = False,
        log_y: bool | list[bool] = False,
        range_x: list[int] | list[list[int]] = None,
        range_y: list[int] | list[list[int]] = None,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
        Returns an area chart

        :param table: A table to pull data from.
        :param x: A column or list of columns that contain x-axis values.
        :param y: A column or list of columns that contain y-axis values.
        :param color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
        :param symbol_sequence: A list of symbols to sequentially apply to the
        series. The symbols loop, so if there are more series than symbols, symbols
        will be reused.
        :param pattern_shape_sequence: A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
        :param xaxis_sequence: A list of x axes to assign series to. Odd numbers
        starting with 1 are created on the bottom x axis and even numbers starting
        with 2 are created on the top x axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
        :param yaxis_sequence: A list of y axes to assign series to. Odd numbers
        starting with 1 are created on the left y axis and even numbers starting
        with 2 are created on the top y axis. Axes are created up
        to the maximum number specified. The axes loop, so if there are more series
        than axes, axes will be reused.
        :param yaxis_title_sequence: A list of titles to sequentially apply to the
        y axes. The titles do not loop.
        :param xaxis_title_sequence: A list of titles to sequentially apply to the
        x axes. The titles do not loop.
        :param markers: True to draw markers on the line, False to not. Default
        False
        :param groupnorm: Default None. 'fraction' to plot the fraction out of
        the total value of all points at that x value, 'percent' to take the
        fraction and multiply by 100. Note that if multiple y axes are
        specified, the groupnorm is taken per axis.
        :param log_x: Default False. A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
        :param log_y: Default False. A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
        :param range_x: A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
        :param range_y: A list of two numbers or a list of lists of two numbers
         that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
        :param line_shape: The line shape for all lines created. One of 'linear',
        'spline', 'vhv', 'hvh', 'vh', 'hv'. Default 'linear'
        :param title: The title of the chart
        :param template: The template for the chart.
        :param callback: A callback function that takes a figure as an argument and
        returns a figure. Used to add any custom changes to the underlying plotly
        figure. Note that the existing data traces should not be removed.
        :return: A DeephavenFigure that contains the area chart
        """
    if isinstance(table, Table):
        args = locals()
        args["pattern_shape_sequence_area"] = args.pop("pattern_shape_sequence")
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        return generate_figure(draw=px.area, call_args=args)


def bar(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a bar chart

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    :param y: A column name or list of columns that contain y-axis values.
    :param error_x: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_x_minus is not specified, and the error bars in only the
    positive direction if error_x_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_x_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_x is not specified.
    :param error_y: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_y_minus is not specified, and the error bars in only the
    positive direction if error_y_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_y_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_y is not specified.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param pattern_shape_sequence: A list of patterns to sequentially apply
    to the series. The patterns loop, so if there are more series than
    patterns, patterns will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param barmode: Default 'relative'. If 'relative', bars are stacked. If
    'overlay', bars are drawn on top of each other. If 'group', bars are drawn
    next to each other.
    :param log_x: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param log_y: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param range_x: A list of two numbers or a list of lists of two numbers
    that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param range_y: A list of two numbers or a list of lists of two numbers
     that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param range_y: A list of two numbers or a list of lists of two numbers
    that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param text_auto: Default False. If True, display the value at each bar.
    If a string, specifies a plotly texttemplate.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the bar chart
    """
    if isinstance(table, Table):
        args = locals()
        args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        return generate_figure(draw=px.bar, call_args=args)


def _bar_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        # barnorm: str = None,
        barmode: str = 'relative',
        direction: str = 'clockwise',
        start_angle: int = 90,
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    # todo: not yet implemented
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
        return generate_figure(draw=px.bar_polar, call_args=args)


def timeline(
        table: str = None,
        x_start: str = None,
        x_end: str = None,
        y: str = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
):
    """
    Returns a timeline (otherwise known as a gantt chart)

    :param table: A table to pull data from.
    :param x_start: A column that contains starting x-axis values.
    :param x_end: A column that contains ending x-axis values.
    :param y: A column or list of columns that contain y-axis labels
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param pattern_shape_sequence: A list of patterns to sequentially apply
    to the series. The patterns loop, so if there are more series than
    patterns, patterns will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the timeline chart
    """
    # TODO: add resource column?
    if isinstance(table, Table):
        table, x_diff = preprocess_timeline(table, x_start, x_end, y)
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
        return generate_figure(draw=px.timeline, call_args=args)


def _to_list(
        arg
):
    if isinstance(arg, list):
        return arg
    elif not arg:
        return []
    return [arg]


def frequency_bar(
        table: Table = None,
        x: str = None,
        y: str = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
):
    """
    Returns a bar chart that contains the counts of the specified columns

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the bars are drawn
    vertically.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If x is specified, the bars are drawn
    horizontally.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param pattern_shape_sequence: A list of patterns to sequentially apply
    to the series. The patterns loop, so if there are more series than
    patterns, patterns will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param barmode: Default 'relative'. If 'relative', bars are stacked. If
    'overlay', bars are drawn on top of each other. If 'group', bars are drawn
    next to each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param text_auto: Default False. If True, display the value at each bar.
    If a string, specifies a plotly texttemplate.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the bar chart
    """
    # TODO: refactor?
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
    args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")

    x = _to_list(x)
    y = _to_list(y)

    figs = []
    trace_generator = None

    for col in x:
        new_table, y_col = preprocess_frequency_bar(table, col)
        args["table"] = new_table
        args["x"] = col
        args["y"] = y_col

        figs.append(generate_figure(draw=px.bar, call_args=args, trace_generator=trace_generator))

        if not trace_generator:
            trace_generator = figs[0].trace_generator

    for col in y:
        new_table, x_col = preprocess_frequency_bar(table, col)
        args["orientation"] = "h"
        args["table"] = new_table
        args["x"] = x_col
        args["y"] = col

        figs.append(generate_figure(draw=px.bar, call_args=args, trace_generator=trace_generator))

        if not trace_generator:
            trace_generator = figs[0].trace_generator

    # layer but with only the first layout (as subsequent ones were not modfied)
    return layer(*figs, which_layout=0)


def violin(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        violinmode: str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        points: bool | str = 'outliers',
        box: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a violin chart

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the violins are
    drawn horizontally.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If y is specified, the violins are
    drawn vertically.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param violinmode: Default 'group', which draws the violins next
    to each other and 'overlay' which draws them on top of each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param points: Default 'outliers', which draws points outside the whiskers.
    'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
    'all' draws all points and False draws no points.
    :param box: Default False. Draw boxes inside the violin if True.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the violin chart
    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    if isinstance(table, Table):
        x = _to_list(x)
        y = _to_list(y)

        figs = []
        trace_generator = None

        for col in x:
            new_table, col_names, col_vals = preprocess_violin(table, col)
            args["table"] = new_table
            args["x"] = col_vals
            args["y"] = col_names

            figs.append(generate_figure(draw=px.violin, call_args=args, trace_generator=trace_generator))

            if not trace_generator:
                trace_generator = figs[0].trace_generator

        for col in y:
            new_table, col_names, col_vals = preprocess_violin(table, col)
            args["table"] = new_table
            args["x"] = col_names
            args["y"] = col_vals

            figs.append(generate_figure(draw=px.violin, call_args=args, trace_generator=trace_generator))

            if not trace_generator:
                trace_generator = figs[0].trace_generator

        # layer but with only the first layout (as subsequent ones were not modfied)
        return layer(*figs, which_layout=0)


def box(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        boxmode: str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        points: bool | str = 'outliers',
        notched: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a box chart

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the violins are
    drawn horizontally.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If y is specified, the violins are
    drawn vertically.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param boxmode: Default 'group', which draws the violins next
    to each other and 'overlay' which draws them on top of each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param points: Default 'outliers', which draws points outside the whiskers.
    'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
    'all' draws all points and False draws no points.
    :param notched: Default False, if True boxes are drawn with notches
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the box chart
    """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
        if isinstance(table, Table):
            x = _to_list(x)
            y = _to_list(y)

            figs = []
            trace_generator = None

            for col in x:
                new_table, col_names, col_vals = preprocess_violin(table, col)
                args["table"] = new_table
                args["x"] = col_vals
                args["y"] = col_names

                figs.append(generate_figure(draw=px.box, call_args=args, trace_generator=trace_generator))

                if not trace_generator:
                    trace_generator = figs[0].trace_generator

            for col in y:
                new_table, col_names, col_vals = preprocess_violin(table, col)
                args["table"] = new_table
                args["x"] = col_names
                args["y"] = col_vals

                figs.append(generate_figure(draw=px.box, call_args=args, trace_generator=trace_generator))

                if not trace_generator:
                    trace_generator = figs[0].trace_generator

            # layer but with only the first layout (as subsequent ones were not modfied)
            return layer(*figs, which_layout=0)


def strip(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        stripmode: bool | str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a strip chart

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the violins are
    drawn horizontally.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If y is specified, the violins are
    drawn vertically.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param stripmode: Default 'group', which draws the violins next
    to each other and 'overlay' which draws them on top of each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the strip chart
    """
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
        if isinstance(table, Table):
            x = _to_list(x)
            y = _to_list(y)

            figs = []
            trace_generator = None

            for col in x:
                new_table, col_names, col_vals = preprocess_violin(table, col)
                args["table"] = new_table
                args["x"] = col_vals
                args["y"] = col_names

                figs.append(generate_figure(draw=px.strip, call_args=args, trace_generator=trace_generator))

                if not trace_generator:
                    trace_generator = figs[0].trace_generator

            for col in y:
                new_table, col_names, col_vals = preprocess_violin(table, col)
                args["table"] = new_table
                args["x"] = col_names
                args["y"] = col_vals

                figs.append(generate_figure(draw=px.strip, call_args=args, trace_generator=trace_generator))

                if not trace_generator:
                    trace_generator = figs[0].trace_generator

            # layer but with only the first layout (as subsequent ones were not modified)
            return layer(*figs, which_layout=0)


def _ecdf(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        markers: bool = False,
        lines: bool = True,
        color_discrete_sequence: list[str] = None,
        line_dash_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        ecdfnorm: str = 'probability',
        ecdfmode: str = 'standard',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    # todo: not yet implemented
    if isinstance(table, Table):
        render_mode = "webgl"
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
        return generate_figure(draw=px.ecdf, call_args=args)


def histogram(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        # barnorm: str = None,
        # histnorm: str = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_bins: list[int] = None,
        histfunc: str = 'count',
        # cumulative: bool = False,
        nbins: int = 10,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a histogram

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the bars are drawn
    vertically.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If x is specified, the bars are drawn
    horizontally.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param pattern_shape_sequence: A list of patterns to sequentially apply
    to the series. The patterns loop, so if there are more series than
    patterns, patterns will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param barmode: Default 'relative'. If 'relative', bars are stacked. If
    'overlay', bars are drawn on top of each other. If 'group', bars are drawn
    next to each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param range_bins: A list of two numbers that specify the range of data
    that is used.
    :param histfunc: The function to use when aggregating within bins. One of
    'avg', 'count', 'count_distinct', 'max', 'median', 'min', 'std', 'sum',
    or 'var'
    :param nbins: Default 10. The number of bins to use.
    :param text_auto: Default False. If True, display the value at each bar.
    If a string, specifies a plotly texttemplate.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the histogram
    """
    # todo: barmode relative and overlay not working

    if isinstance(table, Table):
        if x:
            table, x, y = create_hist_tables(table, x, nbins, range_bins, histfunc)
        elif y:
            table, y, x = create_hist_tables(table, y, nbins, range_bins, histfunc)
            orientation = "h"
        else:
            raise ValueError("x or y must be specified")
        # since we're simulating a histogram with a bar plot, we want no data gaps
        bargap = 0

        # remove arguments not used in bar
        args = locals()
        args.pop("nbins")
        args.pop("histfunc")
        args.pop("range_bins")

        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
        args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")

        return generate_figure(draw=px.bar, call_args=args)


def pie(
        table: Table = None,
        names: str = None,
        values: str = None,
        color_discrete_sequence: list[str] = None,
        title: str = None,
        template: str = None,
        opacity: float = None,
        hole: float = None,
        aggregate: bool = True,
        callback: Callable = default_callback
):
    """
    Returns a pie chart

    :param table: A table to pull data from.
    :param names: The column containing names of the pie slices
    :param values: The column containing values of the pie slices
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param hole: Fraction of the radius to cut out of the center of the pie.
    :param aggregate: Default True, aggregate the table names by total values. Can
    be set to False if the table is already aggregated by name.
    :param callback:
    :return: A DeephavenFigure that contains the pie chart
    """
    if isinstance(table, Table):
        if aggregate:
            table = preprocess_pie(table, names, values)

        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        args.pop("preprocess")

        return generate_figure(draw=px.pie, call_args=args)


def treemap(
        table: Table = None,
        names: str = None,
        values: str = None,
        parents: str = None,
        ids: str = None,
        # path: str = None,
        title: str = None,
        template: str = None,
        branchvalues: str = None,
        maxdepth: int = None,
        callback: Callable = default_callback
):
    """
    Returns a treemap chart

    :param table: A table to pull data from.
    :param names: The column containing names of the sections
    :param values: The column containing values of the sections
    :param parents: The column containing parents of the sections
    :param ids: The column containing ids of the sections. Unlike values, these
    must be unique. Values are used for ids if ids are not specified.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param branchvalues: Set to 'total' to take the value at a level to include
    all descendants and 'remainder' to the value as the remainder after
    subtracting leaf values.
    :param maxdepth: Sets the total number of visible levels. Set to -1 to
     render all levels.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the treemap chart
    """
    if isinstance(table, Table):
        return generate_figure(draw=px.treemap, call_args=locals())


def sunburst(
        table: Table = None,
        names: str = None,
        values: str = None,
        parents: str = None,
        ids: str = None,
        title: str = None,
        template: str = None,
        branchvalues: str = None,
        maxdepth: int = None,
        callback: Callable = default_callback
):
    """
    Returns a treemap chart

    :param table: A table to pull data from.
    :param names: The column containing names of the sections
    :param values: The column containing values of the sections
    :param parents: The column containing parents of the sections
    :param ids: The column containing ids of the sections. Unlike values, these
    must be unique. Values are used for ids if ids are not specified.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param branchvalues: Set to 'total' to take the value at a level to include
    all descendants and 'remainder' to the value as the remainder after
    subtracting leaf values.
    :param maxdepth: Sets the total number of visible levels. Set to -1 to
     render all levels.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the treemap chart
    """
    if isinstance(table, Table):
        return generate_figure(draw=px.sunburst, call_args=locals())


def icicle(
        table: Table = None,
        names: str = None,
        values: str = None,
        parents: str = None,
        ids: str = None,
        title: str = None,
        template: str = None,
        branchvalues: str = None,
        maxdepth: int = None,
        callback: Callable = default_callback
):
    """
    Returns a treemap chart

    :param table: A table to pull data from.
    :param names: The column containing names of the sections
    :param values: The column containing values of the sections
    :param parents: The column containing parents of the sections
    :param ids: The column containing ids of the sections. Unlike values, these
    must be unique. Values are used for ids if ids are not specified.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param branchvalues: Set to 'total' to take the value at a level to include
    all descendants and 'remainder' to the value as the remainder after
    subtracting leaf values.
    :param maxdepth: Sets the total number of visible levels. Set to -1 to
     render all levels.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the treemap chart
    """
    if isinstance(table, Table):
        return generate_figure(draw=px.icicle, call_args=locals())


def _funnel(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        opacity: float = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    # todo: not yet implemented
    if isinstance(table, Table):
        return generate_figure(draw=px.funnel, call_args=locals())


def _funnel_area(
):
    # todo: not yet implemented
    pass

# todo: range slider
#   fig.update(layout_xaxis_rangeslider_visible=False)
def ohlc(
        table: Table = None,
        x: str = None,
        open: str = None,
        high: str = None,
        low: str = None,
        close: str = None,
        increasing_color_sequence: list[str] = None,
        decreasing_color_sequence: list[str] = None,
        xaxis_sequence: list[int] = None,
        yaxis_sequence: list[int] = None,
        yaxis_title_sequence: list[str] = None,
        xaxis_title_sequence: list[str] = None,
        callback: Callable = default_callback
):
    """
    Returns an ohlc chart

    :param table: A table to pull data from.
    :param x: The column containing x-axis data
    :param open: The column containing the open data
    :param high: The column containing the high data
    :param low: The column containing the low data
    :param close: The column containing the close data
    :param increasing_color_sequence: A list of colors to sequentially apply to
    the series on increasing bars. The colors loop, so if there are more series
    than colors, colors will be reused.
    :param decreasing_color_sequence: A list of colors to sequentially apply to
    the series on decreasing bars. The colors loop, so if there are more series
    than colors, colors will be reused.
    :param xaxis_sequence: A list of x axes to assign series to. Odd numbers
    starting with 1 are created on the bottom x axis and even numbers starting
    with 2 are created on the top x axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_sequence: A list of y axes to assign series to. Odd numbers
    starting with 1 are created on the left y axis and even numbers starting
    with 2 are created on the top y axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_title_sequence: A list of titles to sequentially apply to the
    y axes. The titles do not loop.
    :param xaxis_title_sequence: A list of titles to sequentially apply to the
    x axes. The titles do not loop.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the ohlc chart
    """
    if isinstance(table, Table):
        args = locals()
        args["x_finance"] = args.pop("x")
        return generate_figure(draw=draw_ohlc, call_args=args)


def candlestick(
        table: Table = None,
        x: str = None,
        open: str = None,
        high: str = None,
        low: str = None,
        close: str = None,
        increasing_color_sequence: list[str] = None,
        decreasing_color_sequence: list[str] = None,
        xaxis_sequence: list[int] = None,
        yaxis_sequence: list[int] = None,
        yaxis_title_sequence: list[str] = None,
        xaxis_title_sequence: list[str] = None,
        callback: Callable = default_callback
):
    """
    Returns a candlestick chart

    :param table: A table to pull data from.
    :param x: The column containing x-axis data
    :param open: The column containing the open data
    :param high: The column containing the high data
    :param low: The column containing the low data
    :param close: The column containing the close data
    :param increasing_color_sequence: A list of colors to sequentially apply to
    the series on increasing bars. The colors loop, so if there are more series
    than colors, colors will be reused.
    :param decreasing_color_sequence: A list of colors to sequentially apply to
    the series on decreasing bars. The colors loop, so if there are more series
    than colors, colors will be reused.
    :param xaxis_sequence: A list of x axes to assign series to. Odd numbers
    starting with 1 are created on the bottom x axis and even numbers starting
    with 2 are created on the top x axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_sequence: A list of y axes to assign series to. Odd numbers
    starting with 1 are created on the left y axis and even numbers starting
    with 2 are created on the top y axis. Axes are created up
    to the maximum number specified. The axes loop, so if there are more series
    than axes, axes will be reused.
    :param yaxis_title_sequence: A list of titles to sequentially apply to the
    y axes. The titles do not loop.
    :param xaxis_title_sequence: A list of titles to sequentially apply to the
    x axes. The titles do not loop.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the candlestick chart
    """
    if isinstance(table, Table):
        args = locals()
        args["x_finance"] = args.pop("x")
        return generate_figure(draw=draw_candlestick, call_args=args)


def _scatter_matrix():
    # todo: not yet implemented
    pass


def layer(
        *args: DeephavenFigure | Figure,
        which_layout: int = None,
        callback=default_callback
):
    """
    Layers the provided figures. Be default, the layouts are sequentially
    applied, so the layouts of later figures will override the layouts of early
    figures.

    :param args: The charts to layer
    :param which_layout: None to layer layouts, or an index of which arg to
    take the layout from
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: The layered chart
    """
    if len(args) == 0:
        raise ValueError("No figures provided to compose")

    new_data = []
    new_layout = {}
    new_data_mappings = []
    new_template = None

    for i, arg in enumerate(args):
        if isinstance(arg, Figure):
            new_data += arg.data
            if not which_layout or which_layout == i:
                new_layout.update(arg.to_dict()['layout'])

        elif isinstance(arg, DeephavenFigure):
            fig = arg.fig
            # the next data mapping should start after all the existing traces
            offset = len(new_data)
            new_data += fig.data
            if not which_layout or which_layout == i:
                new_layout.update(fig.to_dict()['layout'])
            new_data_mappings += arg.copy_mappings(offset=offset)
            new_template = arg.template if arg.template else new_template

        else:
            raise TypeError("All arguments must be of type Figure or DeephavenFigure")

    new_fig = Figure(data=new_data, layout=new_layout)

    new_fig = callback(new_fig)

    # todo: this doesn't maintain call args, but that isn't currently needed
    return DeephavenFigure(fig=new_fig, data_mappings=new_data_mappings, template=new_template)


def _make_subplots(
        rows=1,
        cols=1
):
    # todo: not yet implemented
    new_fig = subplots.make_subplots(rows=rows, cols=cols)
    return DeephavenFigure(new_fig)
