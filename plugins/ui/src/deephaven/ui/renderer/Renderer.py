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
            logger.debug(
                "render_child element %s: %s",
                type(child),
                child,
            )
            return _render(child_context, child)
        else:
            logger.debug("render_child returning child (%s): %s", type(child), child)
            return child

    logger.debug("Rendering %s: ", element.name)

    result = element.render(context)

    if result is not None:
        if isinstance(result, list):
            # Render all children and store in the result
            result = [
                render_child(child, context.get_child_context(i))
                for i, child in enumerate(result)
            ]
        else:
            result = render_child(result, context.get_child_context(0))

    return RenderedNode(element.name, result, element.props)


class Renderer:
    def __init__(self, context: RenderContext = RenderContext()):
        self._context = context

    def render(self, element: Element):
        return _render(self._context, element)
