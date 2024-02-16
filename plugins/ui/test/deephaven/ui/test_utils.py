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


if __name__ == "__main__":
    unittest.main()
