import unittest
from .BaseTest import BaseTestCase


class TestThemePack(BaseTestCase):
    def test_noop(self):
        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
