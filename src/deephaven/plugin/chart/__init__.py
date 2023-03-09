from copy import copy
from typing import Callable

import plotly.express as px
from plotly.graph_objects import Figure
from plotly import subplots

from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType
from deephaven.table import Table

from .generate import generate_figure, draw_ohlc
from .DeephavenFigure import DeephavenFigure

__version__ = "0.0.1.dev0"

from .preprocess import preprocess_pie, create_hist_tables

NAME = "deephaven.plugin.chart.DeephavenFigure"

# these args map a marginal argument to what variable the data should be
# pulled from in the corresponding figure data
MARGINAL_ARGS = {
    "marginal_x": "x",
    "marginal_y": "y",
}

def default_callback(fig):
    return fig


def _export_figure(exporter: Exporter, figure: DeephavenFigure) -> bytes:
    return figure.to_json(exporter).encode()


class DeephavenFigureType(ObjectType):
    @property
    def name(self) -> str:
        return NAME

    def is_type(self, object: any) -> bool:
        return isinstance(object, DeephavenFigure)

    def to_bytes(self, exporter: Exporter, figure: DeephavenFigure) -> bytes:
        return _export_figure(exporter, figure)


class ChartRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        callback.register(DeephavenFigureType)

"""
def marginal_generator(
        scatter_: DeephavenFigure,
        which,
        table: Table,
        range_x,
        range_y,
        color_discrete_sequence,
        x,
        y,
):
    for mariginal in which:
        if marginal
    marginals = histogram(table, x, y, range_x=range_x, range_y=range_y,

def marginal_mapping_generator
"""


