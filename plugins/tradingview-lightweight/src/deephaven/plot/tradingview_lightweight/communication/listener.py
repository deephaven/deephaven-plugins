"""Table listener for TvlChart real-time updates."""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from deephaven.plugin.object_type import MessageStream

from ..chart import TvlChart
from ..downsample import DownsampleState, TARGET_POINTS

logger = logging.getLogger(__name__)

# Series types eligible for Python-side downsampling
DOWNSAMPLE_ELIGIBLE_TYPES = {"Line", "Area", "Baseline"}


class TvlChartListener:
    """Listens to table changes and sends chart updates to the client."""

    def __init__(self, chart: TvlChart, client_connection: MessageStream):
        self._chart = chart
        self._client_connection = client_connection
        self._revision = 0
        self._table_id_map: dict[int, int] = {}

        # Downsample state per table reference ID
        self._downsample_states: dict[int, DownsampleState] = {}

        # Track which tables are currently exported (table_ref_id -> table)
        self._active_tables: dict[int, Any] = {}

    def process_message(
        self, payload: bytes, references: list[Any]
    ) -> tuple[bytes, list[Any]]:
        """Process an incoming message from the client."""
        try:
            # payload may be Python bytes (from initial RETRIEVE in
            # create_client_connection) or a JVM byte array (from
            # subsequent widget messages). Handle both.
            if isinstance(payload, bytes):
                raw = payload.decode("utf-8")
            else:
                # JVM byte array -- convert to Python bytes first
                raw = bytes(payload).decode("utf-8")
            message = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError, TypeError):
            return b"", []

        msg_type = message.get("type", "")

        if msg_type == "RETRIEVE":
            return self._handle_retrieve()
        if msg_type == "ZOOM":
            return self._handle_zoom(message)
        if msg_type == "RESET":
            return self._handle_reset()

        # Unknown message type
        return b"", []

    def _handle_retrieve(self) -> tuple[bytes, list[Any]]:
        """Build and return the current figure state.

        If any tables are large enough to downsample, creates
        DownsampleState objects and sends the downsampled tables
        instead of the originals.
        """
        self._revision += 1

        tables = self._chart.get_tables()
        series_list = self._chart.series_list
        chart_type = self._chart.chart_type

        # Build per-table analysis: which series reference each table
        table_series_map: dict[int, list[Any]] = {}
        for s in series_list:
            tid = id(s.table)
            table_series_map.setdefault(tid, []).append(s)

        self._table_id_map = {}
        exported_objects: list[Any] = []
        new_refs: list[int] = []
        downsample_info: dict[str, Any] = {}

        for i, table in enumerate(tables):
            self._table_id_map[id(table)] = i
            new_refs.append(i)

            # Check eligibility for Python-side downsampling
            series_for_table = table_series_map.get(id(table), [])
            eligible = (
                chart_type == "standard"
                and hasattr(table, "size")
                and table.size > TARGET_POINTS
                and len(series_for_table) > 0
                and all(
                    s.series_type in DOWNSAMPLE_ELIGIBLE_TYPES for s in series_for_table
                )
            )

            if eligible:
                time_col = series_for_table[0].column_mapping.get("time")
                value_cols: set[str] = set()
                for s in series_for_table:
                    for key, col in s.column_mapping.items():
                        if key != "time":
                            value_cols.add(col)

                if time_col and value_cols:
                    ds = DownsampleState(table, time_col, list(value_cols))
                    try:
                        ds_table = ds.compute_initial()
                        self._downsample_states[i] = ds
                        self._active_tables[i] = ds_table
                        exported_objects.append(ds_table)

                        time_range = ds.get_time_range()
                        downsample_info[str(i)] = {
                            "tableSize": ds_table.size,
                            "fullRange": (list(time_range) if time_range else None),
                            "isDownsampled": True,
                        }
                        continue
                    except Exception:
                        # Fall back to sending original table
                        logger.warning(
                            "Downsampling failed for table %d, sending original",
                            i,
                            exc_info=True,
                        )
                        ds.release()

            # Not downsampled -- send original
            self._active_tables[i] = table
            exported_objects.append(table)

        # Export PartitionedTable if the chart was built with `by`
        pt_ref_index = None
        if self._chart._partitioned_table is not None:
            pt_ref_index = len(exported_objects)
            exported_objects.append(self._chart._partitioned_table)
            new_refs.append(pt_ref_index)

        # Serialize figure
        figure_data = self._chart.to_dict(self._table_id_map)

        # Inject the PartitionedTable reference index
        if pt_ref_index is not None and "partitionSpec" in figure_data:
            figure_data["partitionSpec"]["refIndex"] = pt_ref_index

        # Add downsample metadata so the JS side knows which tables
        # are downsampled and can send ZOOM/RESET messages
        if downsample_info:
            figure_data["downsampleInfo"] = downsample_info

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

    def _handle_zoom(self, msg: dict) -> tuple[bytes, list[Any]]:
        """Handle a ZOOM message: compute hybrid merge for the visible range."""
        try:
            from_nanos = int(msg.get("from", 0))
            to_nanos = int(msg.get("to", 0))
        except (ValueError, TypeError):
            return b"", []

        if from_nanos >= to_nanos:
            return b"", []

        exported_objects: list[Any] = []
        results: dict[str, Any] = {}

        for table_id, ds in self._downsample_states.items():
            try:
                merged_table = ds.compute_hybrid(from_nanos, to_nanos)
                self._active_tables[table_id] = merged_table
                ref_idx = len(exported_objects)
                exported_objects.append(merged_table)

                time_range = ds.get_time_range()
                results[str(table_id)] = {
                    "refIndex": ref_idx,
                    "tableSize": merged_table.size,
                    "viewport": [0, max(0, merged_table.size - 1)],
                    "fullRange": (list(time_range) if time_range else None),
                }
            except Exception:
                logger.warning(
                    "Zoom downsample failed for table %d",
                    table_id,
                    exc_info=True,
                )

        response = json.dumps(
            {
                "type": "DOWNSAMPLE_READY",
                "tables": results,
            }
        ).encode("utf-8")

        return response, exported_objects

    def _handle_reset(self) -> tuple[bytes, list[Any]]:
        """Handle a RESET message: return the cached background table."""
        exported_objects: list[Any] = []
        results: dict[str, Any] = {}

        for table_id, ds in self._downsample_states.items():
            try:
                ds.release_foreground()
                bg_table = ds.get_background_table()
                if bg_table is None:
                    bg_table = ds.compute_initial()
                self._active_tables[table_id] = bg_table
                ref_idx = len(exported_objects)
                exported_objects.append(bg_table)

                time_range = ds.get_time_range()
                results[str(table_id)] = {
                    "refIndex": ref_idx,
                    "tableSize": bg_table.size,
                    "viewport": [0, max(0, bg_table.size - 1)],
                    "fullRange": (list(time_range) if time_range else None),
                    "isReset": True,
                }
            except Exception:
                logger.warning(
                    "Reset downsample failed for table %d",
                    table_id,
                    exc_info=True,
                )

        response = json.dumps(
            {
                "type": "DOWNSAMPLE_READY",
                "tables": results,
            }
        ).encode("utf-8")

        return response, exported_objects

    def close(self) -> None:
        """Release all downsample states."""
        for ds in self._downsample_states.values():
            ds.release()
        self._downsample_states.clear()
        self._active_tables.clear()
