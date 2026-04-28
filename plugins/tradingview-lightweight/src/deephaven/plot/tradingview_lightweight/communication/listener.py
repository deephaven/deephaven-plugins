"""Table listener for TvlChart real-time updates."""

from __future__ import annotations

import json
import logging
from typing import Any

from deephaven.plugin.object_type import MessageStream

from ..chart import TvlChart

logger = logging.getLogger(__name__)

# Series types eligible for JS-side downsampling via runChartDownsample
DOWNSAMPLE_ELIGIBLE_TYPES = {"Line", "Area", "Baseline"}

# Tables smaller than this are rendered directly without downsampling
DOWNSAMPLE_THRESHOLD = 1000


class TvlChartListener:
    """Listens to table changes and sends chart updates to the client."""

    def __init__(self, chart: TvlChart, client_connection: MessageStream):
        self._chart = chart
        self._client_connection = client_connection
        self._revision = 0
        self._table_id_map: dict[int, int] = {}

    def process_message(
        self, payload: bytes, references: list[Any]
    ) -> tuple[bytes, list[Any]]:
        """Process an incoming message from the client.

        Only RETRIEVE is handled — ZOOM/RESET are now managed entirely
        in JS via dh.plot.Downsample.runChartDownsample.
        """
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

        # Unknown message type
        return b"", []

    def _handle_retrieve(self) -> tuple[bytes, list[Any]]:
        """Build and return the current figure state.

        Always sends the original tables. Includes lightweight
        downsampleMeta so the JS side can decide whether to call
        runChartDownsample for each table.
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
        downsample_meta: dict[str, Any] = {}

        for i, table in enumerate(tables):
            self._table_id_map[id(table)] = i
            new_refs.append(i)

            # Always export the original table
            exported_objects.append(table)

            # Check eligibility for JS-side downsampling and send metadata
            series_for_table = table_series_map.get(id(table), [])
            eligible = (
                chart_type == "standard"
                and hasattr(table, "size")
                and table.size > DOWNSAMPLE_THRESHOLD
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
                    downsample_meta[str(i)] = {
                        "tableSize": table.size,
                        "timeCol": time_col,
                        "valueCols": list(value_cols),
                        "seriesTypes": [s.series_type for s in series_for_table],
                    }

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
        # to call runChartDownsample on
        if downsample_meta:
            figure_data["downsampleMeta"] = downsample_meta

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

    def close(self) -> None:
        """Clean up resources."""
        pass
