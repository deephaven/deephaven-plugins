from __future__ import annotations

from typing import Callable

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import draw_ohlc, draw_candlestick, DeephavenFigure, Calendar
from ..types import TableLike


def ohlc(
    table: TableLike,
    x: str | None = None,
    open: str | list[str] | None = None,
    high: str | list[str] | None = None,
    low: str | list[str] | None = None,
    close: str | list[str] | None = None,
    increasing_color_sequence: list[str] | None = None,
    decreasing_color_sequence: list[str] | None = None,
    xaxis_sequence: list[int] | None = None,
    yaxis_sequence: list[int] | None = None,
    yaxis_titles: list[str] | None = None,
    xaxis_titles: list[str] | None = None,
    calendar: Calendar = False,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns an ohlc chart

    Args:
      table: A table to pull data from.
      x: The column containing x-axis data
      open: The column containing the open data
      high: The column containing the high data
      low: The column containing the low data
      close: The column containing the close data
      increasing_color_sequence: A list of colors to sequentially apply to
        the series on increasing bars. The colors loop, so if there are
        more series than colors, colors will be reused.
      decreasing_color_sequence: A list of colors to sequentially apply to
        the series on decreasing bars. The colors loop, so if there are
        more series than colors, colors will be reused.
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
      yaxis_titles: A list of titles to sequentially apply to the y axes. The titles do not
          loop.
      xaxis_titles: A list of titles to sequentially apply to the x axes. The titles do not
          loop.
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
      DeephavenFigure: A DeephavenFigure that contains the ohlc chart

    """

    # todo: range slider
    #   fig.update(layout_xaxis_rangeslider_visible=False)
    args = locals()

    return process_args(args, set(), remap={"x": "x_finance"}, px_func=draw_ohlc)


def candlestick(
    table: TableLike,
    x: str | None = None,
    open: str | list[str] | None = None,
    high: str | list[str] | None = None,
    low: str | list[str] | None = None,
    close: str | list[str] | None = None,
    increasing_color_sequence: list[str] | None = None,
    decreasing_color_sequence: list[str] | None = None,
    xaxis_sequence: list[int] | None = None,
    yaxis_sequence: list[int] | None = None,
    yaxis_titles: list[str] | None = None,
    xaxis_titles: list[str] | None = None,
    calendar: Calendar = False,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a candlestick chart

    Args:
      table:  A table to pull data from.
      x: The column containing x-axis data
      open: The column containing the open data
      high: The column containing the high data
      low: The column containing the low data
      close: The column containing the close data
      increasing_color_sequence: A list of colors to sequentially apply to
        the series on increasing bars. The colors loop, so if there are
        more series than colors, colors will be reused.
      decreasing_color_sequence: A list of colors to sequentially apply to
        the series on decreasing bars. The colors loop, so if there are
        more series than colors, colors will be reused.
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
      yaxis_titles: A list of titles to sequentially apply to the y axes. The titles do not
          loop.
      xaxis_titles: A list of titles to sequentially apply to the x axes. The titles do not
          loop.
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
      DeephavenFigure: A DeephavenFigure that contains the candlestick chart

    """
    args = locals()

    return process_args(args, set(), remap={"x": "x_finance"}, px_func=draw_candlestick)
