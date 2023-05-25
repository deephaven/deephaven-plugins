from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, preprocess_and_layer, layer, \
    unsafe_figure_update_wrapper, process_args
from ..deephaven_figure import DeephavenFigure
from ..preprocess import preprocess_ecdf, create_hist_tables, preprocess_violin


def violin(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        hover_name: str | list[str] = None,
        labels: dict[str, str] = None,
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
        unsafe_update_figure: callable = default_callback
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
      hover_name: str | list[str]:  (Default value = None)
        A column or list of columns that contain names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
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

    update_wrapper = process_args(args, {"marker"})

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.violin, args)

    return update_wrapper(
        create_layered("x") if x else create_layered("y")
    )


def box(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        hover_name: str | list[str] = None,
        labels: dict[str, str] = None,
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
      hover_name: str | list[str]:  (Default value = None)
        A column or list of columns that contain names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
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

    update_wrapper = process_args(args, {"marker"})

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.box, args)

    return update_wrapper(
        create_layered("x") if x else create_layered("y")
    )


def strip(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        hover_name: str | list[str] = None,
        labels: dict[str, str] = None,
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
      hover_name: str | list[str]:  (Default value = None)
        A column or list of columns that contain names to bold in the hover
          tooltip.
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
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

    update_wrapper = process_args(args, {"marker"})

    create_layered = partial(preprocess_and_layer,
                             preprocess_violin,
                             px.strip, args)

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
        hover_name: str | list[str] = None,
        labels: dict[str, str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        marginal: str = None,
        opacity: float = None,
        barmode: str = 'relative',
        barnorm: str = None,
        histnorm: str = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_bins: list[int] = None,
        histfunc: str = 'count',
        cumulative: bool = False,
        nbins: int = 10,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        unsafe_update_figure: Callable = default_callback
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
      marginal: str:  (Default value = None)
        The type of marginal; histogram, violin, rug, box
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      barmode: str:  (Default value = 'relative')
        If 'relative', bars are stacked. If
        'overlay', bars are drawn on top of each other. If 'group', bars are
        drawn next to each other.
      barnorm:: str:  (Default value = None)
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
    bargap = 0
    hist_val_name = histfunc

    args = locals()
    validate_common_args(args)

    marg_data, marg_style = get_marg_args(args)

    preprocessor = partial(
        create_hist_tables,
        nbins=nbins,
        range_bins=range_bins,
        histfunc=histfunc,
        barnorm=barnorm,
        histnorm=histnorm,
        cumulative=cumulative
    )

    create_layered = partial(
        preprocess_and_layer,
        preprocessor, px.bar, args,
        is_hist=True
    )

    update_wrapper = process_args(
        args, {"bar"},
        pop=["nbins", "histfunc", "range_bins", "histnorm", "barnorm",
             "cumulative"]
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
    """Get a list of column for creating marginals. If in wide mode and the
    marginal is on the same dimension on the variable that's a list, return the
    list. Otherwise, return a list of the column, same length as the list

    Args:
      x: str | list[str]: The columns on x
      y: str | list[str]: The columns on y
      var: str: x if the marginal is along the x-axis, y if along y

    Returns:
      list[str]: The marginals columns

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
    """Create an update to a marginal axis so it hides much of the axis info

    Args:
      matches: str:  (Default value = None)
        An optional axis, such as x, y, x2 to match this axis to

    Returns:
      dict[str, any]: The update

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
    """Create a marginal figure

    Args:
      marginal: str: The type of marginal; histogram, violin, rug, box
      args: dict[str, any] The args to pass to the marginal function
      style: dict[str, any] The style args to pass to the marginal function
      which: str: x or y depending on which marginal is being drawn

    Returns:
      DeephavenFigure: The marginal figure

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
    """Create and attach marginals to the provided figure.

    Args:
      fig: DeephavenFigure: The figure to attach marginals to
      data: dict[str, any]: The data args to use
      style: dict[str, any]: The style args to use
      marginal_x: str:  (Default value = None)
        The type of marginal; histogram, violin, rug, box
      marginal_y: str:  (Default value = None)
        The type of marginal; histogram, violin, rug, box

    Returns:
      DeephavenFigure: The figure, with marginals attached if marginal_x/y was
        specified

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
    """Copy the required args into data and style for marginal creation

    Args:
      args: dict[str, any]: The args to split

    Returns:
      tuple[dict[str, any], dict[str, any]]: A tuple of
        (data args dict, style args dict)

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
