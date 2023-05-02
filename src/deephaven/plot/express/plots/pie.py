from functools import partial
from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args, unsafe_figure_update_wrapper
from ..deephaven_figure import generate_figure, DeephavenFigure
from ..preprocess import preprocess_aggregate


def pie(
        table: Table = None,
        names: str = None,
        values: str = None,
        color_discrete_sequence: list[str] = None,
        title: str = None,
        template: str = None,
        opacity: float = None,
        hole: float = None,
        aggregate: bool = True,
        unsafe_update_figure: Callable = default_callback
) -> DeephavenFigure:
    """
    Returns a pie chart

    :param table: A table to pull data from.
    :param names: The column containing names of the pie slices
    :param values: The column containing values of the pie slices
    :param color_discrete_sequence: A list of colors to sequentially apply to
    the series. The colors loop, so if there are more series than colors,
    colors will be reused.
    :param title: The title of the chart
    :param template: The template for the chart.
    :param hole: Fraction of the radius to cut out of the center of the pie.
    :param aggregate: Default True, aggregate the table names by total values. Can
    be set to False if the table is already aggregated by name.
    :param unsafe_update_figure: An update function that takes a plotly figure
    as an argument and optionally returns a plotly figure. If a figure is not
    returned, the plotly figure passed will be assumed to be the return value.
    Used to add any custom changes to the underlying plotly figure. Note that
    the existing data traces should not be removed. This may lead to unexpected
    behavior if traces are modified in a way that break data mappings.
    :return: A DeephavenFigure that contains the pie chart
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
        generate_figure(draw=px.pie, call_args=args)
    )
