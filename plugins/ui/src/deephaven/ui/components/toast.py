from ..hooks import use_event_queue

from typing import Callable
from .make_component import make_component

_TOAST_EVENT = "toast.event"


@make_component
def toast(
    message: str,
) -> Callable[[], None]:
    """
    Toasts display brief, temporary notifications of actions, errors, or other events in an application.

    Args:
        message: The message to display in the toast.
    """
    event_queue = use_event_queue()
    return lambda: event_queue(_TOAST_EVENT, {"message": message})
