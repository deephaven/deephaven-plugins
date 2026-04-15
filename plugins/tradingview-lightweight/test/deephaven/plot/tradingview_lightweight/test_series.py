"""Tests for series creation functions."""

from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import MagicMock

# Add src to path for namespace package resolution
sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

# Mock deephaven.plugin before any plugin imports trigger it
sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight.series import (
    SeriesSpec,
    candlestick_series,
    bar_series,
    line_series,
    area_series,
    baseline_series,
    histogram_series,
)
from deephaven.plot.tradingview_lightweight.markers import Marker, PriceLine


class TestCandlestickSeries(unittest.TestCase):
    """Tests for candlestick_series()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        spec = candlestick_series(self.table)
        self.assertEqual(spec.series_type, "Candlestick")
        self.assertIs(spec.table, self.table)
        self.assertEqual(
            spec.column_mapping,
            {
                "time": "Timestamp",
                "open": "Open",
                "high": "High",
                "low": "Low",
                "close": "Close",
            },
        )
        # No optional style options set, so options dict should be empty
        self.assertEqual(spec.options, {})
        self.assertIsNone(spec.markers)
        self.assertIsNone(spec.price_lines)

    def test_custom_columns(self):
        spec = candlestick_series(
            self.table,
            time="ts",
            open="o",
            high="h",
            low="l",
            close="c",
        )
        self.assertEqual(
            spec.column_mapping,
            {"time": "ts", "open": "o", "high": "h", "low": "l", "close": "c"},
        )

    def test_style_options(self):
        spec = candlestick_series(
            self.table,
            up_color="#00ff00",
            down_color="#ff0000",
            border_up_color="#008800",
            border_down_color="#880000",
            wick_up_color="#004400",
            wick_down_color="#440000",
            border_visible=False,
            wick_visible=True,
            title="AAPL",
            visible=True,
            price_scale_id="right",
        )
        self.assertEqual(spec.options["upColor"], "#00ff00")
        self.assertEqual(spec.options["downColor"], "#ff0000")
        self.assertEqual(spec.options["borderUpColor"], "#008800")
        self.assertEqual(spec.options["borderDownColor"], "#880000")
        self.assertEqual(spec.options["wickUpColor"], "#004400")
        self.assertEqual(spec.options["wickDownColor"], "#440000")
        self.assertFalse(spec.options["borderVisible"])
        self.assertTrue(spec.options["wickVisible"])
        self.assertEqual(spec.options["title"], "AAPL")
        self.assertTrue(spec.options["visible"])
        self.assertEqual(spec.options["priceScaleId"], "right")

    def test_none_options_filtered(self):
        """Options that are None should not appear in the dict."""
        spec = candlestick_series(self.table, up_color="#00ff00")
        self.assertIn("upColor", spec.options)
        self.assertNotIn("downColor", spec.options)
        self.assertNotIn("borderUpColor", spec.options)
        self.assertNotIn("title", spec.options)

    def test_with_markers_and_price_lines(self):
        m = Marker(time="2024-01-01", color="#fff")
        pl = PriceLine(price=100.0, color="red")
        spec = candlestick_series(self.table, markers=[m], price_lines=[pl])
        self.assertEqual(spec.markers, [m])
        self.assertEqual(spec.price_lines, [pl])

    def test_to_dict(self):
        m = Marker(time="2024-01-01", color="#fff")
        pl = PriceLine(price=50.0, title="Support")
        spec = candlestick_series(
            self.table,
            up_color="#0f0",
            title="My Series",
            markers=[m],
            price_lines=[pl],
        )
        result = spec.to_dict("series_0", 42)
        self.assertEqual(result["id"], "series_0")
        self.assertEqual(result["type"], "Candlestick")
        self.assertEqual(result["options"]["upColor"], "#0f0")
        self.assertEqual(result["options"]["title"], "My Series")
        self.assertEqual(result["dataMapping"]["tableId"], 42)
        self.assertEqual(result["dataMapping"]["columns"]["time"], "Timestamp")
        self.assertEqual(len(result["markers"]), 1)
        self.assertEqual(result["markers"][0]["time"], "2024-01-01")
        self.assertEqual(len(result["priceLines"]), 1)
        self.assertEqual(result["priceLines"][0]["price"], 50.0)

    def test_to_dict_no_markers(self):
        """When no markers/price_lines, those keys should be absent."""
        spec = candlestick_series(self.table)
        result = spec.to_dict("s0", 0)
        self.assertNotIn("markers", result)
        self.assertNotIn("priceLines", result)

    def test_price_format(self):
        # minMove (camelCase) is the correct key -- matches TVL JS API
        pf = {"type": "price", "precision": 4, "minMove": 0.0001}
        spec = candlestick_series(self.table, price_format=pf)
        self.assertEqual(spec.options["priceFormat"]["minMove"], 0.0001)
        self.assertEqual(spec.options["priceFormat"]["precision"], 4)
        # min_move (old snake_case key) must NOT appear
        self.assertNotIn("min_move", spec.options["priceFormat"])

    def test_border_color(self):
        spec = candlestick_series(self.table, border_color="#378658")
        self.assertEqual(spec.options["borderColor"], "#378658")

    def test_wick_color(self):
        spec = candlestick_series(self.table, wick_color="#737375")
        self.assertEqual(spec.options["wickColor"], "#737375")

    def test_border_color_not_present_when_none(self):
        spec = candlestick_series(self.table)
        self.assertNotIn("borderColor", spec.options)

    def test_wick_color_not_present_when_none(self):
        spec = candlestick_series(self.table)
        self.assertNotIn("wickColor", spec.options)

    def test_generic_and_directional_colors_together(self):
        """Generic and directional colors can coexist -- JS resolves precedence."""
        spec = candlestick_series(
            self.table,
            border_color="#111",
            border_up_color="#00ff00",
            border_down_color="#ff0000",
            wick_color="#555",
            wick_up_color="#008800",
            wick_down_color="#880000",
        )
        self.assertEqual(spec.options["borderColor"], "#111")
        self.assertEqual(spec.options["borderUpColor"], "#00ff00")
        self.assertEqual(spec.options["borderDownColor"], "#ff0000")
        self.assertEqual(spec.options["wickColor"], "#555")
        self.assertEqual(spec.options["wickUpColor"], "#008800")
        self.assertEqual(spec.options["wickDownColor"], "#880000")


class TestBarSeries(unittest.TestCase):
    """Tests for bar_series()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        spec = bar_series(self.table)
        self.assertEqual(spec.series_type, "Bar")
        self.assertEqual(
            spec.column_mapping,
            {
                "time": "Timestamp",
                "open": "Open",
                "high": "High",
                "low": "Low",
                "close": "Close",
            },
        )
        self.assertEqual(spec.options, {})

    def test_custom_params(self):
        spec = bar_series(
            self.table,
            time="Date",
            open="O",
            high="H",
            low="L",
            close="C",
            up_color="green",
            down_color="red",
            open_visible=False,
            thin_bars=True,
            title="BARS",
        )
        self.assertEqual(spec.column_mapping["time"], "Date")
        self.assertEqual(spec.options["upColor"], "green")
        self.assertEqual(spec.options["downColor"], "red")
        self.assertFalse(spec.options["openVisible"])
        self.assertTrue(spec.options["thinBars"])
        self.assertEqual(spec.options["title"], "BARS")

    def test_to_dict(self):
        spec = bar_series(self.table, up_color="green")
        result = spec.to_dict("series_1", 7)
        self.assertEqual(result["type"], "Bar")
        self.assertEqual(result["dataMapping"]["tableId"], 7)
        self.assertEqual(result["options"]["upColor"], "green")


