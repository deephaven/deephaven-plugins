from __future__ import annotations
from typing import Any
from ..elements import BaseElement, NodeType
from ..types import Key

NAME_PREFIX = "deephaven.ui.components."


def component_element(
    name: str,
    /,
    *children: NodeType,
    key: Key | None = None,
    _nullable_props: list[str] = [],
    **props: Any,
) -> BaseElement:
    """
    Base class for UI elements.
    All names are automatically prefixed with "deephaven.ui.components.", and
    all props are automatically camelCased.

    Args:
        name: The name of the element, e.g. "button", "input", "my_component", etc. The full name of the element will be "deephaven.ui.components.{name}".
        children: The children of the element.
        key: The key for the element.
        _nullable_props: A list of prop names that can be set to None.
        props: The props for the element.
    """
    return BaseElement(
        f"{NAME_PREFIX}{name}",
        *children,
        key=key,
        _nullable_props=_nullable_props,
        **props,
    )
