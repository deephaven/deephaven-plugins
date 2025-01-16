import unittest

from .BaseTest import BaseTestCase


class TypesTest(BaseTestCase):
    def test_nullish_equivalences(self):
        from deephaven.ui.types import Undefined

        self.assertEqual(Undefined, None)
        self.assertEqual(None, Undefined)

        self.assertIsNot(Undefined, None)
        self.assertIsNot(None, Undefined)

    def test_nullish_bool(self):
        from deephaven.ui.types import Undefined

        self.assertFalse(Undefined)

    def test_nullish_init(self):
        from deephaven.ui.types import UndefinedType

        with self.assertRaises(NotImplementedError):
            UndefinedType()

    def test_copy(self):
        from copy import copy, deepcopy
        from deephaven.ui.types import Undefined

        self.assertIs(Undefined, copy(Undefined))
        self.assertIs(Undefined, deepcopy(Undefined))


if __name__ == "__main__":
    unittest.main()
