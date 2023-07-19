from __future__ import annotations

from typing import Any

from ..shared import get_unique_names

from deephaven.time import nanos_to_millis, diff_nanos
from deephaven.table import Table


def time_length(
        start: str,
        end: str
) -> int:
    """Calculate the difference between the start and end times in milliseconds

    Args:
      start: str:
        The start time
      end: str:
        The end time

    Returns:
      int: The time in milliseconds

    """
    return nanos_to_millis(diff_nanos(start, end))


class TimePreprocesser:
    """
    Used to preprocess times for a gantt plot.

    Attributes:
        args: dict[str, str]: Figure creation args
    """

    def __init__(self, args: dict[str, Any]):
        self.args = args

    def preprocess_partitioned_tables(
            self,
            tables: list[Table],
            column: str = None
    ) -> tuple[Table, dict[str, str]]:
        """Preprocess frequency bar params into an appropriate table
        This just sums each value by count

        Args:
          tables: Table:
            The tables to process
          column: str:
            The column to process

        Returns:
          tuple[Table, dict[str, str]]: A tuple containing
            (the new table, an update to make to the args)

        """
        x_start, x_end, y, table = self.args["x_start"], self.args["x_end"], self.args["y"], self.args["table"]

        x_diff = get_unique_names(table, ["x_diff"])["x_diff"]

        for table in tables:
            yield table.update_view([f"{x_start}",
                                     f"{x_end}",
                                     f"{x_diff} = time_length({x_start}, {x_end})",
                                     f"{y}"]), {"x_diff": x_diff}
