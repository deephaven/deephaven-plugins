from __future__ import annotations
from typing import Callable, overload
from .._internal import InitializerFunction
from .use_state import use_state


@overload
def use_flag() -> tuple[bool, Callable[[], None], Callable[[], None]]:
    ...


@overload
def use_flag(
    initial_flag: bool | InitializerFunction[bool],
) -> tuple[bool, Callable[[], None], Callable[[], None]]:
    ...


def use_flag(
    initial_flag: bool | InitializerFunction[bool] = False,
) -> tuple[bool, Callable[[], None], Callable[[], None]]:
    """
    Hook to add a boolean flag variable to your component. The flag will persist across renders.
    This is a convenience hook for when you only need functions to set a flag to True or False.
    For more complex state management, use use_state.

    Args:
        initial_flag: The initial value for the flag.
            It can be True or False, but passing a function will treat it as an initializer function.
            An initializer function is called with no parameters once on the first render to get the initial value.
            After the initial render the argument is ignored.
            Default is False.

    Returns:
        A tuple containing the current value of the flag, a function to set the flag to True, and a function to set the flag to False.
    """
    flag, set_flag = use_state(initial_flag)

    def set_true():
        set_flag(True)

    def set_false():
        set_flag(False)

    return flag, set_true, set_false
