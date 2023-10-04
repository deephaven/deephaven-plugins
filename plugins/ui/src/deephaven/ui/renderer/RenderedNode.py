class RenderedNode:
    """
    Represents the result of rendering a node.
    """

    _name: str
    _props: dict | None

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
        """
        Get the name of the node.
        """
        return self._name

    @property
    def props(self) -> dict | None:
        """
        Get the props of the node.
        """
        return self._props