class TestLineSeries(unittest.TestCase):
    """Tests for line_series()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        spec = line_series(self.table)
        self.assertEqual(spec.series_type, "Line")
        self.assertEqual(spec.column_mapping, {"time": "Timestamp", "value": "Value"})
        self.assertEqual(spec.options, {})

    def test_custom_params(self):
        spec = line_series(
            self.table,
            time="ts",
            value="price",
            color="blue",
            line_width=3,
            title="Price Line",
            visible=False,
            crosshair_marker_visible=True,
            crosshair_marker_radius=5.0,
            price_scale_id="left",
        )
        self.assertEqual(spec.column_mapping, {"time": "ts", "value": "price"})
        self.assertEqual(spec.options["color"], "blue")
        self.assertEqual(spec.options["lineWidth"], 3)
        self.assertEqual(spec.options["title"], "Price Line")
        self.assertFalse(spec.options["visible"])
        self.assertTrue(spec.options["crosshairMarkerVisible"])
        self.assertEqual(spec.options["crosshairMarkerRadius"], 5.0)
        self.assertEqual(spec.options["priceScaleId"], "left")

    def test_line_style_conversion(self):
        """Line style enum strings should be converted to integers."""
        spec = line_series(self.table, line_style="dashed")
        self.assertEqual(spec.options["lineStyle"], 2)

        spec2 = line_series(self.table, line_style="solid")
        self.assertEqual(spec2.options["lineStyle"], 0)

        spec3 = line_series(self.table, line_style="dotted")
        self.assertEqual(spec3.options["lineStyle"], 1)

        spec4 = line_series(self.table, line_style="large_dashed")
        self.assertEqual(spec4.options["lineStyle"], 3)

        spec5 = line_series(self.table, line_style="sparse_dotted")
        self.assertEqual(spec5.options["lineStyle"], 4)

    def test_line_type_conversion(self):
        """Line type enum strings should be converted to integers."""
        spec = line_series(self.table, line_type="simple")
        self.assertEqual(spec.options["lineType"], 0)

        spec2 = line_series(self.table, line_type="with_steps")
        self.assertEqual(spec2.options["lineType"], 1)

        spec3 = line_series(self.table, line_type="curved")
        self.assertEqual(spec3.options["lineType"], 2)

    def test_no_style_when_none(self):
        """lineStyle/lineType should not be in options when not specified."""
        spec = line_series(self.table)
        self.assertNotIn("lineStyle", spec.options)
        self.assertNotIn("lineType", spec.options)

    def test_to_dict(self):
        spec = line_series(self.table, color="red", line_width=2)
        result = spec.to_dict("series_2", 10)
        self.assertEqual(result["type"], "Line")
        self.assertEqual(
            result["dataMapping"]["columns"], {"time": "Timestamp", "value": "Value"}
        )
        self.assertEqual(result["options"]["color"], "red")
        self.assertEqual(result["options"]["lineWidth"], 2)


class TestAreaSeries(unittest.TestCase):
    """Tests for area_series()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        spec = area_series(self.table)
        self.assertEqual(spec.series_type, "Area")
        self.assertEqual(spec.column_mapping, {"time": "Timestamp", "value": "Value"})
        self.assertEqual(spec.options, {})

    def test_custom_params(self):
        spec = area_series(
            self.table,
            time="date",
            value="vol",
            line_color="#0000ff",
            top_color="rgba(0,0,255,0.4)",
            bottom_color="rgba(0,0,255,0.0)",
            line_width=2,
            line_style="dashed",
            line_type="curved",
            crosshair_marker_visible=False,
            title="Volume Area",
        )
        self.assertEqual(spec.options["lineColor"], "#0000ff")
        self.assertEqual(spec.options["topColor"], "rgba(0,0,255,0.4)")
        self.assertEqual(spec.options["bottomColor"], "rgba(0,0,255,0.0)")
        self.assertEqual(spec.options["lineWidth"], 2)
        self.assertEqual(spec.options["lineStyle"], 2)  # dashed
        self.assertEqual(spec.options["lineType"], 2)  # curved
        self.assertFalse(spec.options["crosshairMarkerVisible"])
        self.assertEqual(spec.options["title"], "Volume Area")

    def test_relative_gradient(self):
        spec = area_series(self.table, relative_gradient=True)
        self.assertTrue(spec.options["relativeGradient"])

    def test_relative_gradient_false(self):
        spec = area_series(self.table, relative_gradient=False)
        self.assertFalse(spec.options["relativeGradient"])

    def test_invert_filled_area(self):
        spec = area_series(self.table, invert_filled_area=True)
        self.assertTrue(spec.options["invertFilledArea"])

    def test_relative_gradient_not_present_when_none(self):
        spec = area_series(self.table)
        self.assertNotIn("relativeGradient", spec.options)
        self.assertNotIn("invertFilledArea", spec.options)

    def test_to_dict(self):
        spec = area_series(self.table, top_color="blue")
        result = spec.to_dict("area_0", 3)
        self.assertEqual(result["type"], "Area")
        self.assertEqual(result["options"]["topColor"], "blue")


