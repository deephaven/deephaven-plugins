from __future__ import annotations

from typing import Any, Generic, TypeVar
from .Element import Element, PropsType
from .._internal import RenderContext, _get_context_stack, get_context

T = TypeVar("T")


class ContextProviderElement(Element):
    """
    An element that provides a context value to its children during rendering.

    When rendered, it pushes the value onto the Context's thread-local stack,
    registers a cleanup to pop it after children render, and returns the children
    as its props.
    """

    def __init__(self, context: Context, value: Any, *children: Any):
        """
        Args:
            context: The Context object to provide the value for.
            value: The value to push onto the context stack.
            *children: The child elements to render with this context value.
        """
        self._context = context
        self._value = value
        self._children = children

    @property
    def name(self) -> str:
        return "deephaven.ui.elements.ContextProviderElement"

    def render(self, context: RenderContext) -> PropsType:
        self._context._push(self._value)
        get_context().add_open_cleanup(lambda: self._context._pop())

        if len(self._children) == 1:
            return {"children": self._children[0]}
        return {"children": list(self._children)}


class Context(Generic[T]):
    """
    A callable context object for sharing values through the component tree without
    explicitly passing props.
    """

    _default: T

    def __init__(self, default_value: T) -> None:
        """
        Create a new Context with the given default value.

        Args:
            default_value: The value returned by use_context when no
                provider is active.
        """
        self._default = default_value

    def _push(self, value: T) -> None:
        """
        Push a value onto this context's thread-local stack.

        Args:
            value: The context value to push.
        """
        _get_context_stack(self).append(value)

    def _pop(self) -> T:
        """
        Pop the top value from this context's thread-local stack.

        Returns:
            The value that was popped from the stack.
        """
        return _get_context_stack(self).pop()

    def _current_value(self) -> T:
        """
        Read the current context value.

        Returns:
            The value from the nearest provider up the tree, or the default
            value if no provider is active.
        """
        stack = _get_context_stack(self)
        if stack:
            return stack[-1]
        return self._default

    def __call__(self, *children: Any, value: T) -> ContextProviderElement:
        """
        Provide a context value to child elements.
        Wraps the children so that when rendered, they see the provided value.

        Args:
            value: The context value to provide.
            *children: Child elements to wrap.

        Returns:
            A ContextProviderElement wrapping the children.
        """
        return ContextProviderElement(self, value, *children)


def create_context(default_value: T) -> Context[T]:
    """
    Create a new Context with the given default value.

    Args:
        default_value: The value returned by use_context when no provider
            is active.

    Returns:
        A new Context[T] instance.
    """
    return Context(default_value)
