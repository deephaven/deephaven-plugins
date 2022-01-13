from __future__ import annotations

import json

from deephaven.plugin import Registration
from deephaven.plugin.object \
    import Exporter, ObjectType, Reference, has_object_type_plugin

__version__ = "0.0.1.dev3"


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
    def __init__(self, exporter, **kw):
        super().__init__(**kw)
        self._exporter = exporter

    def default(self, obj):
        # todo: we shouldn't have this dependencies here
        # TBD until we have a better way of doing it
        try:
            from deephaven.Plot.figure_wrapper import FigureWrapper
            import jpy
        except ModuleNotFoundError:
            FigureWrapper = None

        # todo: we should have generic unwrapping code ABC
        if isinstance(obj, FigureWrapper):
            return obj.figure

        if isinstance(obj, Node):
            if obj.is_ref:
                return self._exporter.reference(obj)
            else:
                return obj.object

        if isinstance(obj, Reference):
            return {'index': obj.index}

        if isinstance(obj, jpy.JType):
            return self._exporter.reference(obj)

        if has_object_type_plugin(obj):
            return self._exporter.reference(obj)

        return json.JSONEncoder.default(self, obj)


class JsonType(ObjectType):
    @property
    def name(self) -> str:
        return "deephaven.plugin.json"

    def is_type(self, object) -> bool:
        return isinstance(object, Node)

    def to_bytes(self, exporter: Exporter, node: Node) -> bytes:
        encoder_kw = dict(node.kw)
        encoder_cls = encoder_kw.pop('cls', Encoder)
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
