from __future__ import annotations

import logging
from typing import Any, Callable, TypedDict
from weakref import WeakKeyDictionary
from .RenderedNode import RenderedNode
from .._internal.utils import transform_node, is_primitive, is_iterable

logger = logging.getLogger(__name__)

CALLABLE_KEY = "__dhCbid"
OBJECT_KEY = "__dhObid"
ELEMENT_KEY = "__dhElemName"

DEFAULT_CALLABLE_ID_PREFIX = "cb"

# IDs for callables are a string of a callable prefix set and an incrementing ID
CallableId = str

# IDs for objects is just an incrementing ID. We should only send new exported objects with each render
ObjectId = int


class NodeEncoderResult(TypedDict):
    """
    Result of encoding a node - replaces non-serializable items in a dictionary in place with a serializable equivalent.
    Contains the encoded node, set of new objects, and callables dictionary.
    """

    encoded_node: dict[str, Any]
    """
    The encoded node.
    """

    new_objects: list[Any]
    """
    The list of new objects.
    """

    callable_id_dict: WeakKeyDictionary[Callable[..., Any], CallableId]
    """
    Dictionary from a callable to the ID assigned to the callable.
    """


class NodeEncoder:
    """
    Encode the node in a serializable dictionary. Store any replaced objects and callables in their respective arrays.
    - RenderedNodes in the tree are replaced with a dict with property `ELEMENT_KEY` set to the name of the element, and props set to the props key.
    - callables in the tree are replaced with an object with property `CALLABLE_KEY` set to the index in the callables array.
    - non-serializable objects in the tree are replaced wtih an object with property `OBJECT_KEY` set to the index in the objects array.
    """

    _callable_id_prefix: str
    """
    Prefix to use for callable ids.
    """

    _next_callable_id: int
    """
    Incrementing ID that is used to assign IDs to callables. Needs to be prefixed with the `_callable_id_prefix` to get an ID.
    """

    _callable_dict: WeakKeyDictionary[Callable[..., Any], CallableId]
    """
    Dictionary from a callable to the ID assigned to the callable so we know which
    callables we've seen before, to avoid unnecessarily creating new callableIds.
    """

    _new_objects: list[Any]
    """
    List of objects parsed out of the most recently encoded document.
    """

    _next_object_id: int
    """
    The next object id to use. Increment for each new object encountered.
    """

    _old_objects: set[int]
    """
    List of object python IDs from the last render. Used to remove objects that are no longer in the document.
    """

    _object_id_dict: dict[int, tuple[int, Any]]
    """
    Dictionary from a python ID to the ID assigned to it and the associated object.
    Objects are removed after the next render if they are no longer in the document.
    Unlike `_callable_dict`, we cannot use a WeakKeyDictionary as we need to pass the exported object instance to the client, so we need to always keep a reference around that the client may still have a reference to.
    """

    def __init__(
        self,
        callable_id_prefix: str = DEFAULT_CALLABLE_ID_PREFIX,
    ):
        """
        Create a new NodeEncoder.

        Args:
            callable_id_prefix: Prefix to use for callable ids. Used to ensure callables used in stream are unique.
        """
        self._callable_id_prefix = callable_id_prefix
        self._next_callable_id = 0
        self._callable_dict = WeakKeyDictionary()
        self._new_objects = []
        self._next_object_id = 0
        self._object_id_dict = {}

    def encode_node(self, node: RenderedNode) -> NodeEncoderResult:
        """
        Encode the document, and return the encoded document and the list of new objects.

        Args:
            o: The document to encode
        """

        # Reset the new objects list - they will get set when encoding
        self._new_objects = []
        self._old_objects = set(self._object_id_dict.keys())

        logger.debug("Encoding node with object_id_dict: %s", self._object_id_dict)

        encoded_node = transform_node(node, self._transform_node)

        # Remove the old objects from last render from the object id dict
        for py_id in self._old_objects:
            self._object_id_dict.pop(py_id, None)

        return {
            "encoded_node": encoded_node,
            "new_objects": self._new_objects,
            "callable_id_dict": self._callable_dict,
        }

    def _transform_node(self, key: str, value: Any):
        if isinstance(value, RenderedNode):
            return self._convert_rendered_node(value)
        elif callable(value):
            return self._convert_callable(value)
        elif is_primitive(value) or is_iterable(value):
            # This is an iterable object, we'll have already converted the children.
            return value
        # This is a non-serializable object. We'll store a reference to the object in the objects array.
        return self._convert_object(value)

    def _convert_rendered_node(self, node: RenderedNode):
        result: dict[str, Any] = {ELEMENT_KEY: node.name}
        if node.props is not None:
            result["props"] = transform_node(node.props, self._transform_node)
        return result

    def _convert_callable(self, cb: Callable[..., Any]):
        callable_id = self._callable_dict.get(cb)
        if callable_id is None:
            callable_id = f"{self._callable_id_prefix}{self._next_callable_id}"
            self._next_callable_id += 1
            self._callable_dict[cb] = callable_id

        return {
            CALLABLE_KEY: callable_id,
        }

    def _convert_object(self, obj: Any):
        # it's possible that an object is not hashable, so use the id
        py_id = id(obj)

        obj_info = self._object_id_dict.get(py_id)
        if obj_info is None:
            object_id = self._next_object_id
            self._next_object_id += 1
            self._object_id_dict[py_id] = (object_id, obj)
            self._new_objects.append(obj)
        else:
            object_id, _ = obj_info

        self._old_objects.discard(py_id)
        logger.debug("Converted object %s to id %s", obj, object_id)

        return {
            OBJECT_KEY: object_id,
        }
