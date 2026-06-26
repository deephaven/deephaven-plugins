from __future__ import annotations
import functools
from typing import Any, Callable, overload

from .._internal import (
    get_component_qualname,
    dict_shallow_equal,
    shallow_equal,
    iterable_shallow_equal,
)
from ..elements import Element, FunctionElement, MemoizedElement, PropsType

# Type alias for comparison functions
CompareFunction = Callable[[PropsType, PropsType], bool]


def _default_are_props_equal(prev_props: PropsType, next_props: PropsType) -> bool:
    """
    The default are_props_equal function that does a shallow comparison of the props.

    Args:
        prev_props: The previous props to check against the current props.
        next_props: The current props to check against the previous props.

    Returns:
        True if the props are equal, False otherwise.
    """
    # Children are passed in as positional args wrapped in a tuple, so the tuple
    # itself is a different object on every render even when the children are the
    # same. Compare children by value, then shallow compare the remaining props.
    if "children" in prev_props or "children" in next_props:
        prev_children = prev_props.get("children")
        next_children = next_props.get("children")

        # For list/tuple children, compare element-wise with shallow semantics.
        if isinstance(prev_children, (list, tuple)) and isinstance(
            next_children, (list, tuple)
        ):
            if not iterable_shallow_equal(prev_children, next_children):
                return False
        elif not shallow_equal(prev_children, next_children):
            return False

    prev_props_without_children = dict(prev_props)
    prev_props_without_children.pop("children", None)

    next_props_without_children = dict(next_props)
    next_props_without_children.pop("children", None)

    return dict_shallow_equal(
        prev_props_without_children,
        next_props_without_children,
    )


@overload
def component(func: Callable[..., Any]) -> Callable[..., Element]:
    """Basic usage without parentheses: @ui.component"""
    ...


@overload
def component(
    *,
    memo: bool | CompareFunction = ...,
) -> Callable[[Callable[..., Any]], Callable[..., Element]]:
    """Usage with parameters: @ui.component() or @ui.component(memo=True)"""
    ...


def component(
    func: Callable[..., Any] | None = None,
    *,
    memo: bool | CompareFunction = False,
) -> Callable[..., Element] | Callable[[Callable[..., Any]], Callable[..., Element]]:
    """
    Create a FunctionalElement from the passed in function.

    Args:
        func: The function to create a FunctionalElement from.
              Runs when the component is being rendered.
        memo: Enable memoization to skip re-rendering when props are unchanged.
              - False (default): No memoization, component always re-renders with parent.
              - True: Enable memoization with shallow equality comparison.
              - Callable: Custom comparison function (prev_props, next_props) -> bool
                          that returns True if props are equal (should skip re-render).

    Can be used in several ways:

    1. Without parentheses (no memoization):
       @ui.component
       def my_component(value):
           return ui.text(str(value))

    2. With parentheses (no memoization):
       @ui.component()
       def my_component(value):
           return ui.text(str(value))

    3. With memo=True (shallow equality comparison):
       @ui.component(memo=True)
       def my_component(value):
           return ui.text(str(value))

    4. With custom comparison function:
       @ui.component(memo=lambda prev, next: prev["value"] == next["value"])
       def my_component(value, on_click):
           return ui.button(str(value), on_press=on_click)
    """
    # Determine if memoization is enabled and what comparison function to use
    if memo is False:
        enable_memo = False
        compare_fn: CompareFunction | None = None
    elif memo is True:
        enable_memo = True
        compare_fn = _default_are_props_equal
    elif callable(memo):
        enable_memo = True
        compare_fn = memo
    else:
        raise TypeError(
            f"memo must be True, False, or a callable, got {type(memo).__name__}"
        )

    def decorator(fn: Callable[..., Any]) -> Callable[..., Element]:
        @functools.wraps(fn)
        def make_component_node(*args: Any, key: str | None = None, **kwargs: Any):
            component_type = get_component_qualname(fn)
            element = FunctionElement(
                component_type, lambda: fn(*args, **kwargs), key=key
            )

            if enable_memo and compare_fn is not None:
                return MemoizedElement(
                    element,
                    {"children": args, **kwargs},
                    compare_fn,
                )
            return element

        return make_component_node

    if func is not None:
        # Called without parentheses: @ui.component
        return decorator(func)
    else:
        # Called with parentheses: @ui.component() or @ui.component(memo=True)
        return decorator
