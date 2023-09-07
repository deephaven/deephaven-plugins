from __future__ import annotations

from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import (
    validate_common_args,
    shared_violin,
    shared_box,
    shared_strip,
    shared_histogram,
)
from ._update_wrapper import default_callback, unsafe_figure_update_wrapper
from ..deephaven_figure import DeephavenFigure
from ..preprocess import preprocess_ecdf


def violin(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    violinmode: str = "group",
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] = None,
    range_y: list[int] = None,
    points: bool | str = "outliers",
    box: bool = False,
    title: str = None,
    template: str = None,
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a violin chart

    Args:
      table:  Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column name or list of columns that contain x-axis values.
        Only one of x or y can be specified. If x is specified,
        the violins are drawn horizontally.
      y: str | list[str]:  (Default value = None)
        A column name or list of columns that contain y-axis values.
        Only one of x or y can be specified. If y is specified, the
        violins are drawn vertically.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain color.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      violinmode: str:  (Default value = 'group')
        Default 'group', which draws the violins next
        to each other or 'overlay' which draws them on top of each other.
      log_x: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the x-axis.
      range_y: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the y-axis.
      points:  bool | str:  (Default value = 'outliers')
        Default 'outliers', which draws points outside the whiskers.
        'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
        'all' draws all points and False draws no points.
      box: bool:  (Default value = False)
        Draw boxes inside the violin if True.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure: callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      DeephavenFigure: A DeephavenFigure that contains the violin chart

    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    return shared_violin(**args)


def box(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    boxmode: str = "group",
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] = None,
    range_y: list[int] = None,
    points: bool | str = "outliers",
    notched: bool = False,
    title: str = None,
    template: str = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a box chart

    Args:
      table:  Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column name or list of columns that contain x-axis values.
        Only one of x or y can be specified. If x is specified,
        the boxes are drawn horizontally.
      y: str | list[str]:  (Default value = None)
        A column name or list of columns that contain y-axis values.
        Only one of x or y can be specified. If y is specified, the
        boxes are drawn vertically.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain color.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      boxmode: str:  (Default value = 'group')
        Default 'group', which draws the boxes next
        to each other or 'overlay' which draws them on top of each other.
      log_x: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the x-axis.
      range_y: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the y-axis.
      points:  bool | str:  (Default value = 'outliers')
        Default 'outliers', which draws points outside the whiskers.
        'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
        'all' draws all points and False draws no points.
      notched:  bool:  (Default value = False)
         If True boxes are drawn with notches
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure: callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the box chart

    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    return shared_box(**args)


def strip(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    stripmode: bool | str = "group",
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] = None,
    range_y: list[int] = None,
    title: str = None,
    template: str = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a strip chart

    Args:
      table:  Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column name or list of columns that contain x-axis values.
        Only one of x or y can be specified. If x is specified,
        the strips are drawn horizontally.
      y: str | list[str]:  (Default value = None)
        A column name or list of columns that contain y-axis values.
        Only one of x or y can be specified. If y is specified, the
        strips are drawn vertically.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain color.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      stripmode: str:  (Default value = 'group')
        Default 'group', which draws the strips next
        to each other or 'overlay' which draws them on top of each other.
      log_x: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the x-axis.
      range_y: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the y-axis.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure: callable:  (Default value = default_callback)
        An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the strip chart

    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    return shared_strip(**args)


def _ecdf(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    markers: bool = False,
    lines: bool = True,
    color_discrete_sequence: list[str] = None,
    line_dash_sequence: list[str] = None,
    symbol_sequence: list[str] = None,
    opacity: float = None,
    ecdfnorm: str = "probability",
    ecdfmode: str = "standard",
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] = None,
    range_y: list[int] = None,
    title: str = None,
    template: str = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """

    Args:
      table: Table:  (Default value = None)
      x: str | list[str]:  (Default value = None)
      y: str | list[str]:  (Default value = None)
      markers: bool:  (Default value = False)
      lines: bool:  (Default value = True)
      color_discrete_sequence: list[str]:  (Default value = None)
      line_dash_sequence: list[str]:  (Default value = None)
      symbol_sequence: list[str]:  (Default value = None)
      opacity: float:  (Default value = None)
      ecdfnorm: str:  (Default value = 'probability')
      ecdfmode: str:  (Default value = 'standard')
      log_x: bool:  (Default value = False)
      log_y: bool:  (Default value = False)
      range_x: list[int]:  (Default value = None)
      range_y: list[int]:  (Default value = None)
      title: str:  (Default value = None)
      template: str:  (Default value = None)
      unsafe_update_figure: Callable:  (Default value = default_callback)

    Returns:

    """
    # todo: not fully implemented
    line_shape = "hv"
    # rangemode = "tozero"

    args = locals()

    validate_common_args(args)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    args.pop("lines")
    args.pop("ecdfnorm")
    args.pop("ecdfmode")

    update_wrapper = partial(
        unsafe_figure_update_wrapper, args.pop("unsafe_update_figure")
    )

    create_layered = partial(preprocess_and_layer, preprocess_ecdf, px.line, args)

    return update_wrapper(
        create_layered("x") if x else create_layered("y", orientation="h")
    )


