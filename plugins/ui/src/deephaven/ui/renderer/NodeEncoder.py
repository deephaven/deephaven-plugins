from collections.abc import Iterator
import json
from typing import Any, Callable
from .RenderedNode import RenderedNode

CALLABLE_KEY = "__dh_cbid"
OBJECT_KEY = "__dh_obid"
ELEMENT_KEY = "__dh_elem"


class NodeEncoder(json.JSONEncoder):
    """
    Encode the node in JSON. Store any replaced objects and callables in their respective arrays.
    - RenderedNodes in the tree are replaced with a dict with property `ELEMENT_KEY` set to the name of the element, and props set to the props key.
    - callables in the tree are replaced with an object with property `CALLABLE_KEY` set to the index in the callables array.
    - non-serializable objects in the tree are replaced wtih an object with property `OBJECT_KEY` set to the index in the objects array.
    """

    _callable_id_prefix: str
    """
    Prefix to use for callable ids. Used to ensure callables used in stream are unique.
    """

    _callables: list[Callable]
    """
    List of callables parsed out of the document
    """

    _callable_id_dict: dict[int, int]
    """
    Dictionary from a callables id to the index in the callables array.
    """

    _objects: list[Any]
    """
    List of objects parsed out of the document
    """

    _object_id_dict: dict[int, int]
    """
    Dictionary from an objects id to the index in the objects array.
    """

    def __init__(self, *args, callable_id_prefix: str = "cb", **kwargs):
        """
        Create a new NodeEncoder.

        Args:
            *args: Arguments to pass to the JSONEncoder constructor
            callable_id_prefix: Prefix to use for callable ids. Used to ensure callables used in stream are unique.
            **kwargs: Args to pass to the JSONEncoder constructor
        """
        super().__init__(*args, **kwargs)
        self._callable_id_prefix = callable_id_prefix
        self._callables = []
        self._callable_id_dict = {}
        self._objects = []
        self._object_id_dict = {}

    def default(self, node: Any):
        if isinstance(node, RenderedNode):
            return self._convert_rendered_node(node)
        elif callable(node):
            return self._convert_callable(node)
        else:
            try:
                return super().default(node)
            except TypeError:
                # This is a non-serializable object. We'll store a reference to the object in the objects array.
                return self._convert_object(node)

    @property
    def callables(self) -> list[Callable]:
        return self._callables

    @property
    def objects(self) -> list[Any]:
        return self._objects

    def _convert_rendered_node(self, node: RenderedNode):
        result = {ELEMENT_KEY: node.name}
        if node.props is not None:
            result["props"] = node.props
        return result

    def _convert_callable(self, cb: callable):
        callable_id = id(cb)
        callable_index = self._callable_id_dict.get(callable_id, len(self._callables))
        if callable_index == len(self._callables):
            self._callables.append(cb)
            self._callable_id_dict[callable_id] = callable_index

        return {
            CALLABLE_KEY: f"{self._callable_id_prefix}{callable_index}",
        }

    def _convert_object(self, obj: Any):
        object_id = id(obj)
        object_index = self._object_id_dict.get(object_id, len(self._objects))
        if object_index == len(self._objects):
            self._objects.append(obj)
            self._object_id_dict[object_id] = object_index

        return {
            OBJECT_KEY: object_index,
        }
