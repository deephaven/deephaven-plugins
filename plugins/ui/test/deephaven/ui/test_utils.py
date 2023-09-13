import unittest
from .BaseTest import BaseTestCase


def my_test_func():
    raise Exception("should not be called")


class UtilsTest(BaseTestCase):
    def test_get_component_name(self):
        from deephaven.ui.utils import get_component_name

        self.assertEqual(
            get_component_name(my_test_func),
            "test.deephaven.ui.test_utils.my_test_func",
        )

    def test_verify_component_names(self):
        from deephaven.ui.components import text_field, text
        from deephaven.ui.utils import get_component_name

        def verify_component(component, expected_name):
            self.assertEqual(get_component_name(component), expected_name)

        verify_component(text_field, "deephaven.ui.components.text_field")
        verify_component(text, "deephaven.ui.components.text")


if __name__ == "__main__":
    unittest.main()
