"""Tests for press-event dispatch (Phase 3): registry, EVENT routing,
arity, exec-context / liveness wrapping, exception swallowing, and the
ns -> datetime time conversion.
"""

from __future__ import annotations

import contextlib
import json
import os
import sys
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight.chart import TvlChart, line  # noqa: E402
from deephaven.plot.tradingview_lightweight.series import line_series  # noqa: E402
from deephaven.plot.tradingview_lightweight import events as events_module  # noqa: E402
from deephaven.plot.tradingview_lightweight.events import (  # noqa: E402
    ns_to_datetime,
    ns_to_instant,
    build_press_event,
    time_converter_for,
)
from deephaven.plot.tradingview_lightweight.communication import (  # noqa: E402
    listener as listener_module,
)

TvlChartListener = listener_module.TvlChartListener


class _FakeDType:
    def __init__(self, j_name):
        self.j_name = j_name


class _FakeColumn:
    def __init__(self, name, j_name):
        self.name = name
        self.data_type = _FakeDType(j_name)


def _table_with_time_type(j_name, time_col="Timestamp"):
    """A mock table whose ``columns`` exposes one typed time column."""
    table = MagicMock(name="table")
    table.columns = [_FakeColumn(time_col, j_name), _FakeColumn("Value", "double")]
    return table


def _event_message(handler="press", **payload):
    base = {
        "type": "press",
        "shiftKey": False,
        "ctrlKey": False,
        "metaKey": False,
        "altKey": False,
    }
    base.update(payload)
    return json.dumps({"type": "EVENT", "handler": handler, "payload": base}).encode()


class TestNsToDatetime(unittest.TestCase):
    def test_whole_second(self):
        # 2021-01-01T00:00:00Z = 1609459200 s
        dt = ns_to_datetime(1_609_459_200 * 1_000_000_000)
        self.assertEqual(dt, datetime(2021, 1, 1, tzinfo=timezone.utc))

    def test_sub_second_microsecond_precision(self):
        dt = ns_to_datetime(1_609_459_200 * 1_000_000_000 + 123_456_789)
        self.assertEqual(dt.microsecond, 123_456)  # ns truncated to us
        self.assertEqual(dt.tzinfo, timezone.utc)


class TestBuildPressEvent(unittest.TestCase):
    def test_full_payload(self):
        evt = build_press_event(
            "press",
            {
                "seriesId": "series_0",
                "price": 10.5,
                "seriesData": {"series_0": 10.5},
                "point": {"x": 100, "y": 200},
                "paneIndex": 0,
                "timeNs": 1_609_459_200 * 1_000_000_000,
                "shiftKey": True,
                "ctrlKey": False,
                "metaKey": False,
                "altKey": False,
            },
        )
        self.assertEqual(evt["type"], "press")
        self.assertEqual(evt["seriesId"], "series_0")
        self.assertEqual(evt["price"], 10.5)
        self.assertEqual(evt["point"], {"x": 100, "y": 200})
        self.assertEqual(evt["paneIndex"], 0)
        self.assertTrue(evt["shiftKey"])
        self.assertEqual(evt["time"], datetime(2021, 1, 1, tzinfo=timezone.utc))

    def test_empty_area_omits_time_and_series(self):
        evt = build_press_event("press", {})
        self.assertNotIn("time", evt)
        self.assertNotIn("seriesId", evt)
        self.assertNotIn("price", evt)
        # modifiers always present
        self.assertEqual(evt["shiftKey"], False)
        self.assertEqual(evt["altKey"], False)

    def test_double_press_type(self):
        evt = build_press_event("doublePress", {})
        self.assertEqual(evt["type"], "doublePress")

    def test_uses_injected_time_converter(self):
        evt = build_press_event(
            "press",
            {"timeNs": 42},
            time_converter=lambda ns: ("converted", ns),
        )
        self.assertEqual(evt["time"], ("converted", 42))

    def test_bad_converter_falls_back_to_datetime(self):
        def boom(_ns):
            raise RuntimeError("no JVM")

        evt = build_press_event(
            "press", {"timeNs": 1_609_459_200 * 1_000_000_000}, time_converter=boom
        )
        # A failing converter must not lose the press; degrade to datetime.
        self.assertEqual(evt["time"], datetime(2021, 1, 1, tzinfo=timezone.utc))


