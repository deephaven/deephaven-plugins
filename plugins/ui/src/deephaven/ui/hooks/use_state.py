from __future__ import annotations
import logging
from typing import Any, Callable, TypeVar, overload
from .._internal import InitializerFunction, UpdaterFunction, get_context

logger = logging.getLogger(__name__)

T = TypeVar("T")


# TODO (#208): We can improve the typing in Python 3.12 when we have type parameter syntax for functions
# For not just allow `None`
@overload
def use_state() -> tuple[Any, Callable[[Any | UpdaterFunction[Any]], None]]:
    ...


@overload
def use_state(
    initial_state: T | InitializerFunction[T],
) -> tuple[T, Callable[[T | UpdaterFunction[T]], None]]:
    ...


def use_state(
    initial_state: T | InitializerFunction[T] = None,
) -> tuple[T, Callable[[T | UpdaterFunction[T]], None]]:
    """
    Hook to add a state variable to your component. The state will persist across renders.

    Args:
        initial_state: The initial value for the state.
            It can be any type, but passing a function will treat it as an initializer function.
            An initializer function is called with no parameters once on the first render to get the initial value.
            After the initial render the argument is ignored.
            If an initial value is provided, only types matching that initial value will be valid when calling the returned set state function.
            If no initial value is provided, any type can be passed to the set state function.

    Returns:
        A tuple containing the current value of the state and a function to set the state.
        The set state function can take a new value or an updater function.
        - If the set state function is called with a new value, the state will be set to that value.
        - If the set state function is called with an updater function, the updater function will be called with the current state value and the new state will be set to the return value of the updater function.
    """
    context = get_context()
    hook_index = context.next_hook_index()

    if not context.has_state(hook_index):
        # This is the first render, initialize the value
        context.init_state(hook_index, initial_state)

    value: T = context.get_state(hook_index)

    def set_value(new_value: T | UpdaterFunction[T]):
        # Set the value in the context state and trigger a re-render
        logger.debug("use_state set_value called with %s", new_value)
        context.queue_render(lambda: context.set_state(hook_index, new_value))

    return value, set_value
