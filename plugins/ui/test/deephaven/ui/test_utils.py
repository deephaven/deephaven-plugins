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

    def test_to_react_prop_case(self):
        from deephaven.ui._internal.utils import to_react_prop_case

        self.assertEqual(to_react_prop_case("test_string"), "testString")
        self.assertEqual(to_react_prop_case("test_string_2"), "testString2")
        self.assertEqual(to_react_prop_case("align_items"), "alignItems")
        self.assertEqual(to_react_prop_case("First_Word"), "FirstWord")
        self.assertEqual(to_react_prop_case("first_word"), "firstWord")
        self.assertEqual(to_react_prop_case("alreadyCamelCase"), "alreadyCamelCase")
        self.assertEqual(to_react_prop_case(""), "")
        self.assertEqual(to_react_prop_case("UNSAFE_style"), "UNSAFE_style")
        self.assertEqual(to_react_prop_case("UNSAFE_class_name"), "UNSAFE_className")
        self.assertEqual(to_react_prop_case("UNSAFE_className"), "UNSAFE_className")
        self.assertEqual(to_react_prop_case("unsafe_style"), "unsafeStyle")
        self.assertEqual(to_react_prop_case("aria_expanded"), "aria-expanded")
        self.assertEqual(to_react_prop_case("aria_labelledby"), "aria-labelledby")

    def test_convert_dict_keys(self):
        from deephaven.ui._internal.utils import convert_dict_keys

        # Test with a function reversing the keys
        self.assertDictEqual(
            convert_dict_keys(
                {"foo": "fiz", "bar": "biz"}, convert_key=lambda x: x[::-1]
            ),
            {"oof": "fiz", "rab": "biz"},
        )

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
            dict_to_camel_case({"foo": "bar"}),
            {"foo": "bar"},
        )
        self.assertDictEqual(
            dict_to_camel_case({"bar": "biz", "UNSAFE_class_name": "harry"}),
            {"bar": "biz", "UNSAFEClassName": "harry"},
        )
        # Test leading/trailing underscore
        self.assertDictEqual(
            dict_to_camel_case(
                {"foo_": "bar", "_baz": "biz", "__youre_a_wizard__": "Harry"}
            ),
            {"foo_": "bar", "_baz": "biz", "__youreAWizard__": "Harry"},
        )

    def test_dict_to_react_props(self):
        from deephaven.ui._internal.utils import dict_to_react_props

        self.assertDictEqual(
            dict_to_react_props({"test_string": "foo", "test_string_2": "bar_biz"}),
            {"testString": "foo", "testString2": "bar_biz"},
        )
        self.assertDictEqual(
            dict_to_react_props({"alreadyCamelCase": "foo", "align_items": "bar"}),
            {"alreadyCamelCase": "foo", "alignItems": "bar"},
        )
        self.assertDictEqual(
            dict_to_react_props({"foo": None, "bar": "biz"}),
            {"bar": "biz"},
        )
        self.assertDictEqual(
            dict_to_react_props(
                {"bar": "biz", "UNSAFE_class_name": "harry", "aria_label": "ron"}
            ),
            {"bar": "biz", "UNSAFE_className": "harry", "aria-label": "ron"},
        )
        # Test trailing underscore
        self.assertDictEqual(
            dict_to_react_props(
                {"foo_": "bar", "_baz": "biz", "__youre_a_wizard__": "Harry"}
            ),
            {"foo_": "bar", "_baz": "biz", "__youreAWizard__": "Harry"},
        )

    def test_remove_empty_keys(self):
        from deephaven.ui._internal.utils import remove_empty_keys
        from deephaven.ui.types import Undefined

        self.assertDictEqual(
            remove_empty_keys({"foo": "bar", "biz": None, "baz": 0}),
            {"foo": "bar", "baz": 0},
        )
        self.assertDictEqual(
            remove_empty_keys(
                {
                    "foo": "bar",
                    "biz": None,
                    "baz": 0,
                    "is_undefined": Undefined,
                },
                _nullable_props={"is_undefined"},
            ),
            {"foo": "bar", "baz": 0},
        )
        self.assertDictEqual(
            remove_empty_keys(
                {
                    "foo": "bar",
                    "biz": None,
                    "baz": 0,
                    "is_undefined": Undefined,
                },
                _nullable_props={"biz", "is_undefined"},
            ),
            {"foo": "bar", "biz": None, "baz": 0},
        )

        with self.assertRaises(ValueError) as err:
            remove_empty_keys(
                {
                    "foo": "bar",
                    "biz": None,
                    "baz": 0,
                    "is_undefined": Undefined,
                }
            )
        self.assertEqual(
            str(err.exception),
            "UndefinedType found in a non-nullable prop.",
        )

    def test_wrap_callable(self):
        from deephaven.ui._internal.utils import wrap_callable

        result = None

        def test_func_with_no_args():
            nonlocal result
            result = 42

        wrapped = wrap_callable(test_func_with_no_args)

        wrapped()
        self.assertEqual(result, 42)
        result = None

        wrapped("event", ignored="metadata")
        self.assertEqual(result, 42)
        result = None

        def test_func_with_arg(a):
            nonlocal result
            result = a

        wrapped = wrap_callable(test_func_with_arg)

        wrapped(3, "event", ignored="metadata")
        self.assertEqual(result, 3)
        result = None

        def test_func_with_multiple_args(a, b=1):
            nonlocal result
            result = a + b

        wrapped = wrap_callable(test_func_with_multiple_args)

        wrapped(2)
        self.assertEqual(result, 3)
        result = None

        wrapped(b=2, a=2)
        self.assertEqual(result, 4)
        result = None

        wrapped(2, 3, "event", ignored="metadata")
        self.assertEqual(result, 5)
        result = None

        def test_func_with_positional_arg(a, /):
            nonlocal result
            result = a

        wrapped = wrap_callable(test_func_with_positional_arg)

        wrapped(3)
        self.assertEqual(result, 3)
        result = None

        wrapped(3, "event", ignored="metadata")
        self.assertEqual(result, 3)
        result = None

        def test_func_with_positional_arg(a, b=1, /):
            nonlocal result
            result = a + b

        wrapped = wrap_callable(test_func_with_positional_arg)

        wrapped(2)
        self.assertEqual(result, 3)
        result = None

        wrapped(2, 2)
        self.assertEqual(result, 4)
        result = None

        wrapped(2, 3, "event", ignored="metadata")
        self.assertEqual(result, 5)
        result = None

        def test_func_with_kw_only_args(*args, a, b=1):
            nonlocal result
            result = args[0] + a + b

        wrapped = wrap_callable(test_func_with_kw_only_args)

        wrapped(3, a=2)
        self.assertEqual(result, 6)
        result = None

        wrapped(3, a=2, b=4)
        self.assertEqual(result, 9)
        result = None

        wrapped(3, b=1, a=4, ignored="metadata")
        self.assertEqual(result, 8)
        result = None

        def test_func_with_args(a, /, b, c=1):
            nonlocal result
            result = a + b + c

        wrapped = wrap_callable(test_func_with_args)

        wrapped(1, 2)
        self.assertEqual(result, 4)
        result = None

        wrapped(1, c=3, b=4)
        self.assertEqual(result, 8)
        result = None

        wrapped(1, 2, 3, "event", ignored="metadata")
        self.assertEqual(result, 6)
        result = None

        def test_func_with_all_args(a, /, b, *args, c=1, **kwargs):
            nonlocal result
            result = a + b + args[0] + c + kwargs["d"]

        wrapped = wrap_callable(test_func_with_all_args)

        wrapped(1, 2, 3, d=1)
        self.assertEqual(result, 8)
        result = None

        wrapped(1, 2, 3, "event", d=1, c=2, ignored="metadata")
        self.assertEqual(result, 9)

        # Test that wrapping a function without a signature doesn't throw an error
        wrapped = wrap_callable(print)

    def test_create_props(self):
        from deephaven.ui._internal.utils import create_props

        children1, props1 = create_props(
            {
                "foo": "bar",
                "baz": 42,
                "fizz": "buzz",
            }
        )

        self.assertEqual(children1, tuple())
        self.assertDictEqual(
            props1,
            {
                "foo": "bar",
                "baz": 42,
                "fizz": "buzz",
            },
        )

        children2, props2 = create_props(
            {
                "children": ["item1", "item2"],
                "test": "value",
                "props": {
                    "foo": "bar",
                    "baz": 42,
                    "fizz": "buzz",
                },
            }
        )

        self.assertEqual(children2, ["item1", "item2"])
        self.assertDictEqual(
            props2,
            {
                "foo": "bar",
                "baz": 42,
                "fizz": "buzz",
                "test": "value",
            },
        )

    def test_unpack_item_table_source(self):
        from deephaven.ui._internal.utils import unpack_item_table_source
        from deephaven.ui import item_table_source

        children = ("table",)
        props = {
            "test": "foo",
        }

        expected_children = ("table",)
        expected_props = {
            "test": "foo",
        }

        self.assertTupleEqual(
            unpack_item_table_source(children, props, {}),
            (expected_children, expected_props),
        )

        item_data_source = item_table_source(
            table="table", key_column="key", actions="actions"
        )

        children = (item_data_source,)
        props = {
            "test": "foo",
        }

        expected_children = ("table",)

        expected_props = {
            "test": "foo",
            "key_column": "key",
        }

        self.assertTupleEqual(
            unpack_item_table_source(children, props, {"table", "key_column"}),
            (expected_children, expected_props),
        )


if __name__ == "__main__":
    unittest.main()
