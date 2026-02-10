from __future__ import annotations
import functools
import logging
from typing import Any, Callable

from .._internal import dict_shallow_equal

from ..elements import MemoizedElement, PropsType

logger = logging.getLogger(__name__)


def _default_are_props_equal(prev_props: PropsType, next_props: PropsType) -> bool:
    """
    The default are_props_equal function that does a shallow comparison of the props.

    Args:
        prev_props: The previous props to check against the current props.
        next_props: The current props to check against the previous props.

    Returns:
        True if the props are equal, False otherwise.
    """
    # Need to check the children separately, because they are passed in as a list and the list will be a different object each time even if the children are the same.
    if "children" in prev_props and "children" in next_props:
        prev_children = prev_props["children"]
        next_children = next_props["children"]

        if not prev_children == next_children:
            return False

    # Now we just need to do a dict_shallow_equal with all the other props that aren't children
    return dict_shallow_equal(
        {k: v for k, v in prev_props.items() if k != "children"},
        {k: v for k, v in next_props.items() if k != "children"},
    )


def memo(
    are_props_equal: Callable[[PropsType, PropsType], bool] = _default_are_props_equal,
):
    """
    Create a MemoizedElement from the passed in function.

    A MemoizedElement is a component that will only re-render if its props have changed or if the context it is in is dirty (e.g. state has changed).
    This can be used to optimize performance by preventing unnecessary re-renders of components that are expensive to render.

    Args:
        are_props_equal: A function that takes the previous props and the next props and returns whether they are equal. If the props are equal, the component will not re-render. If the props are not equal, the component will re-render. This is used to optimize performance by preventing unnecessary re-renders of components that are expensive to render.
    """

    def memo_func(
        func: Callable[..., Any],
    ):
        """
        Create a MemoizedElement from the passed in function.

        A MemoizedElement is a component that will only re-render if its props have changed or if the context it is in is dirty (e.g. state has changed).
        This can be used to optimize performance by preventing unnecessary re-renders of components that are expensive to render.

        Args:
            func: The function to create a MemoizedElement from.
                  Runs when the component is being rendered.
        """

        @functools.wraps(func)
        def make_memoized_node(*args: Any, **kwargs: Any):
            element = func(*args, **kwargs)
            return MemoizedElement(
                element,
                {"children": [*args], **kwargs},
                are_props_equal,
            )

        return make_memoized_node

    return memo_func
