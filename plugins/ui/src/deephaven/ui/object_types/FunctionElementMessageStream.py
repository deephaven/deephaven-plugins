from typing import List, Any
from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from ..elements import FunctionElement
from .._internal import RenderContext


class FunctionElementMessageStream(MessageStream):
    def __init__(self, element: FunctionElement, connection: MessageStream):
        self._element = element
        self._connection = connection

    def start(self) -> None:
        context = RenderContext()

        def handle_change():
            result = self._element.render(context)
            self.send_result(result)

        context.set_on_change(handle_change)
        result = self._element.render(context)
        self.send_result(result)

    def send_result(self, result) -> None:

        # Automatically promote any string and numbers to Text components automagically
        # TODO: Doesn't work? Maybe shouldn't do it anyway?
        # for item, i in enumerate(result):
        #     if isinstance(item, str):
        #         result[i] = Text(item)

        self._connection.on_data("updated".encode(), result)

    def on_close(self) -> None:
        pass

    def on_data(self, payload: bytes, references: List[Any]) -> None:
        print(f"Data received: {payload}")
