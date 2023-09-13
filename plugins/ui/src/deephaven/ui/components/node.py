import logging
from typing import List, Any
from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from ..render import RenderContext
from ..utils import get_component_name

logger = logging.getLogger(__name__)


class UINode:
    def __init__(self, component_type, render):
        """
        Create a component node.

        Args:
            component_type: Type of the component. Typically, the module joined with the name of the function.
            render: The render function to call when the component needs to be rendered.
        """
        self._type = component_type
        self._render = render

    def render(self, context: RenderContext, render_deep=True):
        """
        Render the component.

        Args:
            context: The context to render the component in.
            render_deep: Whether to render the component's children.

        Returns:
            The rendered component.
        """

        def render_child(child, child_context):
            if isinstance(child, UINode):
                return child.render(child_context, render_deep)
            else:
                return child

        logger.debug("ComponentNode.render")

        result = self._render(context)

        if render_deep:
            # Array of children returned, render them all
            if isinstance(result, list):
                result = [
                    render_child(child, context.get_child_context(i))
                    for i, child in enumerate(result)
                ]
            else:
                result = render_child(result, context.get_child_context(0))
        return result

    @property
    def type(self):
        return self._type


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
        # Make it an array if it's not already.
        # TODO: Should we do this? Probably should just return one single component
        if not isinstance(result, list):
            result = [result]

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
