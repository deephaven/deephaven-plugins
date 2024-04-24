import unittest
from .BaseTest import BaseTestCase


class Test(BaseTestCase):
    def test(self):
        # since the tests use the embedded server, the import must happen after the tests start
        from deephaven import Table

        pass


if __name__ == "__main__":
    unittest.main()
