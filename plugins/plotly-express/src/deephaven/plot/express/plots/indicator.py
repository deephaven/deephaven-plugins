from __future__ import annotations

from typing import Callable, Literal

from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure, draw_indicator
from ..types import PartitionableTableLike, Gauge, StyleDict
from ._private_utils import process_args


def indicator(
    table: PartitionableTableLike,
    value: str | None,
    reference: str | None = None,
    text: str | Literal[False] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | tuple[str, ...] = "gauge_color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    increasing_color: str | list[str] | None = None,
    decreasing_color: str | list[str] | None = None,
    gauge_color: str | list[str] | None = None,
    increasing_color_sequence: list[str] | None = None,
    increasing_color_map: StyleDict | None = None,
    decreasing_color_sequence: list[str] | None = None,
    decreasing_color_map: StyleDict | None = None,
    gauge_color_sequence: list[str] | None = None,
    gauge_color_map: StyleDict | None = None,
    number: bool = True,
    gauge: Gauge | None = None,
    axis: bool = True,
    prefix: str | None = None,
    suffix: str | None = None,
    increasing_text: str | None = "▲",
    decreasing_text: str | None = "▼",
    number_format: str | None = None,
    rows: int | None = None,
    cols: int | None = None,
    title: str | None = None,
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
      filter_by: A column or list of columns that contain values to filter the chart by.
        If a boolean is passed and the table is partitioned, all partition key columns used to
        create the partitions are used.
        If no filters are specified, all partitions are shown on the chart.
      required_filter_by: A column or list of columns that contain values to filter the chart by.
        Values set in input filters or linkers for the relevant columns determine the exact values to display.
        If a boolean is passed and the table is partitioned, all partition key columns used to
        create the partitions are used.
        All required input filters or linkers must be set for the chart to display any data.
      increasing_color: A column or list of columns used for a plot by on delta increasing color.
        Only valid if reference is not None.
        See increasing_color_map for additional behaviors.
      decreasing_color: A column or list of columns used for a plot by on delta increasing color.
        Only valid if reference is not None.
        See decreasing_color_map for additional behaviors.
      gauge_color: A column or list of columns used for a plot by on color.
        Only valid if gauge is not None.
        See gauge_color_map for additional behaviors.
      text: A column that contains text annotations. Set to "by" if by is specified and is one column.
        Set to False to hide text annotations.
      increasing_color_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors are reused.
      increasing_color_map: A dict with keys that are strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      decreasing_color_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors are reused.
      decreasing_color_map: A dict with keys that are strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      gauge_color_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors are reused.
      gauge_color_map: A dict with keys that are strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      number: True to show the number, False to hide it.
      gauge: Specifies the type of gauge to use.
        Set to "angular" for a half-circle gauge and "bullet" for a horizontal gauge.
      axis: True to show the axis. Only valid if gauge is set.
      prefix: A string to prepend to the number value.
      suffix: A string to append to the number value.
      increasing_text: The text to display before the delta if the number value
        is greater than the reference value.
      decreasing_text: The text to display before the delta if the number value
        is less than the reference value.
      number_format: A string that specifies the number format for values and deltas.
        Default is "#,##0.00" which formats numbers with commas every three digits
        and two decimal places.
      rows: The number of rows of indicators to create.
        If None, the number of rows is determined by the number of columns.
        If both rows and columns are None, a square grid is created.
      cols: The number of columns of indicators to create.
        If None, the number of columns is determined by the number of rows.
        If both rows and columns are None, a square grid is created.
      title: The title of the chart
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
    args = locals()

    return process_args(args, {"indicator"}, px_func=draw_indicator)
