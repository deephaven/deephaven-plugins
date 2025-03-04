from __future__ import annotations
from unittest.mock import Mock, call
from typing import Any, Callable, List, Union
from deephaven.ui._internal.utils import transform_node
from deephaven import ui
from .BaseTest import BaseTestCase


class TransformNodeTestCase(BaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        # Set up the transform with function that just returns the value
        self.transform = Mock(side_effect=lambda k, v: v)

    def assert_node_transform(self, node: Any, expected: Any) -> Any:
        result = transform_node(node, self.transform)
        self.assertEqual(result, expected)
        return result

    def test_primitives(self):
        self.assert_node_transform(1, 1)
        self.assert_node_transform("a", "a")
        self.assert_node_transform(None, None)
        self.assert_node_transform(False, False)

    def test_transform_array_no_children_changed(self):
        """
        Test that an array with no children changed will not be modified and the original array is returned
        """
        value = ["test", "test2"]
        value_copy = list(value)
        result = transform_node(value, self.transform)
        self.assertIs(result, value)
        self.assertEqual(result, value_copy)
        self.transform.assert_has_calls(
            [call("0", "test"), call("1", "test2"), call("", value)]
        )

    def test_transform_array_children_changed(self):
        """
        Test that an array with children changed will be modified and a new array will be returned
        """
        value = ["test", "test2"]
        expected = ["modified", "test2"]
        transform = Mock(side_effect=lambda k, v: "modified" if k == "0" else v)
        result = transform_node(value, transform)
        self.assertIsNot(result, value)
        self.assertEqual(result, expected)
        transform.assert_has_calls(
            [call("0", "test"), call("1", "test2"), call("", expected)]
        )

    def test_empty_array(self):
        """
        Test that an empty array will be returned as is
        """
        value = []
        result = transform_node(value, self.transform)
        self.assertIs(result, value)
        self.assertEqual(result, [])
        self.transform.assert_has_calls([call("", value)])

    def test_transform_dict_no_children_changed(self):
        """
        Test that a dict with no children changed will not be modified and the original dict is returned
        """
        value = {"a": "test", "b": "test2"}
        value_copy = dict(value)
        result = transform_node(value, self.transform)
        self.assertIs(result, value)
        self.assertEqual(result, value_copy)
        self.transform.assert_has_calls(
            [call("a", "test"), call("b", "test2"), call("", value)]
        )

    def test_transform_dict_children_changed(self):
        """
        Test that a dict with children changed will be modified and a new dict will be returned
        """
        value = {"a": "test", "b": "test2"}
        expected = {"a": "modified", "b": "test2"}
        transform = Mock(side_effect=lambda k, v: "modified" if k == "a" else v)
        result = transform_node(value, transform)
        self.assertIsNot(result, value)
        self.assertEqual(result, expected)
        transform.assert_has_calls(
            [call("a", "test"), call("b", "test2"), call("", expected)]
        )

    def test_empty_dict(self):
        """
        Test that an empty dict will be returned as is
        """
        value = {}
        result = transform_node(value, self.transform)
        self.assertIs(result, value)
        self.assertEqual(result, {})
        self.transform.assert_has_calls([call("", value)])

    def test_nested_objects(self):
        """
        Test that nested objects will be transformed
        """
        value = {"a": "test", "b": {"c": "test2"}}
        expected = {"a": "modified", "b": {"c": "test2"}}
        transform = Mock(side_effect=lambda k, v: "modified" if k == "a" else v)
        result = transform_node(value, transform)
        self.assertIsNot(result, value)
        self.assertEqual(result, expected)
        self.assertIs(result["b"], value["b"])

    def test_nested_arrays(self):
        """
        Test that nested arrays will be transformed
        """
        value = {"a": "test", "b": ["test2"]}
        expected = {"a": "modified", "b": ["test2"]}
        transform = Mock(side_effect=lambda k, v: "modified" if k == "a" else v)
        result = transform_node(value, transform)
        self.assertIsNot(result, value)
        self.assertEqual(result, expected)
        self.assertIs(result["b"], value["b"])
