from __future__ import annotations

import json
import functools

from deephaven.plugin import Registration, Callback, object_type


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


class CachedExporter:
    def __init__(self, exporter: object_type.Exporter) -> None:
        self._exporter = exporter

    @functools.lru_cache(maxsize=None)
    def reference(self, obj) -> object_type.Reference:
        return self._exporter.reference(obj)


class Encoder(json.JSONEncoder):
    def __init__(self, exporter: object_type.Exporter, **kw):
        super().__init__(**kw)
        self._exporter = CachedExporter(exporter)

    def default(self, obj):
        if isinstance(obj, Node):
            return self._exporter.reference(obj) if obj.is_ref else obj.object

        if isinstance(obj, object_type.Reference):
            return {"ref": obj.index}

        # Try the default JSON (python) types
        try:
            return json.JSONEncoder.default(self, obj)
        except TypeError:
            pass

        return self._exporter.reference(obj)


class JsonType(object_type.FetchOnlyObjectType):
    @property
    def name(self) -> str:
        return "deephaven.plugin.json.Node"

    def is_type(self, object) -> bool:
        return isinstance(object, Node)

    def to_bytes(self, exporter: object_type.Exporter, node: Node) -> bytes:
        encoder_kw = dict(node.kw)
        encoder_cls = encoder_kw.pop("cls", Encoder)
        if issubclass(encoder_cls, Encoder):
            encoder = encoder_cls(exporter, **encoder_kw)
        else:
            # todo: should this be an error case?
            encoder = encoder_cls(**encoder_kw)
        json_text = encoder.encode(node)
        return str.encode(json_text)


class JsonRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        callback.register(JsonType)
