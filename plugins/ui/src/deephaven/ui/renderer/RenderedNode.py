from __future__ import annotations
from typing import Optional
from ..elements import PropsType


class RenderedNode:
    """
    Represents the result of rendering a node.
    """

    _name: str
    _props: Optional[PropsType]

    def __init__(self, name: str, props: Optional[PropsType] = None):
        """
        Stores the result of a rendered node

        Args:
            name: The name of the node.
            props: The props of the node.
        """
        self._name = name
        self._props = props

    @property
    def name(self) -> str:
        """
        Get the name of the node.
        """
        return self._name

    @property
    def props(self) -> Optional[PropsType]:
        """
        Get the props of the node.
        """
        return self._props
