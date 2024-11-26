from __future__ import annotations

import json
from typing import Any, Callable


class EventEncoder(json.JSONEncoder):
    """
    Encode an event in JSON.
    """

    _convert_callable: Callable[[Any], Any]
    """
    Function that will be called to serialize callables.
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

    def default(self, o: Any):
        if callable(o):
            return self._convert_callable(o)
        else:
            return super().default(o)
