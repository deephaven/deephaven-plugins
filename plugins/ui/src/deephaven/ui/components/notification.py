from __future__ import annotations

from ..hooks import use_send_event

from typing import Callable
from .._internal.utils import dict_to_react_props
from .._internal.EventContext import NoContextException

_NOTIFICATION_EVENT = "notification.event"


class NotificationException(NoContextException):
    pass


def notification(
    title: str,
    *,
    description: str | None = None,
    icon: str | None = None,
    tag: str | None = None,
    silent: bool | None = None,
    on_click: Callable[[], None] | None = None,
    on_close: Callable[[], None] | None = None,
) -> None:
    """
    Displays a system notification to the user using the browser's Notifications API.

    Notifications appear outside the browser window, at the operating system level, so
    they can reach the user even when the Deephaven tab is not focused. The browser must
    be served over a secure context (HTTPS or localhost) and the user must grant
    permission to display notifications. If permission is denied or notifications are not
    supported, the message is shown as a toast instead.

    Args:
        title: The title to display in the notification.
        description: The body text to display below the title.
        icon: The URL of an image to display as the notification's icon.
        tag: An identifying tag for the notification. Notifications with the same tag
            replace each other instead of stacking, which is useful for updating an
            existing notification.
        silent: Whether the notification should be silent (no sounds or vibrations),
            regardless of the device settings.
        on_click: Handler that is called when the user clicks the notification.
        on_close: Handler that is called when the notification is closed, either by the
            user or after a timeout.

    Returns:
        None
    """
    params = dict_to_react_props(locals())
    try:
        send_event = use_send_event()
    except NoContextException as e:
        raise NotificationException(
            "Notifications must be triggered from the render thread. Use the hook `use_render_queue` to queue a function on the render thread."
        ) from e
    send_event(_NOTIFICATION_EVENT, params)
