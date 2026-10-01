from __future__ import annotations
from contextlib import nullcontext
from dataclasses import fields, is_dataclass
import logging
from typing import Any, Union
import weakref

from .._internal import RenderContext, remove_empty_keys
from ..elements import Element, MemoizedElement, PropsType
from ..elements.FunctionElement import COMPONENT_KEY_PROP
from .RenderedNode import RenderedNode

logger = logging.getLogger(__name__)

_PANEL_ELEMENT_NAME = "deephaven.ui.components.Panel"

# Props of a node that only passes its child through, like a component
_PASS_THROUGH_PROPS = {"children", COMPONENT_KEY_PROP}

# List contexts already warned about panels without keys, so each list only warns once
_missing_panel_key_contexts: weakref.WeakSet[RenderContext] = weakref.WeakSet()


def _get_panel(node: Any) -> tuple[RenderedNode, bool] | None:
    """
    Get the panel a list item renders, looking through components that render a single child.

    Args:
        node: The rendered list item.

    Returns:
        The panel and whether it or a component rendering it has a key, or None if the item isn't a panel.
    """
    is_keyed = False
    while isinstance(node, RenderedNode):
        props = node.props or {}
        if node.name == _PANEL_ELEMENT_NAME:
            return node, is_keyed or props.get("key") is not None
        if not set(props.keys()) <= _PASS_THROUGH_PROPS:
            return None
        is_keyed = is_keyed or props.get(COMPONENT_KEY_PROP) is not None
        node = props.get("children")
    return None


def _warn_missing_panel_keys(items: list[Any], context: RenderContext) -> None:
    """
    Warn once per list when it has more than one panel and any of them has no key.
    Like React list items, the client identifies panels by key, so unkeyed panels shift when the list changes.

    Args:
        items: The rendered list items.
        context: The context of the list.
    """
    if context in _missing_panel_key_contexts:
        return
    panels = [panel for panel in map(_get_panel, items) if panel is not None]
    if len(panels) < 2:
        return
    unkeyed_titles = [
        str((panel.props or {}).get("title", "Untitled"))
        for panel, is_keyed in panels
        if not is_keyed
    ]
    if len(unkeyed_titles) == 0:
        return
    _missing_panel_key_contexts.add(context)
    logger.warning(
        "Each panel in a list should have a unique key, so it keeps its place and "
        "state when panels are added, removed or reordered. Add `key=` to the panel, "
        "or to the component that returns it. Panels without a key: %s",
        ", ".join(unkeyed_titles),
    )


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
        is_dirty_render: Whether this pass should (re)render children (opening contexts / allowing new child contexts), versus a traversal pass that fetches existing child contexts and only re-renders dirty subtrees.

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
        shallow = {f.name: getattr(item, f.name) for f in fields(item)}
        return _render_dict(
            remove_empty_keys(shallow),
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
        is_dirty_render: Whether this render is a dirty render (a result of a state change), or we are just traversing the tree. For a dirty render, we need to open this context for a render cycle.

    Returns:
        The rendered list.
    """
    logger.debug("_render_list %s", item)

    with context.open() if is_dirty_render else nullcontext():
        return _render_list_contents(item, context, is_dirty_render)


def _render_list_contents(
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
        is_dirty_render: Whether this pass should (re)render children (opening contexts / allowing new child contexts), versus a traversal pass that fetches existing child contexts and only re-renders dirty subtrees.
    Returns:
        The rendered list.
    """
    rendered = [
        _render_child_item(value, context, str(key), is_dirty_render)
        for key, value in enumerate(item)
    ]
    _warn_missing_panel_keys(rendered, context)
    return rendered


def _render_dict(
    item: PropsType, context: RenderContext, is_dirty_render: bool
) -> PropsType:
    """
    Render a dictionary. You may be able to pass in an element as a prop that needs to be rendered, not just as a child.
    For example, a `label` prop of a button can accept a string or an element.

    Args:
        item: The dictionary to render.
        context: The context to render the dictionary in.
        is_dirty_render: Whether this render is a dirty render (a result of a state change), or we are just traversing the tree. For a dirty render, we need to open this context for a render cycle.

    Returns:
        The rendered dictionary.
    """
    logger.debug("_render_dict %s", item)
    with context.open() if is_dirty_render else nullcontext():
        return _render_dict_contents(item, context, is_dirty_render)


def _render_dict_contents(
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

        if isinstance(element, MemoizedElement):
            # Memoized elements only need a fresh render when their state changed
            # or their props are no longer equal.
            needs_render = context.is_dirty or not element.are_props_equal(prev_props)
        else:
            # Non-memoized elements re-render when the parent is doing a dirty
            # render or when this element's context is dirty.
            needs_render = is_dirty_render or context.is_dirty

        if not needs_render:
            # We can use the cached result without re-rendering this component.
            # A child component may still need to be re-rendered if its context is dirty (e.g. child has a state change),
            # but we can skip re-rendering this component if its props are the same and the context is not dirty.
            logger.debug("Returning cached element %s", element.name)
            rendered_props = _render_dict_contents(
                prev_rendered_element_props, context, False
            )
            return RenderedNode(element.name, rendered_props)

    with context.open():
        logger.debug("Rendering element %s", element.name)

        rendered_element_props = element.render()

        context.cache = (element_props, rendered_element_props)

        # We also need to render any elements that are passed in as props (including `children`)
        rendered_props = _render_dict_contents(rendered_element_props, context, True)

    return RenderedNode(element.name, rendered_props)


class Renderer:
    """
    Renders Elements provided into the RenderContext provided and returns a RenderedNode.
    At this step it executing the render() method of the Element within the RenderContext state to generate the
    realized Document tree for the Element provided.

    Key points:
        - The Renderer executes Element.render() within a RenderContext to generate the realized Document tree.
        - Each Element has a RenderContext that is destroyed when the Element unmounts.
        - The RenderContext caches the previous rendered result of an Element.
        - State changes mark the RenderContext as dirty, triggering re-render of the Element and its children.
        - MemoizedElements only re-render if props change or the context is dirty.
    This ensures only the necessary parts of the tree are re-rendered.
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
