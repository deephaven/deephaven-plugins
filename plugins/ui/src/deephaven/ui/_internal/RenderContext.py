from __future__ import annotations

import threading
import logging
from typing import (
    Any,
    Callable,
    Dict,
    Optional,
    TypeVar,
    Union,
    Generator,
    Generic,
    cast,
)
from functools import partial
from deephaven import DHError
from deephaven.liveness_scope import LivenessScope
from contextlib import contextmanager
from dataclasses import dataclass

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

ContextKey = str
"""
The key for a child context.
"""

ChildrenContextDict = Dict[ContextKey, "RenderContext"]
"""
The child contexts for a RenderContext.
"""


@dataclass
class ValueWithLiveness(Generic[T]):
    """A value with an associated liveness scope, if any."""

    value: T
    liveness_scope: Union[LivenessScope, None]


ContextState = Dict[StateKey, ValueWithLiveness[Any]]
"""
The state for a context.
"""

ExportedRenderState = Dict[str, Any]
"""
The serializable state of a RenderContext. Used to serialize the state for the client.
"""


def _value_or_call(
    value: T | None | Callable[[], T | None]
) -> ValueWithLiveness[T | None]:
    """
    Creates a wrapper around the value, or invokes a callable to hold the value and the liveness scope
    creates while obtaining that value.

    Args:
        value: a value, or callable that will produce a value

    Returns:
        The resulting value, plus a liveness scope, if any.
    """
    if callable(value):
        scope = LivenessScope()
        with scope.open():
            value = value()
        return ValueWithLiveness(value=value, liveness_scope=scope)
    return ValueWithLiveness(value=value, liveness_scope=None)


def _should_retain_value(value: ValueWithLiveness[T | None]) -> bool:
    """
    Determine if the given value should be retained by the current context.

    Args:
        value: The value to check.

    Returns:
        True if the value should be retained, False otherwise.
    """
    return value.liveness_scope is None and isinstance(value.value, (str, int, float))


_local_data = threading.local()


class NoContextException(Exception):
    pass


def get_context() -> RenderContext:
    """
    Gets the currently active context, or throws NoContextException if none is set.

    Returns:
        The active RenderContext, or throws if none is present.
    """
    try:
        return _local_data.context
    except AttributeError:
        raise NoContextException("No context set")


def _set_context(context: Optional[RenderContext]):
    """
    Set the current context for the thread. Can be set to None to unset the context for a thread.
    """
    if context is None:
        del _local_data.context
    else:
        _local_data.context = context


_READY_TO_OPEN: int = -2
_OPENED_AND_UNUSED: int = -1


