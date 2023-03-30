from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, preprocess_and_layer
from ..deephaven_figure import generate_figure, DeephavenFigure
from ..preprocess import preprocess_ecdf, create_hist_tables, preprocess_violin


def violin(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        violinmode: str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        points: bool | str = 'outliers',
        box: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a violin chart

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the violins are
    drawn horizontally.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If y is specified, the violins are
    drawn vertically.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param violinmode: Default 'group', which draws the violins next
    to each other and 'overlay' which draws them on top of each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param points: Default 'outliers', which draws points outside the whiskers.
    'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
    'all' draws all points and False draws no points.
    :param box: Default False. Draw boxes inside the violin if True.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the violin chart
    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    validate_common_args(args)

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.violin, args)

    return create_layered("x") if x else create_layered("y")


def box(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        boxmode: str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        points: bool | str = 'outliers',
        notched: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a box chart

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the violins are
    drawn horizontally.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If y is specified, the violins are
    drawn vertically.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param boxmode: Default 'group', which draws the violins next
    to each other and 'overlay' which draws them on top of each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param points: Default 'outliers', which draws points outside the whiskers.
    'suspectedoutliers' draws points below 4*Q1-3*Q3 and above 4*Q3-3*Q1.
    'all' draws all points and False draws no points.
    :param notched: Default False, if True boxes are drawn with notches
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the box chart
    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    validate_common_args(args)

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.box, args)

    return create_layered("x") if x else create_layered("y")


def strip(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        stripmode: bool | str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a strip chart

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the violins are
    drawn horizontally.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If y is specified, the violins are
    drawn vertically.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param stripmode: Default 'group', which draws the violins next
    to each other and 'overlay' which draws them on top of each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the strip chart
    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    validate_common_args(args)

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.strip, args)

    return create_layered("x") if x else create_layered("y")


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
        ecdfnorm: str = 'probability',
        ecdfmode: str = 'standard',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    line_shape = "hv"
    #rangemode = "tozero"

    args = locals()

    validate_common_args(args)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    args.pop("lines")
    args.pop("ecdfnorm")
    args.pop("ecdfmode")

    create_layered = partial(preprocess_and_layer,
                             preprocess_ecdf,
                             px.line, args)

    return create_layered("x") if x else create_layered("y", orientation="h")


def histogram(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        # barnorm: str = None,
        # histnorm: str = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_bins: list[int] = None,
        histfunc: str = 'count',
        # cumulative: bool = False,
        nbins: int = 10,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a histogram

    :param table: A table to pull data from.
    :param x: A column name or list of columns that contain x-axis values.
    Only one of x or y can be specified. If x is specified, the bars are drawn
    vertically.
    :param y: A column name or list of columns that contain y-axis values.
    Only one of x or y can be specified. If x is specified, the bars are drawn
    horizontally.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param pattern_shape_sequence: A list of patterns to sequentially apply
    to the series. The patterns loop, so if there are more series than
    patterns, patterns will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param barmode: Default 'relative'. If 'relative', bars are stacked. If
    'overlay', bars are drawn on top of each other. If 'group', bars are drawn
    next to each other.
    :param log_x: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param log_y: A boolean that specifies if the corresponding axis is a log
    axis or not.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param range_bins: A list of two numbers that specify the range of data
    that is used.
    :param histfunc: The function to use when aggregating within bins. One of
    'avg', 'count', 'count_distinct', 'max', 'median', 'min', 'std', 'sum',
    or 'var'
    :param nbins: Default 10. The number of bins to use.
    :param text_auto: Default False. If True, display the value at each bar.
    If a string, specifies a plotly texttemplate.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the histogram
    """
    validate_common_args(locals())

    if x:
        table, x, y = create_hist_tables(table, x, nbins, range_bins, histfunc)
    elif y:
        table, y, x = create_hist_tables(table, y, nbins, range_bins, histfunc)
        orientation = "h"
    else:
        raise ValueError("x or y must be specified")
    # since we're simulating a histogram with a bar plot, we want no data gaps
    bargap = 0

    # remove arguments not used in bar
    args = locals()
    args.pop("nbins")
    args.pop("histfunc")
    args.pop("range_bins")

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
    args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")

    return generate_figure(draw=px.bar, call_args=args)
