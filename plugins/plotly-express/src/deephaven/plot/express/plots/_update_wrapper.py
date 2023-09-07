from __future__ import annotations

from plotly.graph_objs import Figure

from ..deephaven_figure import DeephavenFigure


def default_callback(fig: Figure) -> Figure:
    """A default callback that returns the passed fig

    Args:
      fig: Figure: The input figure

    Returns:
      Figure: The same figure

    """
    return fig


def unsafe_figure_update_wrapper(
    unsafe_figure_update: callable, dh_fig: DeephavenFigure
) -> DeephavenFigure:
    """Wrap the callback to be applied last before a figure is returned

    Args:
      unsafe_figure_update: The function to call on the plotly figure
      dh_fig: DeephavenFigure: The DeephavenFigure to update

    Returns:
      DeephavenFigure: The resulting DeephavenFigure

    """
    # allow either returning a new fig or not from callback
    new_fig = unsafe_figure_update(dh_fig.fig)
    dh_fig.fig = new_fig if new_fig else dh_fig.fig
    return dh_fig
