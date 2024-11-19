from ..hooks import use_event_queue

from typing import Callable
from .make_component import make_component
from .._internal.utils import create_props
from ..types import ToastVariant

_TOAST_EVENT = "toast.event"


@make_component
def toast(
    message: str,
    variant: ToastVariant = "neutral",
) -> Callable[[], None]:
    """
    Toasts display brief, temporary notifications of actions, errors, or other events in an application.

    Args:
        message: The message to display in the toast.
        variant: The variant of the toast. Defaults to "neutral".
    """
    event_queue = use_event_queue()
    # _, params = create_props(locals()) TODO should be able to use locals() here
    return lambda: event_queue(_TOAST_EVENT, {"message": message, "variant": variant})
