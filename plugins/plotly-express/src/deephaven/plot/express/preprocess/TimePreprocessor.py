from __future__ import annotations

from typing import Any, Generator

from ..shared import get_unique_names

from deephaven.table import Table

NANOS_PER_MILLI = 1_000_000


class TimePreprocessor:
    """
    Used to preprocess times for a gantt plot.

    Attributes:
        args: Figure creation args
    """

    def __init__(self, args: dict[str, Any]):
        self.args = args

    def preprocess_partitioned_tables(
        self, tables: list[Table], column: str | None = None
    ) -> Generator[tuple[Table, dict[str, str]], None, None]:
        """Preprocess frequency bar params into an appropriate table
        This just sums each value by count

        Args:
          tables:
            The tables to process
          column:
            The column to process

        Returns:
          A tuple containing (the new table, an update to make to the args)

        """
        x_start, x_end, y, table = (
            self.args["x_start"],
            self.args["x_end"],
            self.args["y"],
            self.args["table"],
        )

        x_diff = get_unique_names(table, ["x_diff"])["x_diff"]

        for table in tables:
            # Times are assumed to be Instants which have nanosecond precision
            # We convert them to milliseconds for plotly express
            yield table.update_view(
                [
                    f"{x_start} = {x_start}",
                    f"{x_end} = {x_end}",
                    f"{x_diff} = ({x_end} - {x_start}) / NANOS_PER_MILLI",
                    f"{y}",
                ]
            ), {"x_diff": x_diff}
