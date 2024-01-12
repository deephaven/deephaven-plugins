from __future__ import annotations
import logging
from typing import Callable, TypeVar, overload
from .._internal.shared import get_context
from .._internal.RenderContext import InitializerFunction, UpdaterFunction

logger = logging.getLogger(__name__)

T = TypeVar("T")


@overload
def use_state(
    initial_value: T | InitializerFunction[T],
) -> tuple[T, Callable[[T | UpdaterFunction[T]], None]]:
    ...


@overload
def use_state(
    initial_value: T | InitializerFunction[T] | None = None,
) -> tuple[T | None, Callable[[T | UpdaterFunction[T]], None]]:
    ...


def use_state(
    initial_value: T | InitializerFunction[T] | None = None,
) -> tuple[T | None, Callable[[T | UpdaterFunction[T]], None]]:
    context = get_context()
    hook_index = context.next_hook_index()

    if not context.has_state(hook_index):
        # This is the first render, initialize the value
        context.init_state(hook_index, initial_value)

    value: T = context.get_state(hook_index)

    def set_value(new_value: T | UpdaterFunction[T]):
        # Set the value in the context state and trigger a re-render
        logger.debug("use_state set_value called with %s", new_value)
        context.set_state(hook_index, new_value)

    return value, set_value
