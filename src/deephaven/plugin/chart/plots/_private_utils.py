from typing import Callable

from plotly.graph_objects import Figure

from deephaven.plugin.object import Exporter
from deephaven.table import Table

from ..deephaven_figure import generate_figure, DeephavenFigure
from .utils import layer


def default_callback(
        fig
) -> Figure:
    """
    A default callback that returns the passed fig

    :param fig:
    :return:
    """
    return fig


def validate_common_args(
        args: dict
) -> None:
    """
    Validate common args amongst plots

    :param args: The args to validate
    """
    if not isinstance(args["table"], Table):
        raise ValueError("Argument table is not of type Table")


def remap_scene_args(
        args: dict
) -> None:
    """
    Remap layout scenes args so that they are not converted to a list

    :param args: The args to remap
    """
    for arg in ["range_x", "range_y", "range_z", "log_x", "log_y", "log_z"]:
        args[arg + '_scene'] = args.pop(arg)


def preprocess_and_layer(
        preprocesser: Callable,
        draw: Callable,
        args: dict[str, any],
        var: str,
        orientation: str = None,
) -> DeephavenFigure:
    """
    Given a preprocessing function, a draw function, and several
    columns, layer up the resulting figures

    :param preprocesser: A function that returns a tuple that contains
    (new table, first data columnn, second data column)
    :param draw: A draw function, generally from plotly express
    :param args: The args to pass to figure creation
    :param var: Which var to map to the first column. If "x", then the
    preprocessor output is mapped to table, x, y. If "y" then preprocessor
    output is mapped to table, y, x.
    :param orientation: optional orientation if it is needed
    :return:
    """
    cols = args[var]
    cols = cols if isinstance(cols, list) else [cols]
    keys = ["table", "x", "y"] if var == "x" else ["table", "y", "x"]
    table = args["table"]

    figs = []
    trace_generator = None

    if orientation:
        args["orientation"] = orientation

    for col in cols:
        output = preprocesser(table, col)
        for k, v in zip(keys, output):
            args[k] = v

        figs.append(generate_figure(
            draw=draw,
            call_args=args,
            trace_generator=trace_generator)
        )

        if not trace_generator:
            trace_generator = figs[0].trace_generator

    return layer(*figs, which_layout=0)
