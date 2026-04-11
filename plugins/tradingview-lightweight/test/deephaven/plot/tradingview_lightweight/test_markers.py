"""Tests for marker and price line creation."""

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

from deephaven.plot.tradingview_lightweight.markers import (
    Marker,
    PriceLine,
    MarkerSpec,
    marker,
    price_line,
    markers_from_table,
)


class TestMarkerDataclass(unittest.TestCase):
    """Tests for the Marker dataclass directly."""

    def test_defaults(self):
        m = Marker(time="2024-01-01")
        self.assertEqual(m.time, "2024-01-01")
        self.assertEqual(m.position, "aboveBar")
        self.assertEqual(m.shape, "circle")
        self.assertEqual(m.color, "#2196F3")
        self.assertEqual(m.text, "")
        self.assertIsNone(m.size)

    def test_custom_values(self):
        m = Marker(
            time=1704067200,
            position="belowBar",
            shape="arrowUp",
            color="#ff0000",
            text="Buy",
            size=3,
        )
        self.assertEqual(m.time, 1704067200)
        self.assertEqual(m.position, "belowBar")
        self.assertEqual(m.shape, "arrowUp")
        self.assertEqual(m.color, "#ff0000")
        self.assertEqual(m.text, "Buy")
        self.assertEqual(m.size, 3)

    def test_to_dict_defaults(self):
        m = Marker(time="2024-01-01")
        d = m.to_dict()
        self.assertEqual(d["time"], "2024-01-01")
        self.assertEqual(d["position"], "aboveBar")
        self.assertEqual(d["shape"], "circle")
        self.assertEqual(d["color"], "#2196F3")
        self.assertEqual(d["text"], "")
        self.assertNotIn("size", d)

    def test_to_dict_with_size(self):
        m = Marker(time="2024-01-01", size=2)
        d = m.to_dict()
        self.assertEqual(d["size"], 2)

    def test_to_dict_all_fields(self):
        m = Marker(
            time="2024-06-15",
            position="inBar",
            shape="square",
            color="green",
            text="Signal",
            size=5,
        )
        d = m.to_dict()
        expected = {
            "time": "2024-06-15",
            "position": "inBar",
            "shape": "square",
            "color": "green",
            "text": "Signal",
            "size": 5,
        }
        self.assertEqual(d, expected)

    def test_time_types(self):
        """Marker time can be string, int, or float."""
        m_str = Marker(time="2024-01-01")
        m_int = Marker(time=1704067200)
        m_float = Marker(time=1704067200.5)
        self.assertEqual(m_str.to_dict()["time"], "2024-01-01")
        self.assertEqual(m_int.to_dict()["time"], 1704067200)
        self.assertEqual(m_float.to_dict()["time"], 1704067200.5)


