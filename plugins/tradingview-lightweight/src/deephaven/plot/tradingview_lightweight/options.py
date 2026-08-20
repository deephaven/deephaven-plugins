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
from typing import Literal, Optional
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
rejected as invalid.
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
"""Optional per-marker sign annotation.

Allowed values: ``"negative"``, ``"neutral"``, ``"positive"``.
"""

MismatchDirection = Literal["nearest_left", "none", "nearest_right"]
"""How a lookup resolves an index that has no exact data point.

Allowed values:

- ``"nearest_left"`` — closest data point at or to the left of the index.
- ``"none"`` — exact match only; returns null if no data at that index.
- ``"nearest_right"`` — closest data point at or to the right of the index.
"""

PriceLineSource = Literal["last_bar", "last_visible"]
"""Which bar drives the automatic last-price horizontal rule on a series.

Allowed values:

- ``"last_bar"`` — uses the very last bar in the data set (default).
- ``"last_visible"`` — uses the last bar within the current viewport.

Consumer: ``SeriesOptionsCommon.priceLineSource``.
"""

TickMarkType = Literal["year", "month", "day_of_month", "time", "time_with_seconds"]
"""Tick-mark granularity for time-axis labels.

Allowed values:

- ``"year"`` — year boundary.
- ``"month"`` — month boundary.
- ``"day_of_month"`` — day boundary.
- ``"time"`` — intra-day hours / minutes.
- ``"time_with_seconds"`` — intra-day with seconds resolution.

The time scale picks the right granularity per tick automatically.
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


@dataclass
class PriceFormat:
    """Per-series number format. Pass to ``price_format=`` on any series factory.

    Args:
        type: Value kind — ``"price"``, ``"volume"``, or ``"percent"``.
        precision: Number of decimal places.
        min_move: Smallest representable step (e.g. ``0.01`` for cents).
    """

    type: Literal["price", "volume", "percent"] = "price"
    precision: Optional[int] = None
    min_move: Optional[float] = None

    def to_dict(self) -> dict:
        """Serialise to the JS priceFormat shape (camelCase, None omitted)."""
        d: dict = {"type": self.type}
        if self.precision is not None:
            d["precision"] = self.precision
        if self.min_move is not None:
            d["minMove"] = self.min_move
        return d


def price_format(
    type: Literal["price", "volume", "percent"] = "price",
    precision: Optional[int] = None,
    min_move: Optional[float] = None,
) -> PriceFormat:
    """Create a :class:`PriceFormat` for a series' ``price_format=`` argument.

    Example:
        >>> tvl.line(..., price_format=tvl.price_format(precision=4, min_move=0.0001))
    """
    return PriceFormat(type=type, precision=precision, min_move=min_move)


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


# --- Grouped chart-configuration objects ---
#
# These collapse the large, repeated clusters of ``chart()`` styling options
# into reusable typed objects. Each takes snake_case Python arguments and
# ``to_dict()`` serialises to the camelCase JS shape (None values omitted),
# mirroring the WatermarkLine pattern above. Pass them to ``tvl.chart(...)``.


@dataclass
class PriceScale:
    """Styling and behavior for a single price (value) scale.

    Reuse one instance for any of the three scale slots on
    ``tvl.chart(...)`` — ``right_price_scale=``, ``left_price_scale=``,
    and ``overlay_price_scale=``. Omitted fields inherit TVL defaults.

    Args:
        visible: Show the scale. (Ignored for the overlay scale.)
        border_visible: Show the scale border.
        border_color: Border CSS color.
        auto_scale: Auto-fit the scale to the visible data (default).
            Set ``False`` to fit once on load, then hold that range so
            the axis stays fixed as the user zooms and pans.
        mode: Scale mapping mode; see :data:`PriceScaleMode`.
        invert_scale: Flip the axis top-to-bottom.
        align_labels: Align scale labels with chart pixels.
        text_color: Scale label color.
        entire_text_only: Render only complete labels (avoid clipping).
        ticks_visible: Show tick marks on the scale.
        minimum_width: Minimum scale width in pixels.
        ensure_edge_tick_marks_visible: Force tick marks at the top/bottom edges.
        tick_mark_density: Tick-mark spacing (default ``2.5``). Reads
            inverted: lower values render more ticks, higher values fewer.
        margin_top: Top margin as a fraction (0-1).
        margin_bottom: Bottom margin as a fraction (0-1).
    """

    visible: Optional[bool] = None
    border_visible: Optional[bool] = None
    border_color: Optional[Color] = None
    auto_scale: Optional[bool] = None
    mode: Optional["PriceScaleMode"] = None
    invert_scale: Optional[bool] = None
    align_labels: Optional[bool] = None
    text_color: Optional[Color] = None
    entire_text_only: Optional[bool] = None
    ticks_visible: Optional[bool] = None
    minimum_width: Optional[int] = None
    ensure_edge_tick_marks_visible: Optional[bool] = None
    tick_mark_density: Optional[float] = None
    margin_top: Optional[float] = None
    margin_bottom: Optional[float] = None

    def to_dict(self) -> dict:
        """Serialise to the JS PriceScaleOptions shape (camelCase, None omitted)."""
        d: dict = {}
        if self.visible is not None:
            d["visible"] = self.visible
        if self.border_visible is not None:
            d["borderVisible"] = self.border_visible
        if self.border_color is not None:
            d["borderColor"] = self.border_color
        if self.auto_scale is not None:
            d["autoScale"] = self.auto_scale
        if self.mode is not None:
            d["mode"] = PRICE_SCALE_MODE_MAP[self.mode]
        if self.invert_scale is not None:
            d["invertScale"] = self.invert_scale
        if self.align_labels is not None:
            d["alignLabels"] = self.align_labels
        if self.text_color is not None:
            d["textColor"] = self.text_color
        if self.entire_text_only is not None:
            d["entireTextOnly"] = self.entire_text_only
        if self.ticks_visible is not None:
            d["ticksVisible"] = self.ticks_visible
        if self.minimum_width is not None:
            d["minimumWidth"] = self.minimum_width
        if self.ensure_edge_tick_marks_visible is not None:
            d["ensureEdgeTickMarksVisible"] = self.ensure_edge_tick_marks_visible
        if self.tick_mark_density is not None:
            d["tickMarkDensity"] = self.tick_mark_density
        margins: dict = {}
        if self.margin_top is not None:
            margins["top"] = self.margin_top
        if self.margin_bottom is not None:
            margins["bottom"] = self.margin_bottom
        if margins:
            d["scaleMargins"] = margins
        return d


def price_scale(
    visible: Optional[bool] = None,
    border_visible: Optional[bool] = None,
    border_color: Optional[Color] = None,
    auto_scale: Optional[bool] = None,
    mode: Optional["PriceScaleMode"] = None,
    invert_scale: Optional[bool] = None,
    align_labels: Optional[bool] = None,
    text_color: Optional[Color] = None,
    entire_text_only: Optional[bool] = None,
    ticks_visible: Optional[bool] = None,
    minimum_width: Optional[int] = None,
    ensure_edge_tick_marks_visible: Optional[bool] = None,
    tick_mark_density: Optional[float] = None,
    margin_top: Optional[float] = None,
    margin_bottom: Optional[float] = None,
) -> PriceScale:
    """Create a :class:`PriceScale` config for ``tvl.chart(...)``.

    Pass the result to ``right_price_scale=``, ``left_price_scale=``, or
    ``overlay_price_scale=``. One instance can be reused across slots.

    Example:
        >>> scale = tvl.price_scale(border_visible=True, text_color="#666")
        >>> tvl.chart(..., right_price_scale=scale, overlay_price_scale=scale)
    """
    return PriceScale(
        visible=visible,
        border_visible=border_visible,
        border_color=border_color,
        auto_scale=auto_scale,
        mode=mode,
        invert_scale=invert_scale,
        align_labels=align_labels,
        text_color=text_color,
        entire_text_only=entire_text_only,
        ticks_visible=ticks_visible,
        minimum_width=minimum_width,
        ensure_edge_tick_marks_visible=ensure_edge_tick_marks_visible,
        tick_mark_density=tick_mark_density,
        margin_top=margin_top,
        margin_bottom=margin_bottom,
    )


@dataclass
class CrosshairLine:
    """Styling for one crosshair line (vertical or horizontal).

    Pass to :func:`crosshair` as ``vert_line=`` / ``horz_line=``.

    Args:
        width: Line width in pixels; see :data:`LineWidth`.
        color: Line CSS color.
        style: Dash pattern; see :data:`LineStyle`.
        visible: Show the line.
        label_visible: Show the line's axis label.
        label_background_color: Axis-label background color.
    """

    width: Optional["LineWidth"] = None
    color: Optional[Color] = None
    style: Optional["LineStyle"] = None
    visible: Optional[bool] = None
    label_visible: Optional[bool] = None
    label_background_color: Optional[Color] = None

    def to_dict(self) -> dict:
        """Serialise to the JS CrosshairLineOptions shape (camelCase, None omitted)."""
        d: dict = {}
        if self.width is not None:
            d["width"] = self.width
        if self.color is not None:
            d["color"] = self.color
        if self.style is not None:
            d["style"] = LINE_STYLE_MAP[self.style]
        if self.visible is not None:
            d["visible"] = self.visible
        if self.label_visible is not None:
            d["labelVisible"] = self.label_visible
        if self.label_background_color is not None:
            d["labelBackgroundColor"] = self.label_background_color
        return d


def crosshair_line(
    width: Optional["LineWidth"] = None,
    color: Optional[Color] = None,
    style: Optional["LineStyle"] = None,
    visible: Optional[bool] = None,
    label_visible: Optional[bool] = None,
    label_background_color: Optional[Color] = None,
) -> CrosshairLine:
    """Create a :class:`CrosshairLine` for ``tvl.crosshair(vert_line=..., horz_line=...)``."""
    return CrosshairLine(
        width=width,
        color=color,
        style=style,
        visible=visible,
        label_visible=label_visible,
        label_background_color=label_background_color,
    )


@dataclass
class Crosshair:
    """Chart crosshair configuration. Pass to ``tvl.chart(crosshair=...)``.

    Args:
        mode: Tracking behavior; see :data:`CrosshairMode`.
        do_not_snap_to_hidden_series: In magnet/snap modes, skip hidden series.
        vert_line: Styling for the vertical crosshair line.
        horz_line: Styling for the horizontal crosshair line.
    """

    mode: Optional["CrosshairMode"] = None
    do_not_snap_to_hidden_series: Optional[bool] = None
    vert_line: Optional[CrosshairLine] = None
    horz_line: Optional[CrosshairLine] = None

    def to_dict(self) -> dict:
        """Serialise to the JS CrosshairOptions shape (camelCase, None omitted)."""
        d: dict = {}
        if self.mode is not None:
            d["mode"] = CROSSHAIR_MODE_MAP.get(self.mode, 0)
        if self.do_not_snap_to_hidden_series is not None:
            d["doNotSnapToHiddenSeriesIndices"] = self.do_not_snap_to_hidden_series
        if self.vert_line is not None:
            vert = self.vert_line.to_dict()
            if vert:
                d["vertLine"] = vert
        if self.horz_line is not None:
            horz = self.horz_line.to_dict()
            if horz:
                d["horzLine"] = horz
        return d


def crosshair(
    mode: Optional["CrosshairMode"] = None,
    do_not_snap_to_hidden_series: Optional[bool] = None,
    vert_line: Optional[CrosshairLine] = None,
    horz_line: Optional[CrosshairLine] = None,
) -> Crosshair:
    """Create a :class:`Crosshair` config for ``tvl.chart(crosshair=...)``.

    Example:
        >>> tvl.chart(..., crosshair=tvl.crosshair(
        ...     mode="magnet", vert_line=tvl.crosshair_line(color="#aaa")))
    """
    return Crosshair(
        mode=mode,
        do_not_snap_to_hidden_series=do_not_snap_to_hidden_series,
        vert_line=vert_line,
        horz_line=horz_line,
    )


@dataclass
class GridLines:
    """Styling for one axis of the chart grid (vertical or horizontal lines).

    Pass to :func:`grid` as ``vert=`` / ``horz=``. Omitted fields inherit
    TVL defaults.

    Args:
        visible: Show the gridlines.
        color: Gridline CSS color.
        style: Dash pattern; see :data:`LineStyle`.
    """

    visible: Optional[bool] = None
    color: Optional[Color] = None
    style: Optional["LineStyle"] = None

    def to_dict(self) -> dict:
        """Serialise to the JS GridLineOptions shape (camelCase, None omitted)."""
        d: dict = {}
        if self.visible is not None:
            d["visible"] = self.visible
        if self.color is not None:
            d["color"] = self.color
        if self.style is not None:
            d["style"] = LINE_STYLE_MAP[self.style]
        return d


def grid_lines(
    visible: Optional[bool] = None,
    color: Optional[Color] = None,
    style: Optional["LineStyle"] = None,
) -> GridLines:
    """Create :class:`GridLines` styling for ``tvl.grid(vert=..., horz=...)``."""
    return GridLines(visible=visible, color=color, style=style)


@dataclass
class Grid:
    """Chart grid configuration. Pass to ``tvl.chart(grid=...)``.

    Args:
        vert: Styling for the vertical gridlines.
        horz: Styling for the horizontal gridlines.
    """

    vert: Optional[GridLines] = None
    horz: Optional[GridLines] = None

    def to_dict(self) -> dict:
        """Serialise to the JS GridOptions shape (camelCase, None omitted)."""
        d: dict = {}
        if self.vert is not None:
            vert = self.vert.to_dict()
            if vert:
                d["vertLines"] = vert
        if self.horz is not None:
            horz = self.horz.to_dict()
            if horz:
                d["horzLines"] = horz
        return d


def grid(
    vert: Optional[GridLines] = None,
    horz: Optional[GridLines] = None,
) -> Grid:
    """Create a chart :class:`Grid` config for ``tvl.chart(grid=...)``.

    Example:
        >>> tvl.chart(..., grid=tvl.grid(vert=tvl.grid_lines(visible=False)))
    """
    return Grid(vert=vert, horz=horz)


@dataclass
class LastPriceLine:
    """Styling for a series' automatic last-price horizontal rule.

    Pass to any series constructor via ``last_price_line=``.

    Args:
        visible: Show the last-price line (TVL default ``True``).
        source: Which bar drives the line; see :data:`PriceLineSource`.
        width: Stroke width in pixels; see :data:`LineWidth`.
        color: Line CSS color (empty string uses the series color).
        style: Dash pattern; see :data:`LineStyle`.
    """

    visible: Optional[bool] = None
    source: Optional["PriceLineSource"] = None
    width: Optional["LineWidth"] = None
    color: Optional[Color] = None
    style: Optional["LineStyle"] = None

    def to_dict(self) -> dict:
        """Serialise to flat camelCase ``priceLine*`` series-option keys (None omitted)."""
        pairs = [
            ("priceLineVisible", self.visible),
            (
                "priceLineSource",
                PRICE_LINE_SOURCE_MAP[self.source] if self.source is not None else None,
            ),
            ("priceLineWidth", self.width),
            ("priceLineColor", self.color),
            (
                "priceLineStyle",
                LINE_STYLE_MAP[self.style] if self.style is not None else None,
            ),
        ]
        return {k: v for k, v in pairs if v is not None}


def last_price_line(
    visible: Optional[bool] = None,
    source: Optional["PriceLineSource"] = None,
    width: Optional["LineWidth"] = None,
    color: Optional[Color] = None,
    style: Optional["LineStyle"] = None,
) -> LastPriceLine:
    """Create a :class:`LastPriceLine` for a series' ``last_price_line=`` argument.

    Example:
        >>> tvl.line(..., last_price_line=tvl.last_price_line(visible=False))
    """
    return LastPriceLine(
        visible=visible, source=source, width=width, color=color, style=style
    )


@dataclass
class BaseLine:
    """Styling for a series' zero/index base line (shown in ``percentage`` /
    ``indexed_to_100`` price-scale modes).

    Pass to any series constructor via ``base_line=``. Not related to the
    Baseline *series type* (:func:`baseline`) — this is the horizontal
    reference rule on the price scale.

    Args:
        visible: Show the base line (TVL default ``True``).
        color: Line CSS color.
        width: Stroke width in pixels; see :data:`LineWidth`.
        style: Dash pattern; see :data:`LineStyle`.
    """

    visible: Optional[bool] = None
    color: Optional[Color] = None
    width: Optional["LineWidth"] = None
    style: Optional["LineStyle"] = None

    def to_dict(self) -> dict:
        """Serialise to flat camelCase ``baseLine*`` series-option keys (None omitted)."""
        pairs = [
            ("baseLineVisible", self.visible),
            ("baseLineColor", self.color),
            ("baseLineWidth", self.width),
            (
                "baseLineStyle",
                LINE_STYLE_MAP[self.style] if self.style is not None else None,
            ),
        ]
        return {k: v for k, v in pairs if v is not None}


def base_line(
    visible: Optional[bool] = None,
    color: Optional[Color] = None,
    width: Optional["LineWidth"] = None,
    style: Optional["LineStyle"] = None,
) -> BaseLine:
    """Create a :class:`BaseLine` for a series' ``base_line=`` argument.

    Example:
        >>> tvl.line(..., base_line=tvl.base_line(visible=False))
    """
    return BaseLine(visible=visible, color=color, width=width, style=style)


@dataclass
class CrosshairMarker:
    """Styling for the crosshair marker dot on Line / Area / Baseline series.

    Pass via ``crosshair_marker=`` on :func:`line`, :func:`area`, or
    :func:`baseline`.

    Args:
        visible: Show the crosshair marker dot.
        radius: Marker radius in pixels.
        border_color: Marker border color.
        background_color: Marker fill color.
        border_width: Marker border width in pixels.
    """

    visible: Optional[bool] = None
    radius: Optional[float] = None
    border_color: Optional[Color] = None
    background_color: Optional[Color] = None
    border_width: Optional[float] = None

    def to_dict(self) -> dict:
        """Serialise to flat camelCase ``crosshairMarker*`` series-option keys (None omitted)."""
        pairs = [
            ("crosshairMarkerVisible", self.visible),
            ("crosshairMarkerRadius", self.radius),
            ("crosshairMarkerBorderColor", self.border_color),
            ("crosshairMarkerBackgroundColor", self.background_color),
            ("crosshairMarkerBorderWidth", self.border_width),
        ]
        return {k: v for k, v in pairs if v is not None}


def crosshair_marker(
    visible: Optional[bool] = None,
    radius: Optional[float] = None,
    border_color: Optional[Color] = None,
    background_color: Optional[Color] = None,
    border_width: Optional[float] = None,
) -> CrosshairMarker:
    """Create a :class:`CrosshairMarker` for a series' ``crosshair_marker=`` argument.

    Example:
        >>> tvl.line(..., crosshair_marker=tvl.crosshair_marker(radius=6))
    """
    return CrosshairMarker(
        visible=visible,
        radius=radius,
        border_color=border_color,
        background_color=background_color,
        border_width=border_width,
    )


@dataclass
class TimeScale:
    """Time-axis (horizontal scale) configuration. Pass to ``tvl.chart(time_scale=...)``.

    Collapses the large ``timeScale`` option cluster into one object. Omitted
    fields inherit TVL defaults.

    Args:
        visible: Master visibility toggle for the time scale.
        time_visible: Show the time (not just the date) in labels.
        seconds_visible: Show seconds in time labels.
        border_visible: Show the time-scale border.
        border_color: Border CSS color.
        right_offset: Empty bars kept beyond the rightmost data point.
        right_offset_pixels: Pixel offset of the right edge.
        bar_spacing: Pixels between adjacent bars.
        min_bar_spacing: Minimum bar spacing (zoom-in cap).
        max_bar_spacing: Maximum bar spacing (zoom-out cap).
        fix_left_edge: Prevent scrolling past the leftmost data point.
        fix_right_edge: Prevent scrolling past the rightmost data point.
        lock_visible_time_range_on_resize: Keep the visible range on resize.
        right_bar_stays_on_scroll: Pin the rightmost bar while scrolling.
        shift_visible_range_on_new_bar: Auto-scroll when a new bar is added.
        allow_shift_visible_range_on_whitespace_replacement: Shift when whitespace
            bars are replaced by real data.
        ticks_visible: Show tick marks on the time scale.
        tick_mark_max_character_length: Max characters in a tick label before truncation.
        uniform_distribution: Force uniform bar spacing regardless of timestamp gaps.
        minimum_height: Minimum height of the time-scale area in pixels.
        allow_bold_labels: Allow bold time labels.
        ignore_whitespace_indices: Ignore whitespace indices in visible-range math.
        enable_conflation: Conflate sub-pixel data points for performance.
        conflation_threshold_factor: Conflation sensitivity multiplier.
        precompute_conflation_on_init: Precompute conflation on chart init.
        precompute_conflation_priority: Scheduling priority for precomputation;
            see :data:`PrecomputeConflationPriority`.
    """

    visible: Optional[bool] = None
    time_visible: Optional[bool] = None
    seconds_visible: Optional[bool] = None
    border_visible: Optional[bool] = None
    border_color: Optional[Color] = None
    right_offset: Optional[int] = None
    right_offset_pixels: Optional[int] = None
    bar_spacing: Optional[float] = None
    min_bar_spacing: Optional[float] = None
    max_bar_spacing: Optional[float] = None
    fix_left_edge: Optional[bool] = None
    fix_right_edge: Optional[bool] = None
    lock_visible_time_range_on_resize: Optional[bool] = None
    right_bar_stays_on_scroll: Optional[bool] = None
    shift_visible_range_on_new_bar: Optional[bool] = None
    allow_shift_visible_range_on_whitespace_replacement: Optional[bool] = None
    ticks_visible: Optional[bool] = None
    tick_mark_max_character_length: Optional[int] = None
    uniform_distribution: Optional[bool] = None
    minimum_height: Optional[int] = None
    allow_bold_labels: Optional[bool] = None
    ignore_whitespace_indices: Optional[bool] = None
    enable_conflation: Optional[bool] = None
    conflation_threshold_factor: Optional[float] = None
    precompute_conflation_on_init: Optional[bool] = None
    precompute_conflation_priority: Optional["PrecomputeConflationPriority"] = None

    def to_dict(self) -> dict:
        """Serialise to the JS TimeScaleOptions shape (camelCase, None omitted)."""
        pairs = [
            ("visible", self.visible),
            ("timeVisible", self.time_visible),
            ("secondsVisible", self.seconds_visible),
            ("borderVisible", self.border_visible),
            ("borderColor", self.border_color),
            ("rightOffset", self.right_offset),
            ("rightOffsetPixels", self.right_offset_pixels),
            ("barSpacing", self.bar_spacing),
            ("minBarSpacing", self.min_bar_spacing),
            ("maxBarSpacing", self.max_bar_spacing),
            ("fixLeftEdge", self.fix_left_edge),
            ("fixRightEdge", self.fix_right_edge),
            ("lockVisibleTimeRangeOnResize", self.lock_visible_time_range_on_resize),
            ("rightBarStaysOnScroll", self.right_bar_stays_on_scroll),
            ("shiftVisibleRangeOnNewBar", self.shift_visible_range_on_new_bar),
            (
                "allowShiftVisibleRangeOnWhitespaceReplacement",
                self.allow_shift_visible_range_on_whitespace_replacement,
            ),
            ("ticksVisible", self.ticks_visible),
            ("tickMarkMaxCharacterLength", self.tick_mark_max_character_length),
            ("uniformDistribution", self.uniform_distribution),
            ("minimumHeight", self.minimum_height),
            ("allowBoldLabels", self.allow_bold_labels),
            ("ignoreWhitespaceIndices", self.ignore_whitespace_indices),
            ("enableConflation", self.enable_conflation),
            ("conflationThresholdFactor", self.conflation_threshold_factor),
            ("precomputeConflationOnInit", self.precompute_conflation_on_init),
            ("precomputeConflationPriority", self.precompute_conflation_priority),
        ]
        return {k: v for k, v in pairs if v is not None}


def time_scale(
    visible: Optional[bool] = None,
    time_visible: Optional[bool] = None,
    seconds_visible: Optional[bool] = None,
    border_visible: Optional[bool] = None,
    border_color: Optional[Color] = None,
    right_offset: Optional[int] = None,
    right_offset_pixels: Optional[int] = None,
    bar_spacing: Optional[float] = None,
    min_bar_spacing: Optional[float] = None,
    max_bar_spacing: Optional[float] = None,
    fix_left_edge: Optional[bool] = None,
    fix_right_edge: Optional[bool] = None,
    lock_visible_time_range_on_resize: Optional[bool] = None,
    right_bar_stays_on_scroll: Optional[bool] = None,
    shift_visible_range_on_new_bar: Optional[bool] = None,
    allow_shift_visible_range_on_whitespace_replacement: Optional[bool] = None,
    ticks_visible: Optional[bool] = None,
    tick_mark_max_character_length: Optional[int] = None,
    uniform_distribution: Optional[bool] = None,
    minimum_height: Optional[int] = None,
    allow_bold_labels: Optional[bool] = None,
    ignore_whitespace_indices: Optional[bool] = None,
    enable_conflation: Optional[bool] = None,
    conflation_threshold_factor: Optional[float] = None,
    precompute_conflation_on_init: Optional[bool] = None,
    precompute_conflation_priority: Optional["PrecomputeConflationPriority"] = None,
) -> TimeScale:
    """Create a :class:`TimeScale` config for ``tvl.chart(time_scale=...)``.

    Example:
        >>> tvl.chart(..., time_scale=tvl.time_scale(time_visible=True, bar_spacing=8))
    """
    return TimeScale(
        visible=visible,
        time_visible=time_visible,
        seconds_visible=seconds_visible,
        border_visible=border_visible,
        border_color=border_color,
        right_offset=right_offset,
        right_offset_pixels=right_offset_pixels,
        bar_spacing=bar_spacing,
        min_bar_spacing=min_bar_spacing,
        max_bar_spacing=max_bar_spacing,
        fix_left_edge=fix_left_edge,
        fix_right_edge=fix_right_edge,
        lock_visible_time_range_on_resize=lock_visible_time_range_on_resize,
        right_bar_stays_on_scroll=right_bar_stays_on_scroll,
        shift_visible_range_on_new_bar=shift_visible_range_on_new_bar,
        allow_shift_visible_range_on_whitespace_replacement=allow_shift_visible_range_on_whitespace_replacement,
        ticks_visible=ticks_visible,
        tick_mark_max_character_length=tick_mark_max_character_length,
        uniform_distribution=uniform_distribution,
        minimum_height=minimum_height,
        allow_bold_labels=allow_bold_labels,
        ignore_whitespace_indices=ignore_whitespace_indices,
        enable_conflation=enable_conflation,
        conflation_threshold_factor=conflation_threshold_factor,
        precompute_conflation_on_init=precompute_conflation_on_init,
        precompute_conflation_priority=precompute_conflation_priority,
    )


@dataclass
class Watermark:
    """Text watermark configuration. Pass to ``tvl.chart(watermark=...)``.

    Supports either a single-line shortcut (``text`` + styling) or a multi-line
    form (``lines`` — a list of :class:`WatermarkLine`). The two are mutually
    exclusive, and single-line styling (``color`` / ``font_size`` / ``font_style``
    / ``line_height``) cannot be combined with ``lines``.

    Args:
        text: Single-line watermark text.
        color: Text color (single-line only).
        visible: Show the watermark (defaults to ``True`` when text/lines given).
        font_size: Font size in pixels (single-line only).
        font_style: CSS font-style, e.g. ``"italic"`` (single-line only).
        line_height: Line height in pixels (single-line only).
        horz_align: Horizontal alignment; see :data:`HorzAlign`.
        vert_align: Vertical alignment; see :data:`VertAlign`.
        lines: List of :class:`WatermarkLine` for a multi-line watermark
            (build each with :func:`watermark_line`).
    """

    text: Optional[str] = None
    color: Optional[Color] = None
    visible: Optional[bool] = None
    font_size: Optional[int] = None
    font_style: Optional[str] = None
    line_height: Optional[float] = None
    horz_align: Optional["HorzAlign"] = None
    vert_align: Optional["VertAlign"] = None
    lines: Optional[list["WatermarkLine"]] = None

    def __post_init__(self) -> None:
        if self.lines is not None and self.text is not None:
            raise ValueError(
                "Provide either 'text' (single-line) or 'lines' (multi-line), not both."
            )
        if self.lines is not None and any(
            v is not None
            for v in (self.color, self.font_size, self.font_style, self.line_height)
        ):
            raise ValueError(
                "Single-line styling (color, font_size, font_style, line_height) "
                "cannot be combined with 'lines'. Set per-line styling on each "
                "WatermarkLine instead."
            )

    def to_dict(self) -> dict:
        """Serialise to the JS watermark shape (camelCase, None omitted)."""
        if self.lines is not None:
            d: dict = {"lines": [_watermark_line_to_dict(ln) for ln in self.lines]}
            if self.visible is not None:
                d["visible"] = self.visible
            elif self.lines:
                d["visible"] = True
            if self.horz_align is not None:
                d["horzAlign"] = self.horz_align
            if self.vert_align is not None:
                d["vertAlign"] = self.vert_align
            return d
        d = {}
        if self.text is not None:
            d["text"] = self.text
        if self.color is not None:
            d["color"] = self.color
        vis = (
            self.visible if self.visible is not None else (True if self.text else None)
        )
        if vis is not None:
            d["visible"] = vis
        if self.font_size is not None:
            d["fontSize"] = self.font_size
        if self.font_style is not None:
            d["fontStyle"] = self.font_style
        if self.line_height is not None:
            d["lineHeight"] = self.line_height
        if self.horz_align is not None:
            d["horzAlign"] = self.horz_align
        if self.vert_align is not None:
            d["vertAlign"] = self.vert_align
        return d


def watermark(
    text: Optional[str] = None,
    color: Optional[Color] = None,
    visible: Optional[bool] = None,
    font_size: Optional[int] = None,
    font_style: Optional[str] = None,
    line_height: Optional[float] = None,
    horz_align: Optional["HorzAlign"] = None,
    vert_align: Optional["VertAlign"] = None,
    lines: Optional[list["WatermarkLine"]] = None,
) -> Watermark:
    """Create a :class:`Watermark` config for ``tvl.chart(watermark=...)``.

    Example:
        >>> tvl.chart(..., watermark=tvl.watermark(text="AAPL", color="#888"))
        >>> tvl.chart(..., watermark=tvl.watermark(
        ...     lines=[tvl.watermark_line("AAPL"), tvl.watermark_line("Daily")]))
    """
    return Watermark(
        text=text,
        color=color,
        visible=visible,
        font_size=font_size,
        font_style=font_style,
        line_height=line_height,
        horz_align=horz_align,
        vert_align=vert_align,
        lines=lines,
    )


@dataclass
class WatermarkImage:
    """Image watermark configuration. Pass to ``tvl.chart(watermark_image=...)``.

    Independent of the text watermark; the two can coexist.

    Args:
        url: Image URL.
        max_width: Maximum image width in pixels.
        max_height: Maximum image height in pixels.
        padding: Padding around the image in pixels.
        alpha: Image opacity (0-1).
        visible: Show the image watermark (defaults to ``True`` when ``url`` given).
    """

    url: Optional[str] = None
    max_width: Optional[int] = None
    max_height: Optional[int] = None
    padding: Optional[int] = None
    alpha: Optional[float] = None
    visible: Optional[bool] = None

    def to_dict(self) -> dict:
        """Serialise to the JS imageWatermark shape (camelCase, None omitted)."""
        d: dict = {}
        if self.url is None:
            return d
        d["url"] = self.url
        if self.max_width is not None:
            d["maxWidth"] = self.max_width
        if self.max_height is not None:
            d["maxHeight"] = self.max_height
        if self.padding is not None:
            d["padding"] = self.padding
        if self.alpha is not None:
            d["alpha"] = self.alpha
        vis = self.visible if self.visible is not None else (True if self.url else None)
        if vis is not None:
            d["visible"] = vis
        return d


def watermark_image(
    url: Optional[str] = None,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    padding: Optional[int] = None,
    alpha: Optional[float] = None,
    visible: Optional[bool] = None,
) -> WatermarkImage:
    """Create a :class:`WatermarkImage` for ``tvl.chart(watermark_image=...)``.

    Example:
        >>> tvl.chart(..., watermark_image=tvl.watermark_image(url="logo.png", alpha=0.3))
    """
    return WatermarkImage(
        url=url,
        max_width=max_width,
        max_height=max_height,
        padding=padding,
        alpha=alpha,
        visible=visible,
    )


@dataclass
class Tooltip:
    """Tracking-tooltip configuration. Pass to ``tvl.chart(tooltip=...)``.

    A tooltip is a cursor-following overlay showing the focused series' title,
    value, and time. Constructing one implies ``visible=True`` unless you set
    ``visible=False`` explicitly (in which case no detail options may be set).

    Args:
        visible: Master switch (default ``True`` when the object is built).
        show_title: Show the series title line.
        show_value: Show the series value at the cursor.
        show_date: Show the time/date line.
        value_precision: Decimal places for the value line (defaults to the
            series' own price format when unset).
    """

    visible: bool = True
    show_title: Optional[bool] = None
    show_value: Optional[bool] = None
    show_date: Optional[bool] = None
    value_precision: Optional[int] = None

    def __post_init__(self) -> None:
        if not self.visible and any(
            v is not None
            for v in (
                self.show_title,
                self.show_value,
                self.show_date,
                self.value_precision,
            )
        ):
            raise ValueError(
                "tooltip(show_title/show_value/show_date/value_precision=...) require "
                "visible=True."
            )

    def to_dict(self) -> dict:
        """Serialise to the JS tooltip shape (camelCase, None omitted)."""
        if not self.visible:
            return {}
        pairs = [
            ("visible", True),
            ("showTitle", self.show_title),
            ("showValue", self.show_value),
            ("showDate", self.show_date),
            ("valuePrecision", self.value_precision),
        ]
        return {k: v for k, v in pairs if v is not None}


def tooltip(
    visible: bool = True,
    show_title: Optional[bool] = None,
    show_value: Optional[bool] = None,
    show_date: Optional[bool] = None,
    value_precision: Optional[int] = None,
) -> Tooltip:
    """Create a :class:`Tooltip` config for ``tvl.chart(tooltip=...)``.

    Example:
        >>> tvl.chart(..., tooltip=tvl.tooltip(show_value=True, value_precision=2))
    """
    return Tooltip(
        visible=visible,
        show_title=show_title,
        show_value=show_value,
        show_date=show_date,
        value_precision=value_precision,
    )


@dataclass
class Scroll:
    """Granular scroll-interaction config. Pass to ``tvl.chart(handle_scroll=...)``.

    ``handle_scroll`` also accepts a plain ``bool`` to toggle all scroll behavior
    at once; use this object only for per-gesture control.

    Args:
        mouse_wheel: Allow mouse-wheel scrolling.
        pressed_mouse_move: Allow click-drag scrolling.
        horz_touch_drag: Allow horizontal touch scrolling.
        vert_touch_drag: Allow vertical touch scrolling.
    """

    mouse_wheel: Optional[bool] = None
    pressed_mouse_move: Optional[bool] = None
    horz_touch_drag: Optional[bool] = None
    vert_touch_drag: Optional[bool] = None

    def to_dict(self) -> dict:
        """Serialise to the JS handleScroll shape (camelCase, None omitted)."""
        pairs = [
            ("mouseWheel", self.mouse_wheel),
            ("pressedMouseMove", self.pressed_mouse_move),
            ("horzTouchDrag", self.horz_touch_drag),
            ("vertTouchDrag", self.vert_touch_drag),
        ]
        return {k: v for k, v in pairs if v is not None}


def scroll(
    mouse_wheel: Optional[bool] = None,
    pressed_mouse_move: Optional[bool] = None,
    horz_touch_drag: Optional[bool] = None,
    vert_touch_drag: Optional[bool] = None,
) -> Scroll:
    """Create a :class:`Scroll` config for ``tvl.chart(handle_scroll=...)``.

    Example:
        >>> tvl.chart(..., handle_scroll=tvl.scroll(mouse_wheel=False))
    """
    return Scroll(
        mouse_wheel=mouse_wheel,
        pressed_mouse_move=pressed_mouse_move,
        horz_touch_drag=horz_touch_drag,
        vert_touch_drag=vert_touch_drag,
    )


@dataclass
class Scale:
    """Granular scale/zoom-interaction config. Pass to ``tvl.chart(handle_scale=...)``.

    ``handle_scale`` also accepts a plain ``bool`` to toggle all scaling behavior
    at once; use this object only for per-gesture control.

    Args:
        mouse_wheel: Allow zooming with the mouse wheel.
        pinch: Allow pinch-to-zoom on touch devices.
        axis_pressed_mouse_move: Allow scaling by dragging an axis.
        axis_double_click_reset: Reset axis scale on double-click.
    """

    mouse_wheel: Optional[bool] = None
    pinch: Optional[bool] = None
    axis_pressed_mouse_move: Optional[bool] = None
    axis_double_click_reset: Optional[bool] = None

    def to_dict(self) -> dict:
        """Serialise to the JS handleScale shape (camelCase, None omitted)."""
        pairs = [
            ("mouseWheel", self.mouse_wheel),
            ("pinch", self.pinch),
            ("axisPressedMouseMove", self.axis_pressed_mouse_move),
            ("axisDoubleClickReset", self.axis_double_click_reset),
        ]
        return {k: v for k, v in pairs if v is not None}


def scale(
    mouse_wheel: Optional[bool] = None,
    pinch: Optional[bool] = None,
    axis_pressed_mouse_move: Optional[bool] = None,
    axis_double_click_reset: Optional[bool] = None,
) -> Scale:
    """Create a :class:`Scale` config for ``tvl.chart(handle_scale=...)``.

    Example:
        >>> tvl.chart(..., handle_scale=tvl.scale(pinch=False))
    """
    return Scale(
        mouse_wheel=mouse_wheel,
        pinch=pinch,
        axis_pressed_mouse_move=axis_pressed_mouse_move,
        axis_double_click_reset=axis_double_click_reset,
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
