from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, preprocess_and_layer, unsafe_figure_update_wrapper
from ..deephaven_figure import generate_figure, DeephavenFigure
from ..preprocess import preprocess_timeline, preprocess_frequency_bar


def bar(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a bar chart

    :param table: A table to pull data from.
    :param x: A column or list of columns that contain x-axis values.
    :param y: A column or list of columns that contain y-axis values.
    :param error_x: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_x_minus is not specified, and the error bars in only the
    positive direction if error_x_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_x_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_x is not specified.
    :param error_y: A column or list of columns with x error bar
    values. These form the error bars in both the positive and negative
    direction if error_y_minus is not specified, and the error bars in only the
    positive direction if error_y_minus is specified. None can be used to
    specify no error bars on the corresponding series.
    :param error_y_minus: A column or list of columns with x error
    bar values. These form the error bars in the negative direction, and are
    ignored if error_y is not specified.
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
    :param log_x: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param log_y: Default False. A boolean or list of booleans that specify if
    the corresponding axis is a log axis or not. The booleans loop, so if there
    are more series than booleans, booleans will be reused.
    :param range_x: A list of two numbers or a list of lists of two numbers
    that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param range_y: A list of two numbers or a list of lists of two numbers
     that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param range_y: A list of two numbers or a list of lists of two numbers
    that specify the range of the x axes. None can be specified for no range
    The ranges loop, so if there are more axes than ranges, ranges will
    be reused.
    :param text_auto: Default False. If True, display the value at each bar.
    If a string, specifies a plotly texttemplate.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the bar chart
    """
    args = locals()
    args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.bar, call_args=args)
    )


def _bar_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        # barnorm: str = None,
        barmode: str = 'relative',
        direction: str = 'clockwise',
        start_angle: int = 90,
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
    # todo: not yet implemented
    if isinstance(table, Table):
        args = locals()
        args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

        validate_common_args(args)

        return generate_figure(draw=px.bar_polar, call_args=args)


def timeline(
        table: str = None,
        x_start: str = None,
        x_end: str = None,
        y: str = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        unsafe_update_figure: Callable = default_callback
):
    """
    Returns a timeline (otherwise known as a gantt chart)

    :param table: A table to pull data from.
    :param x_start: A column that contains starting x-axis values.
    :param x_end: A column that contains ending x-axis values.
    :param y: A column or list of columns that contain y-axis labels
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param pattern_shape_sequence: A list of patterns to sequentially apply
    to the series. The patterns loop, so if there are more series than
    patterns, patterns will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param range_x: A list of two numbers that specify the range of the x axis.
    :param range_y: A list of two numbers that specify the range of the y axis.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the timeline chart
    """
    # TODO: add resource column?
    table, x_diff = preprocess_timeline(table, x_start, x_end, y)
    args = locals()
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.timeline, call_args=args)
    )


def frequency_bar(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        unsafe_update_figure: Callable = default_callback
):
    """
    Returns a bar chart that contains the counts of the specified columns

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
    :param text_auto: Default False. If True, display the value at each bar.
    If a string, specifies a plotly texttemplate.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the bar chart
    """

    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()
    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
    args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    create_layered = partial(preprocess_and_layer,
                             preprocess_frequency_bar,
                             px.bar, args, list_var_axis_name="value")

    return update_wrapper(
        create_layered("x") if x else create_layered("y", orientation="h")
    )
