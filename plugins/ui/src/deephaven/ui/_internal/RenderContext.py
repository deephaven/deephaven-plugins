from __future__ import annotations

import logging
from typing import Any, Callable
from contextlib import AbstractContextManager

logger = logging.getLogger(__name__)

OnChangeCallable = Callable[[], None]
StateKey = int
ContextKey = str


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

    def __init__(self):
        self._hook_index = -1
        self._hook_count = -1
        self._state = {}
        self._children_context = {}
        self._on_change = lambda: None

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

    def _notify_change(self) -> None:
        """
        Notify the parent context that this context has changed.
        Note that we're just re-rendering the whole tree on change.
        TODO: We should be able to do better than this, and only re-render the parts that have actually changed.
        """
        logger.debug("Notifying parent context that child context has changed")
        self._on_change()

    def set_on_change(self, on_change: OnChangeCallable) -> None:
        """
        Set the on_change callback.
        """
        self._on_change = on_change

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

    def set_state(self, key: StateKey, value: Any) -> None:
        """
        Set the state for the given key.
        """
        # TODO: Should we throw here if it's called when we're in the middle of a render?
        should_notify = False
        if key in self._state:
            # We only want to notify of a change when the value actually changes, not on the initial render
            should_notify = True
        self._state[key] = value
        if should_notify:
            self._notify_change()

    def get_child_context(self, key: ContextKey) -> "RenderContext":
        """
        Get the child context for the given key.
        """
        logger.debug("Getting child context for key %s", key)
        if key not in self._children_context:
            logger.debug("Creating new child context for key %s", key)
            child_context = RenderContext()
            child_context.set_on_change(self._notify_change)
            self._children_context[key] = child_context
        return self._children_context[key]

    def next_hook_index(self) -> int:
        """
        Increment the hook index.
        """
        self._hook_index += 1
        return self._hook_index
