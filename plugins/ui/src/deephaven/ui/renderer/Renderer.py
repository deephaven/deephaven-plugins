from __future__ import annotations
import logging
from typing import Any
from .._internal import RenderContext
from ..elements import Element, PropsType
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def _render_item(item: Any, context: RenderContext) -> Any:
    """
    Render an item. If the item is a list or tuple, render each item in the list.

    Args:
        item: The item to render.
        context: The context to render the item in.
    """
    logger.debug("_render_item context is %s", context)
    if isinstance(item, (list, tuple)):
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
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The list to render.
        context: The context to render the list in.
    """
    logger.debug("_render_list %s", item)
    return [
        _render_item(value, context.get_child_context(str(key)))
        for key, value in enumerate(item)
    ]


def _render_dict(item: PropsType, context: RenderContext) -> PropsType:
    """
    Render a dictionary. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The dictionary to render.
        context: The context to render the dictionary in.
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
        element: The element to render.
        context: The context to render the component in.

    Returns:
        The RenderedNode representing the element.
    """
    logger.debug("Rendering %s: ", element.name)

    props = element.render(context)

    # We also need to render any elements that are passed in as props
    props = _render_dict(props, context)

    return RenderedNode(element.name, props)


class Renderer:
    """
    Renders Elements provided into the RenderContext provided and returns a RenderedNode.
    At this step it executing the render() method of the Element within the RenderContext state to generate the
    realized Document tree for the Element provided.
    """

    _context: RenderContext
    """
    Context to render the element into. This is essentially the state of the element.
    """

    def __init__(self, context: RenderContext):
        self._context = context

    def render(self, element: Element) -> RenderedNode:
        """
        Render an element. Will update the liveness scope with the new objects from the render.
        """
        return _render_element(element, self._context)
