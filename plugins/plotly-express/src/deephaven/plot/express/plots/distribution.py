from __future__ import annotations

from typing import Callable

from deephaven.table import Table

from ._private_utils import (
    shared_violin,
    shared_box,
    shared_strip,
    shared_histogram,
)
from ..deephaven_figure import DeephavenFigure
from ..shared import (
    VIOLIN_DEFAULTS,
    BOX_DEFAULTS,
    STRIP_DEFAULTS,
    HISTOGRAM_DEFAULTS,
    default_callback,
)
from ..types import PartitionableTableLike, Orientation


def violin(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = VIOLIN_DEFAULTS["by_vars"],
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    violinmode: str = VIOLIN_DEFAULTS["violinmode"],
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    points: bool | str = VIOLIN_DEFAULTS["points"],
    box: bool = False,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = VIOLIN_DEFAULTS["unsafe_update_figure"],
) -> DeephavenFigure:
    """Returns a violin chart

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
        If both x and y are specified, one should be numerical and the other categorical.
        If x is numerical, the violins are drawn horizontally.
      y: A column or list of columns that contain y-axis values.
        If both x and y are specified, one should be numerical and the other categorical.
        If y is numerical, the violins are drawn vertically.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color.
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
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      violinmode: Default 'group', which draws the violins next
        to each other or 'overlay' which draws them on top of each other.
      log_x: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: A list of two numbers that specify the range of the x-axis.
      range_y: A list of two numbers that specify the range of the y-axis.
      points: Default 'outliers', which draws points outside the whiskers.
        'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
        'all' draws all points and False draws no points.
      box: Draw boxes inside the violin if True.
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
      DeephavenFigure: A DeephavenFigure that contains the violin chart

    """
    args = locals()

    return shared_violin(is_marginal=False, **args)


def box(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = BOX_DEFAULTS["by_vars"],
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    boxmode: str = BOX_DEFAULTS["boxmode"],
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    points: bool | str = BOX_DEFAULTS["points"],
    notched: bool = False,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = BOX_DEFAULTS["unsafe_update_figure"],
) -> DeephavenFigure:
    """Returns a box chart

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
        If both x and y are specified, one should be numerical and the other categorical.
        If x is numerical, the violins are drawn horizontally.
      y: A column or list of columns that contain y-axis values.
        If both x and y are specified, one should be numerical and the other categorical.
        If y is numerical, the violins are drawn vertically.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color.
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
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      boxmode: Default 'group', which draws the boxes next
        to each other or 'overlay' which draws them on top of each other.
      log_x: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: A list of two numbers that specify the range of the x-axis.
      range_y: A list of two numbers that specify the range of the y-axis.
      points: Default 'outliers', which draws points outside the whiskers.
        'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
        'all' draws all points and False draws no points.
      notched: If True boxes are drawn with notches
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
      A DeephavenFigure that contains the box chart

    """
    args = locals()

    return shared_box(is_marginal=False, **args)


def strip(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = STRIP_DEFAULTS["by_vars"],
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    stripmode: bool | str = STRIP_DEFAULTS["stripmode"],
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = STRIP_DEFAULTS["unsafe_update_figure"],
) -> DeephavenFigure:
    """Returns a strip chart

    Args:
      table: A table to pull data from.
      x: A column or list of columns that contain x-axis values.
        If both x and y are specified, one should be numerical and the other categorical.
        If x is numerical, the violins are drawn horizontally.
      y: A column or list of columns that contain y-axis values.
        If both x and y are specified, one should be numerical and the other categorical.
        If y is numerical, the violins are drawn vertically.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color.
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
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contains names to bold in the hover tooltip.
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      stripmode: Default 'group', which draws the strips next
        to each other or 'overlay' which draws them on top of each other.
      log_x: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: A list of two numbers that specify the range of the x-axis.
      range_y: A list of two numbers that specify the range of the y-axis.
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
      A DeephavenFigure that contains the strip chart

    """
    args = locals()

    return shared_strip(is_marginal=False, **args)