class TestMarkerFunction(unittest.TestCase):
    """Tests for the marker() factory function."""

    def test_defaults(self):
        m = marker(time="2024-01-01")
        self.assertIsInstance(m, Marker)
        self.assertEqual(m.time, "2024-01-01")
        self.assertEqual(m.position, "aboveBar")
        self.assertEqual(m.shape, "circle")
        self.assertEqual(m.color, "#2196F3")
        self.assertEqual(m.text, "")
        self.assertIsNone(m.size)

    def test_position_mapping(self):
        """Python-friendly position names should be converted to camelCase."""
        m_above = marker(time="t", position="above_bar")
        self.assertEqual(m_above.position, "aboveBar")

        m_below = marker(time="t", position="below_bar")
        self.assertEqual(m_below.position, "belowBar")

        m_in = marker(time="t", position="in_bar")
        self.assertEqual(m_in.position, "inBar")

    def test_shape_mapping(self):
        """Python-friendly shape names should be converted to camelCase."""
        m_circle = marker(time="t", shape="circle")
        self.assertEqual(m_circle.shape, "circle")

        m_square = marker(time="t", shape="square")
        self.assertEqual(m_square.shape, "square")

        m_up = marker(time="t", shape="arrow_up")
        self.assertEqual(m_up.shape, "arrowUp")

        m_down = marker(time="t", shape="arrow_down")
        self.assertEqual(m_down.shape, "arrowDown")

    def test_custom_values(self):
        m = marker(
            time=1704067200,
            position="below_bar",
            shape="arrow_up",
            color="#00ff00",
            text="Buy Signal",
            size=4,
        )
        self.assertEqual(m.time, 1704067200)
        self.assertEqual(m.position, "belowBar")
        self.assertEqual(m.shape, "arrowUp")
        self.assertEqual(m.color, "#00ff00")
        self.assertEqual(m.text, "Buy Signal")
        self.assertEqual(m.size, 4)

    def test_to_dict_from_factory(self):
        m = marker(
            time="2024-03-15",
            position="above_bar",
            shape="arrow_down",
            color="red",
            text="Sell",
            size=2,
        )
        d = m.to_dict()
        self.assertEqual(d["time"], "2024-03-15")
        self.assertEqual(d["position"], "aboveBar")
        self.assertEqual(d["shape"], "arrowDown")
        self.assertEqual(d["color"], "red")
        self.assertEqual(d["text"], "Sell")
        self.assertEqual(d["size"], 2)

    def test_unknown_position_fallback(self):
        """Unknown position should fall back to 'aboveBar'."""
        m = marker(time="t", position="invalid")
        self.assertEqual(m.position, "aboveBar")

    def test_unknown_shape_fallback(self):
        """Unknown shape should fall back to 'circle'."""
        m = marker(time="t", shape="star")
        self.assertEqual(m.shape, "circle")


class TestPriceLineDataclass(unittest.TestCase):
    """Tests for the PriceLine dataclass directly."""

    def test_defaults(self):
        pl = PriceLine(price=100.0)
        self.assertEqual(pl.price, 100.0)
        self.assertIsNone(pl.color)
        self.assertIsNone(pl.line_width)
        self.assertIsNone(pl.line_style)
        self.assertIsNone(pl.axis_label_visible)
        self.assertIsNone(pl.title)

    def test_custom_values(self):
        pl = PriceLine(
            price=150.0,
            color="red",
            line_width=2,
            line_style="dashed",
            axis_label_visible=True,
            title="Resistance",
        )
        self.assertEqual(pl.price, 150.0)
        self.assertEqual(pl.color, "red")
        self.assertEqual(pl.line_width, 2)
        self.assertEqual(pl.line_style, "dashed")
        self.assertTrue(pl.axis_label_visible)
        self.assertEqual(pl.title, "Resistance")

    def test_to_dict_minimal(self):
        pl = PriceLine(price=50.0)
        d = pl.to_dict()
        self.assertEqual(d, {"price": 50.0})

    def test_to_dict_all_fields(self):
        pl = PriceLine(
            price=200.0,
            color="blue",
            line_width=3,
            line_style="dotted",
            axis_label_visible=False,
            title="Target",
        )
        d = pl.to_dict()
        self.assertEqual(d["price"], 200.0)
        self.assertEqual(d["color"], "blue")
        self.assertEqual(d["lineWidth"], 3)
        self.assertEqual(d["lineStyle"], 1)  # dotted -> 1
        self.assertFalse(d["axisLabelVisible"])
        self.assertEqual(d["title"], "Target")

    def test_to_dict_line_style_conversion(self):
        """line_style string should be converted to integer in to_dict."""
        styles = {
            "solid": 0,
            "dotted": 1,
            "dashed": 2,
            "large_dashed": 3,
            "sparse_dotted": 4,
        }
        for style_name, style_value in styles.items():
            pl = PriceLine(price=100.0, line_style=style_name)
            d = pl.to_dict()
            self.assertEqual(
                d["lineStyle"],
                style_value,
                f"Style {style_name} should map to {style_value}",
            )

    def test_to_dict_partial(self):
        """Only set fields should appear in the dict (besides price)."""
        pl = PriceLine(price=75.0, color="green")
        d = pl.to_dict()
        self.assertEqual(d["price"], 75.0)
        self.assertEqual(d["color"], "green")
        self.assertNotIn("lineWidth", d)
        self.assertNotIn("lineStyle", d)
        self.assertNotIn("axisLabelVisible", d)
        self.assertNotIn("title", d)


