from ..hooks import use_event_queue

from typing import Callable
from .make_component import make_component
from .._internal.utils import dict_to_react_props
from ..types import ToastVariant

_TOAST_EVENT = "toast.event"


@make_component
def toast(
    message: str,
    variant: ToastVariant = "neutral",
    action_label: str | None = None,
    on_action: Callable[[], None] | None = None,
    should_close_on_action: bool | None = None,
    on_close: Callable[[], None] | None = None,
    timeout: int | None = None,
    id: str | None = None,
) -> Callable[[], None]:
    """
    Toasts display brief, temporary notifications of actions, errors, or other events in an application.

    Args:
        message: The message to display in the toast.
        variant: The variant of the toast. Defaults to "neutral".
        action_label: The label for the action button with the toast. If provided, an action button will be displayed.
        on_action: Handler that is called when the action button is pressed.
        should_close_on_action: Whether the toast should automatically close when an action is performed.
        on_close: Handler that is called when the toast is closed, either by the user or after a timeout.
        timeout: A timeout to automatically close the toast after, in milliseconds.
        id: The element's unique identifier.
    """
    local_params = locals()
    event_queue = use_event_queue()
    params = dict_to_react_props(local_params)
    return lambda: event_queue(_TOAST_EVENT, params)