class TestTimeConverterFor(unittest.TestCase):
    def test_instant_type(self):
        self.assertIs(time_converter_for("java.time.Instant"), ns_to_instant)

    def test_unknown_and_none_fall_back_to_datetime(self):
        self.assertIs(time_converter_for(None), ns_to_datetime)
        self.assertIs(time_converter_for("java.time.LocalDate"), ns_to_datetime)
        self.assertIs(time_converter_for("double"), ns_to_datetime)

    def test_zoned_returns_distinct_converter(self):
        conv = time_converter_for("java.time.ZonedDateTime", "America/New_York")
        # A dedicated zoned converter, not the instant/datetime ones.
        self.assertIsNot(conv, ns_to_datetime)
        self.assertIsNot(conv, ns_to_instant)
        self.assertTrue(callable(conv))


class TestSeriesIndexParsing(unittest.TestCase):
    def test_plain_id(self):
        self.assertEqual(listener_module._series_index("series_0"), 0)
        self.assertEqual(listener_module._series_index("series_12"), 12)

    def test_partitioned_id_keeps_leading_index(self):
        self.assertEqual(listener_module._series_index("series_0_BBB"), 0)
        self.assertEqual(listener_module._series_index("series_3_AAA_X"), 3)

    def test_non_series_ids(self):
        for bad in (None, "", "foo", "series_", "series_x", 5):
            self.assertIsNone(listener_module._series_index(bad))


class TestCommonTimeType(unittest.TestCase):
    def test_all_same(self):
        self.assertEqual(
            listener_module._common_time_type(["java.time.Instant"] * 3),
            "java.time.Instant",
        )

    def test_mixed_or_unresolved_is_none(self):
        self.assertIsNone(
            listener_module._common_time_type(
                ["java.time.Instant", "java.time.ZonedDateTime"]
            )
        )
        self.assertIsNone(
            listener_module._common_time_type(["java.time.Instant", None])
        )
        self.assertIsNone(listener_module._common_time_type([]))


