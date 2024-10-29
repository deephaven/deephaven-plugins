from __future__ import annotations

from typing import Callable

from plotly import express as px

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure
from ..types import TableLike


def pie(
    table: TableLike,
    names: str | None = None,
    values: str | None = None,
    color: str | list[str] | None = None,
    hover_name: str | None = None,
    labels: dict[str, str] | None = None,
    color_discrete_sequence: list[str] | None = None,
    color_discrete_map: dict[str, str] | None = None,
    title: str | None = None,
    template: str | None = None,
    opacity: float | None = None,
    hole: float | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Returns a pie chart


    Args:
      table: A table to pull data from.
      names: The column containing names of the pie slices
      values: The column containing values of the pie slices
      color: A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: A column that contain names to bold in the hover tooltip..
      labels: A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      title: The title of the chart
      template: The template for the chart.
      opacity: Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      hole: Fraction of the radius to cut out of the center of the pie.
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is
        not returned, the plotly figure passed will be assumed to be the return
        value. Used to add any custom changes to the underlying plotly figure.
        Note that the existing data traces should not be removed. This may lead
        to unexpected behavior if traces are modified in a way that break data
        mappings.

    Returns:
      A DeephavenFigure that contains the pie chart

    """
    args = locals()

    return process_args(args, {"always_attached"}, px_func=px.pie)
