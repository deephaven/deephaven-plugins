import itertools
from collections.abc import Generator
from typing import Callable

import plotly.express as px
from plotly.graph_objects import Figure

from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType
from deephaven.table import Table

from .generate import generate_figure
from .deephaven_figure import DeephavenFigure

__version__ = "0.0.1.dev0"

NAME = "deephaven.plugin.chart.DeephavenFigure"


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


def scatter(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        labels: dict[str, str] = None,
        orientation: str = None,  # implemented, but I can't figure out a good example for scatter
        color_discrete_sequence: list[str] = None,
        opacity: float = None,
        marginal_x: str = None,
        marginal_y: str = None,
        log_x: bool = False,
        log_y: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter, call_args=locals())


def scatter_3d(
        table: Table = None,
        x: str = None,
        y: str = None,
        z: str = None,
        color_discrete_sequence: list[str] = None,
        opacity: float = None,
        log_x: bool = False,
        log_y: bool = False,
        log_z: bool = False,
        range_x: list[int] = None,
        range_y: list[int] = None,
        range_z: list[int] = None,
        title: str = None,
        template: str = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter_3d, call_args=locals())


def scatter_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        color_discrete_sequence: list[str] = None,
        opacity: float = None,
        direction: str = 'clockwise',
        start_angle: int = 90,
        range_r: list[int] = None,
        range_theta: list[int] = None,
        log_r: bool = False,
        title: str = None,
        template: str = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter_polar, call_args=locals())
    pass


def scatter_ternary(
        table: Table = None,
        a: str = None,
        b: str = None,
        c: str = None,
        color_discrete_sequence: list[str] = None,
        opacity: float = None,
        title: str = None,
        template: str = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.scatter_ternary, call_args=locals())
    pass


def line(
        table: Table = None,
        x: str | list[str] = None,
        y: str | list[str] = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line, call_args=locals())


def line_3d(
        table: Table = None,
        x: str = None,
        y: str = None,
        z: str = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line_3d, call_args=locals())
    pass


def line_polar(
        table: Table = None,
        r: str = None,
        theta: str = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line_polar, call_args=locals())
    pass


def line_ternary(
        table: Table = None,
        a: str = None,
        b: str = None,
        c: str = None,
        callback: Callable = None
) -> DeephavenFigure:
    if isinstance(table, Table):
        return generate_figure(px_draw=px.line_ternary, call_args=locals())
    pass