def histogram(
    table: Table = None,
    x: str | list[str] = None,
    y: str | list[str] = None,
    by: str | list[str] = None,
    by_vars: str | list[str] = "color",
    color: str | list[str] = None,
    pattern_shape: str | list[str] = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str | tuple[str], str] = None,
    pattern_shape_sequence: list[str] = None,
    pattern_shape_map: dict[str | tuple[str], str] = None,
    marginal: str = None,
    opacity: float = None,
    barmode: str = "relative",
    barnorm: str = None,
    histnorm: str = None,
    log_x: bool = False,
    log_y: bool = False,
    range_x: list[int] = None,
    range_y: list[int] = None,
    range_bins: list[int] = None,
    histfunc: str = "count",
    cumulative: bool = False,
    nbins: int = 10,
    text_auto: bool | str = False,
    title: str = None,
    template: str = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a histogram

    Args:
      table:  Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column name or list of columns that contain x-axis values.
        Only one of x or y can be specified. If x is specified,
        the bars are drawn horizontally.
      y: str | list[str]:  (Default value = None)
        A column name or list of columns that contain y-axis values.
        Only one of x or y can be specified. If y is specified, the
        bars are drawn vertically.
      by: str | list[str]:  (Default value = None)
        A column or list of columns that contain values to plot the figure traces by.
        All values or combination of values map to a unique design. The variable
        by_vars specifies which design elements are used.
        This is overriden if any specialized design variables such as color are specified
      by_vars: str | list[str]:  (Default value = "color")
        A string or list of string that contain design elements to plot by.
        Can contain color.
        If associated maps or sequences are specified, they are used to map by column values
        to designs. Otherwise, default values are used.
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      pattern_shape: str | list[str]: (Default value = None)
        A column or list of columns that contain pattern shape values.
        The value is used for a plot by on pattern shape.
        See pattern_shape_map for additional behaviors.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      pattern_shape_sequence: list[str]:  (Default value = None)
        A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      pattern_shape_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to patterns.
      marginal: str:  (Default value = None)
        The type of marginal; histogram, violin, rug, box
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      barmode: str:  (Default value = 'relative')
        If 'relative', bars are stacked. If
        'overlay', bars are drawn on top of each other. If 'group', bars are
        drawn next to each other.
      barnorm: str:  (Default value = None)
        If 'fraction', the value of the bar is divided by all bars at that
        location. If 'percentage', the result is the same but multiplied by
        100.
      histnorm: str:  (Default value = None)
        If 'probability', the value at this bin is divided out of the total
        of all bins in this column. If 'percent', result is the same as
        'probability' but multiplied by 100. If 'density', the value is divided
        by the width of the bin. If 'probability density', the value is divided
        out of the total of all bins in this column and the width of the bin.
      log_x: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      log_y: bool
        A boolean that specifies if the corresponding axis is a log
        axis or not.
      range_x: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the x-axis.
      range_y: list[int]:  (Default value = None)
        A list of two numbers that specify the range of the y-axis.
      range_bins: list[int]:
        A list of two numbers that specify the range of data that is used.
      histfunc: str:  (Default value = 'count')
        The function to use when aggregating within bins. One of
        'avg', 'count', 'count_distinct', 'max', 'median', 'min', 'std', 'sum',
        or 'var'
      cumulative: bool:  (Default value = False)
        If True, values are cumulative.
      nbins: int:  (Default value = 10)
        The number of bins to use.
      text_auto: bool | str:  (Default value = False)
        If True, display the value at each bar.
        If a string, specifies a plotly texttemplate.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      unsafe_update_figure: callable:  (Default value = default_callback)
        An update function that takes a plotly figure
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

    return shared_histogram(**args)
