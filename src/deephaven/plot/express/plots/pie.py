from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, validate_common_args
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
        callback: Callable = default_callback
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
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :param opacity: Opacity to apply to all points. 0 is completely transparent
    and 1 is completely opaque.
    :param hole: Fraction of the radius to cut out of the center of the pie.
    :param aggregate: Default True, aggregate the table names by total values. Can
    be set to False if the table is already aggregated by name.
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: A DeephavenFigure that contains the pie chart
    """
    args = locals()

    validate_common_args(args)

    if aggregate:
        args["table"] = preprocess_aggregate(table, names, values)

    args["color_discrete_sequence_marker"] = args.pop("color_discrete_sequence")

    args.pop("aggregate")

    return generate_figure(draw=px.pie, call_args=args)
