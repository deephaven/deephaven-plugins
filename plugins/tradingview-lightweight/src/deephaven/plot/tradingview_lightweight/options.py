"""Type definitions and constants for TradingView Lightweight Charts plugin.

This module exposes the string-literal type aliases ("enum-like" choices) used
throughout the public TVL API for styling, axis behavior, and marker shapes.

All such aliases are :data:`typing.Literal` types, not :class:`enum.Enum`
subclasses, so they appear in signatures as a union of string literals (e.g.
``Literal["solid", "dotted", ...]``).  Each alias also has a ``__doc__``
attached via direct assignment so that ``dhautofunction`` and other autodoc
machinery can surface the full list of allowed values.

The full set of aliases exported as enums:

* :data:`LineStyle`, :data:`LineType`, :data:`LineWidth`
* :data:`CrosshairMode`, :data:`HorzAlign`, :data:`VertAlign`
* :data:`PriceScaleMode`, :data:`MarkerShape`, :data:`MarkerPosition`
* :data:`ChartType`, :data:`ColorSpace`, :data:`ColorType`
* :data:`PriceFormatter`, :data:`TickmarksPriceFormatter`
* :data:`PercentageFormatter`, :data:`TickmarksPercentageFormatter`
* :data:`PrecomputeConflationPriority`, :data:`LastPriceAnimationMode`
* :data:`MarkerSign`, :data:`MismatchDirection`, :data:`PriceLineSource`
* :data:`TickMarkType`, :data:`TrackingModeExitMode`

Limitation: Sphinx ``autodoc`` cannot render ``Literal`` aliases as full
documented members on their own.  The ``__doc__`` attribute on a
``Literal`` alias is only visible through ``help()`` / ``__doc__``
introspection; the recommended docs surface is to refer back to this
module's docstring for the enumerated values.  See
``notes/docstring-audit-limitations.md`` for details.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional, TypedDict
from ._colors import Color

# Line style constants (matching lightweight-charts LineStyle enum)
SOLID = 0
DOTTED = 1
DASHED = 2
LARGE_DASHED = 3
SPARSE_DOTTED = 4

LineStyle = Literal["solid", "dotted", "dashed", "large_dashed", "sparse_dotted"]
"""Line dash pattern used by chart grid lines, crosshairs, price lines, and
series with a line component.

Allowed values:

- ``"solid"`` — unbroken line.
- ``"dotted"`` — small evenly-spaced dots.
- ``"dashed"`` — short dashes.
- ``"large_dashed"`` — long dashes.
- ``"sparse_dotted"`` — widely-spaced dots.
"""

LineType = Literal["simple", "with_steps", "curved"]
"""Geometry used to connect successive data points in line / area / baseline
series.

Allowed values:

- ``"simple"`` — straight line segments between points.
- ``"with_steps"`` — staircase (constant value until next point).
- ``"curved"`` — smoothed monotone-cubic interpolation.
"""

LineWidth = Literal[1, 2, 3, 4]
"""Stroke width in CSS pixels for series lines, crosshairs, and price lines.

Allowed values: ``1``, ``2``, ``3``, ``4``.  Values outside this range are
rejected by the TVL JS runtime.
"""

# Coordinate and Logical are JS-only nominal types used by ITimeScaleApi
# (logicalToCoordinate, coordinateToLogical) and mouse event handlers.
# These APIs are architecturally unavailable from Python (no live chart handle).
# See: notes/api-coverage-report.md §16, §26.

HorzAlign = Literal["left", "center", "right"]
"""Horizontal alignment for text watermarks.

Allowed values: ``"left"``, ``"center"``, ``"right"``.
"""

VertAlign = Literal["top", "center", "bottom"]
"""Vertical alignment for text watermarks.

Allowed values: ``"top"``, ``"center"``, ``"bottom"``.
"""

PriceScaleId = Literal["left", "right"]
"""Which built-in price scale a series is attached to.

Allowed values: ``"left"``, ``"right"``.  Charts default to ``"right"``;
supply ``"left"`` on a series to render against the left price scale.
"""

CrosshairMode = Literal["normal", "magnet", "hidden", "magnet_ohlc"]
"""Crosshair tracking behavior.

