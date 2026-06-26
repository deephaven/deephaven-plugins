"""Tests for press-event API surface (Phase 1).

Covers ``wrap_callable`` arity adaptation, the ``enabledHandlers`` advertised
in ``to_dict``, and that the per-type constructors and ``chart()`` forward
``on_press`` / ``on_double_press`` onto the resulting :class:`TvlChart`.
"""

from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import MagicMock

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight.chart import (  # noqa: E402
    TvlChart,
    chart,
    line,
    area,
    candlestick,
    bar,
    baseline,
    histogram,
)
from deephaven.plot.tradingview_lightweight.series import (  # noqa: E402
    line_series,
)
from deephaven.plot.tradingview_lightweight import events  # noqa: E402
from deephaven.plot.tradingview_lightweight.events import wrap_callable  # noqa: E402


class TestWrapCallable(unittest.TestCase):
    def test_zero_arg_handler_invoked_with_no_args(self):
        seen = []
        wrapped = wrap_callable(lambda: seen.append("called"))
        wrapped({"type": "press"})  # surplus arg dropped
        self.assertEqual(seen, ["called"])

    def test_one_arg_handler_receives_event(self):
        seen = []
        wrapped = wrap_callable(lambda e: seen.append(e))
        evt = {"type": "press", "seriesId": "series_0"}
        wrapped(evt)
        self.assertEqual(seen, [evt])

    def test_var_positional_handler_receives_event(self):
        seen = []
        wrapped = wrap_callable(lambda *a: seen.append(a))
        wrapped({"type": "press"})
        self.assertEqual(seen, [({"type": "press"},)])

    def test_def_one_arg(self):
        captured = {}

        def handler(event):
            captured["event"] = event

        wrap_callable(handler)({"type": "doublePress"})
        self.assertEqual(captured["event"], {"type": "doublePress"})

    def test_builtin_without_signature_returns_callable(self):
        # print() has no introspectable signature in some builds; wrapping
        # must not raise and the result must remain callable.
        wrapped = wrap_callable(print)
        self.assertTrue(callable(wrapped))


class TestEnabledHandlers(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_no_handlers_no_key(self):
        c = TvlChart(series_list=[line_series(self.table)], chart_options={})
        self.assertEqual(c.enabled_handlers(), [])
        self.assertNotIn("enabledHandlers", c.to_dict({id(self.table): 0}))

    def test_press_only(self):
        c = TvlChart(
            series_list=[line_series(self.table)],
            chart_options={},
            on_press=lambda e: None,
        )
        self.assertEqual(c.enabled_handlers(), ["press"])
        d = c.to_dict({id(self.table): 0})
        self.assertEqual(d["enabledHandlers"], ["press"])

    def test_double_press_only(self):
        c = TvlChart(
            series_list=[line_series(self.table)],
            chart_options={},
            on_double_press=lambda: None,
        )
        self.assertEqual(c.enabled_handlers(), ["doublePress"])

    def test_both_handlers_order(self):
        c = TvlChart(
            series_list=[line_series(self.table)],
            chart_options={},
            on_press=lambda e: None,
            on_double_press=lambda e: None,
        )
        self.assertEqual(c.enabled_handlers(), ["press", "doublePress"])
        self.assertEqual(
            c.to_dict({id(self.table): 0})["enabledHandlers"],
            ["press", "doublePress"],
        )


class TestConstructorForwarding(unittest.TestCase):
    def setUp(self):
        self.table = MagicMock(name="table")

    def test_line_forwards_handlers(self):
        p = lambda e: None
        dp = lambda: None
        c = line(self.table, "T", "V", on_press=p, on_double_press=dp)
        self.assertIs(c.on_press, p)
        self.assertIs(c.on_double_press, dp)
        self.assertEqual(c.enabled_handlers(), ["press", "doublePress"])
        # Handlers must NOT leak into the series spec / column mapping.
        self.assertEqual(len(c.series_list), 1)

    def test_all_per_type_constructors_accept_handlers(self):
        p = lambda e: None
        constructors = [
            lambda: line(self.table, "T", "V", on_press=p),
            lambda: area(self.table, "T", "V", on_press=p),
            lambda: candlestick(self.table, on_press=p),
            lambda: bar(self.table, on_press=p),
            lambda: baseline(self.table, "T", "V", on_press=p),
            lambda: histogram(self.table, "T", "V", on_press=p),
        ]
        for make in constructors:
            c = make()
            self.assertIs(c.on_press, p)
            self.assertEqual(c.enabled_handlers(), ["press"])

    def test_chart_handlers_win_over_source(self):
        # tvl.chart(...) discards source chart-level state; its own handlers
        # apply. The source's handler is dropped (documented behavior).
        src_handler = lambda e: None
        chart_handler = lambda e: None
        src = line(self.table, "T", "V", on_press=src_handler)
        composed = chart(src, on_double_press=chart_handler)
        self.assertIsNone(composed.on_press)
        self.assertIs(composed.on_double_press, chart_handler)
        self.assertEqual(composed.enabled_handlers(), ["doublePress"])


if __name__ == "__main__":
    unittest.main()