def _ecdf(
    table: Table | None = None,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    markers: bool = False,
    lines: bool = True,
    color_discrete_sequence: list[str] | None = None,
    line_dash_sequence: list[str] | None = None,
    symbol_sequence: list[str] | None = None,
    opacity: float | None = None,
    ecdfnorm: str = "probability",
    ecdfmode: str = "standard",
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """

    Args:
      table: Table | None:  (Default value = None)
      x: str | list[str] | None:  (Default value = None)
      y: str | list[str] | None:  (Default value = None)
      markers: bool:  (Default value = False)
      lines: bool:  (Default value = True)
      color_discrete_sequence: list[str] | None:  (Default value = None)
      line_dash_sequence: list[str] | None:  (Default value = None)
      symbol_sequence: list[str] | None:  (Default value = None)
      opacity: float | None:  (Default value = None)
      ecdfnorm: str:  (Default value = 'probability')
      ecdfmode: str:  (Default value = 'standard')
      log_x: bool:  (Default value = False)
      log_y: bool:  (Default value = False)
      range_x: list[int] | None:  (Default value = None)
      range_y: list[int] | None:  (Default value = None)
      title: str | None:  (Default value = None)
      template: str | None:  (Default value = None)
      unsafe_update_figure: Callable:  (Default value = default_callback)

    Returns:

    """
    raise NotImplementedError("ecdf is not yet implemented")


def histogram(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    by: str | list[str] | None = None,
    by_vars: str | list[str] = HISTOGRAM_DEFAULTS["by_vars"],
    filter_by: str | list[str] | bool | None = None,
    required_filter_by: str | list[str] | bool | None = None,
    color: str | list[str] | None = None,
    pattern_shape: str | list[str] | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str | tuple[str], str] | None = None,
    pattern_shape_sequence: list[str] | None = None,
    pattern_shape_map: dict[str | tuple[str], str] | None = None,
    marginal: str | None = None,
    opacity: float | None = None,
    orientation: Orientation | None = None,
    barmode: str = HISTOGRAM_DEFAULTS["barmode"],
    barnorm: str = HISTOGRAM_DEFAULTS["barnorm"],
    histnorm: str = HISTOGRAM_DEFAULTS["histnorm"],
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] | None = None,
    range_y: list[int] | None = None,
    range_bins: list[int] = HISTOGRAM_DEFAULTS["range_bins"],
    histfunc: str = HISTOGRAM_DEFAULTS["histfunc"],
    cumulative: bool = HISTOGRAM_DEFAULTS["cumulative"],
    nbins: int = HISTOGRAM_DEFAULTS["nbins"],
    text_auto: bool | str = False,
    title: str | None = None,
    template: str | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a histogram

    Args:
      table: A table to pull data from.
      x: A column name or list of columns that contain x-axis values.
        Column values must be numeric. If x is specified,
        the bars are drawn vertically by default.
      y: A column name or list of columns that contain y-axis values.
        Column values must be numeric. If only y is specified,
        the bars are drawn horizontally by default.
      by: A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: A string or list of string that contain design elements to plot by.
        Can contain color.
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
      marginal: The type of marginal; histogram, violin, rug, box
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      orientation: The orientation of the bars.
        If 'v', the bars are vertical.
        If 'h', the bars are horizontal.
        Defaults to 'v' if `x` is specified.
        Defaults to 'h' if only `y` is specified.
      barmode: If 'relative', bars are stacked. If
        'overlay', bars are drawn on top of each other. If 'group', bars are
        drawn next to each other.
      barnorm: If 'fraction', the value of the bar is divided by all bars at that
        location. If 'percentage', the result is the same but multiplied by
        100.
      histnorm: If 'probability', the value at this bin is divided out of the total
        of all bins in this column. If 'percent', result is the same as
        'probability' but multiplied by 100. If 'density', the value is divided
        by the width of the bin. If 'probability density', the value is divided
        out of the total of all bins in this column and the width of the bin.
      log_x: A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: A list of two numbers that specify the range of the x-axis.
      range_y: A list of two numbers that specify the range of the y-axis.
      range_bins: A list of two numbers that specify the range of data that is used.
      histfunc: The function to use when aggregating within bins. One of
        'abs_sum', 'avg', 'count', 'count_distinct', 'max', 'median', 'min', 'std',
        'sum', or 'var'
        Defaults to 'count' if only one of x or y is specified and 'sum' if both are.
      cumulative: If True, values are cumulative.
      nbins: The number of bins to use.
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
      DeephavenFigure: A DeephavenFigure that contains the histogram

    """
    args = locals()

    return shared_histogram(is_marginal=False, **args)
