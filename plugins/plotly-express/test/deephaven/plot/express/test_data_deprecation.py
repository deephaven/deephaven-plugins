import unittest
import warnings

from .BaseTest import BaseTestCase


class DataDeprecationTestCase(BaseTestCase):
    def test_data_forwards_with_warning(self):
        from deephaven import sample_data
        from deephaven.plot import express as dx

        for name in sample_data.__all__:
            with self.subTest(name=name):
                with self.assertWarns(DeprecationWarning) as cm:
                    value = getattr(dx.data, name)
                self.assertIs(value, getattr(sample_data, name))
                self.assertIn("deephaven.sample_data", str(cm.warning))

    def test_from_import_warns(self):
        from deephaven import sample_data

        with self.assertWarns(DeprecationWarning):
            from deephaven.plot.express.data import iris
        self.assertIs(iris, sample_data.iris)

    def test_data_generators_forwards_with_warning(self):
        from deephaven import sample_data
        from deephaven.plot import express as dx

        with self.assertWarns(DeprecationWarning):
            stocks = dx.data.data_generators.stocks
        self.assertIs(stocks, sample_data.stocks)

        with self.assertWarns(DeprecationWarning):
            from deephaven.plot.express.data.data_generators import SECOND
        self.assertEqual(SECOND, 1_000_000_000)

    def test_module_access_does_not_warn(self):
        from deephaven.plot import express as dx

        with warnings.catch_warnings():
            warnings.simplefilter("error", DeprecationWarning)
            self.assertIn("iris", dir(dx.data))
            self.assertIn("stocks", dir(dx.data.data_generators))

    def test_unknown_attribute_raises(self):
        from deephaven.plot import express as dx

        with self.assertRaises(AttributeError):
            dx.data.not_a_dataset
        with self.assertRaises(AttributeError):
            dx.data.data_generators.not_a_dataset


if __name__ == "__main__":
    unittest.main()
