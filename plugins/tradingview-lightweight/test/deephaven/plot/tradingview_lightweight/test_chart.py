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
    custom_numeric,
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
        """chart() with no kwargs should only have the default font in layout."""
        s = line_series(self.table)
        c = chart(s)
        self.assertEqual(
            c.chart_options,
            {"layout": {"fontFamily": "Fira, sans-serif"}},
        )

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

    def test_crosshair_mode_hidden(self):
        """CrosshairMode 'hidden' serializes to integer 2."""
        s = line_series(self.table)
        c = chart(s, crosshair_mode="hidden")
        self.assertEqual(c.chart_options["crosshair"]["mode"], 2)

    def test_crosshair_mode_magnet_ohlc(self):
        """CrosshairMode 'magnet_ohlc' serializes to integer 3."""
        s = line_series(self.table)
        c = chart(s, crosshair_mode="magnet_ohlc")
        self.assertEqual(c.chart_options["crosshair"]["mode"], 3)

    def test_crosshair_mode_all_four_values(self):
        """All four CrosshairMode members map to the correct integers."""
        expected = {"normal": 0, "magnet": 1, "hidden": 2, "magnet_ohlc": 3}
        s = line_series(self.table)
        for mode_name, mode_int in expected.items():
            c = chart(s, crosshair_mode=mode_name)
            self.assertEqual(
                c.chart_options["crosshair"]["mode"],
                mode_int,
                f"crosshair_mode='{mode_name}' should map to {mode_int}",
            )

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

    def test_crosshair_vert_line_visible_true(self):
        s = line_series(self.table)
        c = chart(s, crosshair_vert_line_visible=True)
        self.assertTrue(c.chart_options["crosshair"]["vertLine"]["visible"])

    def test_crosshair_vert_line_visible_false(self):
        """visible=False must be serialized (not filtered out by _filter_none)."""
        s = line_series(self.table)
        c = chart(s, crosshair_vert_line_visible=False)
        self.assertFalse(c.chart_options["crosshair"]["vertLine"]["visible"])

    def test_crosshair_vert_line_label_visible_true(self):
        s = line_series(self.table)
        c = chart(s, crosshair_vert_line_label_visible=True)
        self.assertTrue(c.chart_options["crosshair"]["vertLine"]["labelVisible"])

    def test_crosshair_vert_line_label_visible_false(self):
        s = line_series(self.table)
        c = chart(s, crosshair_vert_line_label_visible=False)
        self.assertFalse(c.chart_options["crosshair"]["vertLine"]["labelVisible"])

    def test_crosshair_horz_line_visible_true(self):
        s = line_series(self.table)
        c = chart(s, crosshair_horz_line_visible=True)
        self.assertTrue(c.chart_options["crosshair"]["horzLine"]["visible"])

    def test_crosshair_horz_line_visible_false(self):
        s = line_series(self.table)
        c = chart(s, crosshair_horz_line_visible=False)
        self.assertFalse(c.chart_options["crosshair"]["horzLine"]["visible"])

    def test_crosshair_horz_line_label_visible_true(self):
        s = line_series(self.table)
        c = chart(s, crosshair_horz_line_label_visible=True)
        self.assertTrue(c.chart_options["crosshair"]["horzLine"]["labelVisible"])

    def test_crosshair_horz_line_label_visible_false(self):
        s = line_series(self.table)
        c = chart(s, crosshair_horz_line_label_visible=False)
        self.assertFalse(c.chart_options["crosshair"]["horzLine"]["labelVisible"])

    def test_crosshair_do_not_snap_to_hidden_series_true(self):
        s = line_series(self.table)
        c = chart(s, crosshair_do_not_snap_to_hidden_series=True)
        self.assertTrue(c.chart_options["crosshair"]["doNotSnapToHiddenSeriesIndices"])

    def test_crosshair_do_not_snap_to_hidden_series_false(self):
        s = line_series(self.table)
        c = chart(s, crosshair_do_not_snap_to_hidden_series=False)
        self.assertFalse(c.chart_options["crosshair"]["doNotSnapToHiddenSeriesIndices"])

    def test_crosshair_all_new_options(self):
        """All five new crosshair params round-trip correctly together."""
        s = line_series(self.table)
        c = chart(
            s,
            crosshair_mode="hidden",
            crosshair_vert_line_visible=False,
            crosshair_vert_line_label_visible=False,
            crosshair_horz_line_visible=True,
            crosshair_horz_line_label_visible=False,
            crosshair_do_not_snap_to_hidden_series=True,
        )
        ch = c.chart_options["crosshair"]
        self.assertEqual(ch["mode"], 2)
        self.assertFalse(ch["vertLine"]["visible"])
        self.assertFalse(ch["vertLine"]["labelVisible"])
        self.assertTrue(ch["horzLine"]["visible"])
        self.assertFalse(ch["horzLine"]["labelVisible"])
        self.assertTrue(ch["doNotSnapToHiddenSeriesIndices"])

    def test_crosshair_vert_line_visible_not_set_by_default(self):
        """visible key must not appear when param is not provided."""
        s = line_series(self.table)
        c = chart(s, crosshair_vert_line_color="#fff")  # trigger vertLine dict
        self.assertNotIn("visible", c.chart_options["crosshair"]["vertLine"])

    def test_crosshair_vert_line_label_visible_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s, crosshair_vert_line_color="#fff")
        self.assertNotIn("labelVisible", c.chart_options["crosshair"]["vertLine"])

    def test_crosshair_horz_line_visible_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s, crosshair_horz_line_color="#fff")
        self.assertNotIn("visible", c.chart_options["crosshair"]["horzLine"])

    def test_crosshair_horz_line_label_visible_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s, crosshair_horz_line_color="#fff")
        self.assertNotIn("labelVisible", c.chart_options["crosshair"]["horzLine"])

    def test_crosshair_do_not_snap_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s, crosshair_mode="normal")
        self.assertNotIn("doNotSnapToHiddenSeriesIndices", c.chart_options["crosshair"])

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

    # --- Localization: locale ---

    def test_locale_string(self):
        """locale is passed through as-is into localization.locale."""
        s = line_series(self.table)
        c = chart(s, locale="de-DE")
        loc = c.chart_options["localization"]
        self.assertEqual(loc["locale"], "de-DE")

    def test_locale_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("localization", c.chart_options)

    def test_locale_various_tags(self):
        """Spot-check that any BCP-47 tag is accepted (no validation)."""
        for tag in ["en-US", "ja-JP", "zh-CN", "fr-FR", "ar-SA"]:
            s = line_series(self.table)
            c = chart(s, locale=tag)
            self.assertEqual(c.chart_options["localization"]["locale"], tag)

    # --- Localization: tickmarks_price_formatter ---

    def test_tickmarks_price_formatter(self):
        s = line_series(self.table)
        c = chart(s, tickmarks_price_formatter="currency_usd")
        loc = c.chart_options["localization"]
        self.assertEqual(loc["tickmarksPriceFormatterName"], "currency_usd")

    def test_tickmarks_price_formatter_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("localization", c.chart_options)

    def test_all_tickmarks_price_formatter_presets(self):
        presets = [
            "currency_usd",
            "currency_eur",
            "currency_gbp",
            "currency_jpy",
            "percent",
            "compact",
            "scientific",
        ]
        s = line_series(self.table)
        for preset in presets:
            c = chart(s, tickmarks_price_formatter=preset)
            self.assertEqual(
                c.chart_options["localization"]["tickmarksPriceFormatterName"],
                preset,
            )

    # --- Localization: percentage_formatter ---

    def test_percentage_formatter(self):
        s = line_series(self.table)
        c = chart(s, percentage_formatter="percent")
        loc = c.chart_options["localization"]
        self.assertEqual(loc["percentageFormatterName"], "percent")

    def test_all_percentage_formatter_presets(self):
        presets = ["percent", "percent_1dp", "percent_0dp", "decimal"]
        s = line_series(self.table)
        for preset in presets:
            c = chart(s, percentage_formatter=preset)
            self.assertEqual(
                c.chart_options["localization"]["percentageFormatterName"],
                preset,
            )

    # --- Localization: tickmarks_percentage_formatter ---

    def test_tickmarks_percentage_formatter(self):
        s = line_series(self.table)
        c = chart(s, tickmarks_percentage_formatter="percent_1dp")
        loc = c.chart_options["localization"]
        self.assertEqual(loc["tickmarksPercentageFormatterName"], "percent_1dp")

    # --- Localization: combined options ---

    def test_locale_with_price_formatter(self):
        """locale and price_formatter can coexist in the same localization dict."""
        s = line_series(self.table)
        c = chart(s, locale="en-GB", price_formatter="currency_gbp")
        loc = c.chart_options["localization"]
        self.assertEqual(loc["locale"], "en-GB")
        self.assertEqual(loc["priceFormatterName"], "currency_gbp")

    def test_all_localization_options_combined(self):
        """All five localization options together produce a single dict."""
        s = line_series(self.table)
        c = chart(
            s,
            locale="de-DE",
            price_formatter="currency_eur",
            tickmarks_price_formatter="compact",
            percentage_formatter="percent_1dp",
            tickmarks_percentage_formatter="percent_0dp",
        )
        loc = c.chart_options["localization"]
        self.assertEqual(loc["locale"], "de-DE")
        self.assertEqual(loc["priceFormatterName"], "currency_eur")
        self.assertEqual(loc["tickmarksPriceFormatterName"], "compact")
        self.assertEqual(loc["percentageFormatterName"], "percent_1dp")
        self.assertEqual(loc["tickmarksPercentageFormatterName"], "percent_0dp")

    def test_localization_absent_when_nothing_set(self):
        """localization key must not appear when no localization param is given."""
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("localization", c.chart_options)

    def test_none_options_not_in_output(self):
        """Sections with all-None values should not appear in chart_options."""
        s = line_series(self.table)
        c = chart(s)  # all defaults are None
        # layout is always present because fontFamily defaults to "Fira, sans-serif"
        self.assertIn("layout", c.chart_options)
        self.assertEqual(c.chart_options["layout"]["fontFamily"], "Fira, sans-serif")
        self.assertNotIn("grid", c.chart_options)
        self.assertNotIn("crosshair", c.chart_options)
        self.assertNotIn("rightPriceScale", c.chart_options)
        self.assertNotIn("leftPriceScale", c.chart_options)
        self.assertNotIn("timeScale", c.chart_options)
        self.assertNotIn("watermark", c.chart_options)
        self.assertNotIn("autoSize", c.chart_options)
        self.assertNotIn("trackingMode", c.chart_options)
        self.assertNotIn("addDefaultPane", c.chart_options)

    # --- auto_size tests ---

    def test_auto_size_true(self):
        """auto_size=True should set autoSize in chart_options."""
        s = line_series(self.table)
        c = chart(s, auto_size=True)
        self.assertTrue(c.chart_options["autoSize"])

    def test_auto_size_false(self):
        """auto_size=False should set autoSize to False in chart_options."""
        s = line_series(self.table)
        c = chart(s, auto_size=False)
        self.assertFalse(c.chart_options["autoSize"])

    def test_auto_size_not_set_by_default(self):
        """auto_size omitted should not include autoSize in chart_options.
        The JS renderer provides its own default (true) in that case.
        """
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("autoSize", c.chart_options)

    def test_auto_size_false_with_explicit_dimensions(self):
        """auto_size=False combined with width/height is the intended use."""
        s = line_series(self.table)
        c = chart(s, auto_size=False, width=1200, height=600)
        self.assertFalse(c.chart_options["autoSize"])
        self.assertEqual(c.chart_options["width"], 1200)
        self.assertEqual(c.chart_options["height"], 600)

    # --- tracking_mode_exit_mode tests ---

    def test_tracking_mode_on_next_tap(self):
        """tracking_mode_exit_mode='on_next_tap' should emit exitMode=1."""
        s = line_series(self.table)
        c = chart(s, tracking_mode_exit_mode="on_next_tap")
        tm = c.chart_options["trackingMode"]
        self.assertEqual(tm["exitMode"], 1)

    def test_tracking_mode_on_touch_end(self):
        """tracking_mode_exit_mode='on_touch_end' should emit exitMode=0."""
        s = line_series(self.table)
        c = chart(s, tracking_mode_exit_mode="on_touch_end")
        tm = c.chart_options["trackingMode"]
        self.assertEqual(tm["exitMode"], 0)

    def test_tracking_mode_not_set_by_default(self):
        """trackingMode should not appear in chart_options when not specified."""
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("trackingMode", c.chart_options)

    def test_tracking_mode_all_values(self):
        """Enumerate all TrackingModeExitMode values to verify correct mapping."""
        s = line_series(self.table)
        expected = {"on_touch_end": 0, "on_next_tap": 1}
        for mode_name, mode_value in expected.items():
            c = chart(s, tracking_mode_exit_mode=mode_name)
            self.assertEqual(
                c.chart_options["trackingMode"]["exitMode"],
                mode_value,
                f"tracking_mode_exit_mode={mode_name!r} should map to {mode_value}",
            )

    # --- add_default_pane tests ---

    def test_add_default_pane_true(self):
        """add_default_pane=True should set addDefaultPane to True."""
        s = line_series(self.table)
        c = chart(s, add_default_pane=True)
        self.assertTrue(c.chart_options["addDefaultPane"])

    def test_add_default_pane_false(self):
        """add_default_pane=False suppresses the automatic initial pane."""
        s = line_series(self.table)
        c = chart(s, add_default_pane=False)
        self.assertFalse(c.chart_options["addDefaultPane"])

    def test_add_default_pane_not_set_by_default(self):
        """addDefaultPane should not appear in chart_options when not specified."""
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("addDefaultPane", c.chart_options)

    def test_partial_grid_only_vert(self):
        """Setting only vertical grid lines should not create horzLines."""
        s = line_series(self.table)
        c = chart(s, vert_lines_visible=True)
        grid = c.chart_options["grid"]
        self.assertIn("vertLines", grid)
        self.assertNotIn("horzLines", grid)

    def test_precompute_conflation_priority(self):
        """precompute_conflation_priority should pass through as a string."""
        s = line_series(self.table)
        c = chart(s, precompute_conflation_priority="background")
        self.assertEqual(
            c.chart_options["timeScale"]["precomputeConflationPriority"], "background"
        )

    def test_precompute_conflation_priority_user_visible(self):
        s = line_series(self.table)
        c = chart(s, precompute_conflation_priority="user-visible")
        self.assertEqual(
            c.chart_options["timeScale"]["precomputeConflationPriority"], "user-visible"
        )

    def test_precompute_conflation_priority_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        # timeScale should either be absent or not contain the key
        ts = c.chart_options.get("timeScale", {})
        self.assertNotIn("precomputeConflationPriority", ts)


