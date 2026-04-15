"""Table listener for TvlChart real-time updates."""

from __future__ import annotations

import json
from typing import Any

from deephaven.plugin.object_type import MessageStream

from ..chart import TvlChart


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
        """Process an incoming message from the client."""
        try:
            message = json.loads(payload.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return b"", []

        msg_type = message.get("type", "")

        if msg_type == "RETRIEVE":
            return self._handle_retrieve()

        # Unknown message type
        return b"", []

    def _handle_retrieve(self) -> tuple[bytes, list[Any]]:
        """Build and return the current figure state."""
        self._revision += 1

        # Build table reference map
        tables = self._chart.get_tables()
        self._table_id_map = {}
        exported_objects: list[Any] = []
        new_refs = []

        for i, table in enumerate(tables):
            self._table_id_map[id(table)] = i
            exported_objects.append(table)
            new_refs.append(i)

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
