"""Unit tests for auto_bin pure helpers (nice_bin_width, parse_bin_width)."""

from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock

import pytest

# Add src to path for namespace package resolution
sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

# Mock deephaven.plugin before any plugin imports trigger it
sys.modules.setdefault("deephaven.plugin", MagicMock())
sys.modules.setdefault("deephaven.plugin.object_type", MagicMock())
sys.modules.setdefault("deephaven.plugin.utilities", MagicMock())

from deephaven.plot.tradingview_lightweight import auto_bin  # noqa: E402


class TestNiceBinWidth:
    def test_zero_or_negative_range_returns_one(self) -> None:
        assert auto_bin.nice_bin_width(0, 1000) == 1
        assert auto_bin.nice_bin_width(-1, 1000) == 1

    def test_target_zero_returns_one(self) -> None:
        assert auto_bin.nice_bin_width(1_000_000, 0) == 1

    def test_returns_value_from_nice_set(self) -> None:
        for range_ns in [10**3, 10**6, 10**9, 60 * 10**9, 24 * 3600 * 10**9]:
            w = auto_bin.nice_bin_width(range_ns, 5000)
            assert (
                w in auto_bin.NICE_BIN_WIDTHS_NS
            ), f"{range_ns}/{5000} -> {w} not in nice set"

    def test_one_day_target_5000_picks_seconds(self) -> None:
        # 1 day / 5000 = ~17.28s -> nearest >= is 30s
        day_ns = 24 * 3600 * 10**9
        w = auto_bin.nice_bin_width(day_ns, 5000)
        assert w == 30 * 10**9

    def test_one_hour_target_60_picks_one_minute(self) -> None:
        hour_ns = 3600 * 10**9
        # 3600 / 60 = 60s -> nearest >=60s is 60s (1m)
        w = auto_bin.nice_bin_width(hour_ns, 60)
        assert w == 60 * 10**9

    def test_huge_range_caps_at_largest(self) -> None:
        # 100 years
        century_ns = 100 * 365 * 24 * 3600 * 10**9
        w = auto_bin.nice_bin_width(century_ns, 1)
        assert w == auto_bin.NICE_BIN_WIDTHS_NS[-1]

    def test_tiny_range_picks_smallest(self) -> None:
        w = auto_bin.nice_bin_width(1, 1000)
        assert w == 1

    def test_monotonic_in_range(self) -> None:
        # As range_ns grows, the chosen width is non-decreasing.
        prev = 0
        for r in [
            10**3,
            10**6,
            10**9,
            60 * 10**9,
            3600 * 10**9,
            86400 * 10**9,
        ]:
            w = auto_bin.nice_bin_width(r, 5000)
            assert w >= prev
            prev = w


class TestParseBinWidth:
    def test_int_passthrough(self) -> None:
        assert auto_bin.parse_bin_width(123_456) == 123_456

    def test_int_zero_or_negative_raises(self) -> None:
        with pytest.raises(ValueError):
            auto_bin.parse_bin_width(0)
        with pytest.raises(ValueError):
            auto_bin.parse_bin_width(-1)

    def test_pt1s(self) -> None:
        assert auto_bin.parse_bin_width("PT1S") == 1_000_000_000

    def test_pt5m(self) -> None:
        assert auto_bin.parse_bin_width("PT5M") == 5 * 60 * 1_000_000_000

    def test_pt1h(self) -> None:
        assert auto_bin.parse_bin_width("PT1H") == 3600 * 1_000_000_000

    def test_p1d(self) -> None:
        assert auto_bin.parse_bin_width("P1D") == 24 * 3600 * 1_000_000_000

    def test_combined(self) -> None:
        # 1 day + 2h + 30m + 15s
        expected = (24 * 3600 + 2 * 3600 + 30 * 60 + 15) * 1_000_000_000
        assert auto_bin.parse_bin_width("P1DT2H30M15S") == expected

    def test_fractional_seconds(self) -> None:
        # 0.5s = 500ms = 500_000_000 ns
        assert auto_bin.parse_bin_width("PT0.5S") == 500_000_000

    @pytest.mark.parametrize(
        "spec",
        ["", "P", "1H", "PT", "P1Y", "PT-1S", "abc", None],
    )
    def test_invalid_raises(self, spec: object) -> None:
        with pytest.raises(ValueError):
            auto_bin.parse_bin_width(spec)

    def test_non_string_non_int_raises(self) -> None:
        with pytest.raises(ValueError):
            auto_bin.parse_bin_width(1.5)


