import unittest
from typing import cast

from .BaseTest import BaseTestCase

from deephaven.ui._internal.utils import (
    convert_dict_keys,
    create_props,
    dict_shallow_equal,
    dict_to_camel_case,
    dict_to_react_props,
    get_component_name,
    convert_date_for_labeled_value,
    is_primitive,
    is_iterable,
    remove_empty_keys,
    to_camel_case,
    to_react_prop_case,
    wrap_callable,
    unpack_item_table_source,
)
from deephaven.ui.types import Undefined
from deephaven.ui import item_table_source, resolve


def my_test_func():
    raise Exception("should not be called")


class UtilsTest(BaseTestCase):
    def test_get_component_name(self):
        self.assertEqual(
            get_component_name(my_test_func),
            "test.deephaven.ui.test_utils.my_test_func",
        )

    def test_to_camel_case(self):
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
        # Test with a function reversing the keys
        self.assertDictEqual(
            convert_dict_keys(
                {"foo": "fiz", "bar": "biz"}, convert_key=lambda x: x[::-1]
            ),
            {"oof": "fiz", "rab": "biz"},
        )

    def test_dict_to_camel_case(self):
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

    def test_convert_date_for_labeled_value(self):
        from deephaven.time import to_j_instant, to_j_zdt, to_j_local_date

        instant = convert_date_for_labeled_value(
            to_j_instant("2035-01-31T12:30:00.12345Z")
        )
        self.assertEqual(instant, 2053859400123450000)

        zdt = convert_date_for_labeled_value(
            to_j_zdt("2035-01-31T12:30:00.12345 America/New_York")
        )
        self.assertEqual(zdt, (2053877400123450000, "America/New_York"))

        local_date = convert_date_for_labeled_value(to_j_local_date("2035-01-31"))
        self.assertEqual(local_date, "2035-01-31")

    def test_unpack_item_table_source(self):
        from deephaven.table import Table

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
            table=cast(Table, {"table": "foo"}), key_column="key", actions="actions"
        )

        children = (item_data_source,)
        props = {
            "test": "foo",
        }

        expected_children = ({"table": "foo"},)

        expected_props = {
            "test": "foo",
            "key_column": "key",
        }

        self.assertTupleEqual(
            unpack_item_table_source(children, props, {"table", "key_column"}),
            (expected_children, expected_props),
        )

        item_data_source = item_table_source(
            table="tableURI", key_column="key", actions="actions"
        )

        children = (item_data_source,)
        props = {
            "test": "foo",
        }

        expected_children = (resolve("tableURI"),)

        expected_props = {
            "test": "foo",
            "key_column": "key",
        }

        self.assertTupleEqual(
            unpack_item_table_source(children, props, {"table", "key_column"}),
            (expected_children, expected_props),
        )

        item_data_source = item_table_source(
            table=resolve("tableURI"), key_column="key", actions="actions"
        )

        children = (item_data_source,)
        props = {
            "test": "foo",
        }

        expected_children = (resolve("tableURI"),)

        expected_props = {
            "test": "foo",
            "key_column": "key",
        }

        self.assertTupleEqual(
            unpack_item_table_source(children, props, {"table", "key_column"}),
            (expected_children, expected_props),
        )

    def test_is_primitive(self):
        self.assertTrue(is_primitive(1))
        self.assertTrue(is_primitive("a"))
        self.assertTrue(is_primitive(None))
        self.assertTrue(is_primitive(False))
        self.assertFalse(is_primitive([]))
        self.assertFalse(is_primitive({}))
        self.assertFalse(is_primitive(()))
        self.assertFalse(is_primitive(object()))
        self.assertFalse(is_primitive(Exception()))

    def test_is_iterable(self):
        self.assertTrue(is_iterable([]))
        self.assertTrue(is_iterable({}))
        self.assertTrue(is_iterable(()))
        self.assertTrue(is_iterable({"foo": "bar"}))
        self.assertTrue(is_iterable(("foo", "bar")))
        self.assertTrue(is_iterable(map(lambda x: x, [1, 2, 3])))
        self.assertTrue(is_iterable(filter(lambda x: x, [1, 2, 3])))
        self.assertTrue(is_iterable(range(10)))
        self.assertFalse(is_iterable(1))
        self.assertFalse(is_iterable("a"))
        self.assertFalse(is_iterable(None))
        self.assertFalse(is_iterable(False))
        self.assertFalse(is_iterable(object()))
        self.assertFalse(is_iterable(Exception()))
        self.assertFalse(is_iterable(lambda: None))

        # We don't want to treat custom iterables as iterable in this context
        # Some classes implement the __iter__ method but we just want to check for standard iterables
        class CustomIterable:
            def __iter__(self):
                return iter([1, 2, 3])

        self.assertFalse(is_iterable(CustomIterable()))

    def test_dict_shallow_equal(self):
        # Two empty dicts are equal
        self.assertTrue(dict_shallow_equal({}, {}))

        # Same keys with identical values (same object) should be equal
        obj1 = {"nested": "value"}
        obj2 = [1, 2, 3]
        dict1 = {"a": obj1, "b": obj2}
        dict2 = {"a": obj1, "b": obj2}
        self.assertTrue(dict_shallow_equal(dict1, dict2))

        # Same keys with equal but not identical values should NOT be equal
        dict3 = {"a": {"nested": "value"}, "b": [1, 2, 3]}
        dict4 = {"a": {"nested": "value"}, "b": [1, 2, 3]}
        self.assertFalse(dict_shallow_equal(dict3, dict4))

        # Different keys should not be equal
        self.assertFalse(dict_shallow_equal({"a": 1}, {"b": 1}))
        self.assertFalse(dict_shallow_equal({"a": 1}, {"a": 1, "b": 2}))
        self.assertFalse(dict_shallow_equal({"a": 1, "b": 2}, {"a": 1}))

        # Primitives: small ints and interned strings have the same identity
        self.assertTrue(
            dict_shallow_equal({"a": 1, "b": "hello"}, {"a": 1, "b": "hello"})
        )
        self.assertTrue(dict_shallow_equal({"x": None}, {"x": None}))
        self.assertTrue(
            dict_shallow_equal({"x": True, "y": False}, {"x": True, "y": False})
        )

        # Different primitive values
        self.assertFalse(dict_shallow_equal({"a": 1}, {"a": 2}))
        self.assertFalse(dict_shallow_equal({"a": "foo"}, {"a": "bar"}))

        # Test with callables - same function object
        def my_func():
            pass

        self.assertTrue(dict_shallow_equal({"func": my_func}, {"func": my_func}))

        # Different function objects (even with same behavior) should NOT be equal
        def my_func2():
            pass

        self.assertFalse(dict_shallow_equal({"func": my_func}, {"func": my_func2}))


if __name__ == "__main__":
    unittest.main()
