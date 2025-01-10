from __future__ import annotations
from typing import Any, Dict, Literal, Union

# Layout typings

Direction = Literal["row", "column", "row-reverse", "column-reverse"]
Wrap = Literal["wrap", "nowrap", "wrap-reverse"]

Placement = Literal[
    "bottom",
    "bottom left",
    "bottom right",
    "bottom start",
    "bottom end",
    "top",
    "top left",
    "top right",
    "top start",
    "top end",
    "left",
    "left top",
    "left bottom",
    "start",
    "start top",
    "start bottom",
    "right",
    "right top",
    "right bottom",
    "end",
    "end top",
]

AlignContent = Literal[
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

AlignItems = Literal[
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

AlignSelf = Literal[
    "auto",
    "normal",
    "start",
    "end",
    "center",
    "flex-start",
    "flex-end",
    "self-start",
    "self-end",
    "stretch",
]

JustifyContent = Literal[
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

JustifySelf = Literal[
    "auto",
    "normal",
    "start",
    "end",
    "flex-start",
    "flex-end",
    "self-start",
    "self-end",
    "center",
    "left",
    "right",
    "stretch",
]

JustifyItems = Literal[
    "auto",
    "normal",
    "start",
    "end",
    "center",
    "left",
    "right",
    "stretch",
    "self-start",
    "self-end",
    "baseline",
    "first baseline",
    "last baseline",
    "safe center",
    "unsafe center",
    "legacy right",
    "legacy left",
    "legacy center",
]


Overflow = Union[Literal["visible", "hidden", "clip", "scroll", "auto"], str]

OverflowMode = Literal["wrap", "collapse"]
Alignment = Literal["start", "end"]

ButtonGroupAlignment = Literal["start", "center", "end"]

LayoutFlex = Union[str, float, bool]
"""
The flex CSS shorthand property sets how a flex item will grow or shrink to fit the space available in its flex container.
"""

DimensionValue = Union[str, float]
"""
A dimension value can be a string providing a unit, such as "10px", or a number, which is assumed to be in pixels.
"""

Position = Literal["static", "relative", "absolute", "fixed", "sticky"]
"""
The position CSS property sets how an element is positioned in a document. The top, right, bottom, and left properties determine the final location of positioned elements.
"""

CSSProperties = Dict[str, Any]
"""
A dictionary of CSS properties.
"""
LabelPosition = Literal["top", "side"]

GridFlow = Literal["row", "column", "row dense", "column dense"]
BorderSize = Literal["none", "thin", "thick", "thicker", "thickest"]
BorderRadius = Literal[
    "xsmall",
    "small",
    "regular",
    "medium",
    "large",
]
MenuDirection = Literal["bottom", "top"]
IconSize = Literal["XXS", "XS", "S", "M", "L", "XL", "XXL"]
IconColor = Literal["negative", "notice", "positive", "informative"]
ObjectFit = Literal["fill", "contain", "cover", "none", "scale-down"]
MenuTriggerDirection = Literal["bottom", "top", "left", "right", "start", "end"]
