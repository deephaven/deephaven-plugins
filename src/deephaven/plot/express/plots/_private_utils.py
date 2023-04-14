from functools import partial
from typing import Callable
from collections.abc import Generator

from plotly import subplots
from plotly.graph_objects import Figure

from deephaven.table import Table

from ..deephaven_figure import generate_figure, DeephavenFigure, update_traces


def default_callback(
        fig
) -> Figure:
    """
    A default callback that returns the passed fig

    :param fig:
    :return: The same fig
    """
    return fig


def layer(
        *args: DeephavenFigure | Figure,
        which_layout: int = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    """
    Layers the provided figures. Be default, the layouts are sequentially
    applied, so the layouts of later figures will override the layouts of early
    figures.

    :param args: The charts to layer
    :param which_layout: None to layer layouts, or an index of which arg to
    take the layout from
    :param callback: A callback function that takes a figure as an argument and
    returns a figure. Used to add any custom changes to the underlying plotly
    figure. Note that the existing data traces should not be removed.
    :return: The layered chart
    """
    if len(args) == 0:
        raise ValueError("No figures provided to compose")

    new_data = []
    new_layout = {}
    new_data_mappings = []
    new_has_template = False
    new_has_color = False

    for i, arg in enumerate(args):
        if isinstance(arg, Figure):
            new_data += arg.data
            if not which_layout or which_layout == i:
                new_layout.update(arg.to_dict()['layout'])

        elif isinstance(arg, DeephavenFigure):
            fig = arg.fig
            # the next data mapping should start after all the existing traces
            offset = len(new_data)
            new_data += fig.data
            if not which_layout or which_layout == i:
                new_layout.update(fig.to_dict()['layout'])
            new_data_mappings += arg.copy_mappings(offset=offset)
            new_has_template = arg.has_template or new_has_template
            new_has_color = arg.has_color or new_has_color

        else:
            raise TypeError("All arguments must be of type Figure or DeephavenFigure")

    new_fig = Figure(data=new_data, layout=new_layout)

    new_fig = callback(new_fig)

    # todo: this doesn't maintain call args, but that isn't currently needed
    return DeephavenFigure(
        fig=new_fig,
        data_mappings=new_data_mappings,
        has_template=new_has_template,
        has_color=new_has_color
    )


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


def trace_legend_generator(
        cols: list[str]
) -> Generator[dict]:
    """
    Adds the traces to the legend

    :param cols: The cols to label the trace with in the legend
    :returns: A generator that yields trace updates
    """
    for col in cols:
        yield {
            "name": col,
            "showlegend": True
        }


def preprocessed_fig(
        preprocesser: Callable,
        draw: Callable,
        keys: list[str],
        table: Table,
        args: dict[str, any],
        trace_generator: Generator[dict[str, any]],
        cols: str | list[str],
) -> DeephavenFigure:
    """
    Preprocess and return a figure

    :param preprocesser: A function that returns a tuple that contains
    (new table, first data columnn, second data column)
    :param draw: A draw function, generally from plotly express
    :param args: The args to pass to figure creation
    :param keys: A list of the variables to assign the preprocessed results to
    :param table: The table to use
    :param args: The args to passed to generate_figure
    :param trace_generator: The trace generator to use to pass to
    generate_figure
    :param cols: The columns that are being plotted
    :return: The resulting DeephavenFigure
    """
    output = preprocesser(table, cols)
    for k, v in zip(keys, output):
        args[k] = v

    return generate_figure(
        draw=draw,
        call_args=args,
        trace_generator=trace_generator,
        allow_callback=False
    )


def update_legend_and_titles(
        fig: DeephavenFigure,
        var: str,
        cols: list[str],
        is_list: bool,
        list_var_axis_name: str,
        list_val_axis_name: str,
        str_var_axis_name: str,
        str_val_axis_name: str
) -> None:
    """
    Update the legend and titles so they match plotly express (more or less)

    :param fig: The figure to update
    :param var: Which var to map to the first column. If "x", then the
    preprocessor output is mapped to table, x, y. If "y" then preprocessor
    output is mapped to table, y, x.
    :param cols: The columns that are used for the sake of updating the
    legend
    :param is_list: True if the cols were originally passed as a list
    :param str_var_axis_name: Name on the var axis if cols is a str
    :param str_val_axis_name: Name on the non-var axis if cols is a str
    :param list_var_axis_name: Name on the var axis if cols is a list
    :param list_val_axis_name: Name on the non-var axis if cols is a list
    """
    layout_update = {}
    other_var = "y" if var == "x" else "x"

    if is_list:
        update_traces(fig.fig, trace_legend_generator(cols))
        layout_update.update(
            legend_title_text="variable",
            legend_tracegroupgap=0
        )

        if list_var_axis_name:
            layout_update[f"{var}axis_title_text"] = list_var_axis_name

        if list_val_axis_name:
            layout_update[f"{other_var}axis_title_text"] = list_val_axis_name

    else:
        # ensure the legend is hidden (especially for hist)
        layout_update["showlegend"] = False

        if str_var_axis_name:
            layout_update[f"{var}axis_title_text"] = str_var_axis_name

        if str_val_axis_name:
            layout_update[f"{other_var}axis_title_text"] = str_val_axis_name

    fig.fig.update_layout(layout_update)


def preprocess_and_layer(
        preprocesser: Callable,
        draw: Callable,
        args: dict[str, any],
        var: str,
        orientation: str = None,
        str_var_axis_name: str = None,
        str_val_axis_name: str = None,
        list_var_axis_name: str = None,
        list_val_axis_name: str = None,
        skip_layer: bool = False,
) -> DeephavenFigure:
    """
    Given a preprocessing function, a draw function, and several
    columns, layer up the resulting figures

    :param preprocesser: A function that takes a table, list of cols
    and returns a tuple that contains
    (new table, first data columnn, second data column)
    :param draw: A draw function, generally from plotly express
    :param args: The args to pass to figure creation
    :param var: Which var to map to the first column. If "x", then the
    preprocessor output is mapped to table, x, y. If "y" then preprocessor
    output is mapped to table, y, x.
    :param orientation: optional orientation if it is needed
    :param str_var_axis_name: Name on the var axis if cols is a str
    :param str_val_axis_name: Name on the non-var axis if cols is a str
    :param list_var_axis_name: Name on the var axis if cols is a list
    :param list_val_axis_name: Name on the non-var axis if cols is a list
    :param skip_layer: If true, all columns are passed to the preprocess function
    and only one table is returned from it, so the layering step is skipped.
    Currently, it is assumed that hist is the only plot type using this.
    :return: The resulting DeephavenFigure
    """
    cols = args[var]
    # to mirror px, list_var_axis_name and legend should only be used when cols
    # are a list (regardless of length)
    is_list = isinstance(cols, list)
    cols = cols if is_list else [cols]
    keys = ["table", "x", "y"] if var == "x" else ["table", "y", "x"]
    table = args["table"]
    figs = []
    trace_generator = None

    if orientation:
        args["orientation"] = orientation

    create_fig = partial(
        preprocessed_fig,
        preprocesser, draw,
        keys, table, args
    )

    if skip_layer:
        figs.append(create_fig(trace_generator, cols))
        # currently, the only user of skip_layer is hist, so if another plot
        # type is passed here this will need to be refactored
        # hist should have the col name be the passed str if cols is a str
        str_var_axis_name = str_var_axis_name if is_list else cols[0]
    else:
        for col in cols:
            figs.append(create_fig(trace_generator, col))

            if not trace_generator:
                trace_generator = figs[0].trace_generator

    layered = layer(*figs, which_layout=0)

    update_legend_and_titles(
        layered, var, cols, is_list,
        list_var_axis_name, list_val_axis_name,
        str_var_axis_name, str_val_axis_name
    )

    # call the callback now as it was not allowed during figure generation
    new_fig = args['callback'](layered)
    new_fig = new_fig if new_fig else layered

    return new_fig


def _make_subplots(
        rows=1,
        cols=1
):
    # todo: not yet implemented
    new_fig = subplots.make_subplots(rows=rows, cols=cols)
    return DeephavenFigure(new_fig)
