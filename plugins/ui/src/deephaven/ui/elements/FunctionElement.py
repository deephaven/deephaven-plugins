from __future__ import annotations
import logging
from typing import Callable
from .Element import Element, PropsType
from .._internal import RenderContext

logger = logging.getLogger(__name__)


class FunctionElement(Element):
    def __init__(
        self, name: str, render: Callable[[], list[Element]], key: str | None = None
    ):
        """
        Create an element that takes a function to render.

        Args:
            name: Name of the component. Typically, the module joined with the name of the function.
            render: The render function to call when the component needs to be rendered.
        """
        self._name = name
        self._render = render
        self._key = key

    @property
    def name(self):
        return self._name

    @property
    def key(self) -> str | None:
        return self._key

    def render(self, context: RenderContext) -> PropsType:
        """
        Render the component. Should only be called when actually rendering the component, e.g. exporting it to the client.

        Args:
            context: Context to render the component in

        Returns:
            The props of this element.
        """
        children = self._render()

        return {"children": children}
