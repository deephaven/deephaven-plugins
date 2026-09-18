"""Tests for the in-chart legend config and its chart/event wiring."""

from __future__ import annotations

import json
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

from deephaven.plot.tradingview_lightweight.options import Legend, legend
from deephaven.plot.tradingview_lightweight.chart import chart, line
from deephaven.plot.tradingview_lightweight.events import (
    SERIES_TOGGLE,
    build_series_toggle_event,
)
from deephaven.plot.tradingview_lightweight.series import line_series
from deephaven.plot.tradingview_lightweight.chart import TvlChart
from deephaven.plot.tradingview_lightweight.communication.listener import (
    TvlChartListener,
)


def _table(*names: str) -> MagicMock:
    """A mock table exposing the named columns."""
    cols = []
    for n in names:
        c = MagicMock()
        c.name = n
        cols.append(c)
    t = MagicMock(name="table")
    t.columns = cols
    t.is_refreshing = False
    return t


class TestLegendConfig(unittest.TestCase):
    """Serialisation and validation of the Legend dataclass."""

    def test_defaults_serialise_minimally(self):
        # Unset detail options are omitted so the JS defaults apply.
        self.assertEqual(
            legend().to_dict(series_count=2),
            {"variant": "rows", "orientation": "vertical"},
        )

    def test_all_options_serialise_camel_case(self):
        result = legend(
            variant="rows",
            orientation="horizontal",
            max_rows=4,
            show_ohlc=False,
            show_time=False,
            interactive=False,
        ).to_dict(series_count=2)
        self.assertEqual(
            result,
            {
                "variant": "rows",
                "orientation": "horizontal",
                "maxRows": 4,
                "showOhlc": False,
                "showTime": False,
                "interactive": False,
            },
        )

    def test_follow_cursor_serialises(self):
        self.assertEqual(
            legend(follow_cursor=False).to_dict(series_count=2)["followCursor"],
            False,
        )

    def test_factory_matches_dataclass(self):
        self.assertEqual(legend(max_rows=3), Legend(max_rows=3))

    def test_invalid_variant_raises(self):
        with self.assertRaises(ValueError) as ctx:
            legend(variant="three-line")
        self.assertIn("Invalid legend variant", str(ctx.exception))

    def test_invalid_orientation_raises(self):
        with self.assertRaises(ValueError) as ctx:
            legend(orientation="diagonal")
        self.assertIn("Invalid legend orientation", str(ctx.exception))

    def test_non_positive_max_rows_raises(self):
        with self.assertRaises(ValueError) as ctx:
            legend(max_rows=0)
        self.assertIn("Must be >= 1", str(ctx.exception))


class TestLegendVariantResolution(unittest.TestCase):
    """`variant="auto"` resolves against the chart's series."""

    def test_auto_picks_detailed_for_one_static_series(self):
        self.assertEqual(
            legend().resolve_variant(series_count=1, partitioned=False),
            "detailed",
        )

    def test_auto_picks_rows_for_multiple_series(self):
        self.assertEqual(
            legend().resolve_variant(series_count=3, partitioned=False), "rows"
        )

    def test_auto_picks_rows_for_partitioned_charts(self):
        # A `by=` chart starts with one template and grows as keys arrive;
        # `detailed` would flip to `rows` mid-stream.
        self.assertEqual(
            legend().resolve_variant(series_count=1, partitioned=True), "rows"
        )

    def test_explicit_variant_wins_over_auto(self):
        self.assertEqual(
            legend(variant="detailed").resolve_variant(
                series_count=5, partitioned=True
            ),
            "detailed",
        )
        self.assertEqual(
            legend(variant="rows").resolve_variant(series_count=1, partitioned=False),
            "rows",
        )


class TestChartLegendWiring(unittest.TestCase):
    """`tvl.chart(legend=...)` lands in chartOptions with `auto` resolved."""

    def test_legend_true_is_shorthand_for_defaults(self):
        t = _table("Timestamp", "Value")
        by_bool = chart(
            line(t, timestamp="Timestamp", value="Value"), legend=True
        ).chart_options["legend"]
        by_obj = chart(
            line(t, timestamp="Timestamp", value="Value"), legend=legend()
        ).chart_options["legend"]
        self.assertEqual(by_bool, by_obj)

    def test_legend_false_emits_nothing(self):
        c = chart(
            line(_table("Timestamp", "Value"), timestamp="Timestamp", value="Value"),
            legend=False,
        )
        self.assertNotIn("legend", c.chart_options)

    def test_no_legend_option_by_default(self):
        c = chart(
            line(_table("Timestamp", "Value"), timestamp="Timestamp", value="Value")
        )
        self.assertNotIn("legend", c.chart_options)

    def test_legend_lands_in_chart_options(self):
        c = chart(
            line(_table("Timestamp", "Value"), timestamp="Timestamp", value="Value"),
            legend=legend(max_rows=2),
        )
        self.assertEqual(c.chart_options["legend"]["maxRows"], 2)

    def test_auto_resolves_to_detailed_for_single_series_chart(self):
        c = chart(
            line(_table("Timestamp", "Value"), timestamp="Timestamp", value="Value"),
            legend=legend(),
        )
        self.assertEqual(c.chart_options["legend"]["variant"], "detailed")

    def test_auto_resolves_to_rows_for_multi_series_chart(self):
        t = _table("Timestamp", "Value")
        c = chart(
            line(t, timestamp="Timestamp", value="Value"),
            line(t, timestamp="Timestamp", value="Value"),
            legend=legend(),
        )
        self.assertEqual(c.chart_options["legend"]["variant"], "rows")

    def test_auto_resolves_to_rows_for_partitioned_chart(self):
        spec = line(
            _table("Timestamp", "Value", "Sym"), timestamp="Timestamp", value="Value"
        )
        spec.series_list[0].by = "Sym"
        c = chart(spec, legend=legend())
        self.assertEqual(c.chart_options["legend"]["variant"], "rows")

    def test_legend_false_emits_nothing(self):
        c = chart(
            line(_table("Timestamp", "Value"), timestamp="Timestamp", value="Value"),
            legend=False,
        )
        self.assertNotIn("legend", c.chart_options)