class TestLayoutOptions(unittest.TestCase):
    """Tests for layout options: gradient background, attribution_logo, color_space."""

    def setUp(self):
        self.table = MagicMock(name="table")

    # --- Gradient background tests ---

    def test_gradient_background(self):
        """Both gradient params should produce a gradient background object."""
        s = line_series(self.table)
        c = chart(s, background_top_color="#ff0000", background_bottom_color="#0000ff")
        layout = c.chart_options["layout"]
        self.assertEqual(
            layout["background"],
            {"type": "gradient", "topColor": "#ff0000", "bottomColor": "#0000ff"},
        )

    def test_gradient_background_does_not_include_solid_key(self):
        """Gradient background must not contain 'color' key."""
        s = line_series(self.table)
        c = chart(s, background_top_color="#aaa", background_bottom_color="#bbb")
        bg = c.chart_options["layout"]["background"]
        self.assertNotIn("color", bg)
        self.assertEqual(bg["type"], "gradient")

    def test_solid_background_still_works(self):
        """Existing background_color usage must remain unchanged."""
        s = line_series(self.table)
        c = chart(s, background_color="#1a1a2e")
        self.assertEqual(
            c.chart_options["layout"]["background"],
            {"type": "solid", "color": "#1a1a2e"},
        )

    def test_gradient_and_solid_conflict_raises(self):
        """Providing both background_color and gradient params must raise ValueError."""
        s = line_series(self.table)
        with self.assertRaises(ValueError) as ctx:
            chart(
                s,
                background_color="#000",
                background_top_color="#111",
                background_bottom_color="#222",
            )
        self.assertIn("background_color", str(ctx.exception))

    def test_gradient_and_solid_conflict_with_only_top(self):
        """background_color + background_top_color alone must raise ValueError."""
        s = line_series(self.table)
        with self.assertRaises(ValueError):
            chart(s, background_color="#000", background_top_color="#111")

    def test_gradient_missing_bottom_raises(self):
        """Providing only background_top_color without background_bottom_color raises."""
        s = line_series(self.table)
        with self.assertRaises(ValueError) as ctx:
            chart(s, background_top_color="#ff0000")
        self.assertIn("background_bottom_color", str(ctx.exception))

    def test_gradient_missing_top_raises(self):
        """Providing only background_bottom_color without background_top_color raises."""
        s = line_series(self.table)
        with self.assertRaises(ValueError) as ctx:
            chart(s, background_bottom_color="#0000ff")
        self.assertIn("background_top_color", str(ctx.exception))

    def test_gradient_with_other_layout_options(self):
        """Gradient background can coexist with font_size and text_color."""
        s = line_series(self.table)
        c = chart(
            s,
            background_top_color="#000",
            background_bottom_color="#333",
            text_color="#fff",
            font_size=13,
        )
        layout = c.chart_options["layout"]
        self.assertEqual(layout["background"]["type"], "gradient")
        self.assertEqual(layout["textColor"], "#fff")
        self.assertEqual(layout["fontSize"], 13)

    def test_no_background_params_omits_background_key(self):
        """When no background param is set, layout must not contain 'background' key."""
        s = line_series(self.table)
        c = chart(s, text_color="#eee")
        layout = c.chart_options["layout"]
        self.assertNotIn("background", layout)

    # --- attribution_logo tests ---

    def test_attribution_logo_false(self):
        """attribution_logo=False should set attributionLogo: false in layout."""
        s = line_series(self.table)
        c = chart(s, attribution_logo=False)
        layout = c.chart_options["layout"]
        self.assertFalse(layout["attributionLogo"])

    def test_attribution_logo_true(self):
        """attribution_logo=True should set attributionLogo: true in layout."""
        s = line_series(self.table)
        c = chart(s, attribution_logo=True)
        layout = c.chart_options["layout"]
        self.assertTrue(layout["attributionLogo"])

    def test_attribution_logo_not_set_by_default(self):
        """attributionLogo must not appear in layout unless explicitly set."""
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("attributionLogo", c.chart_options.get("layout", {}))

    def test_attribution_logo_false_creates_layout_section(self):
        """attribution_logo alone should produce a layout section."""
        s = line_series(self.table)
        c = chart(s, attribution_logo=False)
        self.assertIn("layout", c.chart_options)
        self.assertFalse(c.chart_options["layout"]["attributionLogo"])

    # --- color_space tests ---

    def test_color_space_srgb(self):
        """color_space='srgb' should appear as 'colorSpace' in layout."""
        s = line_series(self.table)
        c = chart(s, color_space="srgb")
        self.assertEqual(c.chart_options["layout"]["colorSpace"], "srgb")

    def test_color_space_display_p3(self):
        """color_space='display-p3' should appear verbatim in layout."""
        s = line_series(self.table)
        c = chart(s, color_space="display-p3")
        self.assertEqual(c.chart_options["layout"]["colorSpace"], "display-p3")

    def test_color_space_not_set_by_default(self):
        """colorSpace must not appear in layout unless explicitly set."""
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("colorSpace", c.chart_options.get("layout", {}))

    # --- Backwards compatibility tests ---

    def test_backwards_compat_background_color_solid(self):
        """Original background_color usage must produce identical output to before."""
        s = line_series(self.table)
        c = chart(s, background_color="#1a1a2e", text_color="#e0e0e0", font_size=14)
        layout = c.chart_options["layout"]
        self.assertEqual(layout["background"], {"type": "solid", "color": "#1a1a2e"})
        self.assertEqual(layout["textColor"], "#e0e0e0")
        self.assertEqual(layout["fontSize"], 14)
        # No gradient keys should appear
        self.assertNotIn("topColor", layout["background"])
        self.assertNotIn("bottomColor", layout["background"])

    def test_all_new_layout_params_omitted_does_not_break_existing(self):
        """chart() with no new layout params should only have the default font."""
        s = line_series(self.table)
        c = chart(s)
        self.assertEqual(
            c.chart_options,
            {"layout": {"fontFamily": "Fira, sans-serif"}},
        )

    def test_chart_with_gradient_and_candlestick_series(self):
        """Gradient background works with candlestick series via chart()."""
        s = candlestick_series(self.table)
        c = chart(
            s,
            background_top_color="#111",
            background_bottom_color="#333",
        )
        layout = c.chart_options["layout"]
        self.assertEqual(layout["background"]["type"], "gradient")

    def test_all_layout_options_combined(self):
        """All new layout options can be used together."""
        s = line_series(self.table)
        c = chart(
            s,
            background_top_color="#000",
            background_bottom_color="#333",
            text_color="#fff",
            font_size=14,
            attribution_logo=False,
            color_space="display-p3",
        )
        layout = c.chart_options["layout"]
        self.assertEqual(layout["background"]["type"], "gradient")
        self.assertEqual(layout["background"]["topColor"], "#000")
        self.assertEqual(layout["background"]["bottomColor"], "#333")
        self.assertEqual(layout["textColor"], "#fff")
        self.assertEqual(layout["fontSize"], 14)
        self.assertEqual(layout["fontFamily"], "Fira, sans-serif")
        self.assertFalse(layout["attributionLogo"])
        self.assertEqual(layout["colorSpace"], "display-p3")


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
        self.assertNotIn("panes", c.chart_options.get("layout", {}))

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

    def test_existing_stretch_factors_unaffected(self):
        """Adding pane_preserve_empty must not change paneStretchFactors behavior."""
        s1 = candlestick_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(s1, s2, pane_stretch_factors=[3.0, 1.0])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["paneStretchFactors"], [3.0, 1.0])
        self.assertNotIn("panePreserveEmpty", result)


