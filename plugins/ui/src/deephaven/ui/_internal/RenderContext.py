from __future__ import annotations

import logging
from types import TracebackType
from typing import Any, Callable, Optional, TypeVar, Union
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
InitializerFunction = Callable[[], T]
"""
A function that returns the initial value for a state.
"""

UpdaterFunction = Callable[[T], T]
"""
A function that takes the old value and returns the new value for a state.
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

    def __exit__(
        self,
        type: Optional[type[BaseException]],
        value: Optional[BaseException],
        traceback: Optional[TracebackType],
    ) -> None:
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

    def get_state(self, key: StateKey) -> Any:
        """
        Get the state for the given key.
        """
        return self._state[key]

    def init_state(self, key: StateKey, value: T | InitializerFunction[T]) -> None:
        """
        Set the initial state for the given key. Will throw if the key has already been set.
        """
        if key in self._state:
            raise KeyError(f"Key {key} is already initialized")

        # Just set the key value, we don't need to trigger an on_change or anything special on initialization
        self._state[key] = value if not callable(value) else value()

    def set_state(self, key: StateKey, value: T | UpdaterFunction[T]) -> None:
        """
        Update the state for the given key. If the key is not initialized via `init_state` yet, throw.

        Args:
            key: The key to set the state for.
            value: The value to set the state to. Can be a callable that takes the old value and returns the new value.
        """

        if key not in self._state:
            raise KeyError(f"Key {key} not initialized")

        # We queue up the state change in a callable that will get called from the render loop
        def update_state():
            new_value = value
            if callable(value):
                old_value = self._state[key]
                new_value = value(old_value)
            self._state[key] = new_value

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
