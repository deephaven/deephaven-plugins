import logging
from threading import Timer
from typing import Callable
from .shared_internal import _get_context
from deephaven.table import Table
from deephaven.table_listener import listen

logger = logging.getLogger(__name__)


def use_state(initial_value):
    context = _get_context()
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
        # Set the value in the context state and trigger a rerender
        logger.debug("use_state set_value called with %s", new_value)
        context.set_state(hook_index, new_value)

    return value, set_value


class Ref:
    def __init__(self, current):
        self.current = current


def use_ref(initial_value):
    ref, _ = use_state(Ref(initial_value))
    return ref


def use_memo(func, deps):
    deps_ref = use_ref(None)
    value_ref = use_ref(None)

    if deps_ref.current != deps:
        value_ref.current = func()
        deps_ref.current = deps

    return value_ref.current


def use_callback(func, deps):
    deps_ref = use_ref(None)
    callback_ref = use_ref(lambda: None)
    stable_callback_ref = use_ref(
        lambda *args, **kwargs: callback_ref.current(*args, **kwargs)
    )

    if deps_ref.current != deps:
        callback_ref.current = func
        deps_ref.current = deps

    return stable_callback_ref.current


def use_effect(func, deps):
    deps_ref = use_ref(None)
    cleanup_ref = use_ref(lambda: None)

    # Check if the dependencies have changed
    if deps_ref.current != deps:
        if cleanup_ref.current is not None:
            # Call the cleanup function from the previous effect
            cleanup_ref.current()

        # Dependencies have changed, so call the effect function and store the new cleanup that's returned
        cleanup_ref.current = func()

        # Update the dependencies
        deps_ref.current = deps


def use_table_listener(table: Table, listener: Callable, description: str = None):
    """
    Register a listener on the given table.
    """

    def start_listener():
        handle = listen(table, listener, description=description)

        # KLUDGE: We need to stop and start the listener for some reason on first load
        # If we don't, no error is reported but the listener never fires
        # TODO: Still debugging this issue
        handle.stop()
        Timer(0.1, lambda: handle.start()).start()

        return lambda: handle.stop()

    use_effect(start_listener, [table, listener, description])
