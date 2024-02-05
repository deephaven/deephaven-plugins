from __future__ import annotations
from typing import Any
from .basic import spectrum_element
from .layout import (
    Direction,
    Wrap,
    JustifyContent,
    AlignContent,
    AlignItems,
    DimensionValue,
)


def flex(
    *children: Any,
    direction: Direction | None = None,
    wrap: Wrap | None = None,
    justify_content: JustifyContent | None = None,
    align_content: AlignContent | None = None,
    align_items: AlignItems | None = None,
    gap: DimensionValue | None = None,
    column_gap: DimensionValue | None = None,
    row_gap: DimensionValue | None = None,
    **props: Any,
):
    """
    Python implementation for the Adobe React Spectrum Flex component.
    https://react-spectrum.adobe.com/react-spectrum/Flex.html
    """
    return spectrum_element(
        "Flex",
        *children,
        direction=direction,
        wrap=wrap,
        justify_content=justify_content,
        align_content=align_content,
        align_items=align_items,
        gap=gap,
        column_gap=column_gap,
        row_gap=row_gap,
        **props,
    )
