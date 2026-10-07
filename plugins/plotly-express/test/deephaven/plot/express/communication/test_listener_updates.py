from __future__ import annotations

import json
import time
import unittest
from typing import Any, Callable
from unittest.mock import MagicMock, patch

from ..BaseTest import BaseTestCase

# the first update graph cycle in the test JVM can take several seconds to start
TIMEOUT = 60


def wait_for(condition: Callable[[], bool]) -> None:
    end = time.time() + TIMEOUT
    while not condition():
        if time.time() > end:
            raise TimeoutError("condition not met")
        time.sleep(0.05)


class DeephavenFigureListenerUpdateTestCase(BaseTestCase):
    """Tests for how DeephavenFigureListener builds figures for ticking partitions"""

    def setUp(self) -> None:
        from deephaven import dtypes, input_table

        self.source = input_table(
            {"Group": dtypes.string, "X": dtypes.int32, "Y": dtypes.int32}
        )
        self.distinct_groups = self.source.select_distinct("Group")

    def add_groups(self, groups: list[str]) -> None:
        """Add one row per group and wait until the update graph has processed it"""
        from deephaven import new_table, update_graph
        from deephaven.column import int_col, string_col

        expected = self.distinct_groups.size + len(groups)
        self.source.add(
            new_table(
                [
                    string_col("Group", groups),
                    int_col("X", list(range(len(groups)))),
                    int_col("Y", list(range(len(groups)))),
                ]
            )
        )
        wait_for(lambda: self.distinct_groups.size == expected)
        # the shared lock is only granted between cycles, so all derived tables are updated
        with update_graph.shared_lock(self.source):
            pass

    def charts(self) -> dict[str, tuple[Any, int]]:
        """Charts that depend on self.source, mapped to traces per group"""
        import src.deephaven.plot.express as dx

        def line():
            return dx.line(self.source, x="X", y="Y", by="Group")

        def scatter():
            return dx.scatter(self.source, x="X", y="Y", by="Group")

        return {
            "line": (line(), 1),
            "layer": (dx.layer(line(), scatter()), 2),
            "subplots": (dx.make_subplots(line(), scatter(), rows=2), 2),
        }

    def create_listener(self, figure: Any, connection: Any = None) -> Any:
        from src.deephaven.plot.express.communication.DeephavenFigureListener import (
            DeephavenFigureListener,
        )

        return DeephavenFigureListener(figure, connection or MagicMock())

    def count_traces(self, listener: Any) -> int:
        return len(listener._get_figure().get_plotly_fig().data)

    def record_builds(self, record: Callable[[], Any]) -> Any:
        """Patch PartitionManager.create_figure to call record() on every build"""
        from src.deephaven.plot.express.plots.PartitionManager import (
            PartitionManager,
        )

        original = PartitionManager.create_figure

        def wrapper(self_: Any) -> Any:
            record()
            return original(self_)

        return patch.object(PartitionManager, "create_figure", wrapper)

    def blocks_update_graph(self) -> bool:
        """Whether the current thread holds the update graph lock or is processing a cycle"""
        from deephaven import update_graph

        return (
            update_graph.has_shared_lock(self.source)
            or update_graph.has_exclusive_lock(self.source)
            or self.source.update_graph.j_update_graph.currentThreadProcessesUpdates()
        )

    def test_partitions_added_before_open(self):
        """Partitions added after the chart is created but before it is opened are shown"""
        charts = self.charts()
        self.add_groups(["A", "B", "C"])

        for name, (chart, traces_per_group) in charts.items():
            with self.subTest(name):
                listener = self.create_listener(chart)
                self.assertEqual(self.count_traces(listener), 3 * traces_per_group)

    def test_open_builds_outside_update_graph_lock(self):
        """Opening a chart doesn't build while blocking the update graph"""
        self.add_groups(["A", "B"])

        for name, (chart, _) in self.charts().items():
            with self.subTest(name):
                blocking = []
                with self.record_builds(
                    lambda: blocking.append(self.blocks_update_graph())
                ):
                    self.create_listener(chart)
                self.assertTrue(blocking)
                self.assertFalse(any(blocking))

    def test_open_builds_each_partitioned_figure_once(self):
        """Opening a chart builds each partitioned figure exactly once"""
        self.add_groups(["A", "B"])
        expected_builds = {"line": 1, "layer": 2, "subplots": 2}

        for name, (chart, _) in self.charts().items():
            with self.subTest(name):
                builds = []
                with self.record_builds(lambda: builds.append(1)):
                    self.create_listener(chart)
                self.assertEqual(len(builds), expected_builds[name])

    def test_partition_added_after_open(self):
        """A partition added after open sends a rebuilt figure with the new trace,
        built without blocking the update graph"""
        self.add_groups(["A", "B"])
        chart, _ = self.charts()["line"]
        connection = MagicMock()
        listener = self.create_listener(chart, connection)
        self.assertEqual(self.count_traces(listener), 2)

        blocking = []
        with self.record_builds(lambda: blocking.append(self.blocks_update_graph())):
            self.add_groups(["C"])
            wait_for(lambda: connection.on_data.called)

        self.assertEqual(blocking, [False])
        self.assertEqual(self.count_traces(listener), 3)
        payload, _ = connection.on_data.call_args[0]
        message = json.loads(payload)
        self.assertEqual(message["type"], "NEW_FIGURE")
        self.assertEqual(len(message["figure"]["plotly"]["data"]), 3)

    def test_updates_during_rebuild_are_merged(self):
        """Updates that arrive while a rebuild runs cause one more rebuild, not one each"""
        import threading

        self.add_groups(["A", "B"])
        chart, _ = self.charts()["line"]
        connection = MagicMock()
        listener = self.create_listener(chart, connection)

        started, release = threading.Event(), threading.Event()

        def record() -> None:
            if not started.is_set():
                started.set()
                release.wait(TIMEOUT)

        with self.record_builds(record):
            self.add_groups(["C"])
            self.assertTrue(started.wait(TIMEOUT))
            self.add_groups(["D"])
            self.add_groups(["E"])
            release.set()
            wait_for(lambda: not listener._update_task_active)

        # each rebuild sends one figure
        self.assertEqual(connection.on_data.call_count, 2)
        self.assertEqual(self.count_traces(listener), 5)

    def test_closed_connection_stops_updates(self):
        """After the connection closes, partition changes don't rebuild or send"""
        from src.deephaven.plot.express.communication.DeephavenFigureConnection import (
            DeephavenFigureConnection,
        )

        self.add_groups(["A"])
        chart, _ = self.charts()["line"]
        client = MagicMock()
        connection = DeephavenFigureConnection(chart, client)
        connection.on_close()

        builds = []
        with self.record_builds(lambda: builds.append(1)):
            self.add_groups(["B"])
            time.sleep(0.5)

        self.assertEqual(builds, [])
        client.on_data.assert_not_called()


if __name__ == "__main__":
    unittest.main()
