from __future__ import annotations
from typing import Literal, Union

# Accessibility typings

BoolLiteral = Union[Literal["true", "false"], bool]

AriaExpanded = BoolLiteral
AriaHasPopup = Union[BoolLiteral, Literal["menu", "listbox", "tree", "grid", "dialog"]]
AriaPressed = Union[BoolLiteral, Literal["mixed"]]
AriaAutoComplete = Union[BoolLiteral, Literal["inline", "list", "both", "none"]]
