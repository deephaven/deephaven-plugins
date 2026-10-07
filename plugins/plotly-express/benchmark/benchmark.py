"""
Benchmark for plotly-express chart builds.

Not part of the automated tests. Run it by hand to check for performance
regressions or improvements, for example before and after a change:

    source .venv/bin/activate
    python plugins/plotly-express/benchmark/benchmark.py
    python plugins/plotly-express/benchmark/benchmark.py --scenario line line_by --groups 10 200 --repeat 5
    python plugins/plotly-express/benchmark/benchmark.py --src /path/to/other/checkout/plugins/plotly-express/src
    python plugins/plotly-express/benchmark/benchmark.py --list

To cover a new code path, add an entry to SCENARIOS.

Metrics, each the median over --repeat runs:
    create        dx call in the script (initial build)
    open          DeephavenFigureListener setup, which runs when a client opens the chart
    open_stall    longest update graph pause during open; ~0 means open doesn't block other tables
    change        time from adding a new Group until the client is sent the rebuilt figure
    change_stall  longest update graph pause during that change
    "-" means the chart isn't partitioned on Group (by, color, facets, ...), so a new Group doesn't rebuild it
"""
from __future__ import annotations

import argparse
import math
import os
import statistics
import sys
import time
from typing import Any, Callable

CYCLE_MS = 50
TIMEOUT_S = 300
METRICS = ("create", "open", "open_stall", "change", "change_stall")


# dx is imported after the server starts; scenarios only use it when called
def line_by(data: Table) -> Any:
    return dx.line(data, x="Time", y="Value", by="Group")


def scatter_by(data: Table) -> Any:
    return dx.scatter(data, x="Time", y="Value", by="Group")


# columns available: Group, Category (3 values), Time, Value, Other
SCENARIOS: dict[str, Callable[[Table], Any]] = {
    "scatter": lambda data: dx.scatter(data, x="Time", y="Value"),
    "line": lambda data: dx.line(data, x="Time", y="Value"),
    "line_list": lambda data: dx.line(data, x="Time", y=["Value", "Other"]),
    "bar": lambda data: dx.bar(data, x="Category", y="Value"),
    "histogram": lambda data: dx.histogram(data, x="Value"),
    "line_by": line_by,
    "scatter_color": lambda data: dx.scatter(
        data, x="Time", y="Value", color="Group", symbol="Category"
    ),
    "histogram_by": lambda data: dx.histogram(data, x="Value", by="Group"),
    "layer_by": lambda data: dx.layer(line_by(data), scatter_by(data)),
    "subplots_by": lambda data: dx.make_subplots(
        line_by(data), scatter_by(data), rows=2
    ),
}

parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
parser.add_argument("--scenario", nargs="+", help="scenarios to run (default: all)")
parser.add_argument("--list", action="store_true", help="list scenarios and exit")
parser.add_argument(
    "--groups",
    type=int,
    nargs="+",
    default=[10, 50, 200],
    help="distinct values of the Group column; also scales the row count",
)
parser.add_argument("--rows-per-group", type=int, default=30)
parser.add_argument("--repeat", type=int, default=3)
parser.add_argument(
    "--src",
    default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"),
    help="plotly-express source directory to benchmark (default: this checkout)",
)
parser.add_argument("--port", type=int, default=10099)
args = parser.parse_args()

if args.list:
    print("\n".join(SCENARIOS))
    sys.exit(0)
unknown = set(args.scenario or []) - set(SCENARIOS)
if unknown:
    parser.error(f"unknown scenarios: {sorted(unknown)}; see --list")

from deephaven_server import Server

Server(
    port=args.port,
    jvm_args=["-Xmx4g", f"-DPeriodicUpdateGraph.targetCycleDurationMillis={CYCLE_MS}"],
).start()

import deephaven.plot

# the server already imported the installed plugin, so swap in the requested source
for module in [m for m in sys.modules if m.startswith("deephaven.plot.express")]:
    del sys.modules[module]
deephaven.plot.__path__.insert(
    0, os.path.join(os.path.abspath(args.src), "deephaven", "plot")
)

import deephaven.plot.express as dx
from deephaven import empty_table, input_table, merge, time_table, update_graph
from deephaven.table import Table
from deephaven.table_factory import InputTable
from deephaven.table_listener import listen
from deephaven.plot.express.communication.DeephavenFigureListener import (
    DeephavenFigureListener,
)


class RecordingConnection:
    def __init__(self) -> None:
        self.sent: list[float] = []

    def on_data(self, *_: Any) -> None:
        self.sent.append(time.perf_counter())


