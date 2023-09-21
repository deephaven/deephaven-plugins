from typing import Any, List, Union


class RenderedNode:
    def __init__(self, name: str, props: dict = None):
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
        return self._name

    @property
    def props(self) -> Union[dict, None]:
        return self._props
