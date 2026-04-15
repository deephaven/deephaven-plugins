"""TradingView Lightweight Charts plugin for Deephaven."""

from __future__ import annotations

import json
from typing import Any

from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream

from .chart import (
    TvlChart,
    chart,
    candlestick,
    line,
    area,
    bar,
    baseline,
    histogram,
    yield_curve,
    options_chart,
    custom_numeric,
)
from .series import (
    SeriesSpec,
    candlestick_series,
    bar_series,
    line_series,
    area_series,
    baseline_series,
    histogram_series,
)
from .markers import (
    Marker,
    PriceLine,
    MarkerSpec,
    marker,
    price_line,
    markers_from_table,
    up_down_markers,
)
from .options import (
    ChartType,
    ColorSpace,
    ColorType,
    PriceFormat,
    PriceFormatter,
    TickmarksPriceFormatter,
    PercentageFormatter,
    TickmarksPercentageFormatter,
    PrecomputeConflationPriority,
    LineStyle,
    LineType,
    LineWidth,
    CrosshairMode,
    HorzAlign,
    PriceScaleMode,
    MarkerShape,
    MarkerPosition,
    LastPriceAnimationMode,
    MarkerSign,
    MismatchDirection,
    PriceLineSource,
    TickMarkType,
    TrackingModeExitMode,
    VertAlign,
    WatermarkLine,
)
from ._types import BusinessDay, business_day
from .utils import is_business_day, is_utc_timestamp
from .communication.connection import TvlChartConnection

NAME = "deephaven.plot.tradingview_lightweight.TvlChart"


class TvlChartType(BidirectionalObjectType):
    """TvlChartType for plugin registration."""

    @property
    def name(self) -> str:
        return NAME

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, TvlChart)

    def create_client_connection(
        self, obj: TvlChart, connection: MessageStream
    ) -> MessageStream:
        chart_connection = TvlChartConnection(obj, connection)
        initial_message = json.dumps({"type": "RETRIEVE"}).encode()
        payload, references = chart_connection.on_data(initial_message, [])
        connection.on_data(payload, references)
        return chart_connection


__all__ = [
    # Core
    "TvlChart",
    "TvlChartType",
    # Chart creation
    "chart",
    "candlestick",
    "line",
    "area",
    "bar",
    "baseline",
    "histogram",
    "yield_curve",
    "options_chart",
    "custom_numeric",
    # Series creation
    "SeriesSpec",
    "candlestick_series",
    "bar_series",
    "line_series",
    "area_series",
    "baseline_series",
    "histogram_series",
    # Annotations
    "Marker",
    "PriceLine",
    "MarkerSpec",
    "marker",
    "price_line",
    "markers_from_table",
    "up_down_markers",
    # Types
    "BusinessDay",
    "business_day",
    "ChartType",
    "ColorSpace",
    "ColorType",
    "PriceFormat",
    "PriceFormatter",
    "TickmarksPriceFormatter",
    "PercentageFormatter",
    "TickmarksPercentageFormatter",
    "PrecomputeConflationPriority",
    "LineStyle",
    "LineType",
    "LineWidth",
    "CrosshairMode",
    "HorzAlign",
    "PriceScaleMode",
    "MarkerShape",
    "MarkerPosition",
    "LastPriceAnimationMode",
    "MarkerSign",
    "MismatchDirection",
    "PriceLineSource",
    "TickMarkType",
    "TrackingModeExitMode",
    "VertAlign",
    "WatermarkLine",
    # Utility functions
    "is_business_day",
    "is_utc_timestamp",
]
