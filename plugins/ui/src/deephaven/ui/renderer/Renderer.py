import logging
from .._internal import RenderContext, get_component_qualname
from ..elements import Element
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def _render(context: RenderContext, element: Element):
    """
    Render the component.

    Args:
        context: The context to render the component in.

    Returns:
        The rendered component.
    """

    def render_child(child, child_context):
        if isinstance(child, Element):
            return RenderedNode(child.name, child.render(child_context), child.props)
        else:
            return child

    logger.debug("render")

    result = element.render(context)

    # Make it an array if it's not already.
    if not isinstance(result, list):
        result = [result]

    # Render all children and store in the result
    result = [
        render_child(child, context.get_child_context(i))
        for i, child in enumerate(result)
    ]

    return RenderedNode(element.name, result, element.props)


class Renderer:
    def __init__(self, context: RenderContext = RenderContext()):
        self._context = context

    def render(self, element: Element):
        return _render(self._context, element)
