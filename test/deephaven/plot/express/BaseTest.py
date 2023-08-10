import unittest
from unittest.mock import patch

from deephaven_server import Server

class BaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.s = Server(port=10000, jvm_args=["-Xmx4g"])
        cls.s.start()

        # these mocks need to be setup after the deephaven server is
        # initialized because they access the deephaven namespace
        cls.setup_exporter_mock()

    @classmethod
    @patch('deephaven.plugin.object_type.Exporter')
    @patch('deephaven.plugin.object_type.Reference')
    def setup_exporter_mock(cls, MockExporter, MockReference):
        cls.exporter = MockExporter()
        cls.reference = MockReference()

        cls.reference._index = 0
        cls.exporter.reference.return_value = MockReference()

if __name__ == '__main__':
    unittest.main()