class Clock:
    """Records update graph cycles, to find how long the update graph paused"""

    def __init__(self) -> None:
        self.ticks: list[float] = []
        self.table = time_table(f"PT{CYCLE_MS / 1000}S")
        self.handle = listen(
            self.table, lambda update, is_replay: self.ticks.append(time.perf_counter())
        )

    def max_pause(self, start: float, end: float) -> float:
        ticks = [start] + [t for t in self.ticks if start < t <= end]
        gaps = [b - a for a, b in zip(ticks, ticks[1:])]
        return max(max(gaps, default=end - start) - CYCLE_MS / 1000, 0.0)


def wait_until(condition: Callable[[], bool]) -> None:
    end = time.time() + TIMEOUT_S
    while not condition():
        if time.time() > end:
            raise TimeoutError("timed out waiting for the chart")
        time.sleep(0.01)


ROW_FORMULAS = [
    "Category = `C` + (i % 3)",
    "Time = epochNanosToInstant(1767225600000000000L + Step * 86400000000000L)",
    "Value = (double) Step * (i % 7)",
    "Other = (double) (i % 11)",
]


def make_data(groups: int) -> tuple[Table, InputTable]:
    """Returns the chart data and an input table that adds rows to it"""
    base = empty_table(groups * args.rows_per_group).update(
        [f"Group = `G` + (i % {groups})", f"Step = (long) (i / {groups})"]
        + ROW_FORMULAS
    )
    extra = input_table({col.name: col.data_type for col in base.columns})
    # joining a ticking one-row table makes the data refreshing without changing its partitions
    ticker = time_table("PT0.5S").last_by().view(["Tick = Timestamp"])
    data = merge([base, extra]).join(ticker)
    # the join is empty until the ticker's first row, which would make builds trivially fast
    wait_until(lambda: data.size >= groups * args.rows_per_group)
    return data, extra


new_group_count = 0


def add_group(extra: InputTable) -> None:
    global new_group_count
    new_group_count += 1
    row = empty_table(1).update(
        [f"Group = `New{new_group_count}`", "Step = 0L"] + ROW_FORMULAS
    )
    extra.add(row)


def run_once(
    make_chart: Callable[[Table], Any], data: Table, extra: InputTable
) -> dict[str, float]:
    start = time.perf_counter()
    chart = make_chart(data)
    create = time.perf_counter() - start

    clock = Clock()
    time.sleep(0.5)
    connection = RecordingConnection()

    start = time.perf_counter()
    listener = DeephavenFigureListener(chart, connection)
    open_ = time.perf_counter() - start
    time.sleep(0.3)
    open_stall = clock.max_pause(start, time.perf_counter())

    change = change_stall = math.nan
    connection.sent.clear()
    size = data.size
    start = time.perf_counter()
    add_group(extra)
    wait_until(lambda: data.size > size)
    # the shared lock is only granted between cycles, so the cycle's callbacks have run
    with update_graph.shared_lock(data):
        pass
    # rebuilds may run after the cycle, on a server executor thread
    wait_until(lambda: not getattr(listener, "_update_task_active", False))
    # charts without a partition on Group don't rebuild, so there is nothing to measure
    if connection.sent:
        change = connection.sent[-1] - start
        time.sleep(0.3)
        change_stall = clock.max_pause(start, time.perf_counter())

    clock.handle.stop()
    # stop listening so later runs' new groups don't rebuild this chart
    if hasattr(listener, "close"):
        listener.close()
    else:
        for handle in listener._handles:
            handle.stop()

    return {
        "create": create,
        "open": open_,
        "open_stall": open_stall,
        "change": change,
        "change_stall": change_stall,
    }


def main() -> None:
    names = args.scenario or list(SCENARIOS)

    print(
        f"source: {os.path.dirname(sys.modules[DeephavenFigureListener.__module__].__file__)}"
    )
    print(
        f"rows per group: {args.rows_per_group}, repeats: {args.repeat}, median seconds\n"
    )
    width = max(len(name) for name in names + ["scenario"])
    header = f"{'scenario':<{width}} {'groups':>6} " + " ".join(
        f"{metric:>12}" for metric in METRICS
    )
    print(header)
    print("-" * len(header))
    # warm up imports, formula compilation and the JIT so the first scenario isn't penalized
    for name in names:
        run_once(SCENARIOS[name], *make_data(2))
    for name in names:
        for groups in args.groups:
            data, extra = make_data(groups)
            runs = [run_once(SCENARIOS[name], data, extra) for _ in range(args.repeat)]
            cells = []
            for metric in METRICS:
                median = statistics.median(run[metric] for run in runs)
                cells.append("-" if math.isnan(median) else f"{median:.2f}")
            print(
                f"{name:<{width}} {groups:>6} "
                + " ".join(f"{cell:>12}" for cell in cells),
                flush=True,
            )


if __name__ == "__main__":
    main()
