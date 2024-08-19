from __future__ import annotations

from typing import Any
from .basic import component_element


def fragment(*children: Any):
    """
    A React.Fragment: https://react.dev/reference/react/Fragment.
    Used to group elements together without a wrapper node.

    Args:
        *children: The children in the fragment.
    """
    return component_element("Fragment", children=children)
