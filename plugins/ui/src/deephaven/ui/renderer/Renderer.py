from __future__ import annotations
from dataclasses import asdict as dataclass_asdict, is_dataclass
import logging
from typing import Any, Union

from .._internal import RenderContext, remove_empty_keys
from ..elements import Element, PropsType
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def _render_child_item(item: Any, parent_context: RenderContext, index_key: str) -> Any:
    """
    Render a child item. If the item may have its own children, they will be rendered as well.

    Args:
        item: The item to render.
        parent_context: The context of the parent to render the item in.
        index_key: The key of the item in the parent context if it is a list or tuple.

    Returns:
        The rendered item.
    """
    logger.debug("_render_child_item parent_context is %s", parent_context)

    if isinstance(item, (list, map, tuple)):
        return _render_list(item, parent_context.get_child_context(index_key))

    if isinstance(item, dict):
        return _render_dict(item, parent_context.get_child_context(index_key))

    # If the item is an instance of a dataclass
    if is_dataclass(item) and not isinstance(item, type):
        return _render_dict(
            remove_empty_keys(dataclass_asdict(item)),
            parent_context.get_child_context(index_key),
        )

    if isinstance(item, Element):
        logger.debug(
            "render_child element %s: %s",
            type(item),
            item,
        )
        key = item.key or f"{index_key}-{item.name}"
        return _render_element(item, parent_context.get_child_context(key))

    logger.debug("render_item returning child (%s): %s", type(item), item)
    return item


def _render_list(
    item: Union[list[Any], map[Any], tuple[Any, ...]], context: RenderContext
) -> list[Any]:
    """
    Render a list. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The list to render.
        context: The context to render the list in.

    Returns:
        The rendered list.
    """
    logger.debug("_render_list %s", item)
    with context.open():
        return [
            _render_child_item(value, context, str(key))
            for key, value in enumerate(item)
        ]


def _render_dict(item: PropsType, context: RenderContext) -> PropsType:
    """
    Render a dictionary. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The dictionary to render.
        context: The context to render the dictionary in.

    Returns:
        The rendered dictionary.
    """
    logger.debug("_render_dict %s", item)

    with context.open():
        return _render_dict_in_open_context(item, context)


def _render_dict_in_open_context(item: PropsType, context: RenderContext) -> PropsType:
    """
    Render a dictionary. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The dictionary to render.
        context: The context to render the dictionary in.

    Returns:
        The rendered dictionary.
    """
    return {key: _render_child_item(value, context, key) for key, value in item.items()}


def _render_element(element: Element, context: RenderContext) -> RenderedNode:
    """
    Render an Element.

    Args:
        element: The element to render.
        context: The context to render the component in.

    Returns:
        The RenderedNode representing the element.
    """
    logger.debug("Rendering element %s in context %s", element.name, context)

    with context.open():
        props = element.render(context)

        # We also need to render any elements that are passed in as props (including `children`)
        props = _render_dict_in_open_context(props, context)

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

        Args:
            element: The element to render.

        Returns:
            The rendered element.
        """
        return _render_element(element, self._context)
