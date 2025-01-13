from __future__ import annotations

from ..hooks import use_send_event

from typing import Callable
from .._internal.utils import dict_to_react_props
from .._internal.EventContext import NoContextException
from ..types import ToastVariant

_TOAST_EVENT = "toast.event"


class ToastException(NoContextException):
    pass


def toast(
    message: str,
    *,
    variant: ToastVariant = "neutral",
    action_label: str | None = None,
    on_action: Callable[[], None] | None = None,
    should_close_on_action: bool | None = None,
    on_close: Callable[[], None] | None = None,
    timeout: int | None = None,
    id: str | None = None,
) -> None:
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

    Returns:
        None
    """
    params = dict_to_react_props(locals())
    try:
        send_event = use_send_event()
    except NoContextException as e:
        raise ToastException(
            "Toasts must be triggered from the render thread. Use the hook `use_render_queue` to queue a function on the render thread."
        ) from e
    send_event(_TOAST_EVENT, params)
