from __future__ import annotations
from dataclasses import asdict as dataclass_asdict, is_dataclass
import logging
from typing import Any, Union

from .._internal import RenderContext, remove_empty_keys
from ..elements import Element, FunctionElement, PropsType
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
        result = [
            _render_child_item(value, context, str(key))
            for key, value in enumerate(item)
        ]
        # Clear dirty flags after processing children to ensure proper propagation
        # on subsequent state changes. Without this, the _mark_dirty optimization
        # that stops early when a parent already has _has_dirty_descendant=True
        # would fail to propagate to ancestors.
        context._has_dirty_descendant = False
        return result


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
        result = _render_dict_in_open_context(item, context)
        # Clear dirty flags after processing children to ensure proper propagation
        # on subsequent state changes
        context._has_dirty_descendant = False
        return result


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


def _render_children_only(context: RenderContext) -> RenderedNode:
    """
    Re-render only the children of a component, reusing the parent's cached props.

    This is used when a component is clean but has dirty descendants. We don't need to
    re-execute the component's render function, but we do need to re-render children
    (which may include dirty descendants).

    IMPORTANT: We do NOT open the parent context here. Opening the context would
    reset effects and cause cleanup functions to run incorrectly. Instead, we just
    iterate over the cached props and render any child Elements, which will open
    their own contexts.

    Args:
        context: The context to render in. Must have cached_props from a previous render.

    Returns:
        A new RenderedNode with re-rendered children.
    """
    cached_node = context._cached_rendered_node
    cached_props = context._cached_props

    logger.debug(
        "Re-rendering children only for %s in context %s", cached_node.name, context
    )

    # Render children without opening parent context
    # This preserves parent's effects and state while updating children
    if cached_props is not None:
        rendered_props = _render_dict_in_open_context(cached_props, context)
    else:
        rendered_props = {}

    # Clear the dirty descendant flag after processing children
    context._has_dirty_descendant = False

    rendered = RenderedNode(cached_node.name, rendered_props)
    context._cached_rendered_node = rendered
    return rendered


def _render_element(element: Element, context: RenderContext) -> RenderedNode:
    """
    Render an Element, potentially reusing cached output for clean components.

    Args:
        element: The element to render.
        context: The context to render the component in.

    Returns:
        The RenderedNode representing the element.
    """
    logger.debug("Rendering element %s in context %s", element.name, context)

    # Caching optimization only applies to FunctionElements (components with state).
    # BaseElements and other element types always get their props from their constructor,
    # so they need to re-render when their props change (which we can't track).
    is_function_element = isinstance(element, FunctionElement)

    # Check if we can skip rendering this component
    if (
        is_function_element
        and context._cached_rendered_node is not None
        and not context._is_dirty
    ):
        if not context._has_dirty_descendant:
            # Component and all descendants are clean - reuse cache entirely
            logger.debug("Skipping render for %s - using cached node", element.name)
            return context._cached_rendered_node
        else:
            # This component is clean but has dirty descendants
            # Re-render children only, not this component's function
            logger.debug(
                "Re-rendering children only for %s - component is clean but has dirty descendants",
                element.name,
            )
            return _render_children_only(context)

    # Full re-render needed (either first render or component is dirty)
    logger.debug("Full re-render for %s", element.name)

    with context.open():
        props = element.render(context)

        # Cache the pre-rendered props (containing Elements) for potential re-use
        # when this component is clean but has dirty descendants
        context._cached_props = props

        # We also need to render any elements that are passed in as props (including `children`)
        props = _render_dict_in_open_context(props, context)

        # Clear dirty flags after successful render
        context._is_dirty = False
        context._has_dirty_descendant = False

    rendered = RenderedNode(element.name, props)
    context._cached_rendered_node = rendered
    return rendered


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
