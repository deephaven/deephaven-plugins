from __future__ import annotations

from typing import Callable

from plotly.graph_objs import Figure

from ..deephaven_figure import DeephavenFigure


def default_callback(fig: Figure) -> Figure:
    """A default callback that returns the passed fig

    Args:
      fig: The input figure

    Returns:
      The same figure

    """
    return fig


def unsafe_figure_update_wrapper(
    unsafe_figure_update: Callable, dh_fig: DeephavenFigure
) -> DeephavenFigure:
    """Wrap the callback to be applied last before a figure is returned

    Args:
      unsafe_figure_update: The function to call on the plotly figure
      dh_fig: The DeephavenFigure to update

    Returns:
      The resulting DeephavenFigure
    """
    # allow either returning a new fig or not from callback
    new_fig = unsafe_figure_update(dh_fig.get_plotly_fig())
    dh_fig._plotly_fig = new_fig if new_fig else dh_fig.get_plotly_fig()
    return dh_fig
