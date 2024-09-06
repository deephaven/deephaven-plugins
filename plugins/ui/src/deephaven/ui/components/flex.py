from __future__ import annotations
from typing import Any
from inspect import signature, Parameter
from functools import wraps
from .basic import component_element
from .types import (
    LayoutFlex,
    Direction,
    Wrap,
    JustifyContent,
    AlignContent,
    AlignItems,
    DimensionValue,
)


def wrap_prop(f: Any, wrapper: Any, desc: str) -> Any:
    sig = signature(f)
    params = list(sig.parameters.values())
    wrapper_params = list(signature(wrapper).parameters.values())[1:-1]

    for wrapper_param in wrapper_params:
        params.insert(1, wrapper_param)

    wrapper = wraps(f)(wrapper)
    wrapper.__signature__ = sig.replace(parameters=params)
    wrapper.__doc__ += f"        {desc}\n"

    return wrapper


def add_key_prop(f: Any) -> Any:
    def wrapper(*args, key: str | None = None, **kwargs):
        return f(*args, key=key, **kwargs)

    return wrap_prop(f, wrapper, "key: A unique key for the component.")


def add_qwerty_prop(f: Any) -> Any:
    def wrapper(*args, qwerty: int | None = None, **kwargs):
        return f(*args, qwerty=qwerty, **kwargs)

    return wrap_prop(f, wrapper, "qwerty: qwerty.")


@add_qwerty_prop
@add_key_prop
def flex(
    *children: Any,
    flex: LayoutFlex | None = "auto",
    direction: Direction | None = None,
    wrap: Wrap | None = None,
    justify_content: JustifyContent | None = None,
    align_content: AlignContent | None = None,
    align_items: AlignItems | None = None,
    gap: DimensionValue | None = "size-100",
    column_gap: DimensionValue | None = None,
    row_gap: DimensionValue | None = None,
    **props: Any,
):
    """
    Base Flex component for laying out children in a flexbox.

    Args:
        *children: Elements to render in the flexbox.
        flex: The flex property of the flexbox.
        direction: The direction in which to layout children.
        wrap: Whether children should wrap when they exceed the panel's width.
        justify_content: The distribution of space around items along the main axis.
        align_content: The distribution of space between and around items along the cross axis.
        align_items: The alignment of children within their container.
        gap: The space to display between both rows and columns of children.
        column_gap: The space to display between columns of children.
        row_gap: The space to display between rows of children.
    """
    return component_element(
        "Flex",
        *children,
        flex=flex,
        direction=direction,
        wrap=wrap,
        justify_content=justify_content,
        align_content=align_content,
        align_items=align_items,
        gap=gap,
        column_gap=column_gap,
        row_gap=row_gap,
        **props,
    )
