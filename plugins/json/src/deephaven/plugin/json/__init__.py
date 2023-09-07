from __future__ import annotations

import json

from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType, Reference

__version__ = "0.0.1.dev4"


class Node:
    def __init__(self, object, is_ref=False, **kw) -> None:
        self._object = object
        self._is_ref = is_ref
        self._kw = kw

    @property
    def object(self):
        return self._object

    @property
    def kw(self):
        return self._kw

    @property
    def is_ref(self) -> bool:
        return self._is_ref

    @property
    def as_ref(self) -> Node:
        return Node(self._object, is_ref=True, **self._kw)


class Encoder(json.JSONEncoder):
    def __init__(self, exporter: Exporter, **kw):
        super().__init__(**kw)
        self._exporter = exporter

    def default(self, obj):
        if isinstance(obj, Node):
            if obj.is_ref:
                ref = self._exporter.reference(obj)
                if not ref:
                    raise RuntimeError("Unable to create reference to Node")
                return ref
            else:
                return obj.object

        if isinstance(obj, Reference):
            # Note: serializing type is extraneous,
            # but it makes our testing easier. Should
            # we provide a way to turn type serialization on/off?
            return {"type": obj.type, "index": obj.index}

        # Try to create a reference with a known type
        ref = self._exporter.reference(obj, allow_unknown_type=False)
        if ref:
            return ref

        # Try the default JSON (python) types
        try:
            return json.JSONEncoder.default(self, obj)
        except TypeError:
            pass

        # Fallback to unknown reference types
        ref = self._exporter.reference(obj, allow_unknown_type=True)
        if not ref:
            raise RuntimeError("Unable to create reference from exporter")
        return ref


class JsonType(ObjectType):
    @property
    def name(self) -> str:
        return "deephaven.plugin.json.Node"

    def is_type(self, object) -> bool:
        return isinstance(object, Node)

    def to_bytes(self, exporter: Exporter, node: Node) -> bytes:
        encoder_kw = dict(node.kw)
        encoder_cls = encoder_kw.pop("cls", Encoder)
        if issubclass(encoder_cls, Encoder):
            encoder = encoder_cls(exporter, **encoder_kw)
        else:
            # todo: should this be an error case?
            encoder = encoder_cls(**encoder_kw)
        json_text = encoder.encode(node.object)
        return str.encode(json_text)


class JsonRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Registration.Callback) -> None:
        callback.register(JsonType)
