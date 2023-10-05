from __future__ import annotations
import logging
from typing import Callable, TypeVar, overload
from .._internal.shared import get_context

logger = logging.getLogger(__name__)

T = TypeVar("T")


@overload
def use_state(initial_value: T) -> (T, Callable[[T], None]):
    ...


def use_state(initial_value: T | None = None) -> (T | None, Callable[[T], None]):
    context = get_context()
    hook_index = context.next_hook_index()

    value = initial_value
    if context.has_state(hook_index):
        value = context.get_state(hook_index)
    else:
        # Initialize the state
        if callable(value):
            value = value()
        context.set_state(hook_index, value)

    def set_value(new_value):
        # Set the value in the context state and trigger a re-render
        logger.debug("use_state set_value called with %s", new_value)
        context.set_state(hook_index, new_value)

    return value, set_value
