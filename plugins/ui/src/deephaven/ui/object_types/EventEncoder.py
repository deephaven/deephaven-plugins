from __future__ import annotations

from typing import Any, Callable
from .._internal.utils import transform_node


class EventEncoder:
    """
    Encode an event in a serializable dictionary.
    """

    _convert_callable: Callable[[Any], Any]
    """
    Function that will be called to serialize callables.
    """

    def __init__(self, convert_callable: Callable[[Any], Any]):
        """
        Create a new EventEncoder.

        Args:
            convert_callable: A function that will be called to serialize callables
        """
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
