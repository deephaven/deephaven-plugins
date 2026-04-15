"""Type definitions and constants for TradingView Lightweight Charts plugin."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional, TypedDict

# Line style constants (matching lightweight-charts LineStyle enum)
SOLID = 0
DOTTED = 1
DASHED = 2
LARGE_DASHED = 3
SPARSE_DOTTED = 4

LineStyle = Literal["solid", "dotted", "dashed", "large_dashed", "sparse_dotted"]
LineType = Literal["simple", "with_steps", "curved"]
LineWidth = Literal[1, 2, 3, 4]

# Coordinate and Logical are JS-only nominal types used by ITimeScaleApi
# (logicalToCoordinate, coordinateToLogical) and mouse event handlers.
# These APIs are architecturally unavailable from Python (no live chart handle).
# See: notes/api-coverage-report.md §16, §26.

HorzAlign = Literal["left", "center", "right"]
VertAlign = Literal["top", "center", "bottom"]
CrosshairMode = Literal["normal", "magnet", "hidden", "magnet_ohlc"]
PriceScaleMode = Literal["normal", "logarithmic", "percentage", "indexed_to_100"]
MarkerShape = Literal["circle", "square", "arrow_up", "arrow_down"]
MarkerPosition = Literal[
    "above_bar",
    "below_bar",
    "in_bar",
    "at_price_top",
    "at_price_bottom",
    "at_price_middle",
]
PriceFormatter = Literal[
    "currency_usd",
    "currency_eur",
    "currency_gbp",
    "currency_jpy",
    "percent",
    "compact",
    "scientific",
]

# Preset names for tickmarks price formatters (axis tick labels).
# Shares the same preset set as PriceFormatter because both format price values.
# Separate type alias for documentation clarity (IDEs show the correct name).
TickmarksPriceFormatter = Literal[
    "currency_usd",
    "currency_eur",
    "currency_gbp",
    "currency_jpy",
    "percent",
    "compact",
    "scientific",
]

# Preset names for percentage formatters (crosshair percentage label).
# TVL passes raw percentage values (e.g. 42.5 means 42.5%).
PercentageFormatter = Literal[
    "percent",  # "42.50%"
    "percent_1dp",  # "42.5%"
    "percent_0dp",  # "43%"
    "decimal",  # "0.4250" (raw ratio)
]

# Preset names for tickmarks percentage formatters (axis tick labels for percentage mode).
TickmarksPercentageFormatter = Literal[
    "percent",
    "percent_1dp",
    "percent_0dp",
    "decimal",
]
ChartType = Literal["standard", "yield_curve", "options", "custom_numeric"]
ColorSpace = Literal["srgb", "display-p3"]

# PrecomputeConflationPriority (matches browser Scheduler API task priorities)
# Consumer: TimeScaleOptions.precomputeConflationPriority — controls the scheduling
# priority for precomputed conflation when precomputeConflationOnInit is true.
PrecomputeConflationPriority = Literal["background", "user-visible", "user-blocking"]

# ColorType enum (matches TradingView ColorType)
# Used for layout.background: "solid" = SolidColor, "gradient" = VerticalGradientColor.
# The gradient case is activated by providing background_top_color and
# background_bottom_color to chart() — see 03-layout-options.md plan.
ColorType = Literal["solid", "gradient"]

# LastPriceAnimationMode enum (matches TradingView LastPriceAnimationMode)
# Consumer: lastPriceAnimation option on Line, Area, Baseline series.
LastPriceAnimationMode = Literal["disabled", "continuous", "on_data_update"]

# MarkerSign enum (matches TradingView MarkerSign)
# Consumer: SeriesMarker.sign property (optional per-marker annotation).
MarkerSign = Literal["negative", "neutral", "positive"]

# MismatchDirection enum (matches TradingView MismatchDirection)
# Consumer: ISeriesApi.dataByIndex() / barsInLogicalRange() — JS runtime methods.
# These methods are N/A for the static Python configuration layer; the enum is
# provided for completeness and for any future bidirectional messaging work.
MismatchDirection = Literal["nearest_left", "none", "nearest_right"]

# PriceLineSource enum (matches TradingView PriceLineSource)
# Consumer: SeriesOptionsCommon.priceLineSource (which bar the auto price line tracks).
PriceLineSource = Literal["last_bar", "last_visible"]

# TickMarkType enum (matches TradingView TickMarkType)
# Consumer: TimeScaleOptions.tickMarkFormatter callback.
# tickMarkFormatter requires a JS callable and is N/A for the static Python layer.
# This enum is defined for completeness; it has no current consumer.
TickMarkType = Literal["year", "month", "day_of_month", "time", "time_with_seconds"]

# TrackingModeExitMode enum (matches TradingView TrackingModeExitMode)
# Consumer: ChartOptionsBase.trackingMode.exitMode.
TrackingModeExitMode = Literal["on_touch_end", "on_next_tap"]

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
    color: Optional[str] = None
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
