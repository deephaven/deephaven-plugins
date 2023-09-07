import unittest
import importlib.resources
import json

from typing import Optional

from deephaven.plugin.object import Exporter, Reference, find_object_type


def read_text(resource: str):
    return importlib.resources.read_text(__package__, resource)


def read_json(resource: str):
    return json.loads(read_text(resource))


class TestExporter(Exporter):
    def __init__(self):
        self._objects = []
        self._refs = []

    def reference(
        self, object, allow_unknown_type: bool = False, force_new: bool = False
    ) -> Optional[Reference]:
        if not force_new:
            ix = 0
            for o in self._objects:
                if object is o:
                    return self._refs[ix]
                ix += 1
        object_type = find_object_type(object)
        if not object_type and not allow_unknown_type:
            return None
        ref = Reference(
            len(self._refs),
            object_type.name if object_type else None,
            b"Not-Real-Server",
        )
        self._objects.append(object)
        self._refs.append(ref)
        return ref


class TestJsonPluginLocal(unittest.TestCase):
    def test_plain_python_types(self):
        from deephaven.plugin.json import Encoder
        from .plain_python_types import output

        # Exporter not needed for simple types
        actual_json = json.loads(Encoder(None).encode(output))
        expected_json = read_json("plain_python_types.json")
        self.assertEqual(actual_json, expected_json)

    def test_nested_node_types(self):
        from deephaven.plugin.json import Encoder
        from .nested_node_types import output

        actual_json = json.loads(Encoder(TestExporter()).encode(output))
        expected_json = read_json("nested_node_types.json")
        self.assertEqual(actual_json, expected_json)

    def test_nested_other_types(self):
        from deephaven.plugin.json import Encoder
        from .nested_other_types import output

        actual_json = json.loads(Encoder(TestExporter()).encode(output))
        expected_json = read_json("nested_other_types.json")
        self.assertEqual(actual_json, expected_json)

    def test_unknown_python_types(self):
        from deephaven.plugin.json import Encoder
        from .unknown_python_types import output

        actual_json = json.loads(Encoder(TestExporter()).encode(output))
        expected_json = read_json("unknown_python_types.json")
        self.assertEqual(actual_json, expected_json)


# class TestJsonPluginRemote(unittest.TestCase):
#     def execute_code(self, code: str):
#         # todo: execute code, inspect output is as expected
#         pass

#     def fetch_json_output(self):
#         return json.loads('"TODO"')

#     def check_json(self, name):
#         code = read_text(f'{name}.py')
#         expected_json = read_json(f'{name}.json')
#         self.execute_code(code)
#         output_json = self.fetch_json_output()
#         self.assertEqual(output_json, expected_json)

#     def test_plain_python_types(self):
#         self.check_json('plain_python_types')

#     def test_nested_node_types(self):
#         self.check_json('nested_node_types')

#     def test_nested_other_types(self):
#         self.check_json('nested_other_types')


if __name__ == "__main__":
    unittest.main()
