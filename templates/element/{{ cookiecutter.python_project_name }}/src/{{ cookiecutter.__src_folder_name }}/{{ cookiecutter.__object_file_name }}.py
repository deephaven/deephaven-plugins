from __future__ import annotations

from deephaven import ui
from typing import Callable


@ui.component
def {{ cookiecutter.__object_name }}(
    text: str = "Hello, World!",
    callback: Callable = print,
) -> ui.BaseElement:
    """
    A simple component that demonstrates how to create a component in Deephaven.

    Args:
        callback: A callback function that can be used to handle events or actions within the component.

    Returns:
        A simple component that displays the properties passed to it
    """
    props = locals()
    return ui.BaseElement('{{ cookiecutter.__src_folder_name }}.{{ cookiecutter.__object_name }}', props)