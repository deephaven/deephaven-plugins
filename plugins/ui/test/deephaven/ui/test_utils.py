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

    def test_to_camel_case(self):
        from deephaven.ui._internal.utils import to_camel_case

        self.assertEqual(to_camel_case("test_string"), "testString")
        self.assertEqual(to_camel_case("test_string_2"), "testString2")
        self.assertEqual(to_camel_case("align_items"), "alignItems")
        self.assertEqual(to_camel_case("First_Word"), "FirstWord")
        self.assertEqual(to_camel_case("first_word"), "firstWord")
        self.assertEqual(to_camel_case("alreadyCamelCase"), "alreadyCamelCase")
        self.assertEqual(to_camel_case(""), "")
        self.assertEqual(to_camel_case("UNSAFE_style"), "UNSAFEStyle")
        self.assertEqual(to_camel_case("UNSAFE_class_name"), "UNSAFEClassName")
        self.assertEqual(to_camel_case("UNSAFE_className"), "UNSAFEClassName")
        self.assertEqual(to_camel_case("unsafe_style"), "unsafeStyle")

    def test_to_camel_case_skip_unsafe(self):
        from deephaven.ui._internal.utils import to_camel_case_skip_unsafe

        self.assertEqual(to_camel_case_skip_unsafe("test_string"), "testString")
        self.assertEqual(to_camel_case_skip_unsafe("test_string_2"), "testString2")
        self.assertEqual(to_camel_case_skip_unsafe("align_items"), "alignItems")
        self.assertEqual(to_camel_case_skip_unsafe("First_Word"), "FirstWord")
        self.assertEqual(to_camel_case_skip_unsafe("first_word"), "firstWord")
        self.assertEqual(
            to_camel_case_skip_unsafe("alreadyCamelCase"), "alreadyCamelCase"
        )
        self.assertEqual(to_camel_case_skip_unsafe(""), "")
        self.assertEqual(to_camel_case_skip_unsafe("UNSAFE_style"), "UNSAFE_style")
        self.assertEqual(
            to_camel_case_skip_unsafe("UNSAFE_class_name"), "UNSAFE_className"
        )
        self.assertEqual(
            to_camel_case_skip_unsafe("UNSAFE_className"), "UNSAFE_className"
        )
        self.assertEqual(to_camel_case_skip_unsafe("unsafe_style"), "unsafeStyle")

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
        self.assertDictEqual(
            dict_to_camel_case({"foo": None, "bar": "biz"}),
            {"bar": "biz"},
        )
        self.assertDictEqual(
            dict_to_camel_case({"foo": None, "bar": "biz"}, omit_none=False),
            {"foo": None, "bar": "biz"},
        )
        self.assertDictEqual(
            dict_to_camel_case({"bar": "biz", "UNSAFE_class_name": "harry"}),
            {"bar": "biz", "UNSAFE_className": "harry"},
        )
        # Test with a function reversing the keys
        self.assertDictEqual(
            dict_to_camel_case(
                {"foo": "fiz", "bar": "biz"}, convert_key=lambda x: x[::-1]
            ),
            {"oof": "fiz", "rab": "biz"},
        )

    def test_remove_empty_keys(self):
        from deephaven.ui._internal.utils import remove_empty_keys

        self.assertDictEqual(
            remove_empty_keys({"foo": "bar", "biz": None, "baz": 0}),
            {"foo": "bar", "baz": 0},
        )


if __name__ == "__main__":
    unittest.main()
