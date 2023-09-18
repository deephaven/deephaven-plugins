import logging
from .._internal import RenderContext, get_component_qualname
from ..elements import Element, FunctionElement
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def _render(context: RenderContext, node: FunctionElement):
    """
    Render the component.

    Args:
        context: The context to render the component in.

    Returns:
        The rendered component.
    """

    def render_child(child, child_context):
        if isinstance(child, FunctionElement):
            return child.render(child_context)
        elif isinstance(child, Element):
            return RenderedNode(
                get_component_qualname(child), child.children, child.props
            )
        else:
            return child

    logger.debug("render")

    result = node.render(context)

    # Make it an array if it's not already.
    if not isinstance(result, list):
        result = [result]

    # Render all children and store in the result
    result = [
        render_child(child, context.get_child_context(i))
        for i, child in enumerate(result)
    ]

    return RenderedNode(node.name, result)


class Renderer:
    def __init__(self, context: RenderContext = RenderContext()):
        self._context = context

    def render(self, component: FunctionElement):
        return _render(self._context, component)
