"""Tests for the TvlChartListener auto-bin dispatch logic.

These tests focus on the eligibility-decision and message-dispatch paths
without exercising real Deephaven aggregation. The aggregation primitives
(``build_histogram_view`` / ``build_ohlc_view``) are mocked to return a
sentinel object and the per-table ``size`` attribute drives the threshold
decisions.
"""

from __future__ import annotations

import json
import os
import sys
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

# Mock deephaven.plugin before any plugin imports trigger it
sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight import auto_bin  # noqa: E402
from deephaven.plot.tradingview_lightweight.communication import (  # noqa: E402
    listener as listener_module,
)


def _fake_table(size: int, is_refreshing: bool = True) -> SimpleNamespace:
    """Minimal stand-in for a DH Table — enough for eligibility checks."""
    return SimpleNamespace(size=size, is_refreshing=is_refreshing)


def _make_series(
    table: SimpleNamespace,
    series_type: str,
    column_mapping: dict | None = None,
    *,
    auto_bin: object = None,
    bin_width: object = None,
    bin_count: object = None,
    agg: object = None,
):
    if column_mapping is None:
        if series_type == "Histogram":
            column_mapping = {"time": "Timestamp", "value": "Volume"}
        elif series_type in {"Candlestick", "Bar"}:
            column_mapping = {
                "time": "Timestamp",
                "open": "Open",
                "high": "High",
                "low": "Low",
                "close": "Close",
            }
        else:
            column_mapping = {"time": "Timestamp", "value": "Value"}
    return SimpleNamespace(
        series_type=series_type,
        table=table,
        column_mapping=column_mapping,
        auto_bin=auto_bin,
        bin_width=bin_width,
        bin_count=bin_count,
        agg=agg,
        marker_spec=None,
        by=None,
        partitioned_table=None,
    )


def _make_chart(series_list, chart_type: str = "standard") -> SimpleNamespace:
    """Minimal stand-in for TvlChart."""
    seen = []
    tables = []
    for s in series_list:
        if id(s.table) not in seen:
            seen.append(id(s.table))
            tables.append(s.table)
    return SimpleNamespace(
        series_list=series_list,
        chart_type=chart_type,
        get_tables=lambda: tables,
        to_dict=lambda tid_map: {
            "chartType": chart_type,
            "chartOptions": {},
            "series": [
                {
                    "id": f"series_{i}",
                    "type": s.series_type,
                    "options": {},
                    "dataMapping": {
                        "tableId": tid_map[id(s.table)],
                        "columns": s.column_mapping,
                    },
                }
                for i, s in enumerate(series_list)
            ],
        },
    )


@pytest.fixture(autouse=True)
def _stub_aggregation(monkeypatch: pytest.MonkeyPatch):
    """Replace the real aggregation primitives with sentinel-returning fakes."""
    range_ns = (1_700_000_000_000_000_000, 1_700_086_400_000_000_000)  # 1 day
    monkeypatch.setattr(auto_bin, "get_full_range_ns", lambda table, time_col: range_ns)

    def _fake_hist(
        raw,
        time_col,
        value_col,
        bin_width_ns,
        agg_mode="sum",
        color_col=None,
        *,
        body_range_ns=None,
        full_range_ns=None,
    ):
        return SimpleNamespace(
            kind="hist",
            raw=raw,
            bin_width_ns=bin_width_ns,
            agg=agg_mode,
            body_range_ns=body_range_ns,
            full_range_ns=full_range_ns,
        )

    def _fake_ohlc(
        raw,
        time_col,
        o,
        h,
        l,
        c,
        bin_width_ns,
        *,
        body_range_ns=None,
        full_range_ns=None,
    ):
        return SimpleNamespace(
            kind="ohlc",
            raw=raw,
            bin_width_ns=bin_width_ns,
            body_range_ns=body_range_ns,
            full_range_ns=full_range_ns,
        )

    monkeypatch.setattr(auto_bin, "build_histogram_view", _fake_hist)
    monkeypatch.setattr(auto_bin, "build_ohlc_view", _fake_ohlc)


def _retrieve(listener) -> dict:
    payload, _refs = listener.process_message(
        json.dumps({"type": "RETRIEVE"}).encode(), []
    )
    return json.loads(payload.decode())


