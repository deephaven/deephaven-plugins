from __future__ import annotations

from typing import Callable

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure
from ..types import PartitionableTableLike
from typing import Literal

Gauge = Literal["shape", "bullet"]


def indicators(
    table: PartitionableTableLike,
    value: str | None = None,
    reference: str | None = None,
    by: str | list[str] | None = None,
    increasing_color: str | list[str] | None = None,
    decreasing_color: str | list[str] | None = None,
    text: str | None = None,
    increasing_color_discrete_sequence: list[str] | None = None,
    increasing_color_discrete_map: dict[str | tuple[str], str] | None = None,
    decreasing_color_discrete_sequence: list[str] | None = None,
    decreasing_color_discrete_map: dict[str | tuple[str], str] | None = None,
    number: bool = True,
    delta: bool = True,
    gauge: Gauge | None = None,
    axis: bool = False,
    prefix: str | None = None,
    suffix: str | None = None,
    rows: int = 1,
    columns: int = 1,
) -> DeephavenFigure:
    """
    Create an indicator chart.

    Args:
      table: A table to pull data from.
      value: The column to use as the value.
      reference: The column to use as the reference value.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      increasing_color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        see color_discrete_map for additional behaviors.
      decreasing_color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        see color_discrete_map for additional behaviors
      text: A column that contains text annotations.
      increasing_color_discrete_sequence:
      increasing_color_discrete_map:
      decreasing_color_discrete_sequence:
      decreasing_color_discrete_map:
      number: True to show the number, False to hide it.
      delta: True to show the delta, False to hide it.
      gauge: Specifies the type of gauge to use.
        Set to "angular" for a half-circle gauge and bullet for a horizontal gauge.
      axis: True to show the axis. Only valid if gauge is set.
      prefix: A string to prepend to the value.
      suffix: A string to append to the value.
      rows: The number of rows of indicators to create.
      columns: The number of columns of indicators to create.

    Returns:

    """
    raise NotImplementedError
