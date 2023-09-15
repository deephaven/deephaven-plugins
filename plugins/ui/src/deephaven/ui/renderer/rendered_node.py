from typing import Any, List


class RenderedNode:
    def __init__(self, name: str, children: List[Any], props: dict = None):
        """
        Stores the result of a rendered node

        Args:
            name: The name of the node
            children: The children of the node
            props: The props of the node. Exported with the node.
        """
        self._name = name
        self._children = children
        self._props = props

    @property
    def name(self):
        return self._name

    @property
    def children(self):
        return self._children

    @property
    def props(self):
        return self._props
