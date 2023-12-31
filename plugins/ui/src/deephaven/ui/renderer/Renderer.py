import logging
from typing import Any
from deephaven.liveness_scope import LivenessScope
from .._internal import RenderContext
from ..elements import Element
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def _render(context: RenderContext, element: Element):
    """
    Render an Element.

    Args:
        context: The context to render the component in.
        element: The element to render.

    Returns:
        The RenderedNode representing the element.
    """

    def render_child(child: Any, child_context: RenderContext):
        logger.debug("child_context is %s", child_context)
        if isinstance(child, list) or isinstance(child, tuple):
            logger.debug("render_child list: %s", child)
            return [
                render_child(child, child_context.get_child_context(i))
                for i, child in enumerate(child)
            ]
        if isinstance(child, dict):
            logger.debug("render_child dict: %s", child)
            return {
                key: render_child(value, child_context.get_child_context(key))
                for key, value in child.items()
            }
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

    props = element.render(context)

    # We also need to render any elements that are passed in as props
    props = render_child(props, context)

    return RenderedNode(element.name, props)


class Renderer:
    def __init__(self, context: RenderContext = RenderContext()):
        self._context = context
        self._liveness_scope = LivenessScope()

    def __del__(self):
        self.release_liveness_scope()

    def release_liveness_scope(self):
        try:  # May not have an active liveness scope or already been released
            self._liveness_scope.release()
            self._liveness_scope = None
        except:
            pass

    def render(self, element: Element):
        new_liveness_scope = LivenessScope()
        with new_liveness_scope.open():
            render_res = _render(self._context, element)

        # Release after in case of memoized tables
        # Ref count goes 1 -> 2 -> 1 by releasing after
        # instead of 1 -> 0 -> 1 which would release the table
        self.release_liveness_scope()
        self._liveness_scope = new_liveness_scope

        return render_res
