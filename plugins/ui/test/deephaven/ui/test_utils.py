import unittest
from .BaseTest import BaseTestCase


def my_test_func():
    raise Exception("should not be called")


class UtilsTest(BaseTestCase):
    def test_get_component_name(self):
        from deephaven.ui._internal.utils import get_component_name

        self.assertEqual(
            get_component_name(my_test_func),
            "test.deephaven.ui.test_utils.my_test_func",
        )

    def test_verify_component_names(self):
        from deephaven.ui import text_field
        from deephaven.ui._internal.utils import get_component_name

        def verify_component(component, expected_name):
            self.assertEqual(get_component_name(component), expected_name)

        verify_component(text_field, "deephaven.ui.components.text_field.text_field")

    def test_to_camel_case(self):
        from deephaven.ui._internal.utils import to_camel_case

        self.assertEqual(to_camel_case("test_string"), "testString")
        self.assertEqual(to_camel_case("test_string_2"), "testString2")
        self.assertEqual(to_camel_case("align_items"), "alignItems")
        self.assertEqual(to_camel_case("First_Word"), "FirstWord")
        self.assertEqual(to_camel_case("first_word"), "firstWord")
        self.assertEqual(to_camel_case("alreadyCamelCase"), "alreadyCamelCase")
        self.assertEqual(to_camel_case(""), "")

    def test_dict_to_camel_case(self):
        from deephaven.ui._internal.utils import dict_to_camel_case

        self.assertDictEqual(
            dict_to_camel_case({"test_string": "foo", "test_string_2": "bar_biz"}),
            {"testString": "foo", "testString2": "bar_biz"},
        )
        self.assertDictEqual(
            dict_to_camel_case({"alreadyCamelCase": "foo", "align_items": "bar"}),
            {"alreadyCamelCase": "foo", "alignItems": "bar"},
        )

    def test_remove_empty_keys(self):
        from deephaven.ui._internal.utils import remove_empty_keys

        self.assertDictEqual(
            remove_empty_keys({"foo": "bar", "biz": None, "baz": 0}),
            {"foo": "bar", "baz": 0},
        )


if __name__ == "__main__":
    unittest.main()
