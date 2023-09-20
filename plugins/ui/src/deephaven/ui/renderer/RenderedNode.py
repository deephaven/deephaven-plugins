from typing import Any, List, Union


class RenderedNode:
    def __init__(self, name: str, children: Union[Any, List[Any]], props: dict = None):
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
    def name(self) -> str:
        return self._name

    @property
    def children(self) -> Union[Any, List[Any]]:
        return self._children

    @property
    def props(self) -> Union[dict, None]:
        return self._props