Allowed values:

- ``"normal"`` — free cursor; crosshair follows the pointer exactly.
- ``"magnet"`` — snaps the horizontal crosshair to the nearest data point.
- ``"hidden"`` — crosshair is fully suppressed.
- ``"magnet_ohlc"`` — like ``"magnet"`` but snaps to OHLC bar extremes
  (open/high/low/close), not just data values.
"""

PriceScaleMode = Literal["normal", "logarithmic", "percentage", "indexed_to_100"]
"""How a price scale maps data values to vertical screen coordinates.

Allowed values:

- ``"normal"`` — linear mapping from raw values.
- ``"logarithmic"`` — base-10 logarithmic mapping.
- ``"percentage"`` — values shown as percentage change from the leftmost
  visible value.
- ``"indexed_to_100"`` — leftmost visible value rebased to 100; subsequent
  values shown relative to that 100.
"""

MarkerShape = Literal["circle", "square", "arrow_up", "arrow_down"]
"""Glyph drawn for a series marker.

Allowed values: ``"circle"``, ``"square"``, ``"arrow_up"``, ``"arrow_down"``.
"""

MarkerPosition = Literal[
    "above_bar",
    "below_bar",
    "in_bar",
    "at_price_top",
    "at_price_bottom",
    "at_price_middle",
]
"""Where on the chart a series marker is anchored.

Allowed values:

- ``"above_bar"`` — just above the data point / bar.
- ``"below_bar"`` — just below the data point / bar.
- ``"in_bar"`` — vertically centered on the bar body.
- ``"at_price_top"`` — at the supplied ``price``, glyph above the line.
- ``"at_price_bottom"`` — at the supplied ``price``, glyph below the line.
- ``"at_price_middle"`` — at the supplied ``price``, glyph centered on the line.

The three ``"at_price_*"`` positions require a ``price`` field on the marker.
"""

PriceFormatter = Literal[
    "currency_usd",
    "currency_eur",
    "currency_gbp",
    "currency_jpy",
    "percent",
    "compact",
    "scientific",
]
"""Preset name for the chart's price formatter (used on crosshair price labels
and last-value badges).

Allowed values:

- ``"currency_usd"`` — formatted as US dollars (``$1,234.56``).
- ``"currency_eur"`` — formatted as Euros (``€1.234,56``).
- ``"currency_gbp"`` — formatted as British pounds (``£1,234.56``).
- ``"currency_jpy"`` — formatted as Japanese yen (``¥1,235``, no decimals).
- ``"percent"`` — formatted as a percentage (``42.50%``).
- ``"compact"`` — compact notation with magnitude suffix (``1.2K``, ``3.4M``).
- ``"scientific"`` — scientific notation (``1.23e+3``).
"""

TickmarksPriceFormatter = Literal[
    "currency_usd",
    "currency_eur",
    "currency_gbp",
    "currency_jpy",
    "percent",
    "compact",
    "scientific",
]
"""Preset name for the tickmarks (axis tick label) price formatter.

Shares the same preset set as :data:`PriceFormatter` because both format the
same kind of numeric price values, but applied to axis tick labels rather than
crosshair / last-value labels.

Allowed values:

- ``"currency_usd"`` — US dollars (``$1,234.56``).
- ``"currency_eur"`` — Euros (``€1.234,56``).
- ``"currency_gbp"`` — British pounds (``£1,234.56``).
- ``"currency_jpy"`` — Japanese yen (``¥1,235``).
- ``"percent"`` — percentage (``42.50%``).
- ``"compact"`` — compact magnitude (``1.2K``, ``3.4M``).
- ``"scientific"`` — scientific notation (``1.23e+3``).
"""

PercentageFormatter = Literal[
    "percent",
    "percent_1dp",
    "percent_0dp",
    "decimal",
]
"""Preset name for the crosshair percentage formatter used when the price scale
is in ``"percentage"`` mode.  TVL passes raw percentage values (``42.5`` means
``42.5%``).

Allowed values:

