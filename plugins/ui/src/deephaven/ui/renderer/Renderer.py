from __future__ import annotations
from dataclasses import asdict as dataclass_asdict, is_dataclass
import logging
from typing import Any, Union

from .._internal import RenderContext, remove_empty_keys
from ..elements import Element, MemoizedElement, PropsType
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)


def _render_child_item(
    item: Any,
    parent_context: RenderContext,
    index_key: str,
    is_dirty_render: bool,
) -> Any:
    """
    Render a child item. If the item may have its own children, they will be rendered as well.

    Args:
        item: The item to render.
        parent_context: The context of the parent to render the item in.
        index_key: The key of the item in the parent context if it is a list or tuple.
        is_dirty_render: Whether this render is a dirty render (a result of a state change), or we are just traversing the tree

    Returns:
        The rendered item.
    """
    logger.debug("_render_child_item parent_context is %s", parent_context)

    fetch_only = not is_dirty_render

    if isinstance(item, (list, map, tuple)):
        return _render_list(
            item,
            parent_context.get_child_context(index_key, fetch_only),
            is_dirty_render,
        )

    if isinstance(item, dict):
        return _render_dict(
            item,
            parent_context.get_child_context(index_key, fetch_only),
            is_dirty_render,
        )

    # If the item is an instance of a dataclass
    if is_dataclass(item) and not isinstance(item, type):
        return _render_dict(
            remove_empty_keys(dataclass_asdict(item)),
            parent_context.get_child_context(index_key, fetch_only),
            is_dirty_render,
        )

    if isinstance(item, Element):
        logger.debug(
            "render_child element %s: %s",
            type(item),
            item,
        )
        key = item.key or f"{index_key}-{item.name}"
        return _render_element(
            item,
            parent_context.get_child_context(key, fetch_only),
            is_dirty_render,
        )

    logger.debug("render_item returning child (%s): %s", type(item), item)
    return item


def _render_list(
    item: Union[list[Any], map[Any], tuple[Any, ...]],
    context: RenderContext,
    is_dirty_render: bool,
) -> list[Any]:
    """
    Render a list. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The list to render.
        context: The context to render the list in.
        is_dirty_render: Whether this render is a dirty render (a result of a state change), or we are just traversing the tree.

    Returns:
        The rendered list.
    """
    logger.debug("_render_list %s", item)
    if not is_dirty_render:
        # Don't open the context
        return _render_list_in_open_context(item, context, is_dirty_render)

    with context.open():
        return _render_list_in_open_context(item, context, is_dirty_render)


def _render_list_in_open_context(
    item: Union[list[Any], map[Any], tuple[Any, ...]],
    context: RenderContext,
    is_dirty_render: bool,
) -> list[Any]:
    """
    Render a list. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The list to render.
        context: The context to render the list in. This context should already be open.
        is_dirty_render: Whether this render is a dirty render (a result of a state change), or we are just traversing the tree.
    Returns:
        The rendered list.
    """
    return [
        _render_child_item(value, context, str(key), is_dirty_render)
        for key, value in enumerate(item)
    ]


def _render_dict(
    item: PropsType, context: RenderContext, is_dirty_render: bool
) -> PropsType:
    """
    Render a dictionary. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The dictionary to render.
        context: The context to render the dictionary in.
        is_dirty_render: Whether this render is a dirty render (a result of a state change), or we are just traversing the tree.

    Returns:
        The rendered dictionary.
    """
    logger.debug("_render_dict %s", item)

    if not is_dirty_render:
        # Don't open the context
        return _render_dict_in_open_context(item, context, is_dirty_render)

    with context.open():
        return _render_dict_in_open_context(item, context, is_dirty_render)


def _render_dict_in_open_context(
    item: PropsType, context: RenderContext, is_dirty_render: bool
) -> PropsType:
    """
    Render a dictionary. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The dictionary to render.
        context: The context to render the dictionary in.
        is_dirty_render: Whether we are re-rendering an existing element. This is used to determine whether to use the existing child context or create a new one when rendering child elements.

    Returns:
        The rendered dictionary.
    """
    return {
        key: _render_child_item(value, context, key, is_dirty_render)
        for key, value in item.items()
    }


def _render_element(
    element: Element, context: RenderContext, is_dirty_render: bool
) -> RenderedNode:
    """
    Render an Element.

    Args:
        element: The element to render.
        context: The context to render the component in.
        is_dirty_render: Whether this render is a dirty render (a result of a state change), or we are just traversing the tree.

    Returns:
        The RenderedNode representing the element.
    """
    logger.debug(
        "Rendering element %s (%s) in context %s, cache: %s",
        element.name,
        type(element),
        context,
        context.cache,
    )

    # Props that are being passed into this Element
    element_props = None

    # Props that are returned after calling the elements render() method. These will be cached
    rendered_element_props = None

    if isinstance(element, MemoizedElement):
        element_props = element.props

    if context.cache is not None:
        # First check if we can use the result from the cache
        prev_props, prev_rendered_element_props = context.cache

        needs_render = is_dirty_render

        if isinstance(element, MemoizedElement):
            needs_render = not element.are_props_equal(prev_props)

        if not needs_render and not context.is_dirty:
            logger.debug("Returning cached element %s", element.name)
            rendered_props = _render_dict_in_open_context(
                prev_rendered_element_props, context, False
            )
            return RenderedNode(element.name, rendered_props)

    with context.open():
        logger.debug("Rendering element %s", element.name)

        rendered_element_props = element.render()

        context.cache = (element_props, rendered_element_props)

        # We also need to render any elements that are passed in as props (including `children`)
        rendered_props = _render_dict_in_open_context(
            rendered_element_props, context, True
        )

    return RenderedNode(element.name, rendered_props)


class Renderer:
    """
    Renders Elements provided into the RenderContext provided and returns a RenderedNode.
    At this step it executing the render() method of the Element within the RenderContext state to generate the
    realized Document tree for the Element provided.

    There are a few things to note about the Renderer and RenderContext:
        - The Renderer is responsible for rendering an Element and all of its children, but it does not manage the state of the Element, or liveness scopes, or hooks. Those are all tracked by the RenderContext.
        - There is a RenderContext created for each Element. If that Element unmounts, that RenderContext will be destroyed.
        - The RenderContext also has a cache that the Renderer uses to store the previous rendered result of an Element.
        - State changes in an Element will mark the RenderContext as dirty, which will cause the Renderer to re-render the Element and its children.
        - When an Element is dirty, it will be re-rendered along with all of it's children
        - When a MemoizedElement is encountered, the Renderer will _only_ re-render if the props have changes (as determined by the MemoizedElement's are_props_equal function) or if the context of that Element is dirty, whether it's a dirty render or not (e.g. one of it's parent components was marked dirty)

    By following these rules, we can ensure that we are only re-rendering the parts of the tree that need to be re-rendered, and we can skip re-rendering for parts of the tree that have not changed, even in cases where their parent Element has changed.
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
        return _render_element(element, self._context, False)
