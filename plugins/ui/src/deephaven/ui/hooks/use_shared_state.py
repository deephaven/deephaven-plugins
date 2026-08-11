from __future__ import annotations

import logging
import threading
from typing import Any, Callable, Dict, Generic, TypeVar, cast

from .use_state import use_state
from .use_effect import use_effect
from .use_ref import use_ref
from .._internal import UpdaterFunction
from .._internal.utils import value_or_call

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Sentinel to distinguish "not yet set"/"reset" from a legitimate stored value of None.
_UNSET = object()


class _SharedStore(Generic[T]):
    """
    Internal store that manages shared state across multiple component instances.
    Each subscriber (component) gets its own `use_state` setter, and when any
    subscriber calls `set_value`, the store broadcasts the new value to all subscribers.

    When all subscribers disconnect (unmount), the store resets to its initial value
    and notifies the optional `on_empty` callback so an owning registry can discard it.
    """

    def __init__(
        self,
        initial_value: T | Callable[[], T],
        on_empty: Callable[[], None] | None = None,
    ):
        self._initial_value_or_callable = initial_value
        self._value: T | object = value_or_call(initial_value).value
        self._subscribers: set[Callable[[T], None]] = set()
        self._lock = threading.Lock()
        self._on_empty = on_empty

    def is_empty(self) -> bool:
        """Whether this store currently has no subscribers."""
        with self._lock:
            return len(self._subscribers) == 0

    def use(self) -> tuple[T, Callable[[T | UpdaterFunction[T]], None]]:
        """
        Hook to subscribe to this shared store. Must be called inside a `@ui.component`.

        Returns:
            A tuple of (current_value, set_value) matching the `use_state` interface.
        """
        # Resolve the current value; if unset (reset after last unmount),
        # re-initialize from the original initial_value.
        with self._lock:
            if self._value is _UNSET and len(self._subscribers) == 0:
                self._value = value_or_call(self._initial_value_or_callable).value
            init = cast(T, self._value)

        value, set_value = use_state(init)

        # Keep a ref to the latest set_value so the stable subscriber always
        # calls the current setter without the subscriber identity changing.
        set_value_ref = use_ref(set_value)
        set_value_ref.current = set_value

        # Create a stable subscriber function once (persisted in a ref).
        # It delegates to whatever set_value_ref.current is at call time.
        subscriber_ref: Any = use_ref(None)
        if subscriber_ref.current is None:

            def _subscriber(new_value: T) -> None:
                set_value_ref.current(new_value)

            subscriber_ref.current = _subscriber

        subscriber = subscriber_ref.current

        def subscribe():
            with self._lock:
                self._subscribers.add(subscriber)

            def cleanup():
                with self._lock:
                    self._subscribers.discard(subscriber)
                    is_empty = len(self._subscribers) == 0
                    if is_empty:
                        self._value = _UNSET
                # Notify outside the lock to avoid lock-ordering deadlocks
                if is_empty and self._on_empty is not None:
                    self._on_empty()

            return cleanup

        # Empty deps — subscribe on mount, cleanup on unmount only.
        use_effect(subscribe, [])

        def shared_set_value(new_value: T | UpdaterFunction[T]) -> None:
            # Resolve updater functions once to get the concrete value
            if callable(new_value):
                with self._lock:
                    new_value = new_value(cast(T, self._value))

            with self._lock:
                self._value = new_value
                subscribers = list(self._subscribers)

            # Broadcast outside the lock to avoid deadlocks
            for subscriber in subscribers:
                subscriber(new_value)

        return value, shared_set_value


class _SharedStoreRegistry(Generic[T]):
    """
    A keyed collection of `_SharedStore`s that are created on demand and discarded
    when their last subscriber unsubscribes, so unused keys don't accumulate.
    """

    def __init__(self, initial_value: T | Callable[[], T]):
        self._initial_value = initial_value
        self._stores: Dict[str, _SharedStore[T]] = {}
        self._lock = threading.Lock()

    def use(self, key: str) -> tuple[T, Callable[[T | UpdaterFunction[T]], None]]:
        """
        Hook to subscribe to the store for `key`, creating it if needed.
        Must be called inside a `@ui.component`.
        """
        with self._lock:
            store = self._stores.get(key)
            if store is None:
                store = _SharedStore(
                    self._initial_value, on_empty=lambda: self._prune(key)
                )
                self._stores[key] = store
        return store.use()

    def _prune(self, key: str) -> None:
        with self._lock:
            store = self._stores.get(key)
            if store is not None and store.is_empty():
                del self._stores[key]


def _get_effective_user() -> str:
    try:
        from deephaven_enterprise import auth_context  # type: ignore[import-not-found]

        return auth_context.get_effective_user()
    except (ImportError, ModuleNotFoundError):
        return "__anonymous__"


def create_global_state(
    initial_value: T | Callable[[], T] = None,
) -> Callable[[], tuple[T, Callable[[T | UpdaterFunction[T]], None]]]:
    """
    Create a shared state hook that is global across all components and all users.
    Call this at module level to create a store, then call the returned hook inside
    `@ui.component` functions to subscribe.

    When all components using the store unmount, the state resets to `initial_value`.

    Args:
        initial_value: The initial value for the shared state, or a callable that
            returns the initial value. If a callable is provided, it will be invoked
            once when the store is created.

    Returns:
        A hook function that returns a `(value, set_value)` tuple, matching the
        `use_state` interface. The value and setter are shared across all components
        that call this hook.
    """
    store = _SharedStore(initial_value)
    return store.use


def create_user_state(
    initial_value: T | Callable[[], T] = None,
) -> Callable[[], tuple[T, Callable[[T | UpdaterFunction[T]], None]]]:
    """
    Create a shared state hook that is scoped to the current effective user.
    Each user gets their own independent state. Call this at module level to create
    a store, then call the returned hook inside `@ui.component` functions to subscribe.

    When all components for a given user unmount, that user's state resets to `initial_value`.

    On Deephaven Community (without `deephaven_enterprise`), all callers share a single
    anonymous store, behaving the same as `create_global_state`.

    Args:
        initial_value: The initial value for the shared state, or a callable that
            returns the initial value. If a callable is provided, it will be invoked
            once per user when their store is created.

    Returns:
        A hook function that returns a `(value, set_value)` tuple, matching the
        `use_state` interface. The value and setter are shared across all components
        for the same effective user.
    """
    registry: _SharedStoreRegistry[T] = _SharedStoreRegistry(initial_value)

    def use_user_state() -> tuple[T, Callable[[T | UpdaterFunction[T]], None]]:
        return registry.use(_get_effective_user())

    return use_user_state
