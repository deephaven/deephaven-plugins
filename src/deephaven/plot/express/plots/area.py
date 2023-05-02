from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, unsafe_figure_update_wrapper
from ..deephaven_figure import generate_figure, DeephavenFigure


def area(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        size: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        size_sequence: list[int] = None,
        xaxis_sequence: list[str] = None,
        yaxis_sequence: list[str] = None,
        markers: bool = False,
        # todo: groupnorm in engine
        groupnorm: str = None,
        log_x: bool | list[bool] = False,
        log_y: bool | list[bool] = False,
        range_x: list[int] | list[list[int]] = None,
        range_y: list[int] | list[list[int]] = None,
        yaxis_titles: list[str] = None,
        xaxis_titles: list[str] = None,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns an area chart

    :param table: A table to pull data from.
    :param x: A column or list of columns that contain x-axis values.
    :param y: A column or list of columns that contain y-axis values.
    :param size: A column or list of columns that contain size values.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param pattern_shape_sequence: A list of patterns to sequentially apply
    to the series. The patterns loop, so if there are more series than
    patterns, patterns will be reused.
    :param symbol_sequence: A list of symbols to sequentially apply to the
    markers in the series. The symbols loop, so if there are more series than
    symbols, symbols will be reused.
    :param size_sequence: A list of sizes to sequentially apply to the
    markers in the series. The sizes loop, so if there are more series than
    symbols, sizes will be reused. This is overriden is "size" is specified.
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
    :param yaxis_titles: A list of titles to sequentially apply to the
    y axes. The titles do not loop.
    :param xaxis_titles: A list of titles to sequentially apply to the
    x axes. The titles do not loop.
    :param line_shape: The line shape for all lines created. One of 'linear',
    'spline', 'vhv', 'hvh', 'vh', 'hv'. Default 'linear'
    :param title: The title of the chart
    :param template: The template for the chart.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the area chart
    """
    args = locals()

    validate_common_args(args)

    args["pattern_shape_sequence_area"] = args.pop("pattern_shape_sequence")
    args["color_discrete_sequence_marker"] = args["color_discrete_sequence"]
    args["color_discrete_sequence_line"] = args.pop("color_discrete_sequence")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.area, call_args=args)
    )
