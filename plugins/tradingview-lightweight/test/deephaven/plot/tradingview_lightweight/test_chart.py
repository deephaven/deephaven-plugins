"""Tests for chart creation and TvlChart class."""

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

from deephaven.plot.tradingview_lightweight.chart import (
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
)
from deephaven.plot.tradingview_lightweight.series import (
    SeriesSpec,
    candlestick_series,
    line_series,
    area_series,
    bar_series,
    baseline_series,
    histogram_series,
)
from deephaven.plot.tradingview_lightweight.markers import Marker, PriceLine


class TestTvlChart(unittest.TestCase):
    """Tests for the TvlChart class."""

    def setUp(self):
        self.table1 = MagicMock(name="table1")
        self.table2 = MagicMock(name="table2")

    def test_properties(self):
        s1 = line_series(self.table1)
        c = TvlChart(series_list=[s1], chart_options={"width": 800})
        self.assertEqual(len(c.series_list), 1)
        self.assertIs(c.series_list[0], s1)
        self.assertEqual(c.chart_options, {"width": 800})

    def test_get_tables_single(self):
        s1 = line_series(self.table1)
        c = TvlChart(series_list=[s1], chart_options={})
        tables = c.get_tables()
        self.assertEqual(len(tables), 1)
        self.assertIs(tables[0], self.table1)

    def test_get_tables_multiple_unique(self):
        s1 = line_series(self.table1)
        s2 = area_series(self.table2)
        c = TvlChart(series_list=[s1, s2], chart_options={})
        tables = c.get_tables()
        self.assertEqual(len(tables), 2)
        self.assertIs(tables[0], self.table1)
        self.assertIs(tables[1], self.table2)

    def test_get_tables_deduplication(self):
        """Same table used in two series should appear only once."""
        s1 = line_series(self.table1, value="Price")
        s2 = histogram_series(self.table1, value="Volume")
        c = TvlChart(series_list=[s1, s2], chart_options={})
        tables = c.get_tables()
        self.assertEqual(len(tables), 1)
        self.assertIs(tables[0], self.table1)

    def test_to_dict(self):
        s1 = line_series(self.table1, color="blue")
        s2 = candlestick_series(self.table2, up_color="green")
        c = TvlChart(
            series_list=[s1, s2],
            chart_options={"width": 600, "height": 400},
        )
        table_id_map = {id(self.table1): 0, id(self.table2): 1}
        result = c.to_dict(table_id_map)

        self.assertIn("chartOptions", result)
        self.assertIn("series", result)
        self.assertEqual(result["chartOptions"]["width"], 600)
        self.assertEqual(result["chartOptions"]["height"], 400)

        self.assertEqual(len(result["series"]), 2)
        self.assertEqual(result["series"][0]["id"], "series_0")
        self.assertEqual(result["series"][0]["type"], "Line")
        self.assertEqual(result["series"][0]["dataMapping"]["tableId"], 0)
        self.assertEqual(result["series"][1]["id"], "series_1")
        self.assertEqual(result["series"][1]["type"], "Candlestick")
        self.assertEqual(result["series"][1]["dataMapping"]["tableId"], 1)

    def test_to_dict_empty_options(self):
        s = line_series(self.table1)
        c = TvlChart(series_list=[s], chart_options={})
        table_id_map = {id(self.table1): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["chartOptions"], {})


