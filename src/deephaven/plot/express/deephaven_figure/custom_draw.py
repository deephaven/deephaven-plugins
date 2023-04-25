from itertools import zip_longest
from typing import Callable

from pandas import DataFrame
import plotly.graph_objects as go
from plotly.graph_objects import Figure


def draw_finance(
        data_frame: DataFrame,
        x_finance: str | list[str],
        open: str | list[str],
        high: str | list[str],
        low: str | list[str],
        close: str | list[str],
        go_func: Callable
):
    """
    Draws a finance (OHLC or candlestick) chart

    :param data_frame: The data frame to draw with
    :param x_finance: The name of the column containing x-axis values
    :param open: The name of the column containing open values
    :param high: The name of the column containing high values
    :param low: The name of the column containing low values
    :param close: The name of the column containing close values
    :param go_func: The function to use to create graph objects
    :return: The chart
    """
    if not all(len(open) == len(ls) for ls in [high, low, close]) and \
            (len(open) == len(x_finance) or len(x_finance) == 1):
        raise ValueError("open, high, low, close must have same length and x "
                         "must also be of the same length or be of length 1")

    data = []

    for x_f, o, h, l, c in zip_longest(x_finance, open, high, low, close, fillvalue=x_finance[0]):
        data.append(go_func(x=data_frame[x_f],
                            open=data_frame[open],
                            high=data_frame[high],
                            low=data_frame[low],
                            close=data_frame[close]))

    return go.Figure(data=data)


def draw_ohlc(
        data_frame: DataFrame,
        x_finance: str | list[str],
        open: str | list[str],
        high: str | list[str],
        low: str | list[str],
        close: str | list[str],
) -> Figure:
    """
    Create a plotly OHLC chart.

    :param data_frame: The data frame to draw with
    :param x_finance: The name of the column containing x-axis values
    :param open: The name of the column containing open values
    :param high: The name of the column containing high values
    :param low: The name of the column containing low values
    :param close: The name of the column containing close values
    :return: The plotly OHLC chart
    """
    return draw_finance(
        data_frame, x_finance,
        open, high, low, close,
        go.Ohlc)


def draw_candlestick(
        data_frame: DataFrame,
        x_finance: str | list[str],
        open: str | list[str],
        high: str | list[str],
        low: str | list[str],
        close: str | list[str],
) -> Figure:
    """
    Create a plotly candlestick chart.

    :param data_frame: The data frame to draw with
    :param x_finance: The name of the column containing x-axis values
    :param open: The name of the column containing open values
    :param high: The name of the column containing high values
    :param low: The name of the column containing low values
    :param close: The name of the column containing close values
    :return: The plotly candlestick chart
    """

    return draw_finance(
        data_frame, x_finance,
        open, high, low, close,
        go.Candlestick)
