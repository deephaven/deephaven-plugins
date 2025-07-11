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