class TestPanePreserveEmpty(unittest.TestCase):
    """Tests for pane_preserve_empty on chart()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_preserve_empty_serialization(self):
        """pane_preserve_empty list should appear as top-level panePreserveEmpty."""
        s1 = candlestick_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(s1, s2, pane_preserve_empty=[True, False])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["panePreserveEmpty"], [True, False])

    def test_preserve_empty_not_set_by_default(self):
        """panePreserveEmpty must be absent from output when not specified."""
        s = line_series(self.table)
        c = chart(s)
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertNotIn("panePreserveEmpty", result)

    def test_preserve_empty_top_level(self):
        """panePreserveEmpty must be top-level, not nested inside chartOptions."""
        s = line_series(self.table)
        c = chart(s, pane_preserve_empty=[True])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertNotIn("panePreserveEmpty", result.get("chartOptions", {}))
        self.assertIn("panePreserveEmpty", result)

    def test_preserve_empty_single_pane(self):
        """Single-element list with True."""
        s = line_series(self.table, pane=0)
        c = chart(s, pane_preserve_empty=[True])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["panePreserveEmpty"], [True])

    def test_preserve_empty_all_false(self):
        """All False is a valid explicit list."""
        s1 = line_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(s1, s2, pane_preserve_empty=[False, False])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["panePreserveEmpty"], [False, False])

    def test_preserve_empty_property_access(self):
        """pane_preserve_empty should be accessible via property."""
        s = line_series(self.table)
        c = chart(s, pane_preserve_empty=[True, False])
        self.assertEqual(c.pane_preserve_empty, [True, False])

    def test_preserve_empty_none_property(self):
        """pane_preserve_empty property returns None when not set."""
        s = line_series(self.table)
        c = chart(s)
        self.assertIsNone(c.pane_preserve_empty)

    def test_preserve_empty_with_stretch_factors(self):
        """pane_preserve_empty and pane_stretch_factors coexist as separate top-level keys."""
        s1 = candlestick_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(
            s1, s2, pane_stretch_factors=[3.0, 1.0], pane_preserve_empty=[True, False]
        )
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["paneStretchFactors"], [3.0, 1.0])
        self.assertEqual(result["panePreserveEmpty"], [True, False])

    def test_preserve_empty_more_entries_than_panes(self):
        """Extra entries beyond pane count are valid (JS renderer ignores them)."""
        s = line_series(self.table, pane=0)
        c = chart(s, pane_preserve_empty=[True, True, True])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        # Serialized as-is; JS renderer bounds-checks against actual pane count
        self.assertEqual(result["panePreserveEmpty"], [True, True, True])

    def test_preserve_empty_tvl_chart_direct(self):
        """TvlChart constructor should accept and store pane_preserve_empty."""
        s = line_series(self.table)
        c = TvlChart(
            series_list=[s],
            chart_options={},
            pane_preserve_empty=[False, True],
        )
        self.assertEqual(c.pane_preserve_empty, [False, True])


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

    # --- Right price scale scaleMargins tests ---

    def test_right_price_scale_margins(self):
        """scaleMargins nested dict is built for right price scale."""
        s = line_series(self.table)
        c = chart(
            s,
            right_price_scale_margin_top=0.2,
            right_price_scale_margin_bottom=0.1,
        )
        rps = c.chart_options["rightPriceScale"]
        self.assertIn("scaleMargins", rps)
        self.assertEqual(rps["scaleMargins"]["top"], 0.2)
        self.assertEqual(rps["scaleMargins"]["bottom"], 0.1)

    def test_right_price_scale_margin_top_only(self):
        """Providing only top margin still creates scaleMargins with only top key."""
        s = line_series(self.table)
        c = chart(s, right_price_scale_margin_top=0.3)
        rps = c.chart_options["rightPriceScale"]
        self.assertEqual(rps["scaleMargins"]["top"], 0.3)
        self.assertNotIn("bottom", rps["scaleMargins"])

    def test_right_price_scale_margin_with_other_props(self):
        """scaleMargins coexists correctly with other right price scale properties."""
        s = line_series(self.table)
        c = chart(
            s,
            right_price_scale_visible=True,
            right_price_scale_margin_top=0.15,
            right_price_scale_margin_bottom=0.05,
        )
        rps = c.chart_options["rightPriceScale"]
        self.assertTrue(rps["visible"])
        self.assertEqual(rps["scaleMargins"], {"top": 0.15, "bottom": 0.05})

    def test_right_price_scale_margins_not_set_by_default(self):
        """No scaleMargins key in rightPriceScale when margin params are None."""
        s = line_series(self.table)
        c = chart(s, right_price_scale_visible=True)
        rps = c.chart_options["rightPriceScale"]
        self.assertNotIn("scaleMargins", rps)

    # --- Left price scale scaleMargins tests ---

    def test_left_price_scale_margins(self):
        """scaleMargins nested dict is built for left price scale."""
        s = line_series(self.table)
        c = chart(
            s,
            left_price_scale_margin_top=0.1,
            left_price_scale_margin_bottom=0.2,
        )
        lps = c.chart_options["leftPriceScale"]
        self.assertIn("scaleMargins", lps)
        self.assertEqual(lps["scaleMargins"]["top"], 0.1)
        self.assertEqual(lps["scaleMargins"]["bottom"], 0.2)

    def test_left_price_scale_margin_bottom_only(self):
        """Providing only bottom margin produces scaleMargins with only bottom key."""
        s = line_series(self.table)
        c = chart(s, left_price_scale_margin_bottom=0.05)
        lps = c.chart_options["leftPriceScale"]
        self.assertNotIn("top", lps["scaleMargins"])
        self.assertEqual(lps["scaleMargins"]["bottom"], 0.05)

    # --- Overlay price scale: 8 new properties ---

    def test_overlay_price_scale_auto_scale(self):
        s = line_series(self.table)
        c = chart(s, overlay_price_scale_auto_scale=True)
        self.assertTrue(c.chart_options["overlayPriceScales"]["autoScale"])

    def test_overlay_price_scale_mode(self):
        """overlay_price_scale_mode is serialized via PRICE_SCALE_MODE_MAP."""
        s = line_series(self.table)
        modes = {
            "normal": 0,
            "logarithmic": 1,
            "percentage": 2,
            "indexed_to_100": 3,
        }
        for mode_name, expected in modes.items():
            c = chart(s, overlay_price_scale_mode=mode_name)
            self.assertEqual(
                c.chart_options["overlayPriceScales"]["mode"],
                expected,
                f"Mode '{mode_name}' should map to {expected}",
            )

    def test_overlay_price_scale_invert_scale(self):
        s = line_series(self.table)
        c = chart(s, overlay_price_scale_invert_scale=True)
        self.assertTrue(c.chart_options["overlayPriceScales"]["invertScale"])

    def test_overlay_price_scale_align_labels(self):
        s = line_series(self.table)
        c = chart(s, overlay_price_scale_align_labels=False)
        self.assertFalse(c.chart_options["overlayPriceScales"]["alignLabels"])

    def test_overlay_price_scale_border_color(self):
        s = line_series(self.table)
        c = chart(s, overlay_price_scale_border_color="#aabbcc")
        self.assertEqual(
            c.chart_options["overlayPriceScales"]["borderColor"], "#aabbcc"
        )

    def test_overlay_price_scale_text_color(self):
        s = line_series(self.table)
        c = chart(s, overlay_price_scale_text_color="#ffffff")
        self.assertEqual(c.chart_options["overlayPriceScales"]["textColor"], "#ffffff")

    def test_overlay_price_scale_entire_text_only(self):
        s = line_series(self.table)
        c = chart(s, overlay_price_scale_entire_text_only=True)
        self.assertTrue(c.chart_options["overlayPriceScales"]["entireTextOnly"])

    def test_overlay_price_scale_ensure_edge_tick_marks_visible(self):
        s = line_series(self.table)
        c = chart(s, overlay_price_scale_ensure_edge_tick_marks_visible=True)
        self.assertTrue(
            c.chart_options["overlayPriceScales"]["ensureEdgeTickMarksVisible"]
        )

    def test_overlay_price_scale_all_new_props(self):
        """All 8 new overlay props serialize correctly and coexist with the 4 existing ones."""
        s = line_series(self.table)
        c = chart(
            s,
            # existing props
            overlay_price_scale_border_visible=True,
            overlay_price_scale_ticks_visible=False,
            overlay_price_scale_minimum_width=50,
            overlay_price_scale_margin_top=0.1,
            overlay_price_scale_margin_bottom=0.05,
            # new props
            overlay_price_scale_auto_scale=False,
            overlay_price_scale_mode="percentage",
            overlay_price_scale_invert_scale=True,
            overlay_price_scale_align_labels=False,
            overlay_price_scale_border_color="#111111",
            overlay_price_scale_text_color="#eeeeee",
            overlay_price_scale_entire_text_only=True,
            overlay_price_scale_ensure_edge_tick_marks_visible=True,
        )
        ops = c.chart_options["overlayPriceScales"]
        # existing
        self.assertTrue(ops["borderVisible"])
        self.assertFalse(ops["ticksVisible"])
        self.assertEqual(ops["minimumWidth"], 50)
        self.assertEqual(ops["scaleMargins"], {"top": 0.1, "bottom": 0.05})
        # new
        self.assertFalse(ops["autoScale"])
        self.assertEqual(ops["mode"], 2)  # "percentage" -> 2
        self.assertTrue(ops["invertScale"])
        self.assertFalse(ops["alignLabels"])
        self.assertEqual(ops["borderColor"], "#111111")
        self.assertEqual(ops["textColor"], "#eeeeee")
        self.assertTrue(ops["entireTextOnly"])
        self.assertTrue(ops["ensureEdgeTickMarksVisible"])

    def test_overlay_price_scale_not_set_by_default(self):
        """overlayPriceScales key absent when no overlay params provided."""
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

    def test_unknown_chart_type_raises(self):
        """Unrecognised chart_type should raise ValueError, not silently use 'standard'."""
        s = line_series(self.table)
        with self.assertRaises(ValueError) as ctx:
            chart(s, chart_type="unknown_type")
        self.assertIn("unknown_type", str(ctx.exception))
        self.assertIn("createChartEx", str(ctx.exception))

    def test_typo_chart_type_raises(self):
        """Typos like 'yield-curve' or 'yieldcurve' should raise, not silently fall through."""
        s = line_series(self.table)
        with self.assertRaises(ValueError):
            chart(s, chart_type="yieldcurve")  # missing underscore
        with self.assertRaises(ValueError):
            chart(s, chart_type="yield-curve")  # hyphen instead of underscore

    def test_custom_numeric_chart_type(self):
        """'custom_numeric' should be accepted and map to 'options' in the wire format."""
        s = line_series(self.table, time="X", value="Y")
        c = chart(s, chart_type="custom_numeric")
        # The Python-side chart_type stores the resolved JS value
        self.assertEqual(c.chart_type, "options")

    def test_custom_numeric_in_to_dict(self):
        """JSON payload should emit 'options' for custom_numeric."""
        s = line_series(self.table)
        c = chart(s, chart_type="custom_numeric")
        result = c.to_dict({id(self.table): 0})
        self.assertEqual(result["chartType"], "options")

    def test_none_chart_type_defaults_to_standard(self):
        """chart_type=None should default to 'standard' without raising."""
        s = line_series(self.table)
        c = chart(s, chart_type=None)
        self.assertEqual(c.chart_type, "standard")


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


class TestCustomNumericConvenience(unittest.TestCase):
    """Tests for the custom_numeric() convenience function."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_defaults(self):
        """Default call: line series, x='X', value='Value', chartType='options'."""
        c = custom_numeric(self.table)
        self.assertIsInstance(c, TvlChart)
        self.assertEqual(len(c.series_list), 1)
        self.assertEqual(c.series_list[0].series_type, "Line")
        self.assertEqual(c.series_list[0].column_mapping["time"], "X")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Value")
        self.assertEqual(c.chart_type, "options")  # wire value

    def test_custom_columns(self):
        c = custom_numeric(self.table, x="Frequency", value="Amplitude")
        self.assertEqual(c.series_list[0].column_mapping["time"], "Frequency")
        self.assertEqual(c.series_list[0].column_mapping["value"], "Amplitude")

    def test_area_series_type(self):
        c = custom_numeric(self.table, series_type="area")
        self.assertEqual(c.series_list[0].series_type, "Area")

    def test_histogram_series_type(self):
        c = custom_numeric(self.table, series_type="histogram")
        self.assertEqual(c.series_list[0].series_type, "Histogram")

    def test_line_styling(self):
        c = custom_numeric(self.table, color="#2962FF", line_width=2, title="IV Smile")
        opts = c.series_list[0].options
        self.assertEqual(opts["color"], "#2962FF")
        self.assertEqual(opts["lineWidth"], 2)
        self.assertEqual(opts["title"], "IV Smile")

    def test_area_styling_passthrough(self):
        c = custom_numeric(
            self.table,
            series_type="area",
            line_color="#00f",
            top_color="rgba(0,0,255,0.3)",
            bottom_color="rgba(0,0,255,0.0)",
        )
        opts = c.series_list[0].options
        self.assertEqual(opts["lineColor"], "#00f")
        self.assertEqual(opts["topColor"], "rgba(0,0,255,0.3)")

    def test_color_falls_back_to_line_color_for_area(self):
        """When color is set but line_color is not, color should feed lineColor."""
        c = custom_numeric(self.table, series_type="area", color="#ff0000")
        opts = c.series_list[0].options
        self.assertEqual(opts["lineColor"], "#ff0000")

    def test_chart_options_pass_through(self):
        c = custom_numeric(
            self.table,
            background_color="#000",
            text_color="#fff",
            crosshair_mode="normal",
            watermark_text="VOL",
            width=800,
            height=400,
        )
        self.assertEqual(c.chart_options["layout"]["background"]["color"], "#000")
        self.assertEqual(c.chart_options["layout"]["textColor"], "#fff")
        self.assertEqual(c.chart_options["crosshair"]["mode"], 0)
        self.assertEqual(c.chart_options["watermark"]["text"], "VOL")
        self.assertEqual(c.chart_options["width"], 800)
        self.assertEqual(c.chart_options["height"], 400)

    def test_to_dict_structure(self):
        c = custom_numeric(self.table, x="Strike", value="Delta")
        result = c.to_dict({id(self.table): 0})
        self.assertEqual(result["chartType"], "options")
        self.assertEqual(len(result["series"]), 1)
        self.assertEqual(
            result["series"][0]["dataMapping"]["columns"]["time"], "Strike"
        )
        self.assertEqual(
            result["series"][0]["dataMapping"]["columns"]["value"], "Delta"
        )

    def test_invalid_series_type_raises(self):
        """Unknown series_type strings should raise ValueError."""
        with self.assertRaises(ValueError):
            custom_numeric(self.table, series_type="invalid")


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


