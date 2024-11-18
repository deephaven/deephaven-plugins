from ..hooks import use_event_queue

from typing import Callable


def toast(
    message: str,
) -> Callable[[], None]:
    """
    Toasts display brief, temporary notifications of actions, errors, or other events in an application.

    Args:
        message: The message to display in the toast.
    """
    event_queue = use_event_queue()
    return lambda: event_queue("toast", {"message": message})