class TestRegistry(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_registry_only_wired_handlers(self):
        chart = TvlChart(
            series_list=[line_series(self.table)],
            chart_options={},
            on_press=lambda e: None,
        )
        listener = TvlChartListener(chart, MagicMock())
        self.assertIn("press", listener._handlers)
        self.assertNotIn("doublePress", listener._handlers)

    def test_no_handlers_empty_registry(self):
        chart = TvlChart(series_list=[line_series(self.table)], chart_options={})
        listener = TvlChartListener(chart, MagicMock())
        self.assertEqual(listener._handlers, {})


class TestListenerTimeTypeResolution(unittest.TestCase):
    def _listener(self, table, **handlers):
        chart = TvlChart(series_list=[line_series(table)], chart_options={}, **handlers)
        return TvlChartListener(chart, MagicMock())

    def test_resolves_instant_column(self):
        listener = self._listener(
            _table_with_time_type("java.time.Instant"), on_press=lambda e: None
        )
        self.assertEqual(listener._series_time_types, ["java.time.Instant"])
        self.assertEqual(listener._default_time_type, "java.time.Instant")

    def test_hit_series_drives_type(self):
        listener = self._listener(
            _table_with_time_type("java.time.ZonedDateTime"), on_press=lambda e: None
        )
        # Press names series_0 → that series' zoned column wins.
        self.assertEqual(
            listener._time_type_for_payload({"seriesId": "series_0"}),
            "java.time.ZonedDateTime",
        )
        # Press between lines (no seriesId) → chart default (homogeneous here).
        self.assertEqual(listener._time_type_for_payload({}), "java.time.ZonedDateTime")

    def test_no_handlers_skips_resolution(self):
        listener = self._listener(_table_with_time_type("java.time.Instant"))
        self.assertEqual(listener._series_time_types, [])
        self.assertIsNone(listener._default_time_type)

    def test_typeless_table_resolves_none(self):
        # Mock table without a real columns schema → datetime fallback.
        listener = self._listener(MagicMock(name="table"), on_press=lambda e: None)
        self.assertEqual(listener._series_time_types, [None])
        self.assertIsNone(listener._default_time_type)


class TestDispatch(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def _listener(self, **handlers):
        chart = TvlChart(
            series_list=[line_series(self.table)], chart_options={}, **handlers
        )
        return TvlChartListener(chart, MagicMock())

    def test_routes_to_correct_callable(self):
        press_calls, dbl_calls = [], []
        listener = self._listener(
            on_press=lambda e: press_calls.append(e),
            on_double_press=lambda e: dbl_calls.append(e),
        )
        listener.process_message(_event_message("press", seriesId="series_0"), [])
        self.assertEqual(len(press_calls), 1)
        self.assertEqual(len(dbl_calls), 0)
        self.assertEqual(press_calls[0]["seriesId"], "series_0")

        listener.process_message(_event_message("doublePress"), [])
        self.assertEqual(len(dbl_calls), 1)

    def test_zero_arg_handler(self):
        seen = []
        listener = self._listener(on_press=lambda: seen.append("called"))
        listener.process_message(_event_message("press"), [])
        self.assertEqual(seen, ["called"])

    def test_one_arg_handler_receives_event(self):
        seen = []
        listener = self._listener(on_press=lambda e: seen.append(e))
        listener.process_message(
            _event_message("press", price=42.0, seriesId="series_0"), []
        )
        self.assertEqual(seen[0]["price"], 42.0)

    def test_unknown_handler_is_noop(self):
        listener = self._listener(on_press=lambda e: None)
        out, refs = listener.process_message(_event_message("doublePress"), [])
        self.assertEqual(out, b"")
        self.assertEqual(refs, [])

    def test_event_produces_no_response(self):
        listener = self._listener(on_press=lambda e: None)
        out, refs = listener.process_message(_event_message("press"), [])
        self.assertEqual(out, b"")
        self.assertEqual(refs, [])

    def test_handler_exception_is_swallowed(self):
        def boom(e):
            raise RuntimeError("handler bug")

        listener = self._listener(on_press=boom)
        # Must not raise; stream survives.
        out, refs = listener.process_message(_event_message("press"), [])
        self.assertEqual(out, b"")

    def test_exec_ctx_and_liveness_wrapping(self):
        order = []

        @contextlib.contextmanager
        def fake_exec_ctx():
            order.append("ctx-enter")
            yield
            order.append("ctx-exit")

        @contextlib.contextmanager
        def fake_liveness():
            order.append("liveness-enter")
            yield
            order.append("liveness-exit")

        chart = TvlChart(
            series_list=[line_series(self.table)],
            chart_options={},
            on_press=lambda e: order.append("handler"),
        )
        listener = TvlChartListener(chart, MagicMock(), exec_ctx=fake_exec_ctx())

        orig = listener_module.liveness_scope
        listener_module.liveness_scope = fake_liveness
        try:
            listener.process_message(_event_message("press"), [])
        finally:
            listener_module.liveness_scope = orig

        self.assertEqual(
            order,
            ["ctx-enter", "liveness-enter", "handler", "liveness-exit", "ctx-exit"],
        )

    def test_handler_can_mutate_external_state(self):
        # Stand-in for "a table op in a handler succeeds": the handler does
        # real work (here, mutating a shared structure) and it takes effect.
        state = {"count": 0}
        listener = self._listener(
            on_press=lambda e: state.__setitem__("count", state["count"] + 1)
        )
        listener.process_message(_event_message("press"), [])
        listener.process_message(_event_message("press"), [])
        self.assertEqual(state["count"], 2)


if __name__ == "__main__":
    unittest.main()
