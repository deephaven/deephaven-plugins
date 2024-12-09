from __future__ import annotations

from typing import Callable

from ._private_utils import process_args
from ..shared import default_callback
from ..deephaven_figure import DeephavenFigure
from ..types import PartitionableTableLike
from typing import Literal

Gauge = Literal["shape", "bullet"]


def indicator(
    table: PartitionableTableLike,
    value: str | None = None,
    reference: str | None = None,
    increasing_color: str | None = None,
    decreasing_color: str | None = None,
    increasing_color_discrete_sequence: list[str] | None = None,
    increasing_color_discrete_map: dict[str | tuple[str], str] | None = None,
    decreasing_color_discrete_sequence: list[str] | None = None,
    decreasing_color_discrete_map: dict[str | tuple[str], str] | None = None,
    text: str | None = None,
    number: bool = True,
    delta: bool = True,
    gauge: Gauge | None = None,
    axis: bool = False,
    prefix: str | None = None,
    suffix: str | None = None,
    rows: int = 1,
    columns: int = 1,
) -> DeephavenFigure:
    raise NotImplementedError
