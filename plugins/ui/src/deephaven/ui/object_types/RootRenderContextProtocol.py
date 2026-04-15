from __future__ import annotations

from typing import (
    Callable,
    runtime_checkable,
    Protocol,
)
from ..types import QueryParams

StateUpdateCallable = Callable[[], None]
"""
A callable that updates the state. Used to queue up state changes.
"""


@runtime_checkable
class RootRenderContextProtocol(Protocol):
    """
    Protocol that the root owner of a RenderContext tree must implement.
    Provides callbacks for state changes, render queueing, and URL state access.
    """

    def on_change(self, state_update: StateUpdateCallable) -> None:
        """Called when there is a state change in a context."""
        ...

    def on_queue_render(self, callback: StateUpdateCallable) -> None:
        """Called when work is being requested for the render loop."""
        ...

    def get_query_params(self) -> QueryParams:
        """Get the current URL query parameters."""
        ...

    def set_query_params(self, query_params: QueryParams) -> None:
        """Update the URL query parameters."""
        ...
