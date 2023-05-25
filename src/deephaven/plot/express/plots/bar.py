from functools import partial

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, preprocess_and_layer, process_args
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
        text: str | list[str] = None,
        hover_name: str | list[str] = None,
        labels: dict[str, str] = None,
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
        unsafe_update_figure: callable = default_callback
) -> DeephavenFigure:
    """Returns a bar chart

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column or list of columns that contain x-axis values.
      y: str | list[str]:  (Default value = None)
        A column or list of columns that contain y-axis values.
      error_x: str | list[str]:  (Default value = None)
        A column or list of columns with x error bar
        values. These form the error bars in both the positive and negative
        direction if error_x_minus is not specified, and the error bars in
        only the positive direction if error_x_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_x_minus: str | list[str]:  (Default value = None)
        A column or list of columns with x error
        bar values. These form the error bars in the negative direction,
        and are ignored if error_x is not specified.
      error_y: str | list[str]:  (Default value = None)
        A column or list of columns with x error bar
        values. These form the error bars in both the positive and negative
        direction if error_y_minus is not specified, and the error bars in
        only the positive direction if error_y_minus is specified. None can be
        used to specify no error bars on the corresponding series.
      error_y_minus: str | list[str]:  (Default value = None)
        A column or list of columns with y error
        bar values. These form the error bars in the negative direction,
        and are ignored if error_y is not specified.
      text: str | list[str]:  (Default value = None)
        A column or list of columns that contain text annotations.
      hover_name: str | list[str]:  (Default value = None)
        A column or list of columns that contain names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      pattern_shape_sequence: list[str]:  (Default value = None)
        A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      barmode: str:  (Default value = 'relative')
        If 'relative', bars are stacked. If 'overlay', bars are drawn on top
        of each other. If 'group', bars are drawn next to each other.
      log_x: bool | list[bool]:  (Default value = False)
        A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      log_y: bool | list[bool]:  (Default value = False)
        A boolean or list of booleans that specify if
        the corresponding axis is a log axis or not. The booleans loop, so if there
        are more series than booleans, booleans will be reused.
      range_x: list[int] | list[list[int]]:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      range_y: list[int] | list[list[int]]:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the y axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
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
      DeephavenFigure: A DeephavenFigure that contains the bar chart

    """
    args = locals()

    update_wrapper = process_args(args, {"bar"})

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
        unsafe_update_figure: callable = default_callback
) -> DeephavenFigure:
    """

    Args:
      table: Table:  (Default value = None)
      r: str:  (Default value = None)
      theta: str:  (Default value = None)
      color_discrete_sequence: list[str]:  (Default value = None)
      pattern_shape_sequence: list[str]:  (Default value = None)
      # barnorm: str:  (Default value = None)
      barmode: str:  (Default value = 'relative')
      direction: str:  (Default value = 'clockwise')
      start_angle: int:  (Default value = 90)
      range_r: list[int]:  (Default value = None)
      range_theta: list[int]:  (Default value = None)
      log_r: bool:  (Default value = False)
      title: str:  (Default value = None)
      template: str:  (Default value = None)
      unsafe_update_figure: Callable:  (Default value = default_callback)

    Returns:

    """
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
        text: str = None,
        hover_name: str = None,
        labels: dict[str, str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        unsafe_update_figure: callable = default_callback
):
    """Returns a timeline (otherwise known as a gantt chart)

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      x_start: str:  (Default value = None)
        A column that contains starting x-axis values.
      x_end: str:  (Default value = None)
        A column that contains ending x-axis values.
      y: str:  (Default value = None)
        A column that contains y-axis labels
      text: str:  (Default value = None)
        A column that contains text annotations.
      hover_name: str:  (Default value = None)
        A column that contains names to bold in the hover tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      pattern_shape_sequence: list[str]:  (Default value = None)
        A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      range_x: list[int] | list[list[int]]:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the x axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
      range_y: list[int] | list[list[int]]:  (Default value = None)
        A list of two numbers or a list of lists of two numbers
        that specify the range of the y axes. None can be specified for no range
        The ranges loop, so if there are more axes than ranges, ranges will
        be reused.
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
      A DeephavenFigure that contains the timeline chart

    """
    # TODO: add resource column?
    table, x_diff = preprocess_timeline(table, x_start, x_end, y)
    args = locals()

    update_wrapper = process_args(args, {"marker"})

    return update_wrapper(
        generate_figure(draw=px.timeline, call_args=args)
    )


def frequency_bar(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        labels: dict[str, str] = None,
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
        unsafe_update_figure: callable = default_callback
):
    """Returns a bar chart that contains the counts of the specified columns

    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      x: str | list[str]:  (Default value = None)
        A column or list of columns that contain x-axis values.
        Only one of x or y can be specified. If x is specified, the bars
        are drawn vertically.
      y: str | list[str]:  (Default value = None)
        A column or list of columns that contain y-axis values.
        Only one of x or y can be specified. If y is specified, the bars
        are drawn horizontally.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      pattern_shape_sequence: list[str]:  (Default value = None)
        A list of patterns to sequentially apply
        to the series. The patterns loop, so if there are more series than
        patterns, patterns will be reused.
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      barmode: str:  (Default value = 'relative')
        If 'relative', bars are stacked. If 'overlay', bars are drawn on top
        of each other. If 'group', bars are drawn next to each other.
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
      DeephavenFigure: A DeephavenFigure that contains the bar chart

    """

    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    update_wrapper = process_args(args, {"bar"})

    create_layered = partial(preprocess_and_layer,
                             preprocess_frequency_bar,
                             px.bar, args)

    return update_wrapper(
        create_layered("x") if x else create_layered("y", orientation="h")
    )
