from plotly import express as px

from deephaven.table import Table

from ._private_utils import default_callback, process_args
from ..deephaven_figure import generate_figure, DeephavenFigure
from ..preprocess import preprocess_aggregate


def pie(
        table: Table = None,
        names: str = None,
        values: str = None,
        hover_name: str = None,
        labels: dict[str, str] = None,
        color_discrete_sequence: list[str] = None,
        title: str = None,
        template: str = None,
        opacity: float = None,
        hole: float = None,
        aggregate: bool = True,
        unsafe_update_figure: callable = default_callback
) -> DeephavenFigure:
    """Returns a pie chart


    Args:
      table: Table:  (Default value = None)
        A table to pull data from.
      names: str:  (Default value = None)
        The column containing names of the pie slices
      values: str:  (Default value = None)
        The column containing values of the pie slices
      hover_name: str | list[str]:  (Default value = None)
        A column that contain names to bold in the hover tooltip..
      labels: dict[str, str]:  (Default value = None)
        A dictionary of labels mapping columns to new labels.
      color_discrete_sequence: list[str]:  (Default value = None)
        A list of colors to sequentially apply to
        the series. The colors loop, so if there are more series than colors,
        colors will be reused.
      title: str: (Default value = None)
        The title of the chart
      template: str:  (Default value = None)
        The template for the chart.
      opacity: float:  (Default value = None)
        Opacity to apply to all markers. 0 is completely transparent
        and 1 is completely opaque.
      aggregate: bool:  (Default value = True)
        Default True, aggregate the table names by total values. Can
        be set to False if the table is already aggregated by name.
      opacity: Opacity to apply to all points. 0 is completely transparent
        and 1 is completely opaque.
      hole: float:  (Default value = None)
        Fraction of the radius to cut out of the center of the pie.
      aggregate: Default True, aggregate the table names by total values. Can
        be set to False if the table is already aggregated by name.
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

    if aggregate:
        args["table"] = preprocess_aggregate(table, names, values)

    update_wrapper = process_args(args, {"marker"}, pop=["aggregate"])

    return update_wrapper(
        generate_figure(draw=px.pie, call_args=args)
    )
