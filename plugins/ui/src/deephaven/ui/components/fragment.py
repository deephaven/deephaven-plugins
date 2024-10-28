from __future__ import annotations

from typing import Any
from .basic import component_element
from ..elements import Element


def fragment(*children: Any, key: str | None = None) -> Element:
    """
    A React.Fragment: https://react.dev/reference/react/Fragment.
    Used to group elements together without a wrapper node.

    Args:
        *children: The children in the fragment.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered fragment element.
    """
    return component_element("Fragment", children=children, key=key)
