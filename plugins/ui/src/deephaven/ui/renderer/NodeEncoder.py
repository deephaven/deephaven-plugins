from __future__ import annotations

import json
from typing import Any, Callable
from weakref import WeakKeyDictionary
from .RenderedNode import RenderedNode

CALLABLE_KEY = "__dhCbid"
OBJECT_KEY = "__dhObid"
ELEMENT_KEY = "__dhElemName"

DEFAULT_CALLABLE_ID_PREFIX = "cb"

# IDs for callables are prefixes with a string and then use the `id` of the callable itself
CallableId = str

# IDs for objects is just an incrementing ID. We should only send new exported objects with each render
ObjectId = int


class NodeEncoder(json.JSONEncoder):
    """
    Encode the node in JSON. Store any replaced objects and callables in their respective arrays.
    - RenderedNodes in the tree are replaced with a dict with property `ELEMENT_KEY` set to the name of the element, and props set to the props key.
    - callables in the tree are replaced with an object with property `CALLABLE_KEY` set to the index in the callables array.
    - non-serializable objects in the tree are replaced wtih an object with property `OBJECT_KEY` set to the index in the objects array.
    """

    _next_callable_id: int
    """
    Prefix to use for callable ids. Used to ensure callables used in stream are unique.
    """

    _callable_dict: WeakKeyDictionary[Callable[..., Any], str]
    """
    Dictionary from a callable to the ID assigned to the callable.
    """

    _new_objects: list[Any]
    """
    List of objects parsed out of the most recently encoded document.
    """

    _next_object_id: int
    """
    The next object id to use. Increment for each new object encountered.
    """

    _object_id_dict: WeakKeyDictionary[Any, int]
    """
    Dictionary from an object to the ID assigned to it
    """

    def __init__(
        self,
        callable_id_prefix: str = DEFAULT_CALLABLE_ID_PREFIX,
        *args: Any,
        **kwargs: Any,
    ):
        """
        Create a new NodeEncoder.

        Args:
            *args: Arguments to pass to the JSONEncoder constructor
            **kwargs: Args to pass to the JSONEncoder constructor
        """
        super().__init__(*args, **kwargs)
        self._callable_id_prefix = callable_id_prefix
        self._next_callable_id = 0
        self._callable_dict = WeakKeyDictionary()
        self._new_objects = []
        self._next_object_id = 0
        self._object_id_dict = WeakKeyDictionary()

    def default(self, o: Any):
        if isinstance(o, RenderedNode):
            return self._convert_rendered_node(o)
        elif callable(o):
            return self._convert_callable(o)
        else:
            try:
                return super().default(o)
            except TypeError:
                # This is a non-serializable object. We'll store a reference to the object in the objects array.
                return self._convert_object(o)

    def encode(self, o: Any) -> str:
        self._new_objects = []
        return super().encode(o)

    @property
    def callable_dict(self) -> WeakKeyDictionary[Callable[..., Any], str]:
        return self._callable_dict

    @property
    def new_objects(self) -> list[Any]:
        return self._new_objects

    def _convert_rendered_node(self, node: RenderedNode):
        result: dict[str, Any] = {ELEMENT_KEY: node.name}
        if node.props is not None:
            result["props"] = node.props
        return result

    def _convert_callable(self, cb: Callable[..., Any]):
        callable_id = self._callable_dict.get(cb)
        if callable_id == None:
            callable_id = f"{self._callable_id_prefix}{self._next_callable_id}"
            self._next_callable_id += 1
            self._callable_dict[cb] = callable_id

        return {
            CALLABLE_KEY: callable_id,
        }

    def _convert_object(self, obj: Any):
        object_id = self._object_id_dict.get(obj)
        if object_id == None:
            object_id = self._next_object_id
            self._next_object_id += 1
            self._object_id_dict[obj] = object_id
            self._new_objects.append(obj)

        return {
            OBJECT_KEY: object_id,
        }