class TestEligibility:
    def test_default_large_histogram_triggers_autobin(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Histogram")
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert "autoBinMeta" in msg["figure"]
        assert "1" in msg["figure"]["autoBinMeta"]

    def test_default_small_histogram_skips_autobin(self):
        small_table = _fake_table(size=10)
        series = _make_series(small_table, "Histogram")
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert "autoBinMeta" not in msg["figure"]

    def test_auto_bin_false_opts_out(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Histogram", auto_bin=False)
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert "autoBinMeta" not in msg["figure"]

    def test_auto_bin_true_forces_small_table(self):
        small_table = _fake_table(size=5)
        series = _make_series(small_table, "Histogram", auto_bin=True)
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert "autoBinMeta" in msg["figure"]

    def test_yield_curve_chart_skips_autobin(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Histogram")
        chart = _make_chart([series], chart_type="yieldCurve")
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert "autoBinMeta" not in msg["figure"]

    def test_line_series_does_not_autobin(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Line")
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert "autoBinMeta" not in msg["figure"]
        # But it should still flag for JS-side downsample
        assert "downsampleMeta" in msg["figure"]

    def test_candlestick_triggers_autobin_with_distinct_cols(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Candlestick")
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert "autoBinMeta" in msg["figure"]
        meta = msg["figure"]["autoBinMeta"]["1"]
        assert meta["series"]["series_0"]["agg"] == "ohlc"


class TestBinWidthChoice:
    def test_default_uses_nice_bin_width(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Histogram")
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        bw = msg["figure"]["autoBinMeta"]["1"]["binWidthNs"]
        assert bw in auto_bin.NICE_BIN_WIDTHS_NS

    def test_explicit_bin_width_overrides(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Histogram", bin_width="PT1M")
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert msg["figure"]["autoBinMeta"]["1"]["binWidthNs"] == 60 * 10**9

    def test_explicit_bin_count_overrides_target(self):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Histogram", bin_count=200)
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        msg = _retrieve(listener)
        assert msg["figure"]["autoBinMeta"]["1"]["targetBins"] == 200


class TestAutoBinMessages:
    def _setup(self, *, range_ns=None):
        big_table = _fake_table(size=1_000_000)
        series = _make_series(big_table, "Histogram")
        chart = _make_chart([series])
        listener = listener_module.TvlChartListener(chart, MagicMock())
        _retrieve(listener)
        return listener

    def test_zoom_with_unknown_table_ref_returns_empty(self):
        listener = self._setup()
        payload, _refs = listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 99,
                    "fromNs": 0,
                    "toNs": 1,
                }
            ).encode(),
            [],
        )
        assert payload == b""

    def test_repeated_identical_zoom_is_noop(self):
        """Sending the same AUTOBIN_ZOOM twice should not rebuild the second
        time — bin width and range are unchanged so nothing has shifted."""
        listener = self._setup()
        msg = {
            "type": "AUTOBIN_ZOOM",
            "tableRef": 1,
            "fromNs": 1_700_000_000_000_000_000,
            "toNs": 1_700_010_000_000_000_000,
        }
        # First call rebuilds.
        listener.process_message(json.dumps(msg).encode(), [])
        # Second identical call is a no-op.
        payload, _refs = listener.process_message(json.dumps(msg).encode(), [])
        assert payload != b""
        ack = json.loads(payload.decode())
        assert ack["type"] == "AUTOBIN_FIGURE"
        assert ack.get("noop") is True

    def test_zoom_below_resolution_rebuilds(self):
        listener = self._setup()
        # Visible window of 1ms — far below the default bin width of seconds.
        payload, refs = listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": 0,
                    "toNs": 1_000_000,  # 1ms
                }
            ).encode(),
            [],
        )
        assert payload != b""
        msg = json.loads(payload.decode())
        assert msg["type"] == "AUTOBIN_FIGURE"
        assert msg.get("noop") is not True
        # The reference list contains the original table at idx 0 and the
        # rebuilt aggregated table at idx 1.
        assert len(refs) == 2

    def test_zoom_out_after_zoom_in_coarsens_bins(self):
        """Zooming back out past target_bins * MAX_VISIBLE_BINS_RATIO triggers
        a rebuild at a coarser width. Without this the chart stays at the
        previously-zoomed-in fine bin width and looks sub-pixel-dense."""
        listener = self._setup()
        # Force a zoom-in to a tight window so bin_width gets very fine.
        listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": 0,
                    "toNs": 1_000_000,  # 1 ms
                }
            ).encode(),
            [],
        )
        state = listener._autobin_states[1]
        fine_width = state.bin_width_ns
        assert fine_width != state.initial_bin_width_ns

        # Now zoom back out to the full range. With the fine width, that's
        # way more than target_bins * MAX_VISIBLE_BINS_RATIO visible bins,
        # so the server must coarsen.
        full = 86_400_000_000_000  # 1 day
        payload, _refs = listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": 0,
                    "toNs": full,
                }
            ).encode(),
            [],
        )
        msg = json.loads(payload.decode())
        assert msg["type"] == "AUTOBIN_FIGURE"
        assert msg.get("noop") is not True
        # Bins should have coarsened (numerically larger bin_width_ns).
        assert state.bin_width_ns > fine_width

    def test_reset_after_zoom_restores_initial_width(self):
        listener = self._setup()
        # First, force a re-aggregation to a finer width.
        listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": 0,
                    "toNs": 1_000_000,
                }
            ).encode(),
            [],
        )
        state = listener._autobin_states[1]
        assert state.bin_width_ns != state.initial_bin_width_ns

        # Now reset
        payload, _refs = listener.process_message(
            json.dumps({"type": "AUTOBIN_RESET", "tableRef": 1}).encode(), []
        )
        msg = json.loads(payload.decode())
        assert msg["type"] == "AUTOBIN_FIGURE"
        assert state.bin_width_ns == state.initial_bin_width_ns

    def test_zoom_inside_full_range_scopes_body(self):
        """A zoom strictly inside the source extent should rebuild with
        body_range_ns set to the visible window — head/tail anchors flank
        it. The aggregation table reflects (from, to) as the body bounds."""
        listener = self._setup()
        from_ns = 1_700_000_000_000_000_000 + 1_000_000
        to_ns = 1_700_000_000_000_000_000 + 1_000_000_000  # 1s window
        payload, _refs = listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": from_ns,
                    "toNs": to_ns,
                }
            ).encode(),
            [],
        )
        msg = json.loads(payload.decode())
        assert msg["type"] == "AUTOBIN_FIGURE"
        assert msg.get("noop") is not True
        state = listener._autobin_states[1]
        assert state.body_range_ns == (from_ns, to_ns)
        # The fake aggregation primitive captures body_range_ns.
        assert state.aggregated_table.body_range_ns == (from_ns, to_ns)
        assert state.aggregated_table.full_range_ns == state.full_range_ns

    def test_zoom_at_live_edge_extends_body_to_max_long(self):
        """When atLiveEdge is set, body_range_ns[1] becomes MAX_LONG so
        live ticks past the visible window's right edge land in the body."""
        listener = self._setup()
        max_long = (1 << 63) - 1
        from_ns = 1_700_000_000_000_000_000 + 1_000_000
        to_ns = 1_700_086_000_000_000_000  # near full_end
        payload, _refs = listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": from_ns,
                    "toNs": to_ns,
                    "atLiveEdge": True,
                }
            ).encode(),
            [],
        )
        msg = json.loads(payload.decode())
        assert msg["type"] == "AUTOBIN_FIGURE"
        state = listener._autobin_states[1]
        assert state.body_range_ns == (from_ns, max_long)

    def test_reset_clears_body_range(self):
        """After a scoped zoom, AUTOBIN_RESET must clear body_range_ns so
        the aggregation reverts to a full-source build (no anchors)."""
        listener = self._setup()
        listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": 0,
                    "toNs": 1_000_000,
                }
            ).encode(),
            [],
        )
        state = listener._autobin_states[1]
        assert state.body_range_ns is not None

        listener.process_message(
            json.dumps({"type": "AUTOBIN_RESET", "tableRef": 1}).encode(), []
        )
        assert state.body_range_ns is None

    def test_pan_with_unchanged_width_still_rebuilds(self):
        """Pan changes the body window even when bin width is the same.
        The old viewport-shift path treated this as a no-op; with body
        scoping the server must rebuild so the body covers the new
        window."""
        listener = self._setup()
        # First scoped zoom to establish body + a fine width.
        listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": 0,
                    "toNs": 1_000_000_000,  # 1s window
                }
            ).encode(),
            [],
        )
        state = listener._autobin_states[1]
        width_after_zoom = state.bin_width_ns
        # Now pan to the right by the same window duration → bin_width
        # stays the same (same visible_ns) but body_range moves.
        payload, _refs = listener.process_message(
            json.dumps(
                {
                    "type": "AUTOBIN_ZOOM",
                    "tableRef": 1,
                    "fromNs": 1_000_000_000,
                    "toNs": 2_000_000_000,
                }
            ).encode(),
            [],
        )
        msg = json.loads(payload.decode())
        assert msg["type"] == "AUTOBIN_FIGURE"
        assert msg.get("noop") is not True
        assert state.bin_width_ns == width_after_zoom
        assert state.body_range_ns == (1_000_000_000, 2_000_000_000)

    def test_unknown_message_type_returns_empty(self):
        listener = self._setup()
        payload, _refs = listener.process_message(
            json.dumps({"type": "BOGUS"}).encode(), []
        )
        assert payload == b""

    def test_invalid_payload_returns_empty(self):
        listener = self._setup()
        payload, _refs = listener.process_message(b"not json", [])
        assert payload == b""


class TestAutoBinThresholdEnv:
    def test_threshold_overridable_via_env(self, monkeypatch: pytest.MonkeyPatch):
        # Reload to re-evaluate env var
        monkeypatch.setenv("TVL_AUTO_BIN_THRESHOLD", "100")
        import importlib

        importlib.reload(listener_module)
        try:
            assert listener_module.AUTO_BIN_THRESHOLD == 100
        finally:
            monkeypatch.delenv("TVL_AUTO_BIN_THRESHOLD")
            importlib.reload(listener_module)