class TestBaselineSeries(unittest.TestCase):
    """Tests for baseline_series()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        spec = baseline_series(self.table)
        self.assertEqual(spec.series_type, "Baseline")
        self.assertEqual(spec.column_mapping, {"time": "Timestamp", "value": "Value"})
        # base_value defaults to None — omitted when not set
        self.assertNotIn("baseValue", spec.options)

    def test_custom_params(self):
        spec = baseline_series(
            self.table,
            base_value=100.0,
            top_line_color="green",
            top_fill_color1="rgba(0,255,0,0.4)",
            top_fill_color2="rgba(0,255,0,0.0)",
            bottom_line_color="red",
            bottom_fill_color1="rgba(255,0,0,0.4)",
            bottom_fill_color2="rgba(255,0,0,0.0)",
            line_width=2,
            line_style="dotted",
            title="Baseline Chart",
        )
        self.assertEqual(spec.options["baseValue"], {"type": "price", "price": 100.0})
        self.assertEqual(spec.options["topLineColor"], "green")
        self.assertEqual(spec.options["topFillColor1"], "rgba(0,255,0,0.4)")
        self.assertEqual(spec.options["topFillColor2"], "rgba(0,255,0,0.0)")
        self.assertEqual(spec.options["bottomLineColor"], "red")
        self.assertEqual(spec.options["bottomFillColor1"], "rgba(255,0,0,0.4)")
        self.assertEqual(spec.options["bottomFillColor2"], "rgba(255,0,0,0.0)")
        self.assertEqual(spec.options["lineWidth"], 2)
        self.assertEqual(spec.options["lineStyle"], 1)  # dotted
        self.assertEqual(spec.options["title"], "Baseline Chart")

    def test_base_value_structure(self):
        """base_value should always be wrapped in a type/price dict."""
        spec = baseline_series(self.table, base_value=50.5)
        bv = spec.options["baseValue"]
        self.assertEqual(bv["type"], "price")
        self.assertEqual(bv["price"], 50.5)

    def test_line_type_simple(self):
        spec = baseline_series(self.table, line_type="simple")
        self.assertEqual(spec.options["lineType"], 0)

    def test_line_type_with_steps(self):
        spec = baseline_series(self.table, line_type="with_steps")
        self.assertEqual(spec.options["lineType"], 1)

    def test_line_type_curved(self):
        spec = baseline_series(self.table, line_type="curved")
        self.assertEqual(spec.options["lineType"], 2)

    def test_line_type_not_present_when_none(self):
        spec = baseline_series(self.table)
        self.assertNotIn("lineType", spec.options)

    def test_relative_gradient(self):
        spec = baseline_series(self.table, relative_gradient=True)
        self.assertTrue(spec.options["relativeGradient"])

    def test_relative_gradient_not_present_when_none(self):
        spec = baseline_series(self.table)
        self.assertNotIn("relativeGradient", spec.options)

    def test_to_dict(self):
        spec = baseline_series(self.table, base_value=25.0, title="BL")
        result = spec.to_dict("bl_0", 5)
        self.assertEqual(result["type"], "Baseline")
        self.assertEqual(result["options"]["baseValue"]["price"], 25.0)
        self.assertEqual(result["options"]["title"], "BL")


class TestHistogramSeries(unittest.TestCase):
    """Tests for histogram_series()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        spec = histogram_series(self.table)
        self.assertEqual(spec.series_type, "Histogram")
        self.assertEqual(spec.column_mapping, {"time": "Timestamp", "value": "Value"})
        self.assertEqual(spec.options, {})

    def test_custom_params(self):
        spec = histogram_series(
            self.table,
            time="Date",
            value="Volume",
            color="rgba(0,150,136,0.8)",
            title="Volume",
        )
        self.assertEqual(spec.column_mapping, {"time": "Date", "value": "Volume"})
        self.assertEqual(spec.options["color"], "rgba(0,150,136,0.8)")
        self.assertEqual(spec.options["title"], "Volume")

    def test_color_column(self):
        """color_column should add 'color' to column_mapping."""
        spec = histogram_series(self.table, color_column="BarColor")
        self.assertIn("color", spec.column_mapping)
        self.assertEqual(spec.column_mapping["color"], "BarColor")

    def test_no_color_column_by_default(self):
        """Without color_column, 'color' should not be in column_mapping."""
        spec = histogram_series(self.table)
        self.assertNotIn("color", spec.column_mapping)

    def test_base_zero(self):
        spec = histogram_series(self.table, base=0.0)
        self.assertEqual(spec.options["base"], 0.0)

    def test_base_positive(self):
        spec = histogram_series(self.table, base=100.0)
        self.assertEqual(spec.options["base"], 100.0)

    def test_base_negative(self):
        spec = histogram_series(self.table, base=-50.5)
        self.assertEqual(spec.options["base"], -50.5)

    def test_base_not_present_when_none(self):
        spec = histogram_series(self.table)
        self.assertNotIn("base", spec.options)

    def test_to_dict(self):
        spec = histogram_series(self.table, color="#ff0000", color_column="Clr")
        result = spec.to_dict("hist_0", 99)
        self.assertEqual(result["type"], "Histogram")
        self.assertEqual(result["options"]["color"], "#ff0000")
        self.assertEqual(result["dataMapping"]["columns"]["color"], "Clr")


