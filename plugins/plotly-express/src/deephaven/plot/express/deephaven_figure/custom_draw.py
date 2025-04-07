from __future__ import annotations

from itertools import zip_longest
from typing import Callable

from pandas import DataFrame
import plotly.graph_objects as go
from plotly.graph_objects import Figure
from plotly.validators.heatmap import ColorscaleValidator

# attach a prefix to the number format so that we can identify it as the GWT Java NumberFormat syntax
# https://www.gwtproject.org/javadoc/latest/com/google/gwt/i18n/client/NumberFormat.html
# this differentiates it from the d3 format syntax, which the user could provide through an unsafe update
# this should be safe as it shouldn't appear naturally in a d3 format string
# https://github.com/d3/d3-format/tree/v1.4.5#d3-format
# but isn't a perfect solution
FORMAT_PREFIX = "DEEPHAVEN_JAVA_FORMAT="


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

    layout = go.Layout(
        xaxis={
            "anchor": "y",
            "domain": [0.0, 1.0],
            "side": "bottom",
        },
        yaxis={
            "anchor": "x",
            "domain": [0.0, 1.0],
            "side": "left",
        },
    )

    return go.Figure(data=data, layout=layout)


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


def draw_indicator(
    data_frame: DataFrame,
    value: str,
    reference: str | None = None,
    number: bool = True,
    gauge: str | None = None,
    axis: bool = False,
    prefix: str | None = None,
    suffix: str | None = None,
    increasing_text: str | None = None,
    decreasing_text: str | None = None,
    number_format: str | None = None,
    text_indicator: str | None = None,
    layout_title: str | None = None,
    title: str | None = None,
) -> Figure:
    """Create an indicator chart.

    Args:
      data_frame: The data frame to draw with
      value: The column to use as the value.
      reference: The column to use as the reference value.
      number: True to show the number, False to hide it.
      gauge: Specifies the type of gauge to use.
        Set to "angular" for a half-circle gauge and "bullet" for a horizontal gauge.
      axis: True to show the axis. Only valid if gauge is set.
      prefix: A string to prepend to the number value.
      suffix: A string to append to the number value.
      increasing_text: The text to display before the delta if the number value
        is greater than the reference value.
      decreasing_text: The text to display before the delta if the number value
        is less than the reference value.
      number_format: The format to use for the number.
      text_indicator: The column to use as text for the indicator.
      layout_title: The title on the layout
      title: The title on the indicator trace

    Returns:
      The plotly indicator chart.

    """

    modes = []
    if number:
        modes.append("number")
    if reference:
        modes.append("delta")
    if gauge:
        modes.append("gauge")
    mode = "+".join(modes)

    fig = go.Figure(
        go.Indicator(
            value=data_frame[value][0],
            mode=mode,
            domain={"x": [0, 1], "y": [0, 1]},
        ),
        layout={
            "legend": {"tracegroupgap": 0},
            "margin": {"t": 60},
        },
    )

    if reference:
        fig.update_traces(delta_reference=data_frame[reference][0])

    if layout_title:
        fig.update_layout(title=layout_title)

    if title:
        # This is the title on the indicator trace. This is where it should go by default.
        # If if needs to go on the layout, it should be set in layout_title.
        fig.update_traces(title_text=title)

    if text_indicator:
        fig.update_traces(title_text=data_frame[text_indicator][0])

    if gauge:
        fig.update_traces(gauge={"shape": gauge, "axis": {"visible": axis}})

    if prefix:
        fig.update_traces(delta_prefix=prefix, number_prefix=prefix)

    if suffix:
        fig.update_traces(delta_suffix=suffix, number_suffix=suffix)

    if increasing_text:
        fig.update_traces(delta_increasing_symbol=increasing_text)

    if decreasing_text:
        fig.update_traces(delta_decreasing_symbol=decreasing_text)

    if number_format:
        # Plotly expects d3 format strings so these will be converted on the client.
        fig.update_traces(
            delta_valueformat=FORMAT_PREFIX + number_format,
            number_valueformat=FORMAT_PREFIX + number_format,
        )

    return fig
