from plotly import subplots
from plotly.graph_objs import Figure

from ._private_utils import default_callback
from ..deephaven_figure.DeephavenFigure import DeephavenFigure


def layer(
        *args: DeephavenFigure | Figure,
        which_layout: int = None,
        callback=default_callback
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
    new_template = None

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
            new_template = arg.template if arg.template else new_template

        else:
            raise TypeError("All arguments must be of type Figure or DeephavenFigure")

    new_fig = Figure(data=new_data, layout=new_layout)

    new_fig = callback(new_fig)

    # todo: this doesn't maintain call args, but that isn't currently needed
    return DeephavenFigure(fig=new_fig, data_mappings=new_data_mappings, template=new_template)


def _make_subplots(
        rows=1,
        cols=1
):
    # todo: not yet implemented
    new_fig = subplots.make_subplots(rows=rows, cols=cols)
    return DeephavenFigure(new_fig)
