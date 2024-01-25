from __future__ import annotations

from typing import Callable

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure

# The functions in this file are exempt from the styleguide rule that types should not be in the description if there
# is a type annotation.


def pie(
    table: Table | None = None,
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
      table: Table | None:  (Default value = None)
        A table to pull data from.
      names: str | None:  (Default value = None)
        The column containing names of the pie slices
      values: str | None:  (Default value = None)
        The column containing values of the pie slices
      color: str | list[str] | None: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str | None:  (Default value = None)
        A column that contain names to bold in the hover tooltip..
      labels: dict[str, str] | None:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str] | None:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] | None: (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      title: str | None: (Default value = None)
        The title of the chart
      template: str | None:  (Default value = None)
        The template for the chart.
      opacity: float | None:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      hole: float | None:  (Default value = None)
        Fraction of the radius to cut out of the center of the pie.
      unsafe_update_figure: Callable:  (Default value = default_callback)
        An update function that takes a plotly figure
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