def scatter(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        # labels: dict[str, str] = None
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        xaxis_sequence: list[str] = None,
        yaxis_sequence: list[str] = None,
        yaxis_title_sequence: list[str] = None,
        xaxis_title_sequence: list[str] = None,
        opacity: float = None,
        #marginal_x: str = None, #not supported at the moment, will probably be slow
        #marginal_y: str = None, #with lots of data
        log_x: bool | list[bool] = False,
        log_y: bool | list[bool] = False,
        range_x: list[int] | list[list[int]] = None,
        range_y: list[int] | list[list[int]] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        #if (xaxis_sequence or yaxis_sequence) and (marginal_x and marginal_y):
        #    raise ValueError("Cannot use both *axis_sequence and marginal_* arguments")

        render_mode = "webgl"
        args = locals()
        fig = generate_figure(draw=px.scatter, call_args=args)

        return fig


def scatter_3d(
        table: Table = None,
        x: str = None,
        y: str = None,
        z: str = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        error_z: str | list[str] = None,
        error_z_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        log_x: bool = False,
        log_y: bool = False,
        log_z: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_z: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.scatter_3d, call_args=locals())


def scatter_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        direction: str = 'clockwise',
        start_angle: int = 90,
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        render_mode = "webgl"
        return generate_figure(draw=px.scatter_polar, call_args=locals())


def scatter_ternary(
        table: Table = None,
        a: str = None,
        b: str = None,
        c: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.scatter_ternary, call_args=locals())


# TODO: support line_shape as a list?
def line(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        line_dash_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        xaxis_sequence: list[str] = None,
        yaxis_sequence: list[str] = None,
        yaxis_title_sequence: list[str] = None,
        xaxis_title_sequence: list[str] = None,
        markers: bool = False,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        #render_mode = "webgl"
        return generate_figure(draw=px.line, call_args=locals())


def line_3d(
        table: Table = None,
        x: str = None,
        y: str = None,
        z: str = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        error_z: str | list[str] = None,
        error_z_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,  # only draws the first shape with wide data
        log_x: bool = False,
        log_y: bool = False,
        log_z: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_z: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.line_3d, call_args=locals())


def line_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        markers: bool = False,
        direction: str = 'clockwise',
        start_angle: int = 90,
        line_close: bool = False,
        line_shape: str = 'linear',
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback,
) -> DeephavenFigure:
    if isinstance(table, Table):
        render_mode = "webgl"
        return generate_figure(draw=px.line_polar, call_args=locals())


def line_ternary(
        table: Table = None,
        a: str = None,
        b: str = None,
        c: str = None,
        color_discrete_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        markers: bool = False,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.line_ternary, call_args=locals())


def area(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        markers: bool = False,
        # todo: should groupnorm be done in engine?
        #  not really a huge gain, just dividing values
        #  and setting max to 100 (for percent)
        groupnorm: str = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        line_shape: str = 'linear',
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        # TODO: make scatterlgl? no px arg
        args = locals()
        args["pattern_shape_sequence_area"] = args.pop("pattern_shape_sequence")

        return generate_figure(draw=px.area, call_args=args)


def bar(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        error_x: str | list[str] = None,
        error_x_minus: str | list[str] = None,
        error_y: str | list[str] = None,
        error_y_minus: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        args = locals()
        args["pattern_shape_sequence_bar"] = args.pop("pattern_shape_sequence")

        return generate_figure(draw=px.bar, call_args=args)


def _bar_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        barnorm: str = None,
        barmode: str = 'relative',
        direction: str = 'clockwise',
        start_angle: int = 90,
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.bar_polar, call_args=locals())


def _violin(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        violinmode: str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        points: str = 'outliers',
        box: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.violin, call_args=locals())


def _box(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        boxmode: str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        points: str = 'outliers',
        notched: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.box, call_args=locals())


def _ecdf(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        markers: bool = False,
        lines: bool = True,
        color_discrete_sequence: list[str] = None,
        line_dash_sequence: list[str] = None,
        symbol_sequence: list[str] = None,
        opacity: float = None,
        ecdfnorm: str = 'probability',
        ecdfmode: str = 'standard',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        render_mode = "webgl"
        return generate_figure(draw=px.ecdf, call_args=locals())


def _strip(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        stripmode: str = 'group',
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.strip, call_args=locals())


def histogram(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        pattern_shape_sequence: list[str] = None,
        opacity: float = None,
        barmode: str = 'relative',
        #barnorm: str = None,
        #histnorm: str = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        histfunc: str = 'count',
        #cumulative: bool = False,
        nbins: int = None,
        text_auto: bool | str = False,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        if x:
            table, x, y = create_hist_tables(table, x, nbins, range_x, histfunc)
        elif y:
            table, y, x = create_hist_tables(table, y, nbins, range_y, histfunc)
            orientation = "h"
        else:
            raise ValueError("x or y must be specified")
        # since we're simulating a histogram with a bar plot, we want no data gaps
        bargap=0

        #remove arguments not used in bar
        args = locals()
        args.pop("nbins")
        args.pop("histfunc")

        return generate_figure(draw=px.bar, call_args=args)


def pie(
        table: Table = None,
        names: str = None,
        values: str = None,
        color_discrete_sequence: list[str] = None,
        title: str = None,
        template: str = None,
        hole: str = None,
        callback: Callable = default_callback
):
    if isinstance(table, Table):
        table = preprocess_pie(table, names, values)
        return generate_figure(draw=px.pie, call_args=locals())


def treemap(
        table: Table = None,
        names: str = None,
        values: str = None,
        parents: str = None,
        ids: str = None,
        #path: str = None,
        title: str = None,
        template: str = None,
        branchvalues: str = None,
        maxdepth: int = None,
        callback: Callable = default_callback
):
    if isinstance(table, Table):
        return generate_figure(draw=px.treemap, call_args=locals())


def _funnel(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        color_discrete_sequence: list[str] = None,
        opacity: float = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = default_callback
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(draw=px.funnel, call_args=locals())


# TODO: support str or list of str
def ohlc(
        table: Table = None,
        x: str = None,
        open: str = None,
        high: str = None,
        low: str = None,
        close: str = None,
        callback: Callable = default_callback

):
    if isinstance(table, Table):
        call_args = locals()
        return generate_figure(draw=draw_ohlc, call_args=call_args)


def layer(*args, callback=default_callback):
    # should take plotly or deephaven fig
    # plotly fig will
    # compose figures
    if len(args) == 0:
        raise TypeError("No figures provided to compose")

    new_data = []
    new_layout = {}
    new_data_mappings = []
    new_template = None

    for arg in args:

        if isinstance(arg, Figure):
            new_data += arg.data
            new_layout.update(arg.to_dict()['layout'])

        elif isinstance(arg, DeephavenFigure):
            fig = arg.fig
            # the next data mapping should start after all the existing traces
            offset = len(new_data)
            new_data += fig.data
            new_layout.update(fig.to_dict()['layout'])
            new_data_mappings += arg.copy_mappings(offset=offset)
            new_template = arg.template if arg.template else new_template

        else:
            raise ValueError("All arguments must be of type Figure or DeephavenFigure")

    new_fig = Figure(data=new_data, layout=new_layout)

    new_fig = callback(new_fig)

    # todo this doesn't maintain call args, but that isn't currently needed
    return DeephavenFigure(fig=new_fig, data_mappings=new_data_mappings, template=new_template)


def _make_subplots(
        rows=1,
        cols=1
):
    new_fig = subplots.make_subplots(rows=rows, cols=cols)
    return DeephavenFigure(new_fig, has_subplots=True)