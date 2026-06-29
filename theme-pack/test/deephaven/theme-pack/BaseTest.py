import unittest
from unittest.mock import patch


class BaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.setup_exporter_mock()

    @classmethod
    @patch("deephaven.plugin.object_type.Exporter")
    @patch("deephaven.plugin.object_type.Reference")
    def setup_exporter_mock(
        cls, MockExporter, MockReference
    ):  # pragma: no cover - trivial mock wiring
        cls.exporter = MockExporter()
        cls.reference = MockReference()
        cls.reference.index = 0
        cls.exporter.reference.return_value = MockReference()