- ``"percent"`` — ``"42.50%"`` (two decimal places).
- ``"percent_1dp"`` — ``"42.5%"`` (one decimal place).
- ``"percent_0dp"`` — ``"43%"`` (no decimals, rounded).
- ``"decimal"`` — ``"0.4250"`` (raw ratio, no percent sign).
"""

TickmarksPercentageFormatter = Literal[
    "percent",
    "percent_1dp",
    "percent_0dp",
    "decimal",
]
"""Preset name for the tickmarks percentage formatter (axis tick labels when the
price scale is in ``"percentage"`` mode).

Allowed values:

- ``"percent"`` — ``"42.50%"`` (two decimals).
- ``"percent_1dp"`` — ``"42.5%"`` (one decimal).
- ``"percent_0dp"`` — ``"43%"`` (no decimals).
- ``"decimal"`` — ``"0.4250"`` (raw ratio).
"""

ChartType = Literal["standard", "yield_curve", "options", "custom_numeric"]
"""Backend renderer / horizontal-scale selector for :func:`chart`.

Allowed values:

- ``"standard"`` — time-based x-axis via ``createChart``.  All series types
  are valid.
- ``"yield_curve"`` — numeric x-axis representing maturity in months via
  ``createYieldCurveChart``.  Only Line and Area series are supported.
- ``"options"`` — numeric x-axis via ``createOptionsChart``, originally for
  options-strike charts but usable for any numeric x.  All series types are
  valid.
- ``"custom_numeric"`` — alias for ``"options"``; prefer this name when the
  x-axis represents arbitrary numeric values (frequency, distance, etc.)
  rather than option strikes.
"""

ColorSpace = Literal["srgb", "display-p3"]
"""Canvas color space used by the chart.

Allowed values:

- ``"srgb"`` — standard sRGB color space (default).
- ``"display-p3"`` — wide-gamut Display P3 color space for HDR / wide-gamut
  displays.  Must be set at chart creation; cannot be changed later.
"""

PrecomputeConflationPriority = Literal["background", "user-visible", "user-blocking"]
"""Scheduling priority for precomputed conflation when
``precompute_conflation_on_init=True``.  Maps directly to the browser
``Scheduler.postTask`` priorities.

Allowed values:

- ``"background"`` — runs in idle time; lowest priority.
- ``"user-visible"`` — runs at normal task priority.
- ``"user-blocking"`` — runs ahead of other tasks; use sparingly.

Consumer: ``TimeScaleOptions.precomputeConflationPriority``.
"""

ColorType = Literal["solid", "gradient"]
"""Background fill mode for the chart layout.

Allowed values:

- ``"solid"`` — single solid color (``layout.background.color``).
- ``"gradient"`` — vertical gradient between ``topColor`` and ``bottomColor``.

In the Python API this is selected implicitly: pass ``background_color`` for
solid, or ``background_top_color`` + ``background_bottom_color`` together for
a gradient.
"""

LastPriceAnimationMode = Literal["disabled", "continuous", "on_data_update"]
"""Animation behavior of the last-price dot on Line, Area, and Baseline series.

Allowed values:

- ``"disabled"`` — no last-price animation (default).
- ``"continuous"`` — pulsing animation runs continuously.
- ``"on_data_update"`` — pulses once each time the series data updates.
"""

MarkerSign = Literal["negative", "neutral", "positive"]
"""Optional per-marker sign annotation passed through to
``SeriesMarker.sign``.

Allowed values: ``"negative"``, ``"neutral"``, ``"positive"``.

Mainly used by JS-side rendering hooks; included in the Python API for
completeness.
"""

MismatchDirection = Literal["nearest_left", "none", "nearest_right"]
"""Mismatch-direction selector used by ``ISeriesApi.dataByIndex()`` and
``barsInLogicalRange()``.  Allowed values:

- ``"nearest_left"`` — closest data point at or to the left of the index.
- ``"none"`` — exact match only; returns null if no data at that index.
- ``"nearest_right"`` — closest data point at or to the right of the index.

