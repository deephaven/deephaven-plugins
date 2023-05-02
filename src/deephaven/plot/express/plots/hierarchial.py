from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, unsafe_figure_update_wrapper
from ..deephaven_figure import generate_figure, DeephavenFigure
from ..preprocess import preprocess_aggregate


def treemap(
        table: Table = None,
        names: str = None,
        values: str = None,
        parents: str = None,
        ids: str = None,
        # path: str = None,
        title: str = None,
        template: str = None,
        branchvalues: str = None,
        maxdepth: int = None,
        unsafe_update_figure: Callable = default_callback
):
    """
    Returns a treemap chart

    :param table: A table to pull data from.
    :param names: The column containing names of the sections
    :param values: The column containing values of the sections
    :param parents: The column containing parents of the sections
    :param ids: The column containing ids of the sections. Unlike values, these
    must be unique. Values are used for ids if ids are not specified.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param branchvalues: Set to 'total' to take the value at a level to include
    all descendants and 'remainder' to the value as the remainder after
    subtracting leaf values.
    :param maxdepth: Sets the total number of visible levels. Set to -1 to
    render all levels.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the treemap chart
    """
    args = locals()

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.treemap, call_args=args)
    )


def sunburst(
        table: Table = None,
        names: str = None,
        values: str = None,
        parents: str = None,
        ids: str = None,
        title: str = None,
        template: str = None,
        branchvalues: str = None,
        maxdepth: int = None,
        unsafe_update_figure: Callable = default_callback
):
    """
    Returns a sunburst chart

    :param table: A table to pull data from.
    :param names: The column containing names of the sections
    :param values: The column containing values of the sections
    :param parents: The column containing parents of the sections
    :param ids: The column containing ids of the sections. Unlike values, these
    must be unique. Values are used for ids if ids are not specified.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param branchvalues: Set to 'total' to take the value at a level to include
    all descendants and 'remainder' to the value as the remainder after
    subtracting leaf values.
    :param maxdepth: Sets the total number of visible levels. Set to -1 to
    render all levels.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the sunburst chart
    """
    args = locals()

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.sunburst, call_args=args)
    )


def icicle(
        table: Table = None,
        names: str = None,
        values: str = None,
        parents: str = None,
        ids: str = None,
        title: str = None,
        template: str = None,
        branchvalues: str = None,
        maxdepth: int = None,
        unsafe_update_figure: Callable = default_callback
):
    """
    Returns a icicle chart

    :param table: A table to pull data from.
    :param names: The column containing names of the sections
    :param values: The column containing values of the sections
    :param parents: The column containing parents of the sections
    :param ids: The column containing ids of the sections. Unlike values, these
    must be unique. Values are used for ids if ids are not specified.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param branchvalues: Set to 'total' to take the value at a level to include
    all descendants and 'remainder' to the value as the remainder after
    subtracting leaf values.
    :param maxdepth: Sets the total number of visible levels. Set to -1 to
    render all levels.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the icicle chart
    """
    args = locals()

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.icicle, call_args=args)
    )


def funnel(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        opacity: float = None,
        orientation: str = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a funnel chart

    :param table: A table to pull data from.
    :param x: A column that contains x-axis values.
    :param y: A column that contains y-axis values.
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param orientation:
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
    :return: A DeephavenFigure that contains the funnel chart
    """
    args = locals()

    validate_common_args(args)

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.funnel, call_args=args)
    )


def funnel_area(
        table: Table = None,
        names: str = None,
        values: str = None,
        color_discrete_sequence: list[str] = None,
        title: str = None,
        template: str = None,
        opacity: float = None,
        aggregate: bool = True,
        unsafe_update_figure: Callable = default_callback
):
    """
    Returns a funnel area chart

    :param table: A table to pull data from.
    :param names: The column containing names of the pie slices
    :param values: The column containing values of the pie slices
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param aggregate: Default True, aggregate the table names by total values. Can
    be set to False if the table is already aggregated by name.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the funnel area chart
    """

    args = locals()

    validate_common_args(args)

    if aggregate:
        args["table"] = preprocess_aggregate(table, names, values)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    args.pop("aggregate")

    update_wrapper = partial(
        unsafe_figure_update_wrapper,
        args.pop("unsafe_update_figure")
    )

    return update_wrapper(
        generate_figure(draw=px.funnel_area, call_args=args)
    )
