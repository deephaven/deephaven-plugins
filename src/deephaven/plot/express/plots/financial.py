from functools import partial
from typing import Callable

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, unsafe_figure_update_wrapper
from ..deephaven_figure import generate_figure, draw_ohlc, draw_candlestick, DeephavenFigure


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
        yaxis_titles: list[str] = None,
        xaxis_titles: list[str] = None,
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
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
    :param yaxis_titles: A list of titles to sequentially apply to the
    y axes. The titles do not loop.
    :param xaxis_titles: A list of titles to sequentially apply to the
    x axes. The titles do not loop.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the ohlc chart
    """

    # todo: range slider
    #   fig.update(layout_xaxis_rangeslider_visible=False)
    args = locals()
    args["x_finance"] = args.pop("x")

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=draw_ohlc, call_args=args)
    )


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
        yaxis_titles: list[str] = None,
        xaxis_titles: list[str] = None,
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
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
    :param yaxis_titles: A list of titles to sequentially apply to the
    y axes. The titles do not loop.
    :param xaxis_titles: A list of titles to sequentially apply to the
    x axes. The titles do not loop.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the candlestick chart
    """
    args = locals()

    validate_common_args(args)

    args["x_finance"] = args.pop("x")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=draw_candlestick, call_args=args)
    )