class TestSeriesSpecDataclass(unittest.TestCase):
    """Tests for the SeriesSpec dataclass directly."""

    def test_to_dict_basic(self):
        table = MagicMock(name="table")
        spec = SeriesSpec(
            series_type="Line",
            table=table,
            column_mapping={"time": "ts", "value": "val"},
            options={"color": "blue"},
        )
        result = spec.to_dict("test_id", 0)
        self.assertEqual(result["id"], "test_id")
        self.assertEqual(result["type"], "Line")
        self.assertEqual(result["options"], {"color": "blue"})
        self.assertEqual(result["dataMapping"]["tableId"], 0)
        self.assertEqual(
            result["dataMapping"]["columns"], {"time": "ts", "value": "val"}
        )
        self.assertNotIn("markers", result)
        self.assertNotIn("priceLines", result)

    def test_to_dict_with_markers_and_price_lines(self):
        table = MagicMock(name="table")
        m1 = Marker(time="2024-01-01", text="Buy")
        m2 = Marker(time="2024-02-01", text="Sell")
        pl = PriceLine(price=150.0, color="red", title="Resistance")
        spec = SeriesSpec(
            series_type="Line",
            table=table,
            column_mapping={"time": "ts", "value": "val"},
            options={},
            markers=[m1, m2],
            price_lines=[pl],
        )
        result = spec.to_dict("s1", 1)
        self.assertEqual(len(result["markers"]), 2)
        self.assertEqual(result["markers"][0]["text"], "Buy")
        self.assertEqual(result["markers"][1]["text"], "Sell")
        self.assertEqual(len(result["priceLines"]), 1)
        self.assertEqual(result["priceLines"][0]["price"], 150.0)
        self.assertEqual(result["priceLines"][0]["color"], "red")
        self.assertEqual(result["priceLines"][0]["title"], "Resistance")

    def test_empty_markers_list_excluded(self):
        """An empty markers list should still be excluded (falsy)."""
        table = MagicMock(name="table")
        spec = SeriesSpec(
            series_type="Line",
            table=table,
            column_mapping={"time": "ts", "value": "val"},
            markers=[],
            price_lines=[],
        )
        result = spec.to_dict("s0", 0)
        self.assertNotIn("markers", result)
        self.assertNotIn("priceLines", result)


class TestLastValueVisible(unittest.TestCase):
    """lastValueVisible should work on all series types."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_candlestick(self):
        spec = candlestick_series(self.table, last_value_visible=False)
        self.assertFalse(spec.options["lastValueVisible"])

    def test_bar(self):
        spec = bar_series(self.table, last_value_visible=False)
        self.assertFalse(spec.options["lastValueVisible"])

    def test_line(self):
        spec = line_series(self.table, last_value_visible=False)
        self.assertFalse(spec.options["lastValueVisible"])

    def test_area(self):
        spec = area_series(self.table, last_value_visible=False)
        self.assertFalse(spec.options["lastValueVisible"])

    def test_baseline(self):
        spec = baseline_series(self.table, last_value_visible=False)
        self.assertFalse(spec.options["lastValueVisible"])

    def test_histogram(self):
        spec = histogram_series(self.table, last_value_visible=False)
        self.assertFalse(spec.options["lastValueVisible"])

    def test_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("lastValueVisible", spec.options)


class TestCrosshairMarkerOnAreaAndBaseline(unittest.TestCase):
    """crosshairMarkerRadius should work on area and baseline series."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_area_crosshair_marker_radius(self):
        spec = area_series(self.table, crosshair_marker_radius=5.0)
        self.assertEqual(spec.options["crosshairMarkerRadius"], 5.0)

    def test_baseline_crosshair_marker_visible(self):
        spec = baseline_series(self.table, crosshair_marker_visible=False)
        self.assertFalse(spec.options["crosshairMarkerVisible"])

    def test_baseline_crosshair_marker_radius(self):
        spec = baseline_series(self.table, crosshair_marker_radius=3.0)
        self.assertEqual(spec.options["crosshairMarkerRadius"], 3.0)