class TestHistogramApi:
    """Surface-level checks on build_histogram_view: agg validation, missing DH."""

    def test_invalid_agg_raises(self) -> None:
        with pytest.raises(ValueError):
            auto_bin.build_histogram_view(
                None, "T", "V", 1_000_000_000, agg_mode="median"
            )

    def test_zero_bin_width_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        # Force agg to be non-None so we get past the import check
        monkeypatch.setattr(auto_bin, "agg", object())
        with pytest.raises(ValueError):
            auto_bin.build_histogram_view(None, "T", "V", 0)


class TestScopedView:
    """``_build_scoped_view`` routes between full-source and head+body+tail
    builds based on whether body_range_ns is strictly inside full_range_ns."""

    def _patches(self, monkeypatch: pytest.MonkeyPatch) -> dict:
        """Mock the helpers so the routing logic can be observed without DH."""
        calls: dict = {"common": [], "anchor": [], "merge": []}

        def fake_common(raw, time_col, bw, aggs, out):
            calls["common"].append({"raw": raw, "bw": bw, "out": tuple(out)})
            return MagicMock(name="common", bin_width_ns=bw, body=False)

        def fake_anchor(raw, time_col, slice_filter, aggs, out, time_pos):
            calls["anchor"].append({"filter": slice_filter, "time_pos": time_pos})
            return MagicMock(name=f"anchor_{time_pos}")

        class _MergedTable:
            def __init__(self, parts):
                self.parts = parts

            def sort(self, time_col):
                self.sorted_by = time_col
                return self

        def fake_merge(parts):
            calls["merge"].append(parts)
            return _MergedTable(parts)

        monkeypatch.setattr(auto_bin, "_common_aggregated_view", fake_common)
        monkeypatch.setattr(auto_bin, "_build_anchor", fake_anchor)
        monkeypatch.setattr(auto_bin, "dh_merge", fake_merge)
        monkeypatch.setattr(auto_bin, "agg", MagicMock())
        return calls

    def test_no_body_range_uses_full_path(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        calls = self._patches(monkeypatch)
        auto_bin.build_histogram_view(object(), "T", "V", 1_000_000_000, agg_mode="sum")
        assert len(calls["common"]) == 1
        assert calls["anchor"] == []
        assert calls["merge"] == []

    def test_body_covers_full_uses_full_path(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        calls = self._patches(monkeypatch)
        auto_bin.build_histogram_view(
            object(),
            "T",
            "V",
            1_000_000_000,
            agg_mode="sum",
            body_range_ns=(0, 1_000),
            full_range_ns=(0, 1_000),
        )
        assert len(calls["common"]) == 1
        assert calls["anchor"] == []

    def test_body_strictly_inside_uses_scoped_path(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        calls = self._patches(monkeypatch)
        auto_bin.build_histogram_view(
            MagicMock(name="raw"),
            "T",
            "V",
            1_000_000_000,
            agg_mode="sum",
            body_range_ns=(100, 900),
            full_range_ns=(0, 1_000),
        )
        # One body call (common) + two anchors (head, tail) + one merge.
        assert len(calls["common"]) == 1
        assert {a["time_pos"] for a in calls["anchor"]} == {"first", "last"}
        assert len(calls["merge"]) == 1

    def test_ohlc_scoped_path(self, monkeypatch: pytest.MonkeyPatch) -> None:
        calls = self._patches(monkeypatch)
        auto_bin.build_ohlc_view(
            MagicMock(name="raw"),
            "T",
            "O",
            "H",
            "L",
            "C",
            1_000_000_000,
            body_range_ns=(100, 900),
            full_range_ns=(0, 1_000),
        )
        assert len(calls["common"]) == 1
        assert {a["time_pos"] for a in calls["anchor"]} == {"first", "last"}
        assert len(calls["merge"]) == 1


class TestOhlcApi:
    def test_duplicate_columns_raise(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(auto_bin, "agg", object())
        with pytest.raises(ValueError):
            auto_bin.build_ohlc_view(None, "T", "P", "P", "P", "P", 1_000_000_000)

    def test_zero_bin_width_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(auto_bin, "agg", object())
        with pytest.raises(ValueError):
            auto_bin.build_ohlc_view(None, "T", "O", "H", "L", "C", 0)
