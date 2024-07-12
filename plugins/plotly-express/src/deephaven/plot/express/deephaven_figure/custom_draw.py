from __future__ import annotations

from itertools import zip_longest
from typing import Callable

from pandas import DataFrame
import plotly.graph_objects as go
from plotly.graph_objects import Figure
from plotly.validators.heatmap import ColorscaleValidator


def draw_finance(
    data_frame: DataFrame,
    x_finance: str | list[str],
    open: str | list[str],
    high: str | list[str],
    low: str | list[str],
    close: str | list[str],
    go_func: Callable,
) -> Figure:
    """Draws a finance (OHLC or candlestick) chart

    Args:
      data_frame: The data frame to draw with
      x_finance: The name of the column containing x-axis values
      open: The name of the column containing open values
      high: The name of the column containing high values
      low: The name of the column containing low values
      close: The name of the column containing close values
      go_func: The function to use to create graph objects

    Returns:
      Figure: The chart

    """
    if not all(len(open) == len(ls) for ls in [high, low, close]) and (
        len(open) == len(x_finance) or len(x_finance) == 1
    ):
        raise ValueError(
            "open, high, low, close must have same length and x "
            "must also be of the same length or be of length 1"
        )

    data = []

    for x_f, o, h, l, c in zip_longest(
        x_finance, open, high, low, close, fillvalue=x_finance[0]
    ):
        data.append(
            go_func(
                x=data_frame[x_f],
                open=data_frame[open],
                high=data_frame[high],
                low=data_frame[low],
                close=data_frame[close],
            )
        )

    return go.Figure(data=data)


def draw_ohlc(
    data_frame: DataFrame,
    x_finance: str | list[str],
    open: str | list[str],
    high: str | list[str],
    low: str | list[str],
    close: str | list[str],
) -> Figure:
    """Create a plotly OHLC chart.

    Args:
      data_frame: The data frame to draw with
      x_finance: The name of the column containing x-axis
        values
      open: The name of the column containing open values
      high: The name of the column containing high values
      low: The name of the column containing low values
      close: The name of the column containing close values

    Returns:
      The plotly OHLC chart

    """
    return draw_finance(data_frame, x_finance, open, high, low, close, go.Ohlc)


def draw_candlestick(
    data_frame: DataFrame,
    x_finance: str | list[str],
    open: str | list[str],
    high: str | list[str],
    low: str | list[str],
    close: str | list[str],
) -> Figure:
    """Create a plotly candlestick chart.

    Args:
      data_frame: The data frame to draw with
      x_finance: The name of the column containing x-axis
        values
      open: The name of the column containing open values
      high: The name of the column containing high values
      low: The name of the column containing low values
      close: The name of the column containing close values

    Returns:
      The plotly candlestick chart

    """

    return draw_finance(data_frame, x_finance, open, high, low, close, go.Candlestick)


def draw_density_heatmap(
    data_frame: DataFrame,
    x: str,
    y: str,
    z: str,
    labels: dict[str, str] | None = None,
    range_color: list[float] | None = None,
    color_continuous_scale: str | list[str] | None = "plasma",
    color_continuous_midpoint: float | None = None,
    opacity: float = 1.0,
    title: str | None = None,
    template: str | None = None,
) -> Figure:
    """Create a density heatmap

    Args:
      data_frame: The data frame to draw with
      x: The name of the column containing x-axis values
      y: The name of the column containing y-axis values
      z: The name of the column containing bin values
      labels: A dictionary of labels mapping columns to new labels
      color_continuous_scale: A color scale or list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      title: The title of the chart
      template: The template for the chart.

    Returns:
      The plotly density heatmap

    """

    # currently, most plots rely on px setting several attributes such as coloraxis, opacity, etc.
    # so we need to set some things manually
    # this could be done with handle_custom_args in generate.py in the future if
    # we need to provide more options, but it's much easier to just set it here
    # and doesn't risk breaking any other plots

    heatmap = go.Figure(
        go.Heatmap(
            x=data_frame[x],
            y=data_frame[y],
            z=data_frame[z],
            coloraxis="coloraxis1",
            opacity=opacity,
        )
    )

    range_color_list = range_color or [None, None]

    colorscale_validator = ColorscaleValidator("colorscale", "draw_density_heatmap")

    coloraxis_layout = dict(
        colorscale=colorscale_validator.validate_coerce(color_continuous_scale),
        cmid=color_continuous_midpoint,
        cmin=range_color_list[0],
        cmax=range_color_list[1],
    )

    if labels:
        x = labels.get(x, x)
        y = labels.get(y, y)

    heatmap.update_layout(
        coloraxis1=coloraxis_layout,
        title=title,
        template=template,
        xaxis_title=x,
        yaxis_title=y,
    )

    return heatmap
