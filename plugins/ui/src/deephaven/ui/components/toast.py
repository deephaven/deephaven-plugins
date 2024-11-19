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
    on_close: Callable[[], None] | None = None,
    timeout: int | None = None,
    id: str | None = None,
) -> Callable[[], None]:
    """
    Toasts display brief, temporary notifications of actions, errors, or other events in an application.

    Args:
        message: The message to display in the toast.
        variant: The variant of the toast. Defaults to "neutral".
    """
    event_queue = use_event_queue()
    # _, params = create_props(locals()) TODO should be able to use locals() here
    params = dict_to_react_props(
        {
            "message": message,
            "variant": variant,
            "action_label": action_label,
            "on_action": on_action,
            "on_close": on_close,
            "timeout": timeout,
            "id": id,
        }
    )
    return lambda: event_queue(_TOAST_EVENT, params)