These methods are JS-runtime only; the alias is exported for type-hint
completeness and for any future bidirectional messaging work.
"""

PriceLineSource = Literal["last_bar", "last_visible"]
"""Which bar drives the automatic last-price horizontal rule on a series.

Allowed values:

- ``"last_bar"`` — uses the very last bar in the data set (default).
- ``"last_visible"`` — uses the last bar within the current viewport.

Consumer: ``SeriesOptionsCommon.priceLineSource``.
"""

TickMarkType = Literal["year", "month", "day_of_month", "time", "time_with_seconds"]
"""Tick-mark granularity passed to ``TimeScaleOptions.tickMarkFormatter``.

Allowed values:

- ``"year"`` — year boundary.
- ``"month"`` — month boundary.
- ``"day_of_month"`` — day boundary.
- ``"time"`` — intra-day hours / minutes.
- ``"time_with_seconds"`` — intra-day with seconds resolution.

``tickMarkFormatter`` itself requires a JS callable and is not exposed from
Python; this alias is provided for completeness.
"""

TrackingModeExitMode = Literal["on_touch_end", "on_next_tap"]
"""When the touch-device tracking mode (crosshair stays where the user
tapped) is exited.

Allowed values:

- ``"on_touch_end"`` — exit as soon as the touch is released.
- ``"on_next_tap"`` — keep tracking until the user taps somewhere else.

