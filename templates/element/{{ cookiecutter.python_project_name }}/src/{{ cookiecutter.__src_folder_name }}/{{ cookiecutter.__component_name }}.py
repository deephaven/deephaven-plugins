from __future__ import annotations

from deephaven import ui
from typing import Callable


@ui.component
def {{ cookiecutter.__component_name }}(
    text: str = "Hello, World!",
    on_click: Callable = print,
) -> ui.BaseElement:
    """
    A simple component that demonstrates how to create a component for an element plugin in Deephaven.

    Args:
        text: A string that can be displayed in the component.
        on_click: A callback function that can be used to handle events or actions within the component.

    Returns:
        A simple component that displays the properties passed to it
    """
    props = locals()
    # The name should match the key assigned to the associated React component in the mapping found in
    # {{ cookiecutter.__js_plugin_view_obj }}
    return ui.BaseElement('{{ cookiecutter.__element_name }}', **props)


def {{ cookiecutter.__event_sender_name }}(
    message: str = "Hello from the server!",
) -> None:
    """
    Send an event to the client-side handler registered in {{ cookiecutter.__js_plugin_obj }}.ts.

    Similar to `ui.toast`, this must be called from the render thread of a `@ui.component`.
    Use the `ui.use_render_queue` hook to queue it if you need to trigger it from a
    background thread or callback.

    Args:
        message: The message to send to the client. The example handler displays it in an alert.

    Returns:
        None
    """
    # `use_send_event` returns a callback for sending an event to the client.
    send_event = ui.use_send_event()
    # The event name must match the key in the `eventMapping` of the JS plugin.
    send_event("{{ cookiecutter.__py_namespace }}.event", {"message": message})