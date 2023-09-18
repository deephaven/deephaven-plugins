import logging
from typing import Callable, List
from .Element import Element
from .._internal import RenderContext, get_context, set_context, get_component_qualname

logger = logging.getLogger(__name__)


class FunctionElement(Element):
    def __init__(self, name: str, render: Callable[[], List[Element]]):
        """
        Create an element that takes a function to render.

        Args:
            name: Name of the component. Typically, the module joined with the name of the function.
            render: The render function to call when the component needs to be rendered.
        """
        self._name = name
        self._render = render

    def render(self, context: RenderContext):
        """
        Render the component. Should only be called when actually rendering the component, e.g. exporting it to the client.

        Args:
            context: Context to render the component in

        Returns:
            The rendered component.
        """
        old_context = get_context()
        logger.debug("old context is %s and new context is %s", old_context, context)

        set_context(context)
        context.start_render()

        result = self._render()

        context.finish_render()
        logger.debug("Resetting to old context %s", old_context)
        set_context(old_context)

        return result

    @property
    def name(self):
        return self._name

    @property
    def props(self):
        return None
