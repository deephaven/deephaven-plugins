from __future__ import annotations
from typing import Literal, Optional
from .basic import spectrum_element


def flex(
    *children,
    direction: Literal["row", "column", "row-reverse", "column-reverse"] | None = None,
    wrap: Literal["wrap", "nowrap", "wrap-reverse"] | None = None,
    justify_content: Literal[
        "start",
        "end",
        "center",
        "left",
        "right",
        "space-between",
        "space-around",
        "space-evenly",
        "stretch",
        "baseline",
        "first baseline",
        "last baseline",
        "safe center",
        "unsafe center",
    ]
    | None = None,
    align_content: Literal[
        "start",
        "end",
        "center",
        "space-between",
        "space-around",
        "space-evenly",
        "stretch",
        "baseline",
        "first baseline",
        "last baseline",
        "safe center",
        "unsafe center",
    ]
    | None = None,
    align_items: Literal[
        "start",
        "end",
        "center",
        "stretch",
        "self-start",
        "self-end",
        "baseline",
        "first baseline",
        "last baseline",
        "safe center",
        "unsafe center",
    ]
    | None = None,
    gap: str | int | float | None = None,
    column_gap: str | int | float | None = None,
    row_gap: str | int | float | None = None,
    **props,
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
