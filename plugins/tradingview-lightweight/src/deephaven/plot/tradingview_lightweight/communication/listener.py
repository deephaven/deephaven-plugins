"""Table listener for TvlChart real-time updates."""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any, Optional

from deephaven.plugin.object_type import MessageStream

from ..chart import TvlChart
from .. import auto_bin

logger = logging.getLogger(__name__)

# Series types eligible for JS-side downsampling via runChartDownsample
DOWNSAMPLE_ELIGIBLE_TYPES = {"Line", "Area", "Baseline"}

# Tables smaller than this are rendered directly without downsampling
DOWNSAMPLE_THRESHOLD = 1000

# Series types eligible for server-side time-bin aggregation
AUTO_BIN_ELIGIBLE_TYPES = {"Histogram", "Candlestick", "Bar"}

# Tables smaller than this are not auto-binned. Override via TVL_AUTO_BIN_THRESHOLD.
# Defaults to 2x the visual target so anything that would render sub-pixel
# bars triggers aggregation (raw rows > 2x display capacity ≈ illegible).
AUTO_BIN_THRESHOLD = int(
    os.environ.get("TVL_AUTO_BIN_THRESHOLD", str(2 * auto_bin.TARGET_BINS))
)


@dataclass
class _AutoBinTableState:
    """Per-source-table auto-bin state.

    A "source table" here is the raw input table referenced by one or more
    Histogram/Candlestick/Bar series. The aggregated table is rebuilt on
    pan and zoom: the body covers the visible window at fine bin width
    flanked by single-row anchors at the source extremes so LWC's
    fixLeftEdge / fixRightEdge clamp correctly. ``body_range_ns`` is None
    when the build is full-source (no anchors needed); set to (from, to)
    when scoped.
    """

    ref_index: int
    raw_table: Any
    time_col: str
    full_range_ns: tuple[int, int]
    bin_width_ns: int
    initial_bin_width_ns: int
    target_bins: int
    aggregated_table: Any = None
    # series_id -> dict with keys: type, agg, value_cols
    series_meta: dict[str, dict[str, Any]] = field(default_factory=dict)
    body_range_ns: Optional[tuple[int, int]] = None


