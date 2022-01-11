import json
import base64

from deephaven.plugin import Registration
from deephaven.plugin.object import Exporter, ObjectType, Reference

__version__ = "0.0.1.dev2"


class Node:
    def __init__(self, object, **kw) -> None:
        self._object = object
        self._kw = kw

    @property
    def object(self):
        return self._object

    @property
    def kw(self):
        return self._kw


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
            _JTable = jpy.get_type('io.deephaven.engine.table.Table')
            _JFigure = jpy.get_type('io.deephaven.plot.Figure')
        except ModuleNotFoundError:
            FigureWrapper = None
            _JTable = None
            _JFigure = None

        if isinstance(obj, Node):
            return {
                "type": "Node",
                "ref": self._exporter.new_server_side_reference(obj)}
        if isinstance(obj, _JTable):
            return {
                "type": "Table",
                "ref": self._exporter.new_server_side_reference(obj)}
        if isinstance(obj, _JFigure):
            # todo: should this be a plugin lookup?
            return {
                "type": "Figure",
                "ref": self._exporter.new_server_side_reference(obj)}
        if isinstance(obj, FigureWrapper):
            # todo: proper unwrap common code
            return obj.figure
        if isinstance(obj, Reference):
            # todo, try and get int id instead?
            return str(base64.standard_b64encode(obj.id), 'ASCII')
        return json.JSONEncoder.default(self, obj)


class JsonType(ObjectType):
    @property
    def name(self) -> str:
        return "json"

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
