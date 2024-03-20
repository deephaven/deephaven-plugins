import unittest
import importlib.resources
import json
import sys

from deephaven.plugin.json import Encoder
from deephaven.plugin.object_type import Exporter, Reference


def read_text(resource: str):
    if sys.version_info < (3, 9):
        # Need to use legacy behaviour on Python < 3.9
        return importlib.resources.read_text(__package__, resource)
    return importlib.resources.files(__package__).joinpath(resource).read_bytes()


def read_json(resource: str):
    return json.loads(read_text(resource))


class TestExporter(Exporter):
    def __init__(self):
        self._objects = []
        self._refs = []

    def reference(self, object) -> Reference:
        ref = Reference(len(self._refs), None)
        self._objects.append(object)
        self._refs.append(ref)
        return ref


class TestJsonPluginLocal(unittest.TestCase):
    def test_plain_python_types(self):
        from .plain_python_types import output

        # Exporter not needed for simple types
        actual_json = json.loads(Encoder(None).encode(output))
        expected_json = read_json("plain_python_types.json")
        self.assertEqual(actual_json, expected_json)

    def test_nested_node_types(self):
        from .nested_node_types import output

        actual_json = json.loads(Encoder(TestExporter()).encode(output))
        expected_json = read_json("nested_node_types.json")
        self.assertEqual(actual_json, expected_json)

    def test_unknown_python_types(self):
        from .unknown_python_types import output

        actual_json = json.loads(Encoder(TestExporter()).encode(output))
        expected_json = read_json("unknown_python_types.json")
        self.assertEqual(actual_json, expected_json)


if __name__ == "__main__":
    unittest.main()