class TvlChartListener:
    """Listens to table changes and sends chart updates to the client."""

    def __init__(self, chart: TvlChart, client_connection: MessageStream):
        self._chart = chart
        self._client_connection = client_connection
        self._revision = 0
        self._table_id_map: dict[int, int] = {}
        # Auto-bin state, keyed by ref index of the source table.
        self._autobin_states: dict[int, _AutoBinTableState] = {}

    def process_message(
        self, payload: bytes, references: list[Any]
    ) -> tuple[bytes, list[Any]]:
        """Process an incoming message from the client."""
        try:
            if isinstance(payload, bytes):
                raw = payload.decode("utf-8")
            else:
                raw = bytes(payload).decode("utf-8")
            message = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError, TypeError):
            return b"", []

        msg_type = message.get("type", "")

        if msg_type == "RETRIEVE":
            return self._handle_retrieve()
        if msg_type == "AUTOBIN_ZOOM":
            return self._handle_autobin_zoom(message)
        if msg_type == "AUTOBIN_RESET":
            return self._handle_autobin_reset(message)

        return b"", []

    # ---- Eligibility ----

    def _is_series_autobin_eligible(
        self, table: Any, series: Any, chart_type: str
    ) -> bool:
        """Per-series eligibility check.

        A series is auto-bin eligible if:
        - chart is "standard"
        - series.series_type in AUTO_BIN_ELIGIBLE_TYPES
          (Histogram / Candlestick / Bar — series types whose visual
          representation needs server-side aggregation)
        - series.auto_bin is not False
        - either auto_bin=True or table.size > AUTO_BIN_THRESHOLD

        Line / Area / Baseline series on the same source table are NOT
        eligible — they keep using the JS-side runChartDownsample path.
        That asymmetry is intentional: line/area degrades smoothly when
        downsampled per-zoom, but a histogram needs proper bins to render
        meaningfully.
        """
        if chart_type != "standard":
            return False
        if series.series_type not in AUTO_BIN_ELIGIBLE_TYPES:
            return False
        if series.auto_bin is False:
            return False
        if series.auto_bin is True:
            return True
        try:
            return table.size > AUTO_BIN_THRESHOLD
        except Exception:
            return False

    # ---- Aggregation ----

    def _build_state_for_table(
        self,
        ref_index: int,
        table: Any,
        series_for_table: list[Any],
    ) -> Optional[_AutoBinTableState]:
        """Compute the initial aggregated view for the source table."""
        time_col = series_for_table[0].column_mapping.get("time")
        if time_col is None:
            return None

        full_range = auto_bin.get_full_range_ns(table, time_col)
        if full_range is None:
            return None
        range_ns = max(1, full_range[1] - full_range[0])

        # Per-series target bins (use first override; mixed series share a width)
        target_bins = auto_bin.TARGET_BINS
        for s in series_for_table:
            if s.bin_count is not None:
                target_bins = max(1, int(s.bin_count))
                break

        # Per-series bin_width override
        bin_width_ns: Optional[int] = None
        for s in series_for_table:
            if s.bin_width is not None:
                bin_width_ns = auto_bin.parse_bin_width(s.bin_width)
                break
        if bin_width_ns is None:
            bin_width_ns = auto_bin.nice_bin_width(range_ns, target_bins)

        state = _AutoBinTableState(
            ref_index=ref_index,
            raw_table=table,
            time_col=time_col,
            full_range_ns=full_range,
            bin_width_ns=bin_width_ns,
            initial_bin_width_ns=bin_width_ns,
            target_bins=target_bins,
        )

        for s in series_for_table:
            series_id = self._series_id_for(s)
            if s.series_type == "Histogram":
                value_col = s.column_mapping["value"]
                color_col = s.column_mapping.get("color")
                state.series_meta[series_id] = {
                    "type": "Histogram",
                    "agg": s.agg or "sum",
                    "valueCols": [value_col]
                    + ([color_col] if color_col is not None else []),
                }
            else:  # Candlestick / Bar
                state.series_meta[series_id] = {
                    "type": s.series_type,
                    "agg": "ohlc",
                    "valueCols": [
                        s.column_mapping["open"],
                        s.column_mapping["high"],
                        s.column_mapping["low"],
                        s.column_mapping["close"],
                    ],
                }

        # Mixed-type tables (Histogram + Candlestick on same source) are unusual
        # and require a single aggregated schema. We handle them by building one
        # combined aggregated table whose schema is the superset of needed
        # columns. For a pure-histogram or pure-OHLC table that's the typical
        # case, this is straightforward.
        state.aggregated_table = self._build_aggregated_table(state, series_for_table)
        if state.aggregated_table is None:
            return None
        return state

    def _build_aggregated_table(
        self,
        state: _AutoBinTableState,
        series_for_table: list[Any],
    ) -> Any:
        """Build the aggregated table.

        Body covers ``state.body_range_ns`` (or the full source when None)
        at ``state.bin_width_ns``; head / tail anchors flank it at the
        source extremes when scoped. Series sharing one source table all
        use the same bin width and the result schema is the union of
        needed columns.
        """
        types = {s.series_type for s in series_for_table}
        if types == {"Histogram"}:
            primary = series_for_table[0]
            value_col = primary.column_mapping["value"]
            color_col = primary.column_mapping.get("color")
            return auto_bin.build_histogram_view(
                state.raw_table,
                state.time_col,
                value_col,
                state.bin_width_ns,
                agg_mode=primary.agg or "sum",
                color_col=color_col,
                body_range_ns=state.body_range_ns,
                full_range_ns=state.full_range_ns,
            )
        if types <= {"Candlestick", "Bar"}:
            primary = series_for_table[0]
            return auto_bin.build_ohlc_view(
                state.raw_table,
                state.time_col,
                primary.column_mapping["open"],
                primary.column_mapping["high"],
                primary.column_mapping["low"],
                primary.column_mapping["close"],
                state.bin_width_ns,
                body_range_ns=state.body_range_ns,
                full_range_ns=state.full_range_ns,
            )
        # Mixed Histogram + OHLC on a single source table is unusual. The
        # type-dispatch above keeps the build paths simple.
        logger.warning(
            "auto-bin: mixed series types on a single source table not supported; "
            "shipping raw table for ref %s",
            state.ref_index,
        )
        return None

    def _series_id_for(self, series: Any) -> str:
        """Stable series ID matching what TvlChart.to_dict assigns."""
        # series ids are assigned by index in TvlChart.to_dict (series_<i>);
        # we mirror that ordering here.
        for i, s in enumerate(self._chart.series_list):
            if s is series:
                return f"series_{i}"
        return ""

    # ---- RETRIEVE ----

    def _handle_retrieve(self) -> tuple[bytes, list[Any]]:
        """Build and return the current figure state.

        For each source table we partition its series into:
          - auto-bin eligible (Histogram/Candlestick/Bar that pass the threshold)
          - other (Line/Area/Baseline, or auto_bin=False)

        Eligible series share a per-source-table aggregated view at a new
        ref index. Other series continue to reference the original table.
        """
        self._revision += 1

        tables = self._chart.get_tables()
        series_list = self._chart.series_list
        chart_type = self._chart.chart_type

        self._autobin_states = {}

        # Per-table series mapping
        table_series_map: dict[int, list[Any]] = {}
        for s in series_list:
            tid = id(s.table)
            table_series_map.setdefault(tid, []).append(s)

        self._table_id_map = {}
        exported_objects: list[Any] = []
        new_refs: list[int] = []

        # First pass: export originals at their natural ref index.
        for i, table in enumerate(tables):
            self._table_id_map[id(table)] = i
            new_refs.append(i)
            exported_objects.append(table)

        # Second pass: per-source, build aggregated table for the
        # auto-bin-eligible subset of series (if any). Series-id -> new
        # tableId. Line / Area / Baseline siblings on the same source
        # table keep their original tableId and are handled by the
        # downsample path below.
        autobin_meta: dict[str, Any] = {}
        series_table_overrides: dict[str, int] = {}

        for i, table in enumerate(tables):
            series_for_table = table_series_map.get(id(table), [])
            eligible_series = [
                s
                for s in series_for_table
                if self._is_series_autobin_eligible(table, s, chart_type)
            ]
            if not eligible_series:
                continue

            agg_ref_index = len(exported_objects)
            state = self._build_state_for_table(agg_ref_index, table, eligible_series)
            if state is None:
                continue
            exported_objects.append(state.aggregated_table)
            new_refs.append(agg_ref_index)
            self._autobin_states[agg_ref_index] = state

            # Only the autobin-eligible series read from the agg table.
            for s in eligible_series:
                sid = self._series_id_for(s)
                series_table_overrides[sid] = agg_ref_index

            autobin_meta[str(agg_ref_index)] = self._build_autobin_meta(state)

        # Compute downsample meta for any source table whose series are
        # downsample-eligible (Line / Area / Baseline). This includes
        # source tables that ALSO have an autobin-eligible histogram or
        # candlestick — both paths run side-by-side on the same source.
        downsample_meta: dict[str, Any] = {}
        for i, table in enumerate(tables):
            series_for_table = table_series_map.get(id(table), [])
            ds_series = [
                s
                for s in series_for_table
                if s.series_type in DOWNSAMPLE_ELIGIBLE_TYPES
            ]
            if not ds_series or chart_type != "standard":
                continue
            if not hasattr(table, "size") or table.size <= DOWNSAMPLE_THRESHOLD:
                continue

            time_col = ds_series[0].column_mapping.get("time")
            value_cols: set[str] = set()
            for s in ds_series:
                for key, col in s.column_mapping.items():
                    if key != "time":
                        value_cols.add(col)
            if time_col and value_cols:
                downsample_meta[str(i)] = {
                    "tableSize": table.size,
                    "timeCol": time_col,
                    "valueCols": list(value_cols),
                    "seriesTypes": [s.series_type for s in ds_series],
                }

        # Export PartitionedTable if the chart was built with `by`
        pt_ref_index = None
        if self._chart._partitioned_table is not None:
            pt_ref_index = len(exported_objects)
            exported_objects.append(self._chart._partitioned_table)
            new_refs.append(pt_ref_index)

        # Serialize figure (using original table_id_map), then patch the
        # auto-binned series' dataMapping.tableId to the aggregated ref.
        figure_data = self._chart.to_dict(self._table_id_map)
        if series_table_overrides:
            for s_dict in figure_data.get("series", []):
                sid = s_dict.get("id")
                if sid in series_table_overrides:
                    s_dict["dataMapping"]["tableId"] = series_table_overrides[sid]

        if pt_ref_index is not None and "partitionSpec" in figure_data:
            figure_data["partitionSpec"]["refIndex"] = pt_ref_index

        if downsample_meta:
            figure_data["downsampleMeta"] = downsample_meta
        if autobin_meta:
            figure_data["autoBinMeta"] = autobin_meta

        message = json.dumps(
            {
                "type": "NEW_FIGURE",
                "figure": figure_data,
                "revision": self._revision,
                "new_references": new_refs,
                "removed_references": [],
            }
        ).encode("utf-8")

        return message, exported_objects

    @staticmethod
    def _build_autobin_meta(state: _AutoBinTableState) -> dict[str, Any]:
        return {
            "timeCol": state.time_col,
            "binWidthNs": state.bin_width_ns,
            "fullRangeNs": [state.full_range_ns[0], state.full_range_ns[1]],
            "targetBins": state.target_bins,
            "series": state.series_meta,
        }

    # ---- AUTOBIN_ZOOM / AUTOBIN_RESET ----

    def _bin_width_for_visible(
        self,
        from_ns: int,
        to_ns: int,
        target_bins: int,
    ) -> int:
        """Return the bin width to use for a visible window of ``target_bins`` bars.

        Bin width comes directly from ``visible_ns / target_bins`` snapped
        to the nearest nice duration — pan and zoom both refresh it. The
        old min/max-visible-bins thresholds are gone: the body now only
        covers the visible window, so its bar count is always close to
        ``target_bins`` by construction.
        """
        if to_ns <= from_ns:
            return 1
        visible_ns = to_ns - from_ns
        return auto_bin.nice_bin_width(visible_ns, target_bins)

    def _apply_width_px(
        self, state: _AutoBinTableState, message: dict[str, Any]
    ) -> int:
        """If the client supplied widthPx, refresh state.target_bins from it.

        ``widthPx`` is the rounded (cache-friendly) chart width.
        ``actualWidthPx`` is the real chart width and acts as a floor so that
        bars are at least ``MIN_BAR_PX`` pixels wide regardless of rounding
        overshoot.

        Returns the effective target_bins for this operation.
        """

        def _coerce(value: Any) -> Optional[int]:
            try:
                return int(value) if value is not None else None
            except (ValueError, TypeError):
                return None

        width_int = _coerce(message.get("widthPx"))
        actual_int = _coerce(message.get("actualWidthPx"))
        if width_int is not None and width_int > 0:
            state.target_bins = auto_bin.target_bins_for_width(
                width_int, actual_width_px=actual_int
            )
        return state.target_bins

    def _handle_autobin_zoom(self, message: dict[str, Any]) -> tuple[bytes, list[Any]]:
        """Rebuild the aggregation for a (possibly scoped) visible window.

        Pan and zoom both flow through here. Bin width is derived from
        ``visible_ns / target_bins`` so it tracks the user's window. The
        body covers the visible window; head/tail anchors flank it.

        ``atLiveEdge`` extends the body's right bound to ``MAX_LONG`` so
        ticks landing past the visible window's right edge fall into the
        body's last bin (rather than into the tail anchor).
        """
        try:
            ref_index = int(message["tableRef"])
            from_ns = int(message["fromNs"])
            to_ns = int(message["toNs"])
        except (KeyError, ValueError, TypeError):
            return b"", []

        state = self._autobin_states.get(ref_index)
        if state is None:
            return b"", []

        target_bins = self._apply_width_px(state, message)
        new_width = self._bin_width_for_visible(from_ns, to_ns, target_bins)
        at_live_edge = bool(message.get("atLiveEdge"))
        body_to = (1 << 63) - 1 if at_live_edge else to_ns
        new_body_range: tuple[int, int] = (from_ns, body_to)

        if new_width == state.bin_width_ns and state.body_range_ns == new_body_range:
            return self._autobin_ack(state)
        return self._rebuild(state, new_width, new_body_range)

    def _handle_autobin_reset(self, message: dict[str, Any]) -> tuple[bytes, list[Any]]:
        try:
            ref_index = int(message["tableRef"])
        except (KeyError, ValueError, TypeError):
            return b"", []
        state = self._autobin_states.get(ref_index)
        if state is None:
            return b"", []
        # If the client sent a widthPx, recompute the initial bin width at
        # that target. This lets a chart that just learned its real width
        # refine the initial render (otherwise the constant-default
        # TARGET_BINS is used).
        target_bins = self._apply_width_px(state, message)
        full_range_ns = max(1, state.full_range_ns[1] - state.full_range_ns[0])
        new_initial = auto_bin.nice_bin_width(full_range_ns, target_bins)
        state.initial_bin_width_ns = new_initial
        if state.bin_width_ns == new_initial and state.body_range_ns is None:
            return self._autobin_ack(state)
        return self._rebuild(state, new_initial, None)

    def _series_for_state(self, state: _AutoBinTableState) -> list[Any]:
        chart_type = self._chart.chart_type
        return [
            s
            for s in self._chart.series_list
            if id(s.table) == id(state.raw_table)
            and self._is_series_autobin_eligible(state.raw_table, s, chart_type)
        ]

    def _rebuild(
        self,
        state: _AutoBinTableState,
        new_width_ns: int,
        new_body_range: Optional[tuple[int, int]],
    ) -> tuple[bytes, list[Any]]:
        """Rebuild the aggregated table at ``new_width_ns`` /
        ``new_body_range`` and emit AUTOBIN_FIGURE. Pan and zoom both
        flow through here.
        """
        old_table = state.aggregated_table
        old_width = state.bin_width_ns
        old_body = state.body_range_ns
        state.bin_width_ns = new_width_ns
        state.body_range_ns = new_body_range
        state.aggregated_table = self._build_aggregated_table(
            state, self._series_for_state(state)
        )
        if state.aggregated_table is None:
            state.aggregated_table = old_table
            state.bin_width_ns = old_width
            state.body_range_ns = old_body
            return b"", []

        self._revision += 1

        # Reconstruct the exported objects list: originals at their natural
        # refs, aggregated tables at their (post-original) refs.
        tables = self._chart.get_tables()
        max_ref = max(self._autobin_states.keys(), default=len(tables) - 1)
        if self._chart._partitioned_table is not None:
            max_ref = max(max_ref, max_ref + 1)
        size_needed = max_ref + 1
        exported_objects: list[Any] = [None] * size_needed
        new_refs: list[int] = []

        for i, table in enumerate(tables):
            exported_objects[i] = table
            new_refs.append(i)
        for ref_index, st in self._autobin_states.items():
            exported_objects[ref_index] = st.aggregated_table
            new_refs.append(ref_index)

        if self._chart._partitioned_table is not None:
            pt_ref = len(exported_objects)
            exported_objects.append(self._chart._partitioned_table)
            new_refs.append(pt_ref)

        meta = {
            str(ref): self._build_autobin_meta(st)
            for ref, st in self._autobin_states.items()
        }

        message = json.dumps(
            {
                "type": "AUTOBIN_FIGURE",
                "revision": self._revision,
                "tableRef": state.ref_index,
                "binWidthNs": state.bin_width_ns,
                "autoBinMeta": meta,
                "new_references": new_refs,
            }
        ).encode("utf-8")

        return message, exported_objects

    def _autobin_ack(self, state: _AutoBinTableState) -> tuple[bytes, list[Any]]:
        """Send a no-op AUTOBIN_FIGURE so the client can clear pending state."""
        message = json.dumps(
            {
                "type": "AUTOBIN_FIGURE",
                "revision": self._revision,
                "tableRef": state.ref_index,
                "binWidthNs": state.bin_width_ns,
                "autoBinMeta": {
                    str(i): self._build_autobin_meta(st)
                    for i, st in self._autobin_states.items()
                },
                "noop": True,
                "new_references": [],
            }
        ).encode("utf-8")
        return message, []

    def close(self) -> None:
        """Clean up resources."""
        self._autobin_states.clear()