class RenderContext:
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

    _state: ContextState
    """
    The state for this context.
    """

    _children_context: ChildrenContextDict
    """
    The child contexts for this context. 
    """

    _on_change: OnChangeCallable
    """
    The on_change callback to call when the context changes.
    """

    _top_level_scope: LivenessScope | None
    """
    Liveness scope that captures objects directly created in the FunctionElement. Will only be non-None when the context manager is open.
    """

    _collected_scopes: set[LivenessScope]
    """
    Liveness scopes currently owned by this RenderContext. If currently open and rendering, this will be a fresh set,
    representing the new rendered state.
    """

    _collected_unmount_listeners: set[Callable[[], None]]
    """
    Unmount listeners currently owned by this RenderContext. If currently open and rendering, this will be a fresh set,
    representing the new rendered state.
    When the context is deleted or unmounted, it will call all the listeners in this set.
    """

    _collected_contexts: set[RenderContext]
    """
    Child contexts currently owned by this RenderContext. If currently open and rendering, this will be a fresh set,
    representing the new rendered state.
    """

    def __init__(self, on_change: OnChangeCallable, on_queue_render: OnChangeCallable):
        """
        Create a new render context.

        Args:
            on_change: The callback to call when the state in the context has changes.
            on_queue_render: The callback to call when work is being requested for the render loop.
        """

        self._hook_index = _READY_TO_OPEN
        self._hook_count = -1
        self._state = {}
        self._children_context = {}
        self._on_change = on_change
        self._on_queue_render = on_queue_render
        self._collected_scopes = set()
        self._collected_unmount_listeners = set()
        self._collected_contexts = set()
        self._top_level_scope = None

    def __del__(self):
        for scope in self._collected_scopes:
            scope.release()
        self.unmount()

    @contextmanager
    def open(self) -> Generator[RenderContext, None, None]:
        """
        Opens this context to track hook creation, sets this context as active on
        this thread, and opens the liveness scope for user-created objects.

        This is not reentrant and not safe across threads, ensure it is only opened
        once at a time. After it has been closed, it is safe to be opened again.

        Returns:
            A context manager to manage RenderContext resources.
        """
        if self._hook_index != _READY_TO_OPEN or self._top_level_scope is not None:
            raise RuntimeError(
                "RenderContext.open() was already called, and is not reentrant"
            )
        self._hook_index = _OPENED_AND_UNUSED

        old_context: Optional[RenderContext] = None
        try:
            old_context = get_context()
        except NoContextException:
            pass
        logger.debug("old context is %s and new context is %s", old_context, self)
        _set_context(self)

        # Keep a reference to old liveness scopes, and make a collection to track our new ones
        old_liveness_scopes = self._collected_scopes
        self._top_level_scope = LivenessScope()
        self._collected_scopes = {self._top_level_scope}

        # Keep a reference to old unmount listeners, and make a collection to track our new ones
        old_unmount_listeners = self._collected_unmount_listeners
        self._collected_unmount_listeners = set()

        # Keep a reference to old child contexts, and make a collection to track our new ones
        old_contexts = self._collected_contexts
        self._collected_contexts = set()

        try:
            with self._top_level_scope.open():
                yield self

            # Following the "yield" so we don't do this if there was an error, remove all scopes we're still using.
            # Then, release all leftover scopes that are no longer referenced - we always release after creating new
            # ones, so that each reused object's refcount goes from 1 -> 2 -> 1, instead of 1 -> 0 -> 1 which would
            # release the object prematurely.
            old_liveness_scopes -= self._collected_scopes
            for scope in old_liveness_scopes:
                scope.release()

            # Call the unmount listeners for anything that was unmounted
            old_unmount_listeners -= self._collected_unmount_listeners
            for listener in old_unmount_listeners:
                listener()

            # Release all child contexts that are no longer referenced
            new_contexts = self._collected_contexts - old_contexts
            for context in new_contexts:
                context.mount()

            old_contexts -= self._collected_contexts
            for context in old_contexts:
                context.unmount()

            # If this is the first time (and successful), record the hook count
            hook_count = self._hook_index + 1
            if self._hook_count < 0:
                self._hook_count = hook_count
        except Exception as e:
            # An error occurred at some point when executing the FunctionElement - we don't know what parts of the
            # function were successful, so also keep around old liveness scopes, they'll be cleared after the next
            # successful render.
            self._collected_scopes |= old_liveness_scopes
            self._collected_unmount_listeners |= old_unmount_listeners
            self._collected_contexts |= old_contexts

            # re-raise the exception
            raise e
        finally:
            # Do this even if there was an error, old context must be restored
            logger.debug("Resetting to old context %s", old_context)
            _set_context(old_context)

            # Reset count for next use to safeguard double-opening
            self._hook_index = _READY_TO_OPEN
            # Clear the top level scope to ensure nothing tries to use it until opened again
            self._top_level_scope = None

        if self._hook_count != hook_count:
            # It isn't ideal to throw this anywhere - but this speaks to a malformed component, and there is no
            # good way to recover from that. We don't want to prevent liveness wiring above from working, so we
            # throw here at the end of the method instead.
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
        wrapper = self._state[key]

        # This value (and any objects created when this value was created) must be retained by the current context,
        # and will be released when no longer used.
        if wrapper.liveness_scope:
            self.manage(wrapper.liveness_scope)
        else:
            try:
                if self._top_level_scope is None:
                    raise RuntimeError(
                        "RenderContext.get_state() called when RenderContext not opened"
                    )
                self._top_level_scope.manage(wrapper.value)
            except DHError:
                # Ignore, we just won't manage this instance
                pass

        return wrapper.value

    def init_state(self, key: StateKey, value: T | InitializerFunction[T]) -> None:
        """
        Set the initial state for the given key. Will throw if the key has already been set.
        """
        if key in self._state:
            raise KeyError(f"Key {key} is already initialized")

        # Just set the key value, we don't need to trigger an on_change or anything special on initialization
        self._state[key] = _value_or_call(value)

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
            if callable(value):
                old_value = self._state[key].value
                new_value = _value_or_call(partial(value, old_value))
            else:
                new_value = _value_or_call(value)
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

    def manage(self, liveness_scope: LivenessScope) -> None:
        """
        Indicates that the given LivenessScope must live until the end of the next
        successful open() call. This RenderContext must be open to call this method.
        Args:
            liveness_scope: the new LivenessScope to track
        """
        assert self is get_context()
        self._collected_scopes.add(cast(LivenessScope, liveness_scope.j_scope))

    def manage_unmount_listener(self, listener: Callable[[], None]) -> None:
        """
        Indicates that the given listener must be called when the next successful open() call is completed.
        This RenderContext must be open to call this method.
        Args:
            listener: the new listener to track
        """
        assert self is get_context()
        self._collected_unmount_listeners.add(listener)

    def export_state(self) -> ExportedRenderState:
        """
        Export the state of this context. This is used to serialize the state for the client.

        Returns:
            The exported serializable state of this context.
        """
        exported_state: ExportedRenderState = {}

        # We need to iterate through all of our state and export anything that doesn't have a LivenessScope right now (anything serializable)
        def retained_values(state: ContextState):
            for key, value in state.items():
                if _should_retain_value(value):
                    yield key, value.value

        if len(state := dict(retained_values(self._state))) > 0:
            exported_state["state"] = state

        # Now iterate through all the children contexts, and only include them in the export if they're not empty
        def retained_children(children: ChildrenContextDict):
            for key, child in children.items():
                if len(child_state := child.export_state()) > 0:
                    yield key, child_state

        if len(children_state := dict(retained_children(self._children_context))) > 0:
            exported_state["children"] = children_state

        return exported_state

    def import_state(self, state: dict[str, Any]) -> None:
        """
        Import the state of this context. This is used to deserialize the state from the client.

        Args:
            state: The state to import.
        """
        self._state.clear()
        self._children_context.clear()
        if "state" in state:
            for key, value in state["state"].items():
                # When python dict is converted to JSON, all keys are converted to strings. We convert them back to int here.
                self._state[int(key)] = ValueWithLiveness(
                    value=value, liveness_scope=None
                )
        if "children" in state:
            for key, child_state in state["children"].items():
                self.get_child_context(key).import_state(child_state)
        logger.debug("New state is %s", self._state)

    def mount(self) -> None:
        # TODO: We need to add a listener for this, and also call it when it's mounted... but don't call the effect twice on initial mount.
        pass

    def unmount(self) -> None:
        """
        Unmount this context. This will call all unmount listeners, but retains state in case it is mounted again.
        """
        for listener in self._collected_unmount_listeners:
            listener()
        self._collected_unmount_listeners.clear()
        for context in self._collected_contexts:
            context.unmount()
        self._collected_contexts.clear()