class TestPerDatapointColor(unittest.TestCase):
    """Per-datapoint color columns on OHLC series."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_candlestick_color_column(self):
        spec = candlestick_series(self.table, color_column="BarColor")
        self.assertEqual(spec.column_mapping["color"], "BarColor")

    def test_candlestick_border_color_column(self):
        spec = candlestick_series(self.table, border_color_column="BorderClr")
        self.assertEqual(spec.column_mapping["borderColor"], "BorderClr")

    def test_candlestick_wick_color_column(self):
        spec = candlestick_series(self.table, wick_color_column="WickClr")
        self.assertEqual(spec.column_mapping["wickColor"], "WickClr")

    def test_candlestick_no_color_columns_by_default(self):
        spec = candlestick_series(self.table)
        self.assertNotIn("color", spec.column_mapping)
        self.assertNotIn("borderColor", spec.column_mapping)
        self.assertNotIn("wickColor", spec.column_mapping)

    def test_bar_color_column(self):
        spec = bar_series(self.table, color_column="Clr")
        self.assertEqual(spec.column_mapping["color"], "Clr")

    def test_bar_no_color_column_by_default(self):
        spec = bar_series(self.table)
        self.assertNotIn("color", spec.column_mapping)

    # --- Line series per-point color ---

    def test_line_color_column(self):
        spec = line_series(self.table, color_column="PointColor")
        self.assertEqual(spec.column_mapping["color"], "PointColor")

    def test_line_no_color_column_by_default(self):
        spec = line_series(self.table)
        self.assertNotIn("color", spec.column_mapping)

    def test_line_color_column_in_to_dict(self):
        spec = line_series(self.table, color_column="Clr")
        result = spec.to_dict("s0", 0)
        self.assertEqual(result["dataMapping"]["columns"]["color"], "Clr")

    # --- Area series per-point color ---

    def test_area_line_color_column(self):
        spec = area_series(self.table, line_color_column="LineClr")
        self.assertEqual(spec.column_mapping["lineColor"], "LineClr")

    def test_area_top_color_column(self):
        spec = area_series(self.table, top_color_column="TopClr")
        self.assertEqual(spec.column_mapping["topColor"], "TopClr")

    def test_area_bottom_color_column(self):
        spec = area_series(self.table, bottom_color_column="BotClr")
        self.assertEqual(spec.column_mapping["bottomColor"], "BotClr")

    def test_area_no_color_columns_by_default(self):
        spec = area_series(self.table)
        self.assertNotIn("lineColor", spec.column_mapping)
        self.assertNotIn("topColor", spec.column_mapping)
        self.assertNotIn("bottomColor", spec.column_mapping)

    def test_area_all_color_columns(self):
        spec = area_series(
            self.table,
            line_color_column="LC",
            top_color_column="TC",
            bottom_color_column="BC",
        )
        self.assertEqual(spec.column_mapping["lineColor"], "LC")
        self.assertEqual(spec.column_mapping["topColor"], "TC")
        self.assertEqual(spec.column_mapping["bottomColor"], "BC")

    def test_area_color_columns_in_to_dict(self):
        spec = area_series(
            self.table,
            line_color_column="LC",
            top_color_column="TC",
            bottom_color_column="BC",
        )
        result = spec.to_dict("a0", 1)
        cols = result["dataMapping"]["columns"]
        self.assertEqual(cols["lineColor"], "LC")
        self.assertEqual(cols["topColor"], "TC")
        self.assertEqual(cols["bottomColor"], "BC")

    # --- Baseline series per-point color ---

    def test_baseline_top_line_color_column(self):
        spec = baseline_series(self.table, top_line_color_column="TLC")
        self.assertEqual(spec.column_mapping["topLineColor"], "TLC")

    def test_baseline_top_fill_color1_column(self):
        spec = baseline_series(self.table, top_fill_color1_column="TFC1")
        self.assertEqual(spec.column_mapping["topFillColor1"], "TFC1")

    def test_baseline_top_fill_color2_column(self):
        spec = baseline_series(self.table, top_fill_color2_column="TFC2")
        self.assertEqual(spec.column_mapping["topFillColor2"], "TFC2")

    def test_baseline_bottom_line_color_column(self):
        spec = baseline_series(self.table, bottom_line_color_column="BLC")
        self.assertEqual(spec.column_mapping["bottomLineColor"], "BLC")

    def test_baseline_bottom_fill_color1_column(self):
        spec = baseline_series(self.table, bottom_fill_color1_column="BFC1")
        self.assertEqual(spec.column_mapping["bottomFillColor1"], "BFC1")

    def test_baseline_bottom_fill_color2_column(self):
        spec = baseline_series(self.table, bottom_fill_color2_column="BFC2")
        self.assertEqual(spec.column_mapping["bottomFillColor2"], "BFC2")

    def test_baseline_no_color_columns_by_default(self):
        spec = baseline_series(self.table)
        self.assertNotIn("topLineColor", spec.column_mapping)
        self.assertNotIn("topFillColor1", spec.column_mapping)
        self.assertNotIn("topFillColor2", spec.column_mapping)
        self.assertNotIn("bottomLineColor", spec.column_mapping)
        self.assertNotIn("bottomFillColor1", spec.column_mapping)
        self.assertNotIn("bottomFillColor2", spec.column_mapping)

    def test_baseline_all_color_columns(self):
        spec = baseline_series(
            self.table,
            top_line_color_column="TLC",
            top_fill_color1_column="TFC1",
            top_fill_color2_column="TFC2",
            bottom_line_color_column="BLC",
            bottom_fill_color1_column="BFC1",
            bottom_fill_color2_column="BFC2",
        )
        self.assertEqual(spec.column_mapping["topLineColor"], "TLC")
        self.assertEqual(spec.column_mapping["topFillColor1"], "TFC1")
        self.assertEqual(spec.column_mapping["topFillColor2"], "TFC2")
        self.assertEqual(spec.column_mapping["bottomLineColor"], "BLC")
        self.assertEqual(spec.column_mapping["bottomFillColor1"], "BFC1")
        self.assertEqual(spec.column_mapping["bottomFillColor2"], "BFC2")

    def test_baseline_color_columns_in_to_dict(self):
        spec = baseline_series(
            self.table,
            top_line_color_column="TLC",
            bottom_fill_color2_column="BFC2",
        )
        result = spec.to_dict("bl0", 2)
        cols = result["dataMapping"]["columns"]
        self.assertEqual(cols["topLineColor"], "TLC")
        self.assertEqual(cols["bottomFillColor2"], "BFC2")
        # Others should not be present
        self.assertNotIn("topFillColor1", cols)
        self.assertNotIn("bottomLineColor", cols)


class TestPriceScaleOptions(unittest.TestCase):
    """Per-series priceScaleOptions (autoScale, scaleMargins)."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_auto_scale(self):
        spec = line_series(self.table, auto_scale=False)
        self.assertFalse(spec.price_scale_options["autoScale"])

    def test_scale_margins(self):
        spec = line_series(self.table, scale_margin_top=0.1, scale_margin_bottom=0.2)
        self.assertEqual(spec.price_scale_options["scaleMargins"]["top"], 0.1)
        self.assertEqual(spec.price_scale_options["scaleMargins"]["bottom"], 0.2)

    def test_combined(self):
        spec = candlestick_series(
            self.table, auto_scale=False, scale_margin_top=0.1, scale_margin_bottom=0.3
        )
        self.assertFalse(spec.price_scale_options["autoScale"])
        self.assertEqual(spec.price_scale_options["scaleMargins"]["top"], 0.1)
        self.assertEqual(spec.price_scale_options["scaleMargins"]["bottom"], 0.3)

    def test_empty_by_default(self):
        spec = line_series(self.table)
        self.assertEqual(spec.price_scale_options, {})

    def test_to_dict_includes_price_scale_options(self):
        spec = line_series(self.table, auto_scale=False, scale_margin_top=0.1)
        result = spec.to_dict("s0", 0)
        self.assertIn("priceScaleOptions", result)
        self.assertFalse(result["priceScaleOptions"]["autoScale"])

    def test_to_dict_excludes_empty_price_scale_options(self):
        spec = line_series(self.table)
        result = spec.to_dict("s0", 0)
        self.assertNotIn("priceScaleOptions", result)

    def test_all_series_types(self):
        """All series types should support price scale options."""
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            spec = fn(self.table, scale_margin_top=0.2)
            self.assertEqual(spec.price_scale_options["scaleMargins"]["top"], 0.2)


