from __future__ import annotations
import logging
from typing import Callable, Optional

from .Element import Element, PropsType
from .._internal import dict_shallow_equal, RenderContext

logger = logging.getLogger(__name__)


class MemoizedElement(Element):
    _element: Element
    _props: PropsType
    _are_props_equal: Callable[[PropsType, PropsType], bool]

    def __init__(
        self,
        element: Element,
        props: PropsType,
        are_props_equal: Callable[[PropsType, PropsType], bool],
    ):
        """
        Create an element that takes a function to render.

        Args:
            element: The element to memoize.
            props: The props of the element.
            are_props_equal: A function that takes the previous props and the next props and returns whether they are equal. If the props are equal, the component will not re-render. If the props are not equal, the component will re-render. This is used to optimize performance by preventing unnecessary re-renders of components that are expensive to render.
        """
        self._element = element
        self._props = props
        self._are_props_equal = are_props_equal

    @property
    def name(self):
        return self._element.name

    @property
    def key(self) -> str | None:
        return self._element.key

    @property
    def props(self) -> PropsType:
        return self._props

    def are_props_equal(self, prev_props: PropsType) -> bool:
        """
        Check if the props are equal using the are_props_equal function.

        Args:
            prev_props: The previous props to check against the current props.
        Returns:
            True if the props are equal, False otherwise.
        """
        return self._are_props_equal(prev_props, self._props)

    def render(self) -> PropsType:
        """
        Render the component. Should only be called when actually rendering the component, e.g. exporting it to the client.

        Returns:
            The props of this element.
        """
        return self._element.render()
