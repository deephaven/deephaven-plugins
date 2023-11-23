from __future__ import annotations

from typing import Any
from ..elements import BaseElement


def object_view(obj: Any):
    """
    A wrapper for an exported object that can be rendered as a view.
    E.g. A Table will be rendered as a Grid view.

    Args:
        obj: The object to display
    """
    return BaseElement("deephaven.ui.components.Object", object=obj)