class TestSeriesToggleHandler(unittest.TestCase):
    """`on_series_toggle` advertisement and event construction."""

    def test_handler_not_advertised_by_default(self):
        c = chart(
            line(_table("Timestamp", "Value"), timestamp="Timestamp", value="Value")
        )
        self.assertNotIn(SERIES_TOGGLE, c.enabled_handlers())

    def test_handler_advertised_when_wired(self):
        t = _table("Timestamp", "Value")
        c = chart(
            line(t, timestamp="Timestamp", value="Value"),
            legend=legend(),
            on_series_toggle=lambda e: None,
        )
        self.assertIn(SERIES_TOGGLE, c.enabled_handlers())
        # The figure payload must advertise it too, or JS never sends it.
        figure = c.to_dict({id(t): 0})
        self.assertIn(SERIES_TOGGLE, figure["enabledHandlers"])

    def test_handler_is_independent_of_the_legend(self):
        # A toggle handler is advertised even without a legend; harmless, and
        # keeps the advertisement rule the same as press.
        c = chart(
            line(_table("Timestamp", "Value"), timestamp="Timestamp", value="Value"),
            on_series_toggle=lambda e: None,
        )
        self.assertIn(SERIES_TOGGLE, c.enabled_handlers())

    def test_build_event_from_full_payload(self):
        event = build_series_toggle_event(
            {
                "series": "AAPL",
                "seriesId": "series_0_AAPL",
                "visible": False,
                "hiddenSeriesIds": ["series_0_AAPL"],
            }
        )
        self.assertEqual(
            event,
            {
                "type": "seriesToggle",
                "series": "AAPL",
                "seriesId": "series_0_AAPL",
                "visible": False,
                "hiddenSeriesIds": ["series_0_AAPL"],
            },
        )

    def test_build_event_omits_absent_fields(self):
        event = build_series_toggle_event({"visible": True})
        self.assertEqual(event, {"type": "seriesToggle", "visible": True})

    def test_build_event_defaults_visible_to_true(self):
        self.assertTrue(build_series_toggle_event({})["visible"])


class TestSeriesToggleDispatch(unittest.TestCase):
    """End-to-end EVENT routing for a legend toggle, through the listener."""

    def _listener(self, **handlers):
        chart_obj = TvlChart(
            series_list=[line_series(MagicMock(name="table"))],
            chart_options={},
            **handlers,
        )
        return TvlChartListener(chart_obj, MagicMock())

    @staticmethod
    def _message(**payload):
        base = {"series": "AAPL", "seriesId": "series_0", "visible": False}
        base.update(payload)
        return json.dumps(
            {"type": "EVENT", "handler": SERIES_TOGGLE, "payload": base}
        ).encode()

    def test_routes_to_the_toggle_handler(self):
        calls = []
        listener = self._listener(on_series_toggle=calls.append)

        listener.process_message(self._message(), [])

        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["type"], "seriesToggle")
        self.assertEqual(calls[0]["series"], "AAPL")
        self.assertEqual(calls[0]["seriesId"], "series_0")
        self.assertFalse(calls[0]["visible"])

    def test_toggle_does_not_reach_a_press_handler(self):
        press_calls, toggle_calls = [], []
        listener = self._listener(
            on_press=press_calls.append, on_series_toggle=toggle_calls.append
        )

        listener.process_message(self._message(), [])

        self.assertEqual(len(toggle_calls), 1)
        self.assertEqual(len(press_calls), 0)

    def test_unwired_toggle_is_ignored(self):
        listener = self._listener(on_press=lambda e: None)
        # No handler registered: the message is dropped, not an error.
        out, refs = listener.process_message(self._message(), [])
        self.assertEqual(out, b"")
        self.assertEqual(refs, [])

    def test_zero_arg_handler_is_accepted(self):
        calls = []
        listener = self._listener(on_series_toggle=lambda: calls.append(True))

        listener.process_message(self._message(), [])

        self.assertEqual(calls, [True])

    def test_handler_exception_does_not_kill_the_stream(self):
        def boom(event):
            raise RuntimeError("handler bug")

        listener = self._listener(on_series_toggle=boom)

        with self.assertLogs(level="ERROR"):
            out, refs = listener.process_message(self._message(), [])

        self.assertEqual(out, b"")

    def test_toggle_handler_alone_skips_time_type_resolution(self):
        # A toggle carries no timestamp, so the listener must not pay for
        # per-series time-column resolution when only a toggle is wired.
        listener = self._listener(on_series_toggle=lambda e: None)
        self.assertEqual(listener._series_time_types, [])


if __name__ == "__main__":
    unittest.main()