class TestChartFunction(unittest.TestCase):
    """Tests for the chart() function."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_single_series(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(len(c.series_list), 1)
        self.assertIs(c.series_list[0], s)

    def test_multiple_series(self):
        s1 = line_series(self.table, value="Price")
        s2 = histogram_series(self.table, value="Volume")
        c = chart(s1, s2)
        self.assertEqual(len(c.series_list), 2)

    def test_empty_options(self):
        """chart() with no kwargs should produce empty chart_options."""
        s = line_series(self.table)
        c = chart(s)
        self.assertEqual(c.chart_options, {})

    def test_layout_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            background_color="#1a1a2e",
            text_color="#e0e0e0",
            font_size=14,
        )
        layout = c.chart_options["layout"]
        self.assertEqual(layout["background"], {"type": "solid", "color": "#1a1a2e"})
        self.assertEqual(layout["textColor"], "#e0e0e0")
        self.assertEqual(layout["fontSize"], 14)

    def test_background_color_only(self):
        """background_color alone should create a layout with just background."""
        s = line_series(self.table)
        c = chart(s, background_color="#000")
        self.assertIn("layout", c.chart_options)
        self.assertEqual(
            c.chart_options["layout"]["background"],
            {"type": "solid", "color": "#000"},
        )

    def test_grid_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            vert_lines_visible=True,
            vert_lines_color="#333",
            vert_lines_style="dashed",
            horz_lines_visible=False,
            horz_lines_color="#444",
            horz_lines_style="dotted",
        )
        grid = c.chart_options["grid"]
        self.assertTrue(grid["vertLines"]["visible"])
        self.assertEqual(grid["vertLines"]["color"], "#333")
        self.assertEqual(grid["vertLines"]["style"], 2)  # dashed
        self.assertFalse(grid["horzLines"]["visible"])
        self.assertEqual(grid["horzLines"]["color"], "#444")
        self.assertEqual(grid["horzLines"]["style"], 1)  # dotted

    def test_crosshair_mode_normal(self):
        s = line_series(self.table)
        c = chart(s, crosshair_mode="normal")
        self.assertEqual(c.chart_options["crosshair"]["mode"], 0)

    def test_crosshair_mode_magnet(self):
        s = line_series(self.table)
        c = chart(s, crosshair_mode="magnet")
        self.assertEqual(c.chart_options["crosshair"]["mode"], 1)

    def test_crosshair_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("crosshair", c.chart_options)

    def test_crosshair_vert_line_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            crosshair_vert_line_width=8,
            crosshair_vert_line_color="#C3BCDB44",
            crosshair_vert_line_style="solid",
            crosshair_vert_line_label_background_color="#9B7DFF",
        )
        vl = c.chart_options["crosshair"]["vertLine"]
        self.assertEqual(vl["width"], 8)
        self.assertEqual(vl["color"], "#C3BCDB44")
        self.assertEqual(vl["style"], 0)  # solid
        self.assertEqual(vl["labelBackgroundColor"], "#9B7DFF")

    def test_crosshair_horz_line_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            crosshair_horz_line_color="#9B7DFF",
            crosshair_horz_line_label_background_color="#9B7DFF",
        )
        hl = c.chart_options["crosshair"]["horzLine"]
        self.assertEqual(hl["color"], "#9B7DFF")
        self.assertEqual(hl["labelBackgroundColor"], "#9B7DFF")

    def test_crosshair_mode_with_sub_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            crosshair_mode="normal",
            crosshair_vert_line_width=4,
        )
        ch = c.chart_options["crosshair"]
        self.assertEqual(ch["mode"], 0)
        self.assertEqual(ch["vertLine"]["width"], 4)

    def test_crosshair_sub_options_only(self):
        """Setting sub-options without mode should still create crosshair."""
        s = line_series(self.table)
        c = chart(s, crosshair_vert_line_width=2)
        self.assertIn("crosshair", c.chart_options)
        self.assertNotIn("mode", c.chart_options["crosshair"])
        self.assertEqual(c.chart_options["crosshair"]["vertLine"]["width"], 2)

    def test_right_price_scale(self):
        s = line_series(self.table)
        c = chart(
            s,
            right_price_scale_visible=True,
            right_price_scale_border_visible=False,
            right_price_scale_border_color="#555",
            right_price_scale_auto_scale=True,
            right_price_scale_mode="logarithmic",
            right_price_scale_invert_scale=False,
        )
        rps = c.chart_options["rightPriceScale"]
        self.assertTrue(rps["visible"])
        self.assertFalse(rps["borderVisible"])
        self.assertEqual(rps["borderColor"], "#555")
        self.assertTrue(rps["autoScale"])
        self.assertEqual(rps["mode"], 1)  # logarithmic
        self.assertFalse(rps["invertScale"])

    def test_left_price_scale(self):
        s = line_series(self.table)
        c = chart(
            s,
            left_price_scale_visible=True,
            left_price_scale_border_visible=True,
            left_price_scale_border_color="#666",
            left_price_scale_auto_scale=False,
            left_price_scale_mode="percentage",
            left_price_scale_invert_scale=True,
        )
        lps = c.chart_options["leftPriceScale"]
        self.assertTrue(lps["visible"])
        self.assertTrue(lps["borderVisible"])
        self.assertEqual(lps["borderColor"], "#666")
        self.assertFalse(lps["autoScale"])
        self.assertEqual(lps["mode"], 2)  # percentage
        self.assertTrue(lps["invertScale"])

    def test_price_scale_modes(self):
        """Test all four price scale mode mappings."""
        modes = {
            "normal": 0,
            "logarithmic": 1,
            "percentage": 2,
            "indexed_to_100": 3,
        }
        s = line_series(self.table)
        for mode_name, mode_value in modes.items():
            c = chart(s, right_price_scale_mode=mode_name)
            self.assertEqual(
                c.chart_options["rightPriceScale"]["mode"],
                mode_value,
                f"Mode {mode_name} should map to {mode_value}",
            )

    def test_time_scale_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            time_visible=True,
            seconds_visible=False,
            time_scale_border_visible=True,
            time_scale_border_color="#777",
            right_offset=5,
            bar_spacing=10.0,
            min_bar_spacing=2.0,
            fix_left_edge=True,
            fix_right_edge=False,
        )
        ts = c.chart_options["timeScale"]
        self.assertTrue(ts["timeVisible"])
        self.assertFalse(ts["secondsVisible"])
        self.assertTrue(ts["borderVisible"])
        self.assertEqual(ts["borderColor"], "#777")
        self.assertEqual(ts["rightOffset"], 5)
        self.assertEqual(ts["barSpacing"], 10.0)
        self.assertEqual(ts["minBarSpacing"], 2.0)
        self.assertTrue(ts["fixLeftEdge"])
        self.assertFalse(ts["fixRightEdge"])

    def test_watermark_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            watermark_text="AAPL",
            watermark_color="rgba(0,0,0,0.2)",
            watermark_visible=True,
            watermark_font_size=48,
            watermark_horz_align="center",
            watermark_vert_align="center",
        )
        wm = c.chart_options["watermark"]
        self.assertEqual(wm["text"], "AAPL")
        self.assertEqual(wm["color"], "rgba(0,0,0,0.2)")
        self.assertTrue(wm["visible"])
        self.assertEqual(wm["fontSize"], 48)
        self.assertEqual(wm["horzAlign"], "center")
        self.assertEqual(wm["vertAlign"], "center")

    def test_watermark_text_auto_visible(self):
        """Setting watermark_text without watermark_visible should set visible=True."""
        s = line_series(self.table)
        c = chart(s, watermark_text="Test")
        wm = c.chart_options["watermark"]
        self.assertTrue(wm["visible"])

    def test_watermark_visible_false(self):
        """Explicitly setting watermark_visible=False should be respected."""
        s = line_series(self.table)
        c = chart(s, watermark_text="Hidden", watermark_visible=False)
        wm = c.chart_options["watermark"]
        self.assertFalse(wm["visible"])

    def test_sizing(self):
        s = line_series(self.table)
        c = chart(s, width=1200, height=600)
        self.assertEqual(c.chart_options["width"], 1200)
        self.assertEqual(c.chart_options["height"], 600)

    def test_sizing_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("width", c.chart_options)
        self.assertNotIn("height", c.chart_options)

    def test_price_formatter(self):
        s = line_series(self.table)
        c = chart(s, price_formatter="currency_eur")
        loc = c.chart_options["localization"]
        self.assertEqual(loc["priceFormatterName"], "currency_eur")

    def test_price_formatter_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("localization", c.chart_options)

    def test_none_options_not_in_output(self):
        """Sections with all-None values should not appear in chart_options."""
        s = line_series(self.table)
        c = chart(s)  # all defaults are None
        self.assertNotIn("layout", c.chart_options)
        self.assertNotIn("grid", c.chart_options)
        self.assertNotIn("crosshair", c.chart_options)
        self.assertNotIn("rightPriceScale", c.chart_options)
        self.assertNotIn("leftPriceScale", c.chart_options)
        self.assertNotIn("timeScale", c.chart_options)
        self.assertNotIn("watermark", c.chart_options)

    def test_partial_grid_only_vert(self):
        """Setting only vertical grid lines should not create horzLines."""
        s = line_series(self.table)
        c = chart(s, vert_lines_visible=True)
        grid = c.chart_options["grid"]
        self.assertIn("vertLines", grid)
        self.assertNotIn("horzLines", grid)


class TestConvenienceFunctions(unittest.TestCase):
    """Tests for convenience chart creation functions."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_candlestick_convenience(self):
        c = candlestick(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(len(c.series_list), 1)
        self.assertEqual(c.series_list[0].series_type, "Candlestick")
        self.assertEqual(c.series_list[0].column_mapping["time"], "Timestamp")
        self.assertEqual(c.series_list[0].column_mapping["open"], "Open")

    def test_candlestick_custom(self):
        c = candlestick(
            self.table,
            time="Date",
            open="O",
            high="H",
            low="L",
            close="C",
            up_color="green",
            down_color="red",
            title="OHLC",
            background_color="#000",
            width=800,
            height=400,
        )
        series = c.series_list[0]
        self.assertEqual(series.column_mapping["time"], "Date")
        self.assertEqual(series.options["upColor"], "green")
        self.assertEqual(series.options["title"], "OHLC")
        self.assertEqual(c.chart_options["width"], 800)
        self.assertEqual(c.chart_options["height"], 400)
        self.assertIn("layout", c.chart_options)

    def test_candlestick_with_markers(self):
        m = Marker(time="2024-01-01", text="Signal")
        c = candlestick(self.table, markers=[m])
        self.assertEqual(len(c.series_list[0].markers), 1)

    def test_candlestick_with_price_lines(self):
        pl = PriceLine(price=100.0)
        c = candlestick(self.table, price_lines=[pl])
        self.assertEqual(len(c.series_list[0].price_lines), 1)

    def test_line_convenience(self):
        c = line(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(len(c.series_list), 1)
        self.assertEqual(c.series_list[0].series_type, "Line")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Value")

    def test_line_custom(self):
        c = line(
            self.table,
            time="ts",
            value="price",
            color="red",
            line_width=3,
            title="Close Price",
            watermark_text="MSFT",
        )
        series = c.series_list[0]
        self.assertEqual(series.column_mapping["time"], "ts")
        self.assertEqual(series.options["color"], "red")
        self.assertIn("watermark", c.chart_options)

    def test_area_convenience(self):
        c = area(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(c.series_list[0].series_type, "Area")

    def test_area_custom(self):
        c = area(
            self.table,
            line_color="blue",
            top_color="rgba(0,0,255,0.3)",
            bottom_color="rgba(0,0,255,0.0)",
            line_width=2,
            title="Depth",
            time_visible=True,
        )
        series = c.series_list[0]
        self.assertEqual(series.options["lineColor"], "blue")
        self.assertEqual(series.options["topColor"], "rgba(0,0,255,0.3)")
        ts = c.chart_options["timeScale"]
        self.assertTrue(ts["timeVisible"])

    def test_bar_convenience(self):
        c = bar(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(c.series_list[0].series_type, "Bar")

    def test_bar_custom(self):
        c = bar(
            self.table,
            time="Date",
            up_color="#26a69a",
            down_color="#ef5350",
            crosshair_mode="magnet",
        )
        series = c.series_list[0]
        self.assertEqual(series.options["upColor"], "#26a69a")
        self.assertEqual(c.chart_options["crosshair"]["mode"], 1)

    def test_baseline_convenience(self):
        c = baseline(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(c.series_list[0].series_type, "Baseline")

    def test_baseline_custom(self):
        c = baseline(
            self.table,
            base_value=50.0,
            top_line_color="green",
            bottom_line_color="red",
            line_width=2,
            title="Profit/Loss",
            text_color="#ddd",
        )
        series = c.series_list[0]
        self.assertEqual(series.options["baseValue"]["price"], 50.0)
        self.assertEqual(series.options["topLineColor"], "green")
        self.assertEqual(c.chart_options["layout"]["textColor"], "#ddd")

    def test_histogram_convenience(self):
        c = histogram(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(c.series_list[0].series_type, "Histogram")

    def test_histogram_custom(self):
        c = histogram(
            self.table,
            value="Volume",
            color="teal",
            color_column="VolumeColor",
            title="Vol",
            height=200,
        )
        series = c.series_list[0]
        self.assertEqual(series.column_mapping["value"], "Volume")
        self.assertEqual(series.column_mapping["color"], "VolumeColor")
        self.assertEqual(series.options["color"], "teal")
        self.assertEqual(c.chart_options["height"], 200)


class TestChartFullSerialization(unittest.TestCase):
    """Integration-style tests for full chart serialization."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_full_round_trip(self):
        """Build a chart and serialize it, verifying the complete structure."""
        m = Marker(
            time="2024-06-01",
            position="aboveBar",
            shape="arrowDown",
            color="red",
            text="Sell",
        )
        pl = PriceLine(price=200.0, color="blue", title="Target")
        s = line_series(
            self.table,
            time="Date",
            value="Close",
            color="#2962FF",
            line_width=2,
            title="AAPL",
            markers=[m],
            price_lines=[pl],
        )
        c = chart(
            s,
            background_color="#131722",
            text_color="#d1d4dc",
            crosshair_mode="normal",
            time_visible=True,
            watermark_text="AAPL",
            width=800,
            height=400,
        )

        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)

        # Chart options
        self.assertEqual(
            result["chartOptions"]["layout"]["background"]["color"], "#131722"
        )
        self.assertEqual(result["chartOptions"]["layout"]["textColor"], "#d1d4dc")
        self.assertEqual(result["chartOptions"]["crosshair"]["mode"], 0)
        self.assertEqual(result["chartOptions"]["timeScale"]["timeVisible"], True)
        self.assertEqual(result["chartOptions"]["watermark"]["text"], "AAPL")
        self.assertTrue(result["chartOptions"]["watermark"]["visible"])
        self.assertEqual(result["chartOptions"]["width"], 800)
        self.assertEqual(result["chartOptions"]["height"], 400)

        # Series
        self.assertEqual(len(result["series"]), 1)
        series_dict = result["series"][0]
        self.assertEqual(series_dict["id"], "series_0")
        self.assertEqual(series_dict["type"], "Line")
        self.assertEqual(series_dict["options"]["color"], "#2962FF")
        self.assertEqual(series_dict["options"]["lineWidth"], 2)
        self.assertEqual(series_dict["options"]["title"], "AAPL")
        self.assertEqual(series_dict["dataMapping"]["tableId"], 0)
        self.assertEqual(series_dict["dataMapping"]["columns"]["time"], "Date")
        self.assertEqual(series_dict["dataMapping"]["columns"]["value"], "Close")

        # Markers and price lines
        self.assertEqual(len(series_dict["markers"]), 1)
        self.assertEqual(series_dict["markers"][0]["text"], "Sell")
        self.assertEqual(len(series_dict["priceLines"]), 1)
        self.assertEqual(series_dict["priceLines"][0]["price"], 200.0)

    def test_multi_series_multi_table(self):
        """Chart with multiple series on different tables."""
        table_a = MagicMock(name="table_a")
        table_b = MagicMock(name="table_b")
        s1 = candlestick_series(table_a, title="Stock A")
        s2 = line_series(table_b, value="RSI", title="RSI")
        c = chart(s1, s2)

        table_id_map = {id(table_a): 0, id(table_b): 1}
        result = c.to_dict(table_id_map)

        self.assertEqual(len(result["series"]), 2)
        self.assertEqual(result["series"][0]["dataMapping"]["tableId"], 0)
        self.assertEqual(result["series"][1]["dataMapping"]["tableId"], 1)
        self.assertEqual(result["series"][0]["type"], "Candlestick")
        self.assertEqual(result["series"][1]["type"], "Line")


class TestPaneSeparatorOptions(unittest.TestCase):
    """Tests for pane separator chart options."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_pane_separator_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            pane_separator_color="#333",
            pane_separator_hover_color="#555",
            pane_enable_resize=False,
        )
        panes = c.chart_options["layout"]["panes"]
        self.assertEqual(panes["separatorColor"], "#333")
        self.assertEqual(panes["separatorHoverColor"], "#555")
        self.assertFalse(panes["enableResize"])

    def test_pane_separator_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("layout", c.chart_options)

    def test_pane_separator_partial(self):
        s = line_series(self.table)
        c = chart(s, pane_separator_color="#333")
        panes = c.chart_options["layout"]["panes"]
        self.assertEqual(panes["separatorColor"], "#333")
        self.assertNotIn("separatorHoverColor", panes)

    def test_pane_separator_with_background(self):
        """Pane options should coexist with other layout options."""
        s = line_series(self.table)
        c = chart(s, background_color="#000", pane_separator_color="#333")
        layout = c.chart_options["layout"]
        self.assertEqual(layout["background"]["color"], "#000")
        self.assertEqual(layout["panes"]["separatorColor"], "#333")


class TestPaneStretchFactors(unittest.TestCase):
    """Tests for pane stretch factors."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_stretch_factors_serialization(self):
        s1 = candlestick_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(s1, s2, pane_stretch_factors=[3.0, 1.0])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["paneStretchFactors"], [3.0, 1.0])

    def test_stretch_factors_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertNotIn("paneStretchFactors", result)

    def test_stretch_factors_top_level(self):
        """Stretch factors should be top-level, not under chartOptions."""
        s = line_series(self.table)
        c = chart(s, pane_stretch_factors=[2.0, 1.0])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertNotIn("paneStretchFactors", result.get("chartOptions", {}))
        self.assertIn("paneStretchFactors", result)

    def test_stretch_factors_property(self):
        s = line_series(self.table)
        c = chart(s, pane_stretch_factors=[3.0, 1.0])
        self.assertEqual(c.pane_stretch_factors, [3.0, 1.0])

    def test_stretch_factors_none_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertIsNone(c.pane_stretch_factors)


class TestTimeScaleOptions(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_new_time_scale_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            time_scale_ticks_visible=True,
            shift_visible_range_on_new_bar=False,
            lock_visible_time_range_on_resize=True,
            right_bar_stays_on_scroll=True,
            time_scale_minimum_height=40,
            allow_bold_labels=False,
            tick_mark_max_character_length=12,
            uniform_distribution=True,
            max_bar_spacing=20.0,
            right_offset_pixels=50,
            time_scale_visible=False,
        )
        ts = c.chart_options["timeScale"]
        self.assertTrue(ts["ticksVisible"])
        self.assertFalse(ts["shiftVisibleRangeOnNewBar"])
        self.assertTrue(ts["lockVisibleTimeRangeOnResize"])
        self.assertTrue(ts["rightBarStaysOnScroll"])
        self.assertEqual(ts["minimumHeight"], 40)
        self.assertFalse(ts["allowBoldLabels"])
        self.assertEqual(ts["tickMarkMaxCharacterLength"], 12)
        self.assertTrue(ts["uniformDistribution"])
        self.assertEqual(ts["maxBarSpacing"], 20.0)
        self.assertEqual(ts["rightOffsetPixels"], 50)
        self.assertFalse(ts["visible"])

    def test_conflation_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            enable_conflation=True,
            conflation_threshold_factor=4.0,
            precompute_conflation_on_init=True,
        )
        ts = c.chart_options["timeScale"]
        self.assertTrue(ts["enableConflation"])
        self.assertEqual(ts["conflationThresholdFactor"], 4.0)
        self.assertTrue(ts["precomputeConflationOnInit"])

    def test_whitespace_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            ignore_whitespace_indices=True,
            allow_shift_visible_range_on_whitespace_replacement=True,
        )
        ts = c.chart_options["timeScale"]
        self.assertTrue(ts["ignoreWhitespaceIndices"])
        self.assertTrue(ts["allowShiftVisibleRangeOnWhitespaceReplacement"])

    def test_defaults_omit_new_options(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("timeScale", c.chart_options)


class TestPriceScaleNewOptions(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_right_price_scale_new_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            right_price_scale_ticks_visible=True,
            right_price_scale_align_labels=False,
            right_price_scale_text_color="#FF0000",
            right_price_scale_entire_text_only=True,
            right_price_scale_minimum_width=80,
            right_price_scale_ensure_edge_tick_marks_visible=True,
        )
        rps = c.chart_options["rightPriceScale"]
        self.assertTrue(rps["ticksVisible"])
        self.assertFalse(rps["alignLabels"])
        self.assertEqual(rps["textColor"], "#FF0000")
        self.assertTrue(rps["entireTextOnly"])
        self.assertEqual(rps["minimumWidth"], 80)
        self.assertTrue(rps["ensureEdgeTickMarksVisible"])

    def test_left_price_scale_new_options(self):
        s = line_series(self.table)
        c = chart(
            s,
            left_price_scale_ticks_visible=True,
            left_price_scale_minimum_width=60,
        )
        lps = c.chart_options["leftPriceScale"]
        self.assertTrue(lps["ticksVisible"])
        self.assertEqual(lps["minimumWidth"], 60)

    def test_overlay_price_scale_defaults(self):
        s = line_series(self.table)
        c = chart(
            s,
            overlay_price_scale_border_visible=False,
            overlay_price_scale_ticks_visible=True,
            overlay_price_scale_minimum_width=50,
            overlay_price_scale_margin_top=0.7,
            overlay_price_scale_margin_bottom=0.0,
        )
        ops = c.chart_options["overlayPriceScales"]
        self.assertFalse(ops["borderVisible"])
        self.assertTrue(ops["ticksVisible"])
        self.assertEqual(ops["minimumWidth"], 50)
        self.assertEqual(ops["scaleMargins"]["top"], 0.7)
        self.assertEqual(ops["scaleMargins"]["bottom"], 0.0)

    def test_overlay_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("overlayPriceScales", c.chart_options)


class TestChartType(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_default_chart_type(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertEqual(c.chart_type, "standard")

    def test_default_chart_type_in_to_dict(self):
        s = line_series(self.table)
        c = chart(s)
        result = c.to_dict({id(self.table): 0})
        self.assertEqual(result["chartType"], "standard")

    def test_yield_curve_chart_type(self):
        s = line_series(self.table, time="Months", value="Yield")
        c = chart(s, chart_type="yield_curve")
        self.assertEqual(c.chart_type, "yieldCurve")

    def test_yield_curve_in_to_dict(self):
        s = line_series(self.table)
        c = chart(s, chart_type="yield_curve")
        result = c.to_dict({id(self.table): 0})
        self.assertEqual(result["chartType"], "yieldCurve")

    def test_options_chart_type(self):
        s = line_series(self.table, time="Strike", value="Premium")
        c = chart(s, chart_type="options")
        self.assertEqual(c.chart_type, "options")

    def test_options_in_to_dict(self):
        s = line_series(self.table)
        c = chart(s, chart_type="options")
        result = c.to_dict({id(self.table): 0})
        self.assertEqual(result["chartType"], "options")

    def test_yield_curve_options_serialized(self):
        s = line_series(self.table)
        c = chart(
            s,
            chart_type="yield_curve",
            base_resolution=1,
            minimum_time_range=120,
            start_time_range=0,
        )
        self.assertIn("yieldCurve", c.chart_options)
        self.assertEqual(c.chart_options["yieldCurve"]["baseResolution"], 1)
        self.assertEqual(c.chart_options["yieldCurve"]["minimumTimeRange"], 120)
        self.assertEqual(c.chart_options["yieldCurve"]["startTimeRange"], 0)

    def test_yield_curve_options_omitted_when_not_set(self):
        s = line_series(self.table)
        c = chart(s, chart_type="yield_curve")
        self.assertNotIn("yieldCurve", c.chart_options)

    def test_yield_curve_rejects_candlestick(self):
        s = candlestick_series(self.table)
        with self.assertRaises(ValueError):
            chart(s, chart_type="yield_curve")

    def test_yield_curve_rejects_bar(self):
        s = bar_series(self.table)
        with self.assertRaises(ValueError):
            chart(s, chart_type="yield_curve")

    def test_yield_curve_rejects_histogram(self):
        s = histogram_series(self.table)
        with self.assertRaises(ValueError):
            chart(s, chart_type="yield_curve")

    def test_yield_curve_rejects_baseline(self):
        s = baseline_series(self.table)
        with self.assertRaises(ValueError):
            chart(s, chart_type="yield_curve")

    def test_yield_curve_allows_line(self):
        s = line_series(self.table)
        c = chart(s, chart_type="yield_curve")
        self.assertEqual(c.chart_type, "yieldCurve")

    def test_yield_curve_allows_area(self):
        s = area_series(self.table)
        c = chart(s, chart_type="yield_curve")
        self.assertEqual(c.chart_type, "yieldCurve")

    def test_options_allows_any_series_type(self):
        for fn in [
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ]:
            s = fn(self.table)
            c = chart(s, chart_type="options")
            self.assertEqual(c.chart_type, "options")


class TestYieldCurveConvenience(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        c = yield_curve(self.table)
        self.assertEqual(c.chart_type, "yieldCurve")
        self.assertEqual(len(c.series_list), 1)
        self.assertEqual(c.series_list[0].series_type, "Line")
        self.assertEqual(c.series_list[0].column_mapping["time"], "Maturity")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Yield")

    def test_area_series_type(self):
        c = yield_curve(self.table, series_type="area")
        self.assertEqual(c.series_list[0].series_type, "Area")

    def test_custom_columns(self):
        c = yield_curve(self.table, maturity="Months", value="Rate")
        self.assertEqual(c.series_list[0].column_mapping["time"], "Months")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Rate")

    def test_yield_curve_options_pass_through(self):
        c = yield_curve(self.table, base_resolution=1, minimum_time_range=240)
        self.assertEqual(c.chart_options["yieldCurve"]["baseResolution"], 1)
        self.assertEqual(c.chart_options["yieldCurve"]["minimumTimeRange"], 240)

    def test_styling_pass_through(self):
        c = yield_curve(self.table, color="#2962FF", line_width=2, title="Yield")
        opts = c.series_list[0].options
        self.assertEqual(opts["color"], "#2962FF")
        self.assertEqual(opts["lineWidth"], 2)
        self.assertEqual(opts["title"], "Yield")


class TestOptionsChartConvenience(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        c = options_chart(self.table)
        self.assertEqual(c.chart_type, "options")
        self.assertEqual(len(c.series_list), 1)
        self.assertEqual(c.series_list[0].series_type, "Line")
        self.assertEqual(c.series_list[0].column_mapping["time"], "Strike")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Value")

    def test_custom_columns(self):
        c = options_chart(self.table, strike="StrikePrice", value="Premium")
        self.assertEqual(c.series_list[0].column_mapping["time"], "StrikePrice")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Premium")

    def test_area_series_type(self):
        c = options_chart(self.table, series_type="area")
        self.assertEqual(c.series_list[0].series_type, "Area")

    def test_histogram_series_type(self):
        c = options_chart(self.table, series_type="histogram")
        self.assertEqual(c.series_list[0].series_type, "Histogram")


class TestLiveness(unittest.TestCase):
    """Tests for LivenessScope integration."""

    def test_liveness_scope_none_in_test_env(self):
        """Without a real DH server, LivenessScope is None so _liveness_scope is None."""
        table = MagicMock(name="table")
        s = line_series(table)
        c = TvlChart([s], {})
        # In test env, LivenessScope import fails → _liveness_scope is None
        self.assertIsNone(c._liveness_scope)

    def test_extra_refs_initialized(self):
        table = MagicMock(name="table")
        s = line_series(table)
        c = TvlChart([s], {})
        self.assertEqual(c._extra_refs, [])

    def test_partition_metadata_defaults(self):
        table = MagicMock(name="table")
        s = line_series(table)
        c = TvlChart([s], {})
        self.assertIsNone(c._partitioned_table)
        self.assertIsNone(c._by_column)
        self.assertIsNone(c._series_factory)
        self.assertIsNone(c._series_kwargs)

    def test_del_no_error_when_scope_none(self):
        table = MagicMock(name="table")
        s = line_series(table)
        c = TvlChart([s], {})
        # Should not raise even though _liveness_scope is None
        del c


class TestByParameter(unittest.TestCase):
    """Tests for the by parameter on line() and area()."""

    def _make_mock_partition(self, keys, rows_per_key=5):
        """Create a mock PartitionedTable with constituent tables."""
        constituents = []
        for key in keys:
            mock_table = MagicMock(name=f"table_{key}")
            mock_table.size = rows_per_key
            # Mock j_table.getColumnSource(col).get(0) → key string
            key_source = MagicMock()
            key_source.get = MagicMock(return_value=key)
            mock_table.j_table.getColumnSource = MagicMock(return_value=key_source)
            constituents.append(mock_table)

        partitioned = MagicMock(name="partitioned_table")
        partitioned.constituent_tables = constituents

        meta_table = MagicMock()
        meta_table.is_refreshing = False
        partitioned.table = meta_table

        return partitioned, constituents

    def test_partition_spec_in_to_dict(self):
        """When by is used, to_dict should include partitionSpec."""
        from deephaven.plot.tradingview_lightweight.chart import TvlChart
        from deephaven.plot.tradingview_lightweight import series as sm

        c = TvlChart([], {})
        c._partitioned_table = MagicMock(name="pt")
        c._by_column = "Sym"
        c._series_factory = sm.line_series
        c._series_kwargs = {"time": "Timestamp", "value": "Price"}

        d = c.to_dict({})
        self.assertIn("partitionSpec", d)
        self.assertEqual(d["partitionSpec"]["byColumn"], "Sym")
        self.assertEqual(d["partitionSpec"]["seriesType"], "Line")
        self.assertEqual(d["partitionSpec"]["columns"]["time"], "Timestamp")
        self.assertEqual(d["partitionSpec"]["columns"]["value"], "Price")
        # No initial series — JS discovers keys
        self.assertEqual(len(d["series"]), 0)

    def test_line_without_by_unchanged(self):
        """line() without by should produce a single series as before."""
        table = MagicMock(name="table")
        c = line(table, time="T", value="V", color="red")
        self.assertEqual(len(c.series_list), 1)
        self.assertEqual(c.series_list[0].options.get("color"), "red")
        self.assertIsNone(c._partitioned_table)

    def test_area_without_by_unchanged(self):
        table = MagicMock(name="table")
        c = area(table, time="T", value="V", line_color="blue")
        self.assertEqual(len(c.series_list), 1)
        self.assertIsNone(c._partitioned_table)


if __name__ == "__main__":
    unittest.main()