class TestPaneParameter(unittest.TestCase):
    """Tests for per-series pane parameter."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_pane_on_line_series(self):
        spec = line_series(self.table, pane=1)
        self.assertEqual(spec.pane, 1)

    def test_pane_on_histogram_series(self):
        spec = histogram_series(self.table, pane=2)
        self.assertEqual(spec.pane, 2)

    def test_pane_default_is_none(self):
        spec = line_series(self.table)
        self.assertIsNone(spec.pane)

    def test_to_dict_includes_pane_index(self):
        spec = line_series(self.table, pane=1)
        result = spec.to_dict("s0", 0)
        self.assertEqual(result["paneIndex"], 1)

    def test_to_dict_excludes_pane_index_when_none(self):
        spec = line_series(self.table)
        result = spec.to_dict("s0", 0)
        self.assertNotIn("paneIndex", result)

    def test_pane_zero(self):
        """pane=0 (main pane) should still be serialized."""
        spec = candlestick_series(self.table, pane=0)
        result = spec.to_dict("s0", 0)
        self.assertEqual(result["paneIndex"], 0)

    def test_all_series_types_support_pane(self):
        """All series types should accept the pane parameter."""
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            spec = fn(self.table, pane=1)
            self.assertEqual(spec.pane, 1)


class TestExtendedPriceScaleOptions(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_new_scale_options_on_line_series(self):
        spec = line_series(
            self.table,
            scale_mode="logarithmic",
            scale_invert=True,
            scale_align_labels=False,
            scale_border_visible=False,
            scale_border_color="#333",
            scale_text_color="#FF0000",
            scale_entire_text_only=True,
            scale_visible=False,
            scale_ticks_visible=True,
            scale_minimum_width=80,
            scale_ensure_edge_tick_marks_visible=True,
        )
        pso = spec.price_scale_options
        self.assertEqual(pso["mode"], 1)  # logarithmic = 1
        self.assertTrue(pso["invertScale"])
        self.assertFalse(pso["alignLabels"])
        self.assertFalse(pso["borderVisible"])
        self.assertEqual(pso["borderColor"], "#333")
        self.assertEqual(pso["textColor"], "#FF0000")
        self.assertTrue(pso["entireTextOnly"])
        self.assertFalse(pso["visible"])
        self.assertTrue(pso["ticksVisible"])
        self.assertEqual(pso["minimumWidth"], 80)
        self.assertTrue(pso["ensureEdgeTickMarksVisible"])

    def test_all_series_types_support_new_scale_options(self):
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            spec = fn(self.table, scale_ticks_visible=True, scale_minimum_width=50)
            self.assertTrue(spec.price_scale_options["ticksVisible"])
            self.assertEqual(spec.price_scale_options["minimumWidth"], 50)

    def test_new_scale_options_not_set_by_default(self):
        spec = line_series(self.table)
        self.assertEqual(spec.price_scale_options, {})

    def test_to_dict_includes_new_scale_options(self):
        spec = line_series(
            self.table, scale_mode="percentage", scale_ticks_visible=True
        )
        d = spec.to_dict("s0", 0)
        self.assertIn("priceScaleOptions", d)
        self.assertEqual(d["priceScaleOptions"]["mode"], 2)  # percentage = 2
        self.assertTrue(d["priceScaleOptions"]["ticksVisible"])


class TestPriceLineOptions(unittest.TestCase):
    """price_line_* common options on all series types."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_price_line_visible_false(self):
        spec = line_series(self.table, price_line_visible=False)
        self.assertFalse(spec.options["priceLineVisible"])

    def test_price_line_visible_true(self):
        spec = line_series(self.table, price_line_visible=True)
        self.assertTrue(spec.options["priceLineVisible"])

    def test_price_line_source_last_bar(self):
        spec = line_series(self.table, price_line_source="last_bar")
        self.assertEqual(spec.options["priceLineSource"], 0)

    def test_price_line_source_last_visible(self):
        spec = line_series(self.table, price_line_source="last_visible")
        self.assertEqual(spec.options["priceLineSource"], 1)

    def test_price_line_width(self):
        spec = line_series(self.table, price_line_width=2)
        self.assertEqual(spec.options["priceLineWidth"], 2)

    def test_price_line_color(self):
        spec = line_series(self.table, price_line_color="#ff0000")
        self.assertEqual(spec.options["priceLineColor"], "#ff0000")

    def test_price_line_style_dashed(self):
        spec = line_series(self.table, price_line_style="dashed")
        self.assertEqual(spec.options["priceLineStyle"], 2)

    def test_price_line_style_solid(self):
        spec = line_series(self.table, price_line_style="solid")
        self.assertEqual(spec.options["priceLineStyle"], 0)

    def test_price_line_options_absent_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("priceLineVisible", spec.options)
        self.assertNotIn("priceLineSource", spec.options)
        self.assertNotIn("priceLineWidth", spec.options)
        self.assertNotIn("priceLineColor", spec.options)
        self.assertNotIn("priceLineStyle", spec.options)

    def test_all_series_types_accept_price_line_options(self):
        """price_line_* must be accepted by all 6 series functions."""
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            spec = fn(
                self.table,
                price_line_visible=False,
                price_line_source="last_visible",
                price_line_width=3,
                price_line_color="#aabbcc",
                price_line_style="dotted",
            )
            self.assertFalse(spec.options["priceLineVisible"])
            self.assertEqual(spec.options["priceLineSource"], 1)
            self.assertEqual(spec.options["priceLineWidth"], 3)
            self.assertEqual(spec.options["priceLineColor"], "#aabbcc")
            self.assertEqual(spec.options["priceLineStyle"], 1)  # dotted

    def test_to_dict_includes_price_line_options(self):
        spec = line_series(
            self.table,
            price_line_visible=True,
            price_line_color="#123456",
        )
        result = spec.to_dict("s0", 0)
        self.assertTrue(result["options"]["priceLineVisible"])
        self.assertEqual(result["options"]["priceLineColor"], "#123456")


