from __future__ import annotations

from typing import Callable
import warnings

from plotly import express as px

from deephaven.table import Table

from ._private_utils import validate_common_args, process_args
from ..shared import default_callback
from ..deephaven_figure import generate_figure, DeephavenFigure
from ..types import PartitionableTableLike, Orientation


def bar(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    pattern_shape: str | list[str] | None = None,
    error_x: str | None = None,
    error_x_minus: str | None = None,
    error_y: str | None = None,
    error_y_minus: str | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
    pattern_shape_sequence: list[str] | None = None,
    pattern_shape_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[float] | None = None,
    color_continuous_midpoint: float | None = None,
    opacity: float | None = None,
    orientation: Orientation | None = None,
    barmode: str = "relative",
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    text_auto: bool | str = False,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a bar chart

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
        If only x is specified, the y-axis values are the count of each unique x value.
      y: A column or list of columns that contain y-axis values.
        If only y is specified, the x-axis values are the count of each unique y value.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color and pattern_shape.
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
      color: A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      pattern_shape: A column or list of columns that contain pattern shape values.
        The value is used for a plot by on pattern shape.
        See pattern_shape_map for additional behaviors.
      error_x: A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_x_minus is not specified, and the error bars in
        only the positive direction if error_x_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_x_minus: A column with x error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_x is not specified.
      error_y: A column with x error bar values.
        These form the error bars in both the positive and negative
        direction if error_y_minus is not specified, and the error bars in
        only the positive direction if error_y_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_y_minus: A column with y error bar values.
        These form the error bars in the negative direction,
        and are ignored if error_y is not specified.
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      pattern_shape_sequence: A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      pattern_shape_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to patterns.
        If "identity", the values are taken as literal patterns.
        If "by" or ("by", dict) where dict is as described above, the patterns are forced to by
      color_continuous_scale: A list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      orientation: The orientation of the bars.
        If 'v', the bars are vertical.
        If 'h', the bars are horizontal.
        Defaults to 'v' if only `x` is specified.
        Defaults to 'h' if only `y` is specified.
        Defaults to 'v' if both `x` and `y` are specified unless `x` is passed only numeric columns and `y` is not.
      barmode: If 'relative', bars are stacked. If 'overlay', bars are drawn on top
        of each other. If 'group', bars are drawn next to each other.
      log_x: A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      log_y: A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      range_x: A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      range_y: A list of two numbers or a list of lists of two numbers
        that specify the range of the y axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      text_auto: If True, display the value at each bar.
        If a string, specifies a plotly texttemplate.
      title:  The title of the chart
      template: The template for the chart.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the bar chart

    """
    args = locals()

    groups = {"bar", "supports_lists"}

    if not x or not y:
        groups.add("preprocess_freq")

    return process_args(args, groups, px_func=px.bar)


def _bar_polar(
    table: Table | None = None,
    r: str | None = None,
    theta: str | None = None,
    color_discrete_sequence: list[str] | None = None,
    pattern_shape_sequence: list[str] | None = None,
    # barnorm: str = None,
    barmode: str = "relative",
    direction: str = "clockwise",
    start_angle: int = 90,
    range_r: list[int] | None = None,
    range_theta: list[int] | None = None,
    log_r: bool = False,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """

    Args:
      table: Table | None:  (Default value = None)
      r: str | None:  (Default value = None)
      theta: str | None:  (Default value = None)
      color_discrete_sequence: list[str] | None:  (Default value = None)
      pattern_shape_sequence: list[str] | None:  (Default value = None)
      # barnorm: str | None:  (Default value = None)
      barmode: str:  (Default value = 'relative')
      direction: str:  (Default value = 'clockwise')
      start_angle: int:  (Default value = 90)
      range_r: list[int] | None:  (Default value = None)
      range_theta: list[int] | None:  (Default value = None)
      log_r: bool:  (Default value = False)
      title: str | None:  (Default value = None)
      template: str | None:  (Default value = None)
      unsafe_update_figure: Callable:  (Default value = default_callback)

    Returns:

    """
    # todo: not yet implemented
    raise NotImplementedError("Not yet implemented")
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        validate_common_args(args)

        return generate_figure(draw=px.bar_polar, call_args=args)


def timeline(
    table: PartitionableTableLike,
    x_start: str | None = None,
    x_end: str | None = None,
    y: str | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    pattern_shape: str | list[str] | None = None,
    text: str | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
    pattern_shape_sequence: list[str] | None = None,
    pattern_shape_map: str
    | tuple[str, dict[str | tuple[str], dict[str | tuple[str], str]]]
    | dict[str | tuple[str], str]
    | None = None,
    color_continuous_scale: list[str] | None = None,
    range_color: list[float] | None = None,
    color_continuous_midpoint: float | None = None,
    opacity: float | None = None,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a timeline (otherwise known as a gantt chart)

    Args:
      table: A table to pull data from.
      x_start: A column that contains starting x-axis values. Must be a `java.time.Instant` column.
      x_end: A column that contains ending x-axis values. Must be a `java.time.Instant` column.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color and pattern_shape.
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
      color: A column or list of columns that contain color values.
        If only one column is passed, and it contains numeric values, the value
        is used as a value on a continuous color scale. Otherwise, the value is
        used for a plot by on color.
        See color_discrete_map for additional behaviors.
      pattern_shape: A column or list of columns that contain pattern shape values.
        The value is used for a plot by on pattern shape.
        See pattern_shape_map for additional behaviors.
      y: A column that contains y-axis labels
      text: A column that contains text annotations.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
        If "identity", the values are taken as literal colors.
        If "by" or ("by", dict) where dict is as described above, the colors are forced to by
      pattern_shape_sequence: A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      pattern_shape_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to patterns.
        If "identity", the values are taken as literal patterns.
        If "by" or ("by", dict) where dict is as described above, the patterns are forced to by
      color_continuous_scale: A list of colors for a continuous scale
      range_color: A list of two numbers that form the endpoints of the color axis
      color_continuous_midpoint: A number that is the midpoint of the color axis
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      range_x: A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      range_y: A list of two numbers or a list of lists of two numbers
        that specify the range of the y axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      title: The title of the chart
      template: The template for the chart.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the timeline chart

    """
    args = locals()

    return process_args(args, {"bar", "preprocess_time"}, px_func=px.timeline)


def frequency_bar(
    table: Table | None = None,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = "color",
    labels: dict[str, str] | None = None,
    color: str | list[str] | None = None,
    pattern_shape: str | list[str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    pattern_shape_sequence: list[str] | None = None,
    pattern_shape_map: dict[str | tuple[str], str] | None = None,
    opacity: float | None = None,
    barmode: str = "relative",
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    text_auto: bool | str = False,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a bar chart that contains the counts of the specified columns

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
        Only one of x or y can be specified. If x is specified, the bars
        are drawn vertically.
      y: A column or list of columns that contain y-axis values.
        Only one of x or y can be specified. If y is specified, the bars
        are drawn horizontally.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color and pattern_shape.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      pattern_shape: A column or list of columns that contain pattern shape values.
        The value is used for a plot by on pattern shape.
        See pattern_shape_map for additional behaviors.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      pattern_shape_sequence: A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      pattern_shape_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to patterns.
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      barmode: If 'relative', bars are stacked. If 'overlay', bars are drawn on top
        of each other. If 'group', bars are drawn next to each other.
      log_x: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: A list of two numbers that specify the range of the x-axis.
      range_y: A list of two numbers that specify the range of the y-axis.
      text_auto: If True, display the value at each bar.
        If a string, specifies a plotly texttemplate.
      title: The title of the chart
      template: The template for the chart.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the bar chart

    """
    warnings.warn(
        "This function is deprecated and will be removed in a future release. "
        "Use bar with only one of x or y specified instead for identical behavior.",
        DeprecationWarning,
        stacklevel=2,
    )

    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    return process_args(
        args, {"bar", "preprocess_freq", "supports_lists"}, px_func=px.bar
    )
