from collections.abc import Iterator
import json
from typing import Any
from .RenderedNode import RenderedNode


class NodeEncoder(json.JSONEncoder):
    """
    Encode the node in JSON. Store any replaced objects and callables in their respective arrays.
    - RenderedNodes in the tree are replaced with a dict with property "__dh_elem" set to the name of the element, and props set to the props key.
    - callables in the tree are replaced with an object with property "__dh_cbid" set to the index in the callables array.
    - non-serializable objects in the tree are replaced wtih an object with property "__dh_obid" set to the index in the objects array.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._callables = []
        self._objects = []

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
    def callables(self):
        return self._callables

    @property
    def objects(self):
        return self._objects

    def _convert_rendered_node(self, node: RenderedNode):
        result = {"__dh_elem": node.name}
        if node.props is not None:
            result["props"] = node.props
        return result

    def _convert_callable(self, cb: callable):
        callable_id = None

        try:
            # Reference an existing callable if it's already in the array
            callable_id = self._callables.index(cb)
        except ValueError:
            # Add it to the array and reference it
            callable_id = len(self._callables)
            self._callables.append(cb)

        return {
            "__dh_cbid": callable_id,
        }

    def _convert_object(self, obj: Any):
        object_id = None

        try:
            # Reference an existing object if it's already in the array
            object_id = self._objects.index(obj)
        except ValueError:
            # Add it to the array and reference it
            object_id = len(self._objects)
            self._objects.append(obj)

        return {
            "__dh_obid": object_id,
        }