class TestPriceLineFunction(unittest.TestCase):
    """Tests for the price_line() factory function."""

    def test_defaults(self):
        pl = price_line(price=100.0)
        self.assertIsInstance(pl, PriceLine)
        self.assertEqual(pl.price, 100.0)
        self.assertIsNone(pl.color)
        self.assertIsNone(pl.line_width)
        self.assertIsNone(pl.line_style)
        self.assertIsNone(pl.axis_label_visible)
        self.assertIsNone(pl.title)

    def test_custom_values(self):
        pl = price_line(
            price=250.0,
            color="orange",
            line_width=1,
            line_style="dashed",
            axis_label_visible=True,
            title="Stop Loss",
        )
        self.assertEqual(pl.price, 250.0)
        self.assertEqual(pl.color, "orange")
        self.assertEqual(pl.line_width, 1)
        self.assertEqual(pl.line_style, "dashed")
        self.assertTrue(pl.axis_label_visible)
        self.assertEqual(pl.title, "Stop Loss")

    def test_serialization(self):
        pl = price_line(price=300.0, color="purple", title="Entry")
        d = pl.to_dict()
        self.assertEqual(d["price"], 300.0)
        self.assertEqual(d["color"], "purple")
        self.assertEqual(d["title"], "Entry")


class TestMarkerSpec(unittest.TestCase):
    """Tests for the MarkerSpec dataclass."""

    def test_defaults(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table)
        self.assertIs(spec.table, table)
        self.assertEqual(spec.time, "Timestamp")
        self.assertEqual(spec.position, "above_bar")
        self.assertEqual(spec.shape, "circle")
        self.assertEqual(spec.color, "#2196F3")
        self.assertEqual(spec.text, "")
        self.assertIsNone(spec.size)

    def test_custom_values(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(
            table=table,
            time="Date",
            position="below_bar",
            shape="arrow_up",
            color="red",
            text="alert",
            size=3,
        )
        self.assertEqual(spec.time, "Date")
        self.assertEqual(spec.position, "below_bar")
        self.assertEqual(spec.shape, "arrow_up")
        self.assertEqual(spec.color, "red")
        self.assertEqual(spec.text, "alert")
        self.assertEqual(spec.size, 3)


class TestMarkersFromTable(unittest.TestCase):
    """Tests for the markers_from_table() function."""

    def test_defaults(self):
        table = MagicMock(name="table")
        spec = markers_from_table(table)
        self.assertIsInstance(spec, MarkerSpec)
        self.assertIs(spec.table, table)
        self.assertEqual(spec.time, "Timestamp")
        self.assertEqual(spec.position, "above_bar")
        self.assertEqual(spec.shape, "circle")
        self.assertEqual(spec.color, "#2196F3")
        self.assertEqual(spec.text, "")
        self.assertIsNone(spec.size)

    def test_custom_values(self):
        table = MagicMock(name="marker_table")
        spec = markers_from_table(
            table,
            time="EventTime",
            position="in_bar",
            shape="square",
            color="#ff6600",
            text="event",
            size=2,
        )
        self.assertIs(spec.table, table)
        self.assertEqual(spec.time, "EventTime")
        self.assertEqual(spec.position, "in_bar")
        self.assertEqual(spec.shape, "square")
        self.assertEqual(spec.color, "#ff6600")
        self.assertEqual(spec.text, "event")
        self.assertEqual(spec.size, 2)


class TestMarkerIntegration(unittest.TestCase):
    """Integration tests for markers used within series."""

    def test_markers_serialize_in_series(self):
        """Markers attached to a series should serialize properly."""
        from deephaven.plot.tradingview_lightweight.series import line_series

        table = MagicMock(name="table")
        m1 = marker(
            time="2024-01-15",
            position="above_bar",
            shape="arrow_down",
            color="red",
            text="Sell",
        )
        m2 = marker(
            time="2024-02-15",
            position="below_bar",
            shape="arrow_up",
            color="green",
            text="Buy",
        )
        pl = price_line(price=100.0, color="gray", line_style="dashed", title="Support")

        spec = line_series(table, markers=[m1, m2], price_lines=[pl])
        result = spec.to_dict("s0", 0)

        self.assertEqual(len(result["markers"]), 2)
        self.assertEqual(result["markers"][0]["position"], "aboveBar")
        self.assertEqual(result["markers"][0]["shape"], "arrowDown")
        self.assertEqual(result["markers"][0]["text"], "Sell")
        self.assertEqual(result["markers"][1]["position"], "belowBar")
        self.assertEqual(result["markers"][1]["shape"], "arrowUp")
        self.assertEqual(result["markers"][1]["text"], "Buy")

        self.assertEqual(len(result["priceLines"]), 1)
        self.assertEqual(result["priceLines"][0]["price"], 100.0)
        self.assertEqual(result["priceLines"][0]["lineStyle"], 2)  # dashed
        self.assertEqual(result["priceLines"][0]["title"], "Support")


class TestDynamicPriceLine(unittest.TestCase):
    """Tests for column-based dynamic price lines."""

    def test_column_creates_dynamic_price_line(self):
        pl = PriceLine(column="AvgPrice")
        self.assertIsNone(pl.price)
        self.assertEqual(pl.column, "AvgPrice")

    def test_column_to_dict(self):
        pl = PriceLine(column="MaxPrice", color="green", title="High")
        d = pl.to_dict()
        self.assertEqual(d["column"], "MaxPrice")
        self.assertEqual(d["color"], "green")
        self.assertEqual(d["title"], "High")
        self.assertNotIn("price", d)

    def test_static_to_dict_no_column(self):
        pl = PriceLine(price=100.0)
        d = pl.to_dict()
        self.assertEqual(d["price"], 100.0)
        self.assertNotIn("column", d)

    def test_validation_neither(self):
        with self.assertRaises(ValueError):
            PriceLine()

    def test_validation_both(self):
        with self.assertRaises(ValueError):
            PriceLine(price=100.0, column="AvgPrice")

    def test_factory_with_column(self):
        pl = price_line(column="MinPrice", color="red", title="Low")
        self.assertIsInstance(pl, PriceLine)
        self.assertIsNone(pl.price)
        self.assertEqual(pl.column, "MinPrice")
        self.assertEqual(pl.color, "red")
        self.assertEqual(pl.title, "Low")

    def test_factory_column_with_styling(self):
        pl = price_line(
            column="AvgPrice",
            color="blue",
            line_width=2,
            line_style="dashed",
            axis_label_visible=True,
            title="Average",
        )
        d = pl.to_dict()
        self.assertEqual(d["column"], "AvgPrice")
        self.assertEqual(d["color"], "blue")
        self.assertEqual(d["lineWidth"], 2)
        self.assertEqual(d["lineStyle"], 2)  # dashed
        self.assertTrue(d["axisLabelVisible"])
        self.assertEqual(d["title"], "Average")
        self.assertNotIn("price", d)

    def test_dynamic_in_series(self):
        from deephaven.plot.tradingview_lightweight.series import candlestick_series

        table = MagicMock(name="table")
        pl_static = price_line(price=100.0, color="gray", title="Static")
        pl_dynamic = price_line(column="AvgPrice", color="blue", title="Average")

        spec = candlestick_series(table, price_lines=[pl_static, pl_dynamic])
        result = spec.to_dict("s0", 0)

        self.assertEqual(len(result["priceLines"]), 2)
        self.assertEqual(result["priceLines"][0]["price"], 100.0)
        self.assertNotIn("column", result["priceLines"][0])
        self.assertEqual(result["priceLines"][1]["column"], "AvgPrice")
        self.assertNotIn("price", result["priceLines"][1])


class TestMarkerSpecToDict(unittest.TestCase):
    """Tests for the updated MarkerSpec with to_dict and get_columns."""

    def test_all_fixed_defaults(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, time="SignalTime", text="Buy")
        d = spec.to_dict(table_id=1)
        self.assertEqual(d["tableId"], 1)
        self.assertEqual(d["columns"], {"time": "SignalTime"})
        self.assertEqual(d["defaults"]["position"], "aboveBar")
        self.assertEqual(d["defaults"]["shape"], "circle")
        self.assertEqual(d["defaults"]["color"], "#2196F3")
        self.assertEqual(d["defaults"]["text"], "Buy")

    def test_column_overrides(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(
            table=table,
            time="Time",
            text_column="Label",
            color_column="Color",
        )
        d = spec.to_dict(table_id=2)
        self.assertEqual(d["columns"]["time"], "Time")
        self.assertEqual(d["columns"]["text"], "Label")
        self.assertEqual(d["columns"]["color"], "Color")
        # Defaults should not include text/color since they come from columns
        self.assertNotIn("text", d["defaults"])
        self.assertNotIn("color", d["defaults"])
        # Position and shape should still be in defaults
        self.assertEqual(d["defaults"]["position"], "aboveBar")
        self.assertEqual(d["defaults"]["shape"], "circle")

    def test_all_columns(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(
            table=table,
            time="T",
            position_column="Pos",
            shape_column="Shape",
            color_column="Col",
            text_column="Txt",
            size_column="Sz",
        )
        d = spec.to_dict(table_id=0)
        self.assertEqual(
            d["columns"],
            {
                "time": "T",
                "position": "Pos",
                "shape": "Shape",
                "color": "Col",
                "text": "Txt",
                "size": "Sz",
            },
        )
        # No defaults except possibly size (which has no default when None)
        self.assertEqual(d["defaults"], {})

    def test_position_shape_mapping(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(
            table=table,
            time="T",
            position="below_bar",
            shape="arrow_up",
        )
        d = spec.to_dict(table_id=0)
        self.assertEqual(d["defaults"]["position"], "belowBar")
        self.assertEqual(d["defaults"]["shape"], "arrowUp")

    def test_get_columns_time_only(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, time="SignalTime")
        self.assertEqual(spec.get_columns(), ["SignalTime"])

    def test_get_columns_with_overrides(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(
            table=table,
            time="Time",
            text_column="Label",
            color_column="Color",
        )
        cols = spec.get_columns()
        self.assertIn("Time", cols)
        self.assertIn("Label", cols)
        self.assertIn("Color", cols)
        self.assertEqual(len(cols), 3)

    def test_size_in_defaults(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, time="T", size=3)
        d = spec.to_dict(table_id=0)
        self.assertEqual(d["defaults"]["size"], 3)

    def test_size_not_in_defaults_when_none(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, time="T")
        d = spec.to_dict(table_id=0)
        self.assertNotIn("size", d["defaults"])


class TestMarkersFromTableUpdated(unittest.TestCase):
    """Tests for the updated markers_from_table with *_column params."""

    def test_with_text_column(self):
        table = MagicMock(name="table")
        spec = markers_from_table(table, time="SignalTime", text_column="Label")
        self.assertEqual(spec.time, "SignalTime")
        self.assertEqual(spec.text_column, "Label")
        self.assertIsNone(spec.position_column)

    def test_with_all_columns(self):
        table = MagicMock(name="table")
        spec = markers_from_table(
            table,
            time="T",
            position_column="Pos",
            shape_column="Shape",
            color_column="Col",
            text_column="Txt",
            size_column="Sz",
        )
        self.assertEqual(spec.position_column, "Pos")
        self.assertEqual(spec.shape_column, "Shape")
        self.assertEqual(spec.color_column, "Col")
        self.assertEqual(spec.text_column, "Txt")
        self.assertEqual(spec.size_column, "Sz")

    def test_mixed_fixed_and_columns(self):
        table = MagicMock(name="table")
        spec = markers_from_table(
            table,
            time="T",
            text_column="Label",
            position="below_bar",
            color="#FF0000",
        )
        d = spec.to_dict(table_id=1)
        self.assertEqual(d["columns"]["text"], "Label")
        self.assertEqual(d["defaults"]["position"], "belowBar")
        self.assertEqual(d["defaults"]["color"], "#FF0000")


class TestMarkerSpecInSeries(unittest.TestCase):
    """Tests for marker_spec integration in series and chart."""

    def test_marker_spec_in_candlestick_series(self):
        from deephaven.plot.tradingview_lightweight.series import candlestick_series

        table = MagicMock(name="data")
        marker_table = MagicMock(name="markers")
        ms = MarkerSpec(table=marker_table, time="SignalTime", text="Buy")

        spec = candlestick_series(table, marker_spec=ms)
        self.assertIs(spec.marker_spec, ms)

    def test_marker_spec_serialized_in_to_dict(self):
        from deephaven.plot.tradingview_lightweight.series import line_series

        table = MagicMock(name="data")
        marker_table = MagicMock(name="markers")
        ms = MarkerSpec(table=marker_table, time="T", text_column="Lbl")

        spec = line_series(table, marker_spec=ms)
        result = spec.to_dict("s0", 0, marker_table_id=1)

        self.assertIn("markerSpec", result)
        self.assertEqual(result["markerSpec"]["tableId"], 1)
        self.assertEqual(result["markerSpec"]["columns"]["time"], "T")
        self.assertEqual(result["markerSpec"]["columns"]["text"], "Lbl")

    def test_marker_spec_not_serialized_without_table_id(self):
        from deephaven.plot.tradingview_lightweight.series import line_series

        table = MagicMock(name="data")
        marker_table = MagicMock(name="markers")
        ms = MarkerSpec(table=marker_table, time="T")

        spec = line_series(table, marker_spec=ms)
        result = spec.to_dict("s0", 0)  # no marker_table_id
        self.assertNotIn("markerSpec", result)

    def test_all_series_types_accept_marker_spec(self):
        from deephaven.plot.tradingview_lightweight.series import (
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        )

        table = MagicMock(name="data")
        marker_table = MagicMock(name="markers")
        ms = MarkerSpec(table=marker_table, time="T")

        for fn in (
            candlestick_series,
            bar_series,
            line_series,
            area_series,
            baseline_series,
            histogram_series,
        ):
            spec = fn(table, marker_spec=ms)
            self.assertIs(spec.marker_spec, ms)

    def test_chart_get_tables_includes_marker_table(self):
        from deephaven.plot.tradingview_lightweight.series import line_series
        from deephaven.plot.tradingview_lightweight.chart import TvlChart

        data = MagicMock(name="data")
        marker_table = MagicMock(name="markers")
        ms = MarkerSpec(table=marker_table, time="T")
        s = line_series(data, marker_spec=ms)
        c = TvlChart([s], {})
        tables = c.get_tables()
        self.assertIn(data, tables)
        self.assertIn(marker_table, tables)
        self.assertEqual(len(tables), 2)

    def test_chart_to_dict_includes_marker_spec(self):
        from deephaven.plot.tradingview_lightweight.series import line_series
        from deephaven.plot.tradingview_lightweight.chart import TvlChart

        data = MagicMock(name="data")
        marker_table = MagicMock(name="markers")
        ms = MarkerSpec(table=marker_table, time="T", text="Signal")
        s = line_series(data, marker_spec=ms)
        c = TvlChart([s], {})
        table_id_map = {id(data): 0, id(marker_table): 1}
        d = c.to_dict(table_id_map)
        self.assertIn("markerSpec", d["series"][0])
        self.assertEqual(d["series"][0]["markerSpec"]["tableId"], 1)


if __name__ == "__main__":
    unittest.main()
