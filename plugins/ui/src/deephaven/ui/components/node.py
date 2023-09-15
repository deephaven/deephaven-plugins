from typing import List, Any
from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from .._internal import RenderContext, get_component_name


class UINode:
    def __init__(self, name: str, render):
        """
        Create a component node.

        Args:
            name: Name of the component. Typically, the module joined with the name of the function.
            render: The render function to call when the component needs to be rendered.
        """
        self._name = name
        self._render = render

    @property
    def render(self):
        return self._render

    @property
    def name(self):
        return self._name


class UINodeMessageStream(MessageStream):
    def __init__(self, node: UINode, connection: MessageStream):
        self._node = node
        self._connection = connection

    def start(self) -> None:
        context = RenderContext()

        def handle_change():
            result = self._node.render(context)
            self.send_result(result)

        context.set_on_change(handle_change)
        result = self._node.render(context)
        self.send_result(result)

    def send_result(self, result) -> None:

        # Automatically promote any strings to Text components automagically
        # TODO: Doesn't work? Maybe shouldn't do it anyway?
        # for item, i in enumerate(result):
        #     if isinstance(item, str):
        #         result[i] = Text(item)

        self._connection.on_data("updated".encode(), result)

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        print(f"Data received: {payload}")


class UINodeType(BidirectionalObjectType):
    @property
    def name(self) -> str:
        return get_component_name(UINode)

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, UINode)

    def create_client_connection(self, obj: UINode, connection: MessageStream):
        client_connection = UINodeMessageStream(obj, connection)
        client_connection.start()
        return client_connection
