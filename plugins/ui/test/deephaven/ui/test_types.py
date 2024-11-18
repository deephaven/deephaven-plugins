import unittest

from .BaseTest import BaseTestCase


class TypesTest(BaseTestCase):
    def test_nullish_equal(self):
        from deephaven.ui.types import Null, Undefined

        self.assertEqual(Null, None)
        self.assertEqual(None, Null)
        self.assertEqual(Undefined, None)
        self.assertEqual(None, Undefined)
        self.assertEqual(Null, Undefined)
        self.assertEqual(Undefined, Null)

    def test_nullish_is(self):
        from deephaven.ui.types import Null, Undefined

        self.assertIsNot(Null, None)
        self.assertIsNot(None, Null)
        self.assertIsNot(Undefined, None)
        self.assertIsNot(None, Undefined)
        self.assertIsNot(Null, Undefined)
        self.assertIsNot(Undefined, Null)

    def test_nullish_bool(self):
        from deephaven.ui.types import Null, Undefined

        self.assertFalse(Null)
        self.assertFalse(Undefined)

    def test_nullish_init(self):
        from deephaven.ui.types import NullType, UndefinedType

        with self.assertRaises(NotImplemented):
            NullType()
        with self.assertRaises(NotImplemented):
            UndefinedType()

    def test_copy(self):
        from copy import copy, deepcopy
        from deephaven.ui.types import Null, Undefined

        self.assertIs(Null, copy(Null))
        self.assertIs(Null, deepcopy(Null))
        self.assertIs(Undefined, copy(Undefined))
        self.assertIs(Undefined, deepcopy(Undefined))


if __name__ == "__main__":
    unittest.main()
