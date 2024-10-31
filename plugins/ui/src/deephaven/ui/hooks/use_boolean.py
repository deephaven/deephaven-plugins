from __future__ import annotations
from .._internal import InitializerFunction, UpdaterFunction
from typing import Callable, cast, Protocol, Tuple, overload

from .use_state import use_state
from .use_callback import use_callback
from .use_memo import use_memo


class BooleanCallable(Protocol):
    on: Callable[[], None]
    off: Callable[[], None]
    toggle: Callable[[], None]

    def __call__(self, new_value: UpdaterFunction[bool]) -> None:
        ...


@overload
def use_boolean() -> Tuple[bool, BooleanCallable]:
    ...


@overload
def use_boolean(
    initial_value: bool | InitializerFunction[bool],
) -> Tuple[bool, BooleanCallable]:
    ...


def use_boolean(
    initial_value: bool | InitializerFunction[bool] = False,
) -> Tuple[bool, BooleanCallable]:
    """
    Hook to add a boolean variable to your component. The variable will persist across renders.
    This is a convenience hook for when you only need functions to set update a boolean value.
    For more complex state management, use use_state.

    Args:
        initial_value: The initial value for the booelean.
            It can be True or False, but passing a function will treat it as an initializer function.
            An initializer function is called with no parameters once on the first render to get the initial value.
            After the initial render the argument is ignored.
            Default is False.

    Returns:
        A tuple containing the current value of the boolean, and a callable to set the boolean.
    """
    boolean, set = use_state(initial_value)

    on = use_callback(lambda: set(True), [set])
    off = use_callback(lambda: set(False), [set])
    toggle = use_callback(lambda: set(lambda old_value: not old_value), [set])

    def init_callable():
        set.on = on
        set.off = off
        set.toggle = toggle
        boolean_callable = cast(BooleanCallable, set)
        return boolean_callable

    boolean_callable = use_memo(init_callable, [set, on, off, toggle])

    return boolean, boolean_callable
