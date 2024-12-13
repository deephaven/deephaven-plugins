from __future__ import annotations

from typing import Callable

from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure
from ..types import PartitionableTableLike, Gauge, StyleMap


def indicators(
    table: PartitionableTableLike,
    value: str | None = None,
    reference: str | None = None,
    text: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | tuple[str, ...] = ("increasing_color", "decreasing_color"),
    increasing_color: str | list[str] | None = None,
    decreasing_color: str | list[str] | None = None,
    increasing_color_discrete_sequence: list[str] | None = None,
    increasing_color_discrete_map: StyleMap | None = None,
    decreasing_color_discrete_sequence: list[str] | None = None,
    decreasing_color_discrete_map: StyleMap | None = None,
    number: bool = True,
    delta: bool = True,
    gauge: Gauge | None = None,
    axis: bool = False,
    prefix: str | None = None,
    suffix: str | None = None,
    rows: int = 1,
    columns: int | None = None,
    unsafe_update_figure: Callable = default_callback,
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
        This is overriden if any specialized design variables such as increasing_color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain increasing_color and decreasing_color
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      increasing_color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        see color_discrete_map for additional behaviors.
      decreasing_color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        see color_discrete_map for additional behaviors
      text: A column that contains text annotations.
      increasing_color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      increasing_color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      decreasing_color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      decreasing_color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      number: True to show the number, False to hide it.
      delta: True to show the delta, False to hide it.
      gauge: Specifies the type of gauge to use.
        Set to "angular" for a half-circle gauge and bullet for a horizontal gauge.
      axis: True to show the axis. Only valid if gauge is set.
      prefix: A string to prepend to the value.
      suffix: A string to append to the value.
      rows: The number of rows of indicators to create.
        At least one of rows or columns must be numeric.
        If rows is numeric and columns is None,
        the plot will divide all indicators into the specified number of rows.
        Defaults to 1, which creates a single row of indicators when combined with the default `columns` of None.
      columns: The number of columns of indicators to create.
        At least one of rows or columns must be numeric.
        If columns is numeric and rows is None,
        the plot will divide all indicators into the specified number of columns.
        Defaults to None, which creates a single row of indicators when combined with the default `rows` of 1.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
        A DeephavenFigure that contains the indicator chart

    """
    raise NotImplementedError