class TestBaseLineOptions(unittest.TestCase):
    """base_line_* common options on all series types."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_base_line_visible_false(self):
        spec = line_series(self.table, base_line_visible=False)
        self.assertFalse(spec.options["baseLineVisible"])

    def test_base_line_color(self):
        spec = line_series(self.table, base_line_color="#B2B5BE")
        self.assertEqual(spec.options["baseLineColor"], "#B2B5BE")

    def test_base_line_width(self):
        spec = line_series(self.table, base_line_width=2)
        self.assertEqual(spec.options["baseLineWidth"], 2)

    def test_base_line_style_solid(self):
        spec = line_series(self.table, base_line_style="solid")
        self.assertEqual(spec.options["baseLineStyle"], 0)

    def test_base_line_style_large_dashed(self):
        spec = line_series(self.table, base_line_style="large_dashed")
        self.assertEqual(spec.options["baseLineStyle"], 3)

    def test_base_line_options_absent_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("baseLineVisible", spec.options)
        self.assertNotIn("baseLineColor", spec.options)
        self.assertNotIn("baseLineWidth", spec.options)
        self.assertNotIn("baseLineStyle", spec.options)

    def test_all_series_types_accept_base_line_options(self):
        """base_line_* must be accepted by all 6 series functions."""
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            spec = fn(
                self.table,
                base_line_visible=False,
                base_line_color="#ffffff",
                base_line_width=1,
                base_line_style="dotted",
            )
            self.assertFalse(spec.options["baseLineVisible"])
            self.assertEqual(spec.options["baseLineColor"], "#ffffff")
            self.assertEqual(spec.options["baseLineWidth"], 1)
            self.assertEqual(spec.options["baseLineStyle"], 1)  # dotted

    def test_to_dict_includes_base_line_options(self):
        spec = area_series(
            self.table,
            base_line_visible=True,
            base_line_color="#aaaaaa",
        )
        result = spec.to_dict("s0", 0)
        self.assertTrue(result["options"]["baseLineVisible"])
        self.assertEqual(result["options"]["baseLineColor"], "#aaaaaa")


class TestPriceLineSourceEnum(unittest.TestCase):
    """PriceLineSource string literals resolve to correct integer values."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_last_bar_is_zero(self):
        spec = candlestick_series(self.table, price_line_source="last_bar")
        self.assertEqual(spec.options["priceLineSource"], 0)

    def test_last_visible_is_one(self):
        spec = candlestick_series(self.table, price_line_source="last_visible")
        self.assertEqual(spec.options["priceLineSource"], 1)

    def test_source_absent_when_not_set(self):
        spec = candlestick_series(self.table)
        self.assertNotIn("priceLineSource", spec.options)


