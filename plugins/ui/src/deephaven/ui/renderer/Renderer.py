import logging
from typing import Any
from deephaven.liveness_scope import LivenessScope
from .._internal import RenderContext
from ..elements import Element, PropsType
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def _render_item(item: Any, context: RenderContext) -> Any:
    logger.debug("_render_item context is %s", context)
    if isinstance(item, list) or isinstance(item, tuple):
        # I couldn't figure out how to map a `list[Unknown]` to a `list[Any]`, or to accept a `list[Unknown]` as a parameter
        return _render_list(item, context)  # type: ignore
    if isinstance(item, dict):
        return _render_dict(item, context)  # type: ignore
    if isinstance(item, Element):
        logger.debug(
            "render_child element %s: %s",
            type(item),
            item,
        )
        return _render_element(item, context)
    else:
        logger.debug("render_item returning child (%s): %s", type(item), item)
        return item


def _render_list(
    item: list[Any] | tuple[Any, ...], context: RenderContext
) -> list[Any]:
    """
    Render a list. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    """
    logger.debug("_render_list %s", item)
    return [
        _render_item(value, context.get_child_context(key))
        for key, value in enumerate(item)
    ]


def _render_dict(item: PropsType, context: RenderContext) -> PropsType:
    """
    Render a dictionary. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.
    """
    logger.debug("_render_props %s", item)
    return {
        key: _render_item(value, context.get_child_context(key))
        for key, value in item.items()
    }


def _render_element(element: Element, context: RenderContext) -> RenderedNode:
    """
    Render an Element.

    Args:
        context: The context to render the component in.
        element: The element to render.

    Returns:
        The RenderedNode representing the element.
    """
    logger.debug("Rendering %s: ", element.name)

    props = element.render(context)

    # We also need to render any elements that are passed in as props
    props = _render_dict(props, context)

    return RenderedNode(element.name, props)


class Renderer:
    _liveness_scope: LivenessScope

    def __init__(self, context: RenderContext = RenderContext()):
        self._context = context
        self._liveness_scope = LivenessScope()

    def __del__(self):
        self.release_liveness_scope()

    def release_liveness_scope(self):
        try:  # May not have an active liveness scope or already been released
            self._liveness_scope.release()
        except:
            pass

    def render(self, element: Element) -> RenderedNode:
        # TODO: Should we be tracking if we're mid render here?
        # TODO: Should we be doing this render on a separate thread?
        new_liveness_scope = LivenessScope()
        with new_liveness_scope.open():
            render_res = _render_element(element, self._context)

        # Release after in case of memoized tables
        # Ref count goes 1 -> 2 -> 1 by releasing after
        # instead of 1 -> 0 -> 1 which would release the table
        self.release_liveness_scope()
        self._liveness_scope = new_liveness_scope

        return render_res
