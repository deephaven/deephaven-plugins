from threading import Timer
from typing import Callable
from deephaven.table import Table
from deephaven.table_listener import listen

from .use_effect import use_effect


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