class TestLastPriceAnimation(unittest.TestCase):
    """lastPriceAnimation should serialize correctly on line/area/baseline series."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_disabled(self):
        spec = line_series(self.table, last_price_animation="disabled")
        self.assertEqual(spec.options["lastPriceAnimation"], 0)

    def test_line_continuous(self):
        spec = line_series(self.table, last_price_animation="continuous")
        self.assertEqual(spec.options["lastPriceAnimation"], 1)

    def test_line_on_data_update(self):
        spec = line_series(self.table, last_price_animation="on_data_update")
        self.assertEqual(spec.options["lastPriceAnimation"], 2)

    def test_line_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("lastPriceAnimation", spec.options)

    def test_area_last_price_animation(self):
        spec = area_series(self.table, last_price_animation="continuous")
        self.assertEqual(spec.options["lastPriceAnimation"], 1)

    def test_baseline_last_price_animation(self):
        spec = baseline_series(self.table, last_price_animation="on_data_update")
        self.assertEqual(spec.options["lastPriceAnimation"], 2)


class TestLineVisible(unittest.TestCase):
    """lineVisible should work on line, area, and baseline series."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_series_visible_false(self):
        spec = line_series(self.table, line_visible=False)
        self.assertFalse(spec.options["lineVisible"])

    def test_line_series_visible_true(self):
        spec = line_series(self.table, line_visible=True)
        self.assertTrue(spec.options["lineVisible"])

    def test_line_series_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("lineVisible", spec.options)

    def test_area_series(self):
        spec = area_series(self.table, line_visible=False)
        self.assertFalse(spec.options["lineVisible"])

    def test_baseline_series(self):
        spec = baseline_series(self.table, line_visible=False)
        self.assertFalse(spec.options["lineVisible"])


class TestPointMarkers(unittest.TestCase):
    """pointMarkersVisible and pointMarkersRadius on line/area/baseline."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_point_markers_visible(self):
        spec = line_series(self.table, point_markers_visible=True)
        self.assertTrue(spec.options["pointMarkersVisible"])

    def test_line_point_markers_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("pointMarkersVisible", spec.options)
        self.assertNotIn("pointMarkersRadius", spec.options)

    def test_line_point_markers_radius(self):
        spec = line_series(self.table, point_markers_radius=3.5)
        self.assertEqual(spec.options["pointMarkersRadius"], 3.5)

    def test_area_point_markers(self):
        spec = area_series(
            self.table, point_markers_visible=True, point_markers_radius=4.0
        )
        self.assertTrue(spec.options["pointMarkersVisible"])
        self.assertEqual(spec.options["pointMarkersRadius"], 4.0)

    def test_baseline_point_markers(self):
        spec = baseline_series(
            self.table, point_markers_visible=True, point_markers_radius=2.0
        )
        self.assertTrue(spec.options["pointMarkersVisible"])
        self.assertEqual(spec.options["pointMarkersRadius"], 2.0)


class TestCrosshairMarkerExtended(unittest.TestCase):
    """crosshairMarkerBorderColor/BackgroundColor/BorderWidth on line/area/baseline."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_border_color(self):
        spec = line_series(self.table, crosshair_marker_border_color="#ff0000")
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "#ff0000")

    def test_line_background_color(self):
        spec = line_series(self.table, crosshair_marker_background_color="#00ff00")
        self.assertEqual(spec.options["crosshairMarkerBackgroundColor"], "#00ff00")

    def test_line_border_width(self):
        spec = line_series(self.table, crosshair_marker_border_width=3.0)
        self.assertEqual(spec.options["crosshairMarkerBorderWidth"], 3.0)

    def test_line_empty_string_border_color(self):
        """Empty string is a valid value (means 'use series color') and must not be filtered."""
        spec = line_series(self.table, crosshair_marker_border_color="")
        # _filter_none removes None via `if v is not None`, so "" passes through.
        self.assertIn("crosshairMarkerBorderColor", spec.options)
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "")

    def test_line_not_present_when_none(self):
        spec = line_series(self.table)
        self.assertNotIn("crosshairMarkerBorderColor", spec.options)
        self.assertNotIn("crosshairMarkerBackgroundColor", spec.options)
        self.assertNotIn("crosshairMarkerBorderWidth", spec.options)

    def test_area_all_three(self):
        spec = area_series(
            self.table,
            crosshair_marker_border_color="#111",
            crosshair_marker_background_color="#222",
            crosshair_marker_border_width=1.5,
        )
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "#111")
        self.assertEqual(spec.options["crosshairMarkerBackgroundColor"], "#222")
        self.assertEqual(spec.options["crosshairMarkerBorderWidth"], 1.5)

    def test_baseline_all_three(self):
        spec = baseline_series(
            self.table,
            crosshair_marker_border_color="#aaa",
            crosshair_marker_background_color="#bbb",
            crosshair_marker_border_width=4.0,
        )
        self.assertEqual(spec.options["crosshairMarkerBorderColor"], "#aaa")
        self.assertEqual(spec.options["crosshairMarkerBackgroundColor"], "#bbb")
        self.assertEqual(spec.options["crosshairMarkerBorderWidth"], 4.0)


class TestCommonOptionsCoexistence(unittest.TestCase):
    """Common and per-type options coexist without conflict."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_common_and_per_type_together(self):
        spec = line_series(
            self.table,
            color="blue",
            line_width=2,
            price_line_visible=False,
            base_line_color="#ff0000",
            last_value_visible=False,
            title="My Line",
        )
        self.assertEqual(spec.options["color"], "blue")
        self.assertEqual(spec.options["lineWidth"], 2)
        self.assertFalse(spec.options["priceLineVisible"])
        self.assertEqual(spec.options["baseLineColor"], "#ff0000")
        self.assertFalse(spec.options["lastValueVisible"])
        self.assertEqual(spec.options["title"], "My Line")

    def test_candlestick_common_and_per_type_together(self):
        spec = candlestick_series(
            self.table,
            up_color="#00ff00",
            price_line_visible=True,
            price_line_width=2,
            base_line_visible=False,
        )
        self.assertEqual(spec.options["upColor"], "#00ff00")
        self.assertTrue(spec.options["priceLineVisible"])
        self.assertEqual(spec.options["priceLineWidth"], 2)
        self.assertFalse(spec.options["baseLineVisible"])


if __name__ == "__main__":
    unittest.main()