class TestEnumMaps(unittest.TestCase):
    """Verify all enum maps contain correct JS integer values."""

    def test_crosshair_mode_map_complete(self):
        from deephaven.plot.tradingview_lightweight.options import CROSSHAIR_MODE_MAP

        self.assertEqual(CROSSHAIR_MODE_MAP["normal"], 0)
        self.assertEqual(CROSSHAIR_MODE_MAP["magnet"], 1)
        self.assertEqual(CROSSHAIR_MODE_MAP["hidden"], 2)
        self.assertEqual(CROSSHAIR_MODE_MAP["magnet_ohlc"], 3)
        self.assertEqual(len(CROSSHAIR_MODE_MAP), 4)

    def test_last_price_animation_mode_map(self):
        from deephaven.plot.tradingview_lightweight.options import (
            LAST_PRICE_ANIMATION_MODE_MAP,
        )

        self.assertEqual(LAST_PRICE_ANIMATION_MODE_MAP["disabled"], 0)
        self.assertEqual(LAST_PRICE_ANIMATION_MODE_MAP["continuous"], 1)
        self.assertEqual(LAST_PRICE_ANIMATION_MODE_MAP["on_data_update"], 2)
        self.assertEqual(len(LAST_PRICE_ANIMATION_MODE_MAP), 3)

    def test_price_line_source_map(self):
        from deephaven.plot.tradingview_lightweight.options import (
            PRICE_LINE_SOURCE_MAP,
        )

        self.assertEqual(PRICE_LINE_SOURCE_MAP["last_bar"], 0)
        self.assertEqual(PRICE_LINE_SOURCE_MAP["last_visible"], 1)
        self.assertEqual(len(PRICE_LINE_SOURCE_MAP), 2)

    def test_tracking_mode_exit_mode_map(self):
        from deephaven.plot.tradingview_lightweight.options import (
            TRACKING_MODE_EXIT_MODE_MAP,
        )

        self.assertEqual(TRACKING_MODE_EXIT_MODE_MAP["on_touch_end"], 0)
        self.assertEqual(TRACKING_MODE_EXIT_MODE_MAP["on_next_tap"], 1)
        self.assertEqual(len(TRACKING_MODE_EXIT_MODE_MAP), 2)

    def test_all_new_enums_exported_from_package(self):
        """All new enum Literals and maps should be importable from the package root."""
        from deephaven.plot.tradingview_lightweight.options import (
            ColorType,
            LastPriceAnimationMode,
            MarkerSign,
            MismatchDirection,
            PriceLineSource,
            TickMarkType,
            TrackingModeExitMode,
        )

        # Spot-check that they are typing constructs, not None or other types
        self.assertIsNotNone(ColorType)
        self.assertIsNotNone(LastPriceAnimationMode)
        self.assertIsNotNone(MarkerSign)
        self.assertIsNotNone(MismatchDirection)
        self.assertIsNotNone(PriceLineSource)
        self.assertIsNotNone(TickMarkType)
        self.assertIsNotNone(TrackingModeExitMode)


