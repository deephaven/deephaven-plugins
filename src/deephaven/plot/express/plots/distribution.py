from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, preprocess_and_layer, layer, \
    unsafe_figure_update_wrapper
from ..deephaven_figure import DeephavenFigure
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
        unsafe_update_figure: Callable = default_callback
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
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the violin chart
    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    validate_common_args(args)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.violin, args,
                             list_var_axis_name="value")

    return update_wrapper(
        create_layered("x") if x else create_layered("y")
    )


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
        unsafe_update_figure: Callable = default_callback
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
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the box chart
    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    validate_common_args(args)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.box, args,
                             list_val_axis_name="value")

    return update_wrapper(
        create_layered("x") if x else create_layered("y")
    )


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
        unsafe_update_figure: Callable = default_callback
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
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the strip chart
    """
    if x and y:
        raise ValueError("Cannot specify both x and y")

    args = locals()

    validate_common_args(args)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.strip, args,
                             list_val_axis_name="value")

    return update_wrapper(
        create_layered("x") if x else create_layered("y")
    )


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
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
    line_shape = "hv"
    # rangemode = "tozero"

    args = locals()

    validate_common_args(args)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    args.pop("lines")
    args.pop("ecdfnorm")
    args.pop("ecdfmode")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    create_layered = partial(preprocess_and_layer,
                             preprocess_ecdf,
                             px.line, args)

    return update_wrapper(
        create_layered("x") if x else create_layered("y", orientation="h")
    )


def histogram(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        marginal: str = None,
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
        unsafe_update_figure: Callable = default_callback
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
    :param marginal: The type of marginal; histogram, violin, rug, box
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
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the histogram
    """
    bargap = 0
    args = locals()
    validate_common_args(args)

    marg_data, marg_style = get_marg_args(args)

    # remove arguments not used in bar
    args.pop("nbins")
    args.pop("histfunc")
    args.pop("range_bins")

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")
    args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    preprocessor = partial(
        create_hist_tables,
        nbins=nbins,
        range_bins=range_bins,
        histfunc=histfunc
    )

    create_layered = partial(
        preprocess_and_layer,
        preprocessor, px.bar, args,
        str_val_axis_name=histfunc,
        list_val_axis_name=histfunc,
        is_hist=True
    )

    var = "x" if x else "y"
    orientation = "h" if var == "y" else None
    fig = create_layered(var, orientation=orientation)

    marginals = partial(
        attach_marginals, marg_data, marg_style,
        marginal_x=marginal if var == "x" else None,
        marginal_y=marginal if var == "y" else None,
    )

    return update_wrapper(
        attach_marginals(
            fig,
            marg_data,
            marg_style,
            marginal_x=marginal if var == "x" else None,
            marginal_y=marginal if var == "y" else None,
        )
    )


def get_marginal_columns(
        x: str | list[str],
        y: str | list[str],
        var: str
) -> list[str]:
    """
    Get a list of column for creating marginals. If in wide mode and the
    marginal is on the same dimension on the variable that's a list, return the
    list. Otherwise, return a list of the column, same length as the list

    :param x: The columns on x
    :param y: The columns on y
    :param var: x if the marginal is along the x-axis, y if along y
    :return: The marginals columns
    """
    x_is_list = isinstance(x, list)
    y_is_list = isinstance(y, list)

    if var == "x":
        if x_is_list:
            return x
        else:
            return [x for _ in range(len(y) if y_is_list else 1)]
    else:
        if y_is_list:
            return y
        else:
            return [y for _ in range(len(x) if x_is_list else 1)]


def marginal_axis_update(
        matches: str = None
) -> dict[str, any]:
    """
    Create an update to a marginal axis so it hides much of the axis info

    :param matches: An optional axis, such as x, y, x2 to match this axis to
    :return: The update
    """
    return {
        "matches": matches,
        "title": {},
        'showgrid': False,
        'showline': False,
        'showticklabels': False,
        'ticks': ''
    }


def create_marginal(
        marginal: str,
        args: dict[str, any],
        style: dict[str, any],
        which: str
) -> DeephavenFigure:
    """
    Create a marginal figure

    :param marginal: The type of marginal; histogram, violin, rug, box
    :param args: The args to pass to the marginal function
    :param style: The style args to pass to the marginal function
    :param which: x or y depending on which marginal is being drawn
    :return: The marginal figure
    """
    if marginal == "histogram":
        args["barmode"] = "overlay"
    marginal_map = {
        "histogram": histogram,
        "violin": violin,
        "rug": strip,
        "box": box
    }

    fig_marg = marginal_map[marginal](**args, **style)
    fig_marg.fig.update_traces(showlegend=False)

    if marginal == "rug":
        symbol = "line-ns-open" if which == "x" else "line-ew-open"
        fig_marg.fig.update_traces(marker_symbol=symbol, jitter=0)

    return fig_marg


def attach_marginals(
        fig: DeephavenFigure,
        data: dict[str, any],
        style: dict[str, any],
        marginal_x: str = None,
        marginal_y: str = None
) -> DeephavenFigure:
    """
    Create and attach marginals to the provided figure.

    :param fig: The figure to attach marginals to
    :param data: The data args to use
    :param style: The style args to use
    :param marginal_x: The type of marginal; histogram, violin, rug, box
    :param marginal_y: The type of marginal; histogram, violin, rug, box
    :return: The figure, with marginals attached if marginal_x/y was specified
    """
    figs = [fig]

    specs = []

    if marginal_x:
        cols = get_marginal_columns(data["x"], data["y"], "x")
        args = {
            "table": data["table"],
            "x": cols
        }
        figs.append(create_marginal(marginal_x, args, style, "x"))
        specs = [
            {'y': [0, 0.74]},
            {
                'y': [0.75, 1],
                "xaxis_update": marginal_axis_update("x"),
                "yaxis_update": marginal_axis_update(),
            },
        ]

    if marginal_y:
        cols = get_marginal_columns(data["x"], data["y"], "y")
        args = {
            "table": data["table"],
            "y": cols
        }
        figs.append(create_marginal(marginal_y, args, style, "y"))
        if specs:
            specs[0]["x"] = [0, 0.745]
            specs[1]["x"] = [0, 0.745]
            specs.append(
                {
                    'x': [0.75, 1], 'y': [0, 0.74],
                    "yaxis_update": marginal_axis_update("y"),
                    "xaxis_update": marginal_axis_update(),
                })

        else:
            specs = [
                {'x': [0, 0.745]},
                {'x': [0.75, 1],
                 "yaxis_update": marginal_axis_update("y"),
                 "xaxis_update": marginal_axis_update(),
                 },
            ]

    return layer(*figs, specs=specs) if specs else fig


def get_marg_args(
        args: dict[str, any]
) -> tuple[dict[str, any], dict[str, any]]:
    """
    Copy the required args into data and style for marginal creation

    :param args: The args to split
    :return: A tuple of (data args dict, style args dict)
    """
    data = {
        "table": args["table"],
        "x": args["x"],
        "y": args["y"],
    }

    style = {
        "color_discrete_sequence": args["color_discrete_sequence"],
    }

    return data, style
