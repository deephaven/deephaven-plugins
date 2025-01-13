from __future__ import annotations

import threading
from typing import (
    Any,
    Callable,
    Dict,
    Optional,
    Generator,
)
from contextlib import contextmanager
from .NoContextException import NoContextException

OnEventCallable = Callable[[str, Dict[str, Any]], None]
"""
Callable that is called when an event is queued up.
"""

_local_data = threading.local()


def get_event_context() -> EventContext:
    """
    Gets the currently active context, or throws NoContextException if none is set.

    Returns:
        The active EventContext, or throws if none is present.
    """
    try:
        return _local_data.event_context
    except AttributeError as e:
        raise NoContextException("No context set") from e


def _set_event_context(context: Optional[EventContext]):
    """
    Set the current context for the thread. Can be set to None to unset the context for a thread.
    """
    if context is None:
        del _local_data.event_context
    else:
        _local_data.event_context = context


class EventContext:
    _on_send_event: OnEventCallable
    """
    The callback to call when sending an event.
    """

    def __init__(
        self,
        on_send_event: OnEventCallable,
    ):
        """
        Create a new event context.

        Args:
            on_send_event: The callback to call when sending an event.
        """

        self._on_send_event = on_send_event

    @contextmanager
    def open(self) -> Generator[EventContext, None, None]:
        """
        Opens this context.

        Returns:
            A context manager to manage EventContext resources.
        """
        old_context: Optional[EventContext] = None
        try:
            old_context = get_event_context()
        except NoContextException:
            pass
        _set_event_context(self)
        yield self
        _set_event_context(old_context)

    def send_event(self, name: str, params: Dict[str, Any]) -> None:
        """
        Send an event to the client.

        Args:
            name: The name of the event.
            params: The params of the event.
        """
        self._on_send_event(name, params)
