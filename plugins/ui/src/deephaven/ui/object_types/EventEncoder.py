from __future__ import annotations

from typing import Any, Callable
from .._internal.utils import transform_node


class EventEncoder:
    """
    Encode an event in JSON.
    """

    def __init__(
        self,
        convert_callable: Callable[[Any], Any],
        *args: Any,
        **kwargs: Any,
    ):
        """
        Create a new EventEncoder.

        Args:
            convert_callable: A function that will be called to serialize callables
            *args: Arguments to pass to the JSONEncoder constructor
            **kwargs: Args to pass to the JSONEncoder constructor
        """
        super().__init__(*args, **kwargs)
        self._convert_callable = convert_callable

    def transform_node(self, key: str, value: Any):
        if callable(value):
            return self._convert_callable(value)
        else:
            return value

    def encode(self, o: Any):
        """
        Encode the event.
        """
        return transform_node(o, self.transform_node)
