from __future__ import annotations
from typing import Any
from inspect import signature
from functools import wraps
from .types import (
    LayoutFlex,
    Direction,
    Wrap,
    JustifyContent,
    AlignContent,
    AlignItems,
    DimensionValue,
)
from ._maker import make_element

_override_params = {
    "children": "Elements to render in the flexbox.",
    "flex": "The flex property of the flexbox.",
    "direction": "The direction of the flexbox.",
}


@make_element(
    "Base Flex component for laying out children in a flexbox.",
    override_params=_override_params,
)
def flex(
    *children: Any,
    key: str | None = None,
    flex: LayoutFlex | None = "auto",
    direction: Direction | None = None,
    wrap: Wrap | None = None,
    justify_content: JustifyContent | None = None,
    align_content: AlignContent | None = None,
    align_items: AlignItems | None = None,
    gap: DimensionValue | None = "size-100",
    column_gap: DimensionValue | None = None,
    row_gap: DimensionValue | None = None,
):
    return locals()
