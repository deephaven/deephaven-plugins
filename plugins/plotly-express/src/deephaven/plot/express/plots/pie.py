from __future__ import annotations

from plotly import express as px

from deephaven.table import Table

from ._private_utils import process_args
from ._update_wrapper import default_callback
from ..deephaven_figure import DeephavenFigure


def pie(
    table: Table = None,
    names: str = None,
    values: str = None,
    color: str | list[str] = None,
    hover_name: str = None,
    labels: dict[str, str] = None,
    color_discrete_sequence: list[str] = None,
    color_discrete_map: dict[str, str] = None,
    title: str = None,
    template: str = None,
    opacity: float = None,
    hole: float = None,
    unsafe_update_figure: callable = default_callback,
) -> DeephavenFigure:
    """Returns a pie chart


    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      names: str:  (Default value = None)
        The column containing names of the pie slices
      values: str:  (Default value = None)
        The column containing values of the pie slices
      color: str | list[str]: (Default value = None)
        A column or list of columns that contain color values.
        The value is used for a plot by on color.
        See color_discrete_map for additional behaviors.
      hover_name: str:  (Default value = None)
        A column that contain names to bold in the hover tooltip..
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      color_discrete_map: dict[str | tuple[str], str] (Default value = None)
        If dict, the keys should be strings of the column values (or a tuple
        of combinations of column values) which map to colors.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      opacity: Opacity to apply to all points. 0 is completely transparent
        and 1 is completely opaque.
      hole: float:  (Default value = None)
        Fraction of the radius to cut out of the center of the pie.
      unsafe_update_figure: callable:  (Default value = default_callback)
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
