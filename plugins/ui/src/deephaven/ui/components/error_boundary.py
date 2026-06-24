from __future__ import annotations

from .basic import component_element
from ..elements import Element, NodeType
from .types import ErrorInfoCallable


def error_boundary(
    *children: NodeType,
    fallback: Element | None = None,
    on_error: ErrorInfoCallable | None = None,
    key: str | None = None,
) -> Element:
    """
    An error boundary catches rendering errors that occur in its child component
    tree, logs the error, and displays a fallback UI instead of crashing the
    whole component. This contains the error to the boundary so the rest of the
    deephaven.ui widget continues to render.

    Args:
        *children: The components to render within the error boundary.
        fallback: A component to render instead of the children if an error is
            caught. If not provided, a default error message is displayed.
        on_error: A callback that is called with information about the error when
            a rendering error is caught by the boundary.
        key: A unique identifier used by React to render elements in a list.

    Returns:
        The rendered error boundary element.
    """
    return component_element(
        "ErrorBoundary",
        *children,
        fallback=fallback,
        on_error=on_error,
        key=key,
    )
