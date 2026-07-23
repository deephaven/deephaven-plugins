import unittest
import importlib.util
import json
from unittest.mock import MagicMock, patch
import sys
import os

# Load callbacks module directly to avoid deephaven server requirement
# Navigate from test/deephaven/plot/express/types/ to src/deephaven/plot/express/types/
_test_dir = os.path.dirname(os.path.abspath(__file__))
_plugin_root = os.path.abspath(os.path.join(_test_dir, "..", "..", "..", "..", ".."))
_callbacks_path = os.path.join(
    _plugin_root, "src", "deephaven", "plot", "express", "types", "callbacks.py"
)
spec = importlib.util.spec_from_file_location("callbacks", _callbacks_path)
callbacks_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(callbacks_mod)

wrap_callable = callbacks_mod.wrap_callable
ALWAYS_PREVENTABLE_EVENTS = callbacks_mod.ALWAYS_PREVENTABLE_EVENTS
HIERARCHICAL_TRACE_TYPES = callbacks_mod.HIERARCHICAL_TRACE_TYPES


class TestWrapCallable(unittest.TestCase):
    """Tests for wrap_callable"""

    def test_zero_args_function(self):
        """wrap_callable trims args for 0-arg functions"""

        def no_args():
            return "called"

        wrapped = wrap_callable(no_args)
        result = wrapped({"some": "data"})
        self.assertEqual(result, "called")

    def test_one_arg_function(self):
        """wrap_callable passes one arg to 1-arg functions"""

        def one_arg(event):
            return event

        wrapped = wrap_callable(one_arg)
        event_data = {"points": [{"x": 1}]}
        result = wrapped(event_data)
        self.assertEqual(result, event_data)

    def test_variadic_function(self):
        """wrap_callable passes all args to variadic functions"""

        def var_args(*args):
            return args

        wrapped = wrap_callable(var_args)
        result = wrapped("a", "b", "c")
        self.assertEqual(result, ("a", "b", "c"))

    def test_propagates_return_value(self):
        """wrap_callable propagates return values"""

        def returns_false(event):
            return False

        def returns_true(event):
            return True

        def returns_none(event):
            return None

        self.assertEqual(wrap_callable(returns_false)({}), False)
        self.assertEqual(wrap_callable(returns_true)({}), True)
        self.assertIsNone(wrap_callable(returns_none)({}))

    def test_two_arg_function(self):
        """wrap_callable handles 2-arg functions (extra args trimmed)"""

        def two_args(a, b):
            return (a, b)

        wrapped = wrap_callable(two_args)
        result = wrapped("x", "y", "z")
        self.assertEqual(result, ("x", "y"))

    def test_exception_propagates(self):
        """wrap_callable does not suppress exceptions"""

        def raises(event):
            raise ValueError("test error")

        wrapped = wrap_callable(raises)
        with self.assertRaises(ValueError):
            wrapped({})


class TestConstants(unittest.TestCase):
    """Tests for module constants"""

    def test_always_preventable_events(self):
        self.assertIn("on_legend_click", ALWAYS_PREVENTABLE_EVENTS)
        self.assertIn("on_legend_double_click", ALWAYS_PREVENTABLE_EVENTS)
        self.assertNotIn("on_click", ALWAYS_PREVENTABLE_EVENTS)

    def test_hierarchical_trace_types(self):
        self.assertIn("sunburst", HIERARCHICAL_TRACE_TYPES)
        self.assertIn("treemap", HIERARCHICAL_TRACE_TYPES)
        self.assertIn("icicle", HIERARCHICAL_TRACE_TYPES)
        self.assertNotIn("scatter", HIERARCHICAL_TRACE_TYPES)


if __name__ == "__main__":
    unittest.main()