class TestLineWidth(unittest.TestCase):
    """Tests that LineWidth annotation is exported and its values are accepted."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_linewidth_exported(self):
        """LineWidth must be importable from the top-level package."""
        from deephaven.plot.tradingview_lightweight.options import LineWidth
        import typing

        args = typing.get_args(LineWidth)
        self.assertEqual(set(args), {1, 2, 3, 4})

    def test_linewidth_values_accepted_in_chart(self):
        """All four valid LineWidth values should serialize without error."""
        s = line_series(self.table)
        for w in (1, 2, 3, 4):
            c = chart(s, crosshair_vert_line_width=w)
            self.assertEqual(
                c.chart_options["crosshair"]["vertLine"]["width"],
                w,
                f"Width {w} should pass through verbatim",
            )

    def test_linewidth_price_line_annotation(self):
        """PriceLine.line_width accepts LineWidth-typed ints."""
        pl = PriceLine(price=100.0, line_width=2)
        self.assertEqual(pl.to_dict()["lineWidth"], 2)


class TestPriceFormat(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_price_format_builtin_types_accepted(self):
        """Valid built-in type values should not raise."""
        from deephaven.plot.tradingview_lightweight.options import PriceFormat

        for t in ("price", "volume", "percent"):
            pf: PriceFormat = {"type": t, "precision": 2, "min_move": 0.01}
            self.assertEqual(pf["type"], t)

    def test_price_format_custom_type_not_in_literal(self):
        """The 'custom' literal must not appear in PriceFormat.type."""
        import typing
        from deephaven.plot.tradingview_lightweight.options import PriceFormat

        hints = typing.get_type_hints(PriceFormat)
        type_args = typing.get_args(hints.get("type", None))
        self.assertNotIn("custom", type_args)

    def test_price_format_custom_raises_valueerror(self):
        """Passing type='custom' to a series function should raise ValueError."""
        with self.assertRaises(ValueError) as ctx:
            line_series(self.table, price_format={"type": "custom"})
        self.assertIn("custom", str(ctx.exception))

    def test_price_format_custom_raises_in_all_series(self):
        """All series creation functions should reject type='custom'."""
        custom_pf = {"type": "custom"}
        for fn in (
            candlestick_series,
            bar_series,
            area_series,
            baseline_series,
            histogram_series,
        ):
            with self.assertRaises(
                ValueError, msg=f"{fn.__name__} should reject custom"
            ):
                if fn in (candlestick_series, bar_series):
                    fn(self.table, price_format=custom_pf)
                else:
                    fn(self.table, price_format=custom_pf)


class TestAlignTypes(unittest.TestCase):
    def test_horz_align_literal_values(self):
        """HorzAlign must be exactly {'left', 'center', 'right'}."""
        import typing
        from deephaven.plot.tradingview_lightweight.options import HorzAlign

        args = typing.get_args(HorzAlign)
        self.assertEqual(set(args), {"left", "center", "right"})

    def test_vert_align_literal_values(self):
        """VertAlign must be exactly {'top', 'center', 'bottom'}."""
        import typing
        from deephaven.plot.tradingview_lightweight.options import VertAlign

        args = typing.get_args(VertAlign)
        self.assertEqual(set(args), {"top", "center", "bottom"})

    def test_horz_align_exported(self):
        """HorzAlign must be importable from the top-level package."""
        from deephaven.plot import tradingview_lightweight as tvl

        self.assertTrue(hasattr(tvl, "HorzAlign"))

    def test_vert_align_exported(self):
        """VertAlign must be importable from the top-level package."""
        from deephaven.plot import tradingview_lightweight as tvl

        self.assertTrue(hasattr(tvl, "VertAlign"))

    def test_watermark_horz_align_passthrough(self):
        """watermark_horz_align should pass through to chartOptions."""
        table = MagicMock(name="table")
        s = line_series(table)
        c = chart(s, watermark_text="TEST", watermark_horz_align="center")
        self.assertEqual(c.chart_options["watermark"]["horzAlign"], "center")

    def test_watermark_vert_align_passthrough(self):
        """watermark_vert_align should pass through to chartOptions."""
        table = MagicMock(name="table")
        s = line_series(table)
        c = chart(s, watermark_text="TEST", watermark_vert_align="top")
        self.assertEqual(c.chart_options["watermark"]["vertAlign"], "top")


class TestWatermarkOptions(unittest.TestCase):
    """Tests for text, multi-line, and image watermark options."""

    def setUp(self):
        self.table = MagicMock(name="table")

    # --- Single-line new fields ---

    def test_watermark_single_line_new_fields(self):
        """fontStyle, lineHeight are forwarded in single-line mode."""
        s = line_series(self.table)
        c = chart(
            s,
            watermark_text="AAPL",
            watermark_font_style="italic",
            watermark_line_height=80.0,
        )
        wm = c.chart_options["watermark"]
        self.assertEqual(wm["text"], "AAPL")
        self.assertNotIn("fontFamily", wm)
        self.assertEqual(wm["fontStyle"], "italic")
        self.assertEqual(wm["lineHeight"], 80.0)
        self.assertNotIn("lines", wm)  # still legacy shape

    def test_watermark_single_line_omitted_new_fields(self):
        """Omitted new fields do not appear in the serialised dict."""
        s = line_series(self.table)
        c = chart(s, watermark_text="AAPL")
        wm = c.chart_options["watermark"]
        self.assertNotIn("fontFamily", wm)
        self.assertNotIn("fontStyle", wm)
        self.assertNotIn("lineHeight", wm)

    # --- Multi-line watermark ---

    def test_watermark_multi_line_basic(self):
        """watermark_lines produces a lines[] array in the watermark dict."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        s = line_series(self.table)
        c = chart(
            s,
            watermark_lines=[
                WatermarkLine(text="AAPL", font_size=72, font_style="italic"),
                WatermarkLine(
                    text="Apple Inc",
                    font_size=32,
                    color="rgba(100,100,100,0.3)",
                ),
            ],
            watermark_horz_align="left",
            watermark_vert_align="bottom",
        )
        wm = c.chart_options["watermark"]
        self.assertTrue(wm["visible"])
        self.assertEqual(wm["horzAlign"], "left")
        self.assertEqual(wm["vertAlign"], "bottom")
        self.assertEqual(len(wm["lines"]), 2)

        line0 = wm["lines"][0]
        self.assertEqual(line0["text"], "AAPL")
        self.assertEqual(line0["fontSize"], 72)
        self.assertEqual(line0["fontStyle"], "italic")
        self.assertNotIn("color", line0)  # not specified -> omitted
        self.assertNotIn("lineHeight", line0)

        line1 = wm["lines"][1]
        self.assertEqual(line1["text"], "Apple Inc")
        self.assertEqual(line1["fontSize"], 32)
        self.assertEqual(line1["color"], "rgba(100,100,100,0.3)")

    def test_watermark_multi_line_no_text_key(self):
        """Multi-line path must NOT produce a top-level 'text' key."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        s = line_series(self.table)
        c = chart(s, watermark_lines=[WatermarkLine(text="AAPL")])
        wm = c.chart_options["watermark"]
        self.assertNotIn("text", wm)
        self.assertIn("lines", wm)

    def test_watermark_multi_line_visible_false(self):
        """watermark_visible=False is respected with watermark_lines."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        s = line_series(self.table)
        c = chart(
            s,
            watermark_lines=[WatermarkLine(text="AAPL")],
            watermark_visible=False,
        )
        wm = c.chart_options["watermark"]
        self.assertFalse(wm["visible"])

    def test_watermark_multi_line_auto_visible(self):
        """watermark_lines without watermark_visible auto-sets visible=True."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        s = line_series(self.table)
        c = chart(s, watermark_lines=[WatermarkLine(text="AAPL")])
        self.assertTrue(c.chart_options["watermark"]["visible"])

    def test_watermark_line_height_in_line(self):
        """lineHeight on a WatermarkLine is serialised correctly."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        s = line_series(self.table)
        c = chart(
            s,
            watermark_lines=[WatermarkLine(text="X", line_height=90.0)],
        )
        line0 = c.chart_options["watermark"]["lines"][0]
        self.assertEqual(line0["lineHeight"], 90.0)

    def test_watermark_mutual_exclusion_raises(self):
        """Providing both watermark_text and watermark_lines must raise ValueError."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        s = line_series(self.table)
        with self.assertRaises(ValueError) as ctx:
            chart(
                s,
                watermark_text="AAPL",
                watermark_lines=[WatermarkLine(text="AAPL")],
            )
        self.assertIn("watermark_text", str(ctx.exception))
        self.assertIn("watermark_lines", str(ctx.exception))

    # --- Image watermark ---

    def test_watermark_image_basic(self):
        """Image watermark params produce an 'imageWatermark' key."""
        s = line_series(self.table)
        c = chart(
            s,
            watermark_image_url="https://example.com/logo.png",
            watermark_image_max_width=200,
            watermark_image_max_height=100,
            watermark_image_padding=10,
            watermark_image_alpha=0.5,
        )
        img = c.chart_options["imageWatermark"]
        self.assertEqual(img["url"], "https://example.com/logo.png")
        self.assertEqual(img["maxWidth"], 200)
        self.assertEqual(img["maxHeight"], 100)
        self.assertEqual(img["padding"], 10)
        self.assertEqual(img["alpha"], 0.5)
        self.assertTrue(img["visible"])  # auto-set when url is provided

    def test_watermark_image_no_url_no_key(self):
        """No imageWatermark key when url is not given."""
        s = line_series(self.table)
        c = chart(s, watermark_image_max_width=200)
        self.assertNotIn("imageWatermark", c.chart_options)

    def test_watermark_image_visible_false(self):
        """Image watermark visible=False is respected."""
        s = line_series(self.table)
        c = chart(
            s,
            watermark_image_url="https://example.com/logo.png",
            watermark_image_visible=False,
        )
        self.assertFalse(c.chart_options["imageWatermark"]["visible"])

    def test_watermark_image_url_only(self):
        """Minimal image watermark with only url."""
        s = line_series(self.table)
        c = chart(s, watermark_image_url="https://example.com/logo.png")
        img = c.chart_options["imageWatermark"]
        self.assertEqual(img["url"], "https://example.com/logo.png")
        self.assertNotIn("maxWidth", img)
        self.assertNotIn("maxHeight", img)
        self.assertNotIn("padding", img)
        self.assertNotIn("alpha", img)

    def test_watermark_image_and_text_coexist(self):
        """Text and image watermarks can be set simultaneously."""
        s = line_series(self.table)
        c = chart(
            s,
            watermark_text="AAPL",
            watermark_image_url="https://example.com/logo.png",
        )
        self.assertIn("watermark", c.chart_options)
        self.assertIn("imageWatermark", c.chart_options)

    def test_watermark_image_and_multiline_coexist(self):
        """Multi-line text and image watermarks can be set simultaneously."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        s = line_series(self.table)
        c = chart(
            s,
            watermark_lines=[WatermarkLine(text="AAPL")],
            watermark_image_url="https://example.com/logo.png",
        )
        self.assertIn("watermark", c.chart_options)
        self.assertIn("imageWatermark", c.chart_options)

    # --- Backwards-compatibility regression guard ---

    def test_watermark_options_backward_compat(self):
        """Existing tests still pass: single-line params produce unchanged shape."""
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
        self.assertNotIn("lines", wm)  # still legacy flat shape
        self.assertNotIn("imageWatermark", c.chart_options)

    # --- WatermarkLine.to_dict() ---

    def test_watermark_line_to_dict(self):
        """WatermarkLine.to_dict() returns camelCase keys and omits None values."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        wl = WatermarkLine(
            text="AAPL", font_size=72, font_style="italic", line_height=90.0
        )
        d = wl.to_dict()
        self.assertEqual(d["text"], "AAPL")
        self.assertEqual(d["fontSize"], 72)
        self.assertEqual(d["fontStyle"], "italic")
        self.assertEqual(d["lineHeight"], 90.0)
        self.assertNotIn("color", d)
        self.assertNotIn("fontFamily", d)

    def test_watermark_line_to_dict_minimal(self):
        """WatermarkLine with only text produces minimal dict."""
        from deephaven.plot.tradingview_lightweight.options import WatermarkLine

        wl = WatermarkLine(text="X")
        d = wl.to_dict()
        self.assertEqual(d, {"text": "X"})

    # --- WatermarkLine exported from package ---

    def test_watermark_line_exported(self):
        """WatermarkLine must be importable from the top-level package."""
        from deephaven.plot import tradingview_lightweight as tvl

        self.assertTrue(hasattr(tvl, "WatermarkLine"))


class TestScrollScaleOptions(unittest.TestCase):
    """Tests for handleScroll, handleScale, and kineticScroll options."""

    def setUp(self):
        self.table = MagicMock(name="table")

    # -----------------------------------------------------------------------
    # HandleScroll — not set by default
    # -----------------------------------------------------------------------

    def test_handle_scroll_not_set_by_default(self):
        """No scroll/scale keys should appear when no params are given."""
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("handleScroll", c.chart_options)
        self.assertNotIn("handleScale", c.chart_options)
        self.assertNotIn("kineticScroll", c.chart_options)

    # -----------------------------------------------------------------------
    # HandleScroll — boolean shorthand
    # -----------------------------------------------------------------------

    def test_handle_scroll_false_shorthand(self):
        """handle_scroll=False should emit handleScroll: false (boolean)."""
        s = line_series(self.table)
        c = chart(s, handle_scroll=False)
        self.assertIn("handleScroll", c.chart_options)
        self.assertIs(c.chart_options["handleScroll"], False)

    def test_handle_scroll_true_shorthand(self):
        """handle_scroll=True should emit handleScroll: true (boolean)."""
        s = line_series(self.table)
        c = chart(s, handle_scroll=True)
        self.assertIs(c.chart_options["handleScroll"], True)

    def test_handle_scroll_shorthand_overrides_granular(self):
        """When handle_scroll bool is set, granular sub-options are ignored."""
        s = line_series(self.table)
        c = chart(s, handle_scroll=False, handle_scroll_mouse_wheel=True)
        # Must be boolean False, not an object
        self.assertIs(c.chart_options["handleScroll"], False)

    # -----------------------------------------------------------------------
    # HandleScroll — granular sub-options
    # -----------------------------------------------------------------------

    def test_handle_scroll_mouse_wheel_false(self):
        """handle_scroll_mouse_wheel=False emits object form."""
        s = line_series(self.table)
        c = chart(s, handle_scroll_mouse_wheel=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["mouseWheel"])

    def test_handle_scroll_pressed_mouse_move_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scroll_pressed_mouse_move=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["pressedMouseMove"])

    def test_handle_scroll_horz_touch_drag_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scroll_horz_touch_drag=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["horzTouchDrag"])

    def test_handle_scroll_vert_touch_drag_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scroll_vert_touch_drag=False)
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertFalse(hs["vertTouchDrag"])

    def test_handle_scroll_all_granular_options(self):
        """All four granular scroll options should appear in the object."""
        s = line_series(self.table)
        c = chart(
            s,
            handle_scroll_mouse_wheel=True,
            handle_scroll_pressed_mouse_move=False,
            handle_scroll_horz_touch_drag=True,
            handle_scroll_vert_touch_drag=False,
        )
        hs = c.chart_options["handleScroll"]
        self.assertIsInstance(hs, dict)
        self.assertTrue(hs["mouseWheel"])
        self.assertFalse(hs["pressedMouseMove"])
        self.assertTrue(hs["horzTouchDrag"])
        self.assertFalse(hs["vertTouchDrag"])

    def test_handle_scroll_partial_granular_only_set_keys_emitted(self):
        """Only explicitly set granular keys should appear in the output dict."""
        s = line_series(self.table)
        c = chart(s, handle_scroll_mouse_wheel=False)
        hs = c.chart_options["handleScroll"]
        # Only "mouseWheel" should be present — not the others
        self.assertIn("mouseWheel", hs)
        self.assertNotIn("pressedMouseMove", hs)
        self.assertNotIn("horzTouchDrag", hs)
        self.assertNotIn("vertTouchDrag", hs)

    # -----------------------------------------------------------------------
    # HandleScale — boolean shorthand
    # -----------------------------------------------------------------------

    def test_handle_scale_false_shorthand(self):
        """handle_scale=False should emit handleScale: false (boolean)."""
        s = line_series(self.table)
        c = chart(s, handle_scale=False)
        self.assertIs(c.chart_options["handleScale"], False)

    def test_handle_scale_true_shorthand(self):
        s = line_series(self.table)
        c = chart(s, handle_scale=True)
        self.assertIs(c.chart_options["handleScale"], True)

    def test_handle_scale_shorthand_overrides_granular(self):
        """When handle_scale bool is set, granular sub-options are ignored."""
        s = line_series(self.table)
        c = chart(s, handle_scale=False, handle_scale_pinch=True)
        self.assertIs(c.chart_options["handleScale"], False)

    # -----------------------------------------------------------------------
    # HandleScale — granular sub-options
    # -----------------------------------------------------------------------

    def test_handle_scale_mouse_wheel_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_mouse_wheel=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["mouseWheel"])

    def test_handle_scale_pinch_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_pinch=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["pinch"])

    def test_handle_scale_axis_pressed_mouse_move_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_axis_pressed_mouse_move=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["axisPressedMouseMove"])

    def test_handle_scale_axis_double_click_reset_false(self):
        s = line_series(self.table)
        c = chart(s, handle_scale_axis_double_click_reset=False)
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertFalse(hsc["axisDoubleClickReset"])

    def test_handle_scale_all_granular_options(self):
        """All four granular scale options should appear in the object."""
        s = line_series(self.table)
        c = chart(
            s,
            handle_scale_mouse_wheel=True,
            handle_scale_pinch=False,
            handle_scale_axis_pressed_mouse_move=True,
            handle_scale_axis_double_click_reset=False,
        )
        hsc = c.chart_options["handleScale"]
        self.assertIsInstance(hsc, dict)
        self.assertTrue(hsc["mouseWheel"])
        self.assertFalse(hsc["pinch"])
        self.assertTrue(hsc["axisPressedMouseMove"])
        self.assertFalse(hsc["axisDoubleClickReset"])

    def test_handle_scale_partial_granular_only_set_keys_emitted(self):
        """Only explicitly set granular keys should appear in the output dict."""
        s = line_series(self.table)
        c = chart(s, handle_scale_pinch=False)
        hsc = c.chart_options["handleScale"]
        self.assertIn("pinch", hsc)
        self.assertNotIn("mouseWheel", hsc)
        self.assertNotIn("axisPressedMouseMove", hsc)
        self.assertNotIn("axisDoubleClickReset", hsc)

    # -----------------------------------------------------------------------
    # KineticScroll
    # -----------------------------------------------------------------------

    def test_kinetic_scroll_touch_false(self):
        """kinetic_scroll_touch=False should emit kineticScroll.touch: false."""
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_touch=False)
        ks = c.chart_options["kineticScroll"]
        self.assertIsInstance(ks, dict)
        self.assertFalse(ks["touch"])

    def test_kinetic_scroll_mouse_true(self):
        """kinetic_scroll_mouse=True should emit kineticScroll.mouse: true."""
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_mouse=True)
        ks = c.chart_options["kineticScroll"]
        self.assertIsInstance(ks, dict)
        self.assertTrue(ks["mouse"])

    def test_kinetic_scroll_both_options(self):
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_touch=True, kinetic_scroll_mouse=True)
        ks = c.chart_options["kineticScroll"]
        self.assertTrue(ks["touch"])
        self.assertTrue(ks["mouse"])

    def test_kinetic_scroll_not_set_by_default(self):
        s = line_series(self.table)
        c = chart(s)
        self.assertNotIn("kineticScroll", c.chart_options)

    def test_kinetic_scroll_partial_only_set_keys_emitted(self):
        """Setting only mouse should not emit touch key."""
        s = line_series(self.table)
        c = chart(s, kinetic_scroll_mouse=False)
        ks = c.chart_options["kineticScroll"]
        self.assertIn("mouse", ks)
        self.assertNotIn("touch", ks)

    # -----------------------------------------------------------------------
    # Combined: all three groups together
    # -----------------------------------------------------------------------

    def test_all_three_groups_combined(self):
        """All three option groups can coexist in chart_options."""
        s = line_series(self.table)
        c = chart(
            s,
            handle_scroll=False,
            handle_scale_pinch=False,
            kinetic_scroll_mouse=True,
        )
        self.assertIs(c.chart_options["handleScroll"], False)
        self.assertFalse(c.chart_options["handleScale"]["pinch"])
        self.assertTrue(c.chart_options["kineticScroll"]["mouse"])

    def test_scroll_scale_options_do_not_interfere_with_other_options(self):
        """Adding scroll/scale options should not disturb layout or grid."""
        s = line_series(self.table)
        c = chart(
            s,
            background_color="#000",
            vert_lines_visible=False,
            handle_scroll=False,
            handle_scale=False,
            kinetic_scroll_touch=False,
        )
        self.assertIn("layout", c.chart_options)
        self.assertIn("grid", c.chart_options)
        self.assertIs(c.chart_options["handleScroll"], False)
        self.assertIs(c.chart_options["handleScale"], False)
        self.assertFalse(c.chart_options["kineticScroll"]["touch"])


if __name__ == "__main__":
    unittest.main()
