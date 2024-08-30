from __future__ import annotations
from typing import Any, Callable, Dict


from .basic import component_element
from ..elements import Element


def editor(
    language: str | None = "python",
    default_value: str | None = None,
    on_change: Callable[[str], None] | None = None,
    settings: Dict[str, Any] | None = None,
) -> Element:
    """
    Editors are multiline text inputs with syntax highlighting and autocomplete, useful for cases where users have code to enter.

    Args:
        language: The language to use for syntax highlighting
        default_value: The default value of the input
        on_change: Function called when the input value changes

    Returns:
        The element representing the text area
    """

    return component_element(
        "Editor",
        language=language,
        default_value=default_value,
        on_change=on_change,
        settings=settings,
    )
