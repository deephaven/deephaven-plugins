from __future__ import annotations

import logging
from typing import Any, Callable, Union, TypeVar
from contextlib import AbstractContextManager

logger = logging.getLogger(__name__)

StateUpdateCallable = Callable[[], None]
"""
A callable that updates the state. Used to queue up state changes.
"""

OnChangeCallable = Callable[[StateUpdateCallable], None]
"""
Callable that is called when there is a change in the context (setting the state).
"""


StateKey = int
"""
The key for a state value. Should be the hook index.
"""

T = TypeVar("T")
StateValue = T | Callable[[T | None], T]
"""
The value for a state. Can be a callable that takes the old value and returns the new value.
"""

ContextKey = Union[str, int]
"""
The key for a child context.
"""


class RenderContext(AbstractContextManager):
    """
    Context for rendering a component. Keeps track of state and child contexts.
    Used by hooks to get and set state.
    """

    _hook_index: int
    """
    The index of the current hook for this render. Should only be set while rendering.
    """

    _hook_count: int
    """
    Count of hooks used in the render. Should only be set after initial render.
    """

    _state: dict[StateKey, Any]
    """
    The state for this context.
    """

    _children_context: dict[ContextKey, "RenderContext"]
    """
    The child contexts for this context. 
    """

    _on_change: OnChangeCallable
    """
    The on_change callback to call when the context changes.
    """

    def __init__(self, on_change: OnChangeCallable, on_queue_render: OnChangeCallable):
        """
        Create a new render context.

        Args:
            on_change: The callback to call when the state in the context has changes.
            on_queue_render: The callback to call when work is being requested for the render loop.
        """

        self._hook_index = -1
        self._hook_count = -1
        self._state = {}
        self._children_context = {}
        self._on_change = on_change
        self._on_queue_render = on_queue_render

    def __enter__(self) -> None:
        """
        Start rendering this component.
        """
        self._hook_index = -1

    def __exit__(self, type, value, traceback) -> None:
        """
        Finish rendering this component.
        """
        hook_count = self._hook_index + 1
        if self._hook_count < 0:
            self._hook_count = hook_count
        elif self._hook_count != hook_count:
            raise Exception(
                "Expected to use {} hooks, but used {}".format(
                    self._hook_count, hook_count
                )
            )

    def has_state(self, key: StateKey) -> bool:
        """
        Check if the given key is in the state.
        """
        return key in self._state

    def get_state(self, key: StateKey, default: Any = None) -> None:
        """
        Get the state for the given key.
        """
        if key not in self._state:
            self._state[key] = default
        return self._state[key]

    def set_state(self, key: StateKey, value: StateValue[T]) -> None:
        """
        Set the state for the given key.

        Args:
            key: The key to set the state for.
            value: The value to set the state to. Can be a callable that takes the old value and returns the new value.
        """

        # We queue up the state change in a callable that will get called from the render loop
        def update_state():
            new_value = value
            if callable(value):
                old_value = self._state[key]
                new_value = value(old_value)
            self._state[key] = new_value

        if key not in self._state:
            # We haven't set the state for this key yet, this is the initial render. We can just set the state immediately, we don't need to queue it for notification
            update_state()
        else:
            # This is not the initial state, queue up the state change on the render loop
            self._on_change(update_state)

    def get_child_context(self, key: ContextKey) -> "RenderContext":
        """
        Get the child context for the given key.
        """
        logger.debug("Getting child context for key %s", key)
        if key not in self._children_context:
            logger.debug("Creating new child context for key %s", key)
            child_context = RenderContext(self._on_change, self._on_queue_render)
            self._children_context[key] = child_context
        return self._children_context[key]

    def next_hook_index(self) -> int:
        """
        Increment the hook index.
        """
        self._hook_index += 1
        return self._hook_index

    def queue_render(self, update: Callable[[], None]) -> None:
        """
        Queue up a state update. Needed in multi-threading scenarios.

        Args:
            update: The update to queue up.
        """
        self._on_queue_render(update)
