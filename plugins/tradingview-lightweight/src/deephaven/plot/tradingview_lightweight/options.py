"""Type definitions and constants for TradingView Lightweight Charts plugin."""

from __future__ import annotations

from typing import Literal, TypedDict

# Line style constants (matching lightweight-charts LineStyle enum)
SOLID = 0
DOTTED = 1
DASHED = 2
LARGE_DASHED = 3
SPARSE_DOTTED = 4

LineStyle = Literal["solid", "dotted", "dashed", "large_dashed", "sparse_dotted"]
LineType = Literal["simple", "with_steps", "curved"]
CrosshairMode = Literal["normal", "magnet"]
PriceScaleMode = Literal["normal", "logarithmic", "percentage", "indexed_to_100"]
MarkerShape = Literal["circle", "square", "arrow_up", "arrow_down"]
MarkerPosition = Literal["above_bar", "below_bar", "in_bar"]
PriceFormatter = Literal[
    "currency_usd",
    "currency_eur",
    "currency_gbp",
    "currency_jpy",
    "percent",
    "compact",
    "scientific",
]
ChartType = Literal["standard", "yield_curve", "options"]

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
}


class PriceFormat(TypedDict, total=False):
    """Price format configuration."""

    type: Literal["price", "volume", "percent", "custom"]
    precision: int
    min_move: float