Consumer: ``ChartOptionsBase.trackingMode.exitMode``.
"""

# Map Python-friendly names to lightweight-charts enum values
LINE_STYLE_MAP = {
    "solid": 0,
    "dotted": 1,
    "dashed": 2,
    "large_dashed": 3,
    "sparse_dotted": 4,
}

LINE_TYPE_MAP = {
    "simple": 0,
    "with_steps": 1,
    "curved": 2,
}

CROSSHAIR_MODE_MAP = {
    "normal": 0,
    "magnet": 1,
    "hidden": 2,
    "magnet_ohlc": 3,
}

PRICE_SCALE_MODE_MAP = {
    "normal": 0,
    "logarithmic": 1,
    "percentage": 2,
    "indexed_to_100": 3,
}

MARKER_POSITION_MAP = {
    "above_bar": "aboveBar",
    "below_bar": "belowBar",
    "in_bar": "inBar",
    "at_price_top": "atPriceTop",
    "at_price_bottom": "atPriceBottom",
    "at_price_middle": "atPriceMiddle",
}

MARKER_SHAPE_MAP = {
    "circle": "circle",
    "square": "square",
    "arrow_up": "arrowUp",
    "arrow_down": "arrowDown",
}

CHART_TYPE_MAP = {
    "standard": "standard",
    "yield_curve": "yieldCurve",
    "options": "options",
    "custom_numeric": "options",  # alias — same JS renderer
}

# NOTE: The TVL JS function createChartEx(container, horzScaleBehavior, options?)
# cannot be mapped to Python.  The horzScaleBehavior argument is a JS object whose
# methods (formatHorzItem, preprocessData, etc.) run in the browser at render time.
# There is no mechanism to serialize arbitrary Python callables to browser-side JS
# through the JSON message channel.  The built-in behaviors (yieldCurve, options)
# are exposed as named chart types above.  Any user needing a custom behavior must
# write a JS plugin extension.

LAST_PRICE_ANIMATION_MODE_MAP = {
    "disabled": 0,
    "continuous": 1,
    "on_data_update": 2,
}

PRICE_LINE_SOURCE_MAP = {
    "last_bar": 0,
    "last_visible": 1,
}

# MarkerSign, MismatchDirection, and TickMarkType are type-only (Literal aliases
# for annotations). Their integer maps are omitted because these enums are only
# consumed by JS runtime APIs not reachable from the Python static config layer.

TRACKING_MODE_EXIT_MODE_MAP = {
    "on_touch_end": 0,
    "on_next_tap": 1,
}


class PriceFormat(TypedDict, total=False):
    """Price format configuration (built-in formats only).

    Keys match the TVL JS API exactly:
      - type:      ``'price'`` | ``'volume'`` | ``'percent'``
      - precision: number of decimal places
      - minMove:   minimum price movement (e.g. 0.01 for cents)

    Note:
        The ``'custom'`` type from the TradingView JS API requires a JavaScript
        formatter callback and cannot be expressed in this Python plugin. Passing
        ``type='custom'`` will raise ``ValueError`` at chart-building time.
    """

    type: Literal["price", "volume", "percent"]
    precision: int
    minMove: float


@dataclass
class WatermarkLine:
    """One line of a multi-line text watermark.

    All fields except ``text`` are optional; omitted fields inherit TVL defaults
    (fontSize=48, color='rgba(0,0,0,0.5)', lineHeight=1.2*fontSize).

    Args:
        text: The watermark text. Required (the line is skipped if empty).
        color: CSS color string. Defaults to a theme-derived semi-transparent color.
        font_size: Font size in pixels. Defaults to 48.
        line_height: Line height in pixels. Defaults to 1.2 * font_size.
        font_style: CSS font-style string, e.g. ``'italic'``. Defaults to ``''``.

    Note:
        font_family is intentionally omitted — we do not allow font customization.
    """

    text: str
    color: Optional[Color] = None
    font_size: Optional[int] = None
    line_height: Optional[float] = None
    font_style: Optional[str] = None

    def to_dict(self) -> dict:
        """Serialise to the JS WatermarkLineOptions shape (camelCase keys, None omitted)."""
        return _watermark_line_to_dict(self)


def _watermark_line_to_dict(line: WatermarkLine) -> dict:
    """Convert a WatermarkLine to a camelCase dict, omitting None values."""
    d: dict = {"text": line.text}
    if line.color is not None:
        d["color"] = line.color
    if line.font_size is not None:
        d["fontSize"] = line.font_size
    if line.line_height is not None:
        d["lineHeight"] = line.line_height
    if line.font_style is not None:
        d["fontStyle"] = line.font_style
    return d


def watermark_line(
    text: str,
    color: Optional[Color] = None,
    font_size: Optional[int] = None,
    line_height: Optional[float] = None,
    font_style: Optional[str] = None,
) -> WatermarkLine:
    """Create one line of a multi-line text watermark.

    Pass a list of ``watermark_line(...)`` results to
    ``tvl.chart(..., watermark_lines=[...])`` to draw a stacked
    multi-line watermark behind the chart.  All fields except ``text``
    are optional; omitted fields inherit TVL defaults
    (``font_size=48``, color a theme-derived semi-transparent value,
    ``line_height=1.2 * font_size``, ``font_style=''``).

    Args:
        text (str): The watermark text.  Required (the line is skipped
            if empty).
        color (Optional[Color]): CSS color string.  Defaults to a
            theme-derived semi-transparent color.
        font_size (Optional[int]): Font size in pixels.  Defaults to
            ``48``.
        line_height (Optional[float]): Line height in pixels.  Defaults
            to ``1.2 * font_size``.
        font_style (Optional[str]): CSS font-style string, e.g.
            ``"italic"``.  Defaults to ``""``.

    Returns:
        WatermarkLine: A :class:`WatermarkLine` instance suitable for
        passing inside ``watermark_lines=[...]``.

    Example:
        >>> wl = tvl.watermark_line("AAPL", color="#888", font_size=72)
    """
    return WatermarkLine(
        text=text,
        color=color,
        font_size=font_size,
        line_height=line_height,
        font_style=font_style,
    )


# PriceFormatCustom is intentionally not implemented.
# The JS API defines:
#   { type: 'custom'; formatter: (priceValue: BarPrice) => string; minMove?: number }
# The 'formatter' field is a JavaScript callback. Since this plugin serializes
# configuration to JSON, there is no way to express a Python callable as JS code.
# See: notes/api-coverage-report.md §26.

# customSeriesDefaultOptions is not implemented.
# It is only meaningful in the context of custom series (ICustomSeriesView).
# Custom series require user-supplied JavaScript ICustomSeriesView implementations,
# which the Python plugin has no mechanism to accept or forward.
# Implementation is blocked until custom series support is added.
# See: notes/api-coverage-report.md §10, §27.
