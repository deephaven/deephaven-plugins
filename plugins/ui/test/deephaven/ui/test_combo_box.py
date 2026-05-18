import unittest
import warnings

from .BaseTest import BaseTestCase


class ComboBoxProcessSelectionPropsTest(BaseTestCase):
    def setUp(self):
        from deephaven.ui.types import Undefined

        self.Undefined = Undefined

    def _process(self, props, is_multiple):
        from deephaven.ui.components.combo_box import _process_selection_props

        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            _process_selection_props(props, is_multiple)

    def test_single_mode_converts_selected_keys_to_selected_key(self):
        props = {
            "selected_key": self.Undefined,
            "default_selected_key": None,
            "selected_keys": ["a", "b"],
            "default_selected_keys": ["c"],
            "other": "value",
        }
        self._process(props, is_multiple=False)
        self.assertNotIn("selected_keys", props)
        self.assertNotIn("default_selected_keys", props)
        self.assertEqual(props["selected_key"], "a")
        self.assertEqual(props["default_selected_key"], "c")
        self.assertEqual(props["other"], "value")

    def test_single_mode_converts_empty_selected_keys_to_none(self):
        props = {
            "selected_key": self.Undefined,
            "default_selected_key": None,
            "selected_keys": [],
            "default_selected_keys": [],
        }
        self._process(props, is_multiple=False)
        self.assertIsNone(props["selected_key"])
        self.assertIsNone(props["default_selected_key"])

    def test_single_mode_no_conversion_when_keys_none(self):
        props = {
            "selected_key": self.Undefined,
            "default_selected_key": None,
            "selected_keys": None,
            "default_selected_keys": None,
        }
        self._process(props, is_multiple=False)
        # When selected_keys is None, falls through and sets single prop to its default
        self.assertEqual(props["selected_key"], self.Undefined)
        self.assertEqual(props["default_selected_key"], None)
        self.assertNotIn("selected_keys", props)
        self.assertNotIn("default_selected_keys", props)

    def test_single_mode_deprecated_strips_multi_props(self):
        props = {
            "selected_key": "a",
            "default_selected_key": None,
            "selected_keys": ["x"],
            "default_selected_keys": ["y"],
        }
        self._process(props, is_multiple=False)
        self.assertNotIn("selected_keys", props)
        self.assertNotIn("default_selected_keys", props)
        self.assertEqual(props["selected_key"], "a")

    def test_multiple_mode_strips_single_props(self):
        props = {
            "selected_key": self.Undefined,
            "default_selected_key": None,
            "selected_keys": None,
            "default_selected_keys": None,
            "other": "value",
        }
        self._process(props, is_multiple=True)
        self.assertNotIn("selected_key", props)
        self.assertNotIn("default_selected_key", props)
        self.assertEqual(props["other"], "value")

    def test_multiple_mode_raises_when_single_props_set(self):
        props = {
            "selected_key": "some_key",
            "default_selected_key": "other",
            "selected_keys": None,
            "default_selected_keys": None,
        }
        with self.assertRaises(ValueError):
            self._process(props, is_multiple=True)


class ComboBoxWrapCallbackTest(BaseTestCase):
    def _wrap(self, callback):
        from deephaven.ui.components.combo_box import _wrap_callback_as_selection

        return _wrap_callback_as_selection(callback)

    def test_none_returns_none(self):
        self.assertIsNone(self._wrap(None))

    def test_wraps_string_key(self):
        received = []
        wrapped = self._wrap(lambda v: received.append(v))
        wrapped("my_key")
        self.assertEqual(received, [["my_key"]])

    def test_wraps_int_key(self):
        received = []
        wrapped = self._wrap(lambda v: received.append(v))
        wrapped(42)
        self.assertEqual(received, [[42]])

    def test_wraps_float_key(self):
        received = []
        wrapped = self._wrap(lambda v: received.append(v))
        wrapped(3.14)
        self.assertEqual(received, [[3.14]])

    def test_wraps_bool_key(self):
        received = []
        wrapped = self._wrap(lambda v: received.append(v))
        wrapped(True)
        self.assertEqual(received, [[True]])

    def test_passes_list_through(self):
        received = []
        wrapped = self._wrap(lambda v: received.append(v))
        wrapped(["a", "b"])
        self.assertEqual(received, [["a", "b"]])

    def test_passes_none_through(self):
        received = []
        wrapped = self._wrap(lambda v: received.append(v))
        wrapped(None)
        self.assertEqual(received, [None])


class ComboBoxDeprecationTest(BaseTestCase):
    def test_selected_key_warns(self):
        from deephaven.ui import combo_box

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            combo_box(selected_key="a")
            dep_warnings = [x for x in w if issubclass(x.category, FutureWarning)]
            messages = [str(x.message) for x in dep_warnings]
            self.assertTrue(
                any("selected_key" in m and "selected_keys" in m for m in messages),
                f"Expected selected_key deprecation warning, got: {messages}",
            )

    def test_default_selected_key_warns(self):
        from deephaven.ui import combo_box

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            combo_box(default_selected_key="a")
            dep_warnings = [x for x in w if issubclass(x.category, FutureWarning)]
            messages = [str(x.message) for x in dep_warnings]
            self.assertTrue(
                any(
                    "default_selected_key" in m and "default_selected_keys" in m
                    for m in messages
                ),
                f"Expected default_selected_key deprecation warning, got: {messages}",
            )

    def test_no_warning_when_defaults(self):
        from deephaven.ui import combo_box

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            combo_box()
            dep_warnings = [
                x
                for x in w
                if issubclass(x.category, FutureWarning)
                and ("selected_key" in str(x.message))
            ]
            self.assertEqual(
                len(dep_warnings),
                0,
                f"Unexpected deprecation warning: {[str(x.message) for x in dep_warnings]}",
            )


class ComboBoxCallbackWrappingTest(BaseTestCase):
    """Callbacks are wrapped to receive Selection when deprecated key props are NOT used."""

    def _process(self, props, is_multiple):
        from deephaven.ui.components.combo_box import _process_selection_props

        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            _process_selection_props(props, is_multiple)

    def test_single_wraps_when_no_deprecated_props(self):
        from deephaven.ui.types import Undefined

        received = []
        handler = lambda v: received.append(v)
        props = {
            "selected_key": Undefined,
            "default_selected_key": None,
            "selected_keys": ["a"],
            "default_selected_keys": None,
            "on_change": handler,
        }
        self._process(props, is_multiple=False)
        # selected_keys converted to selected_key
        self.assertEqual(props["selected_key"], "a")
        # callback wrapped
        props["on_change"]("my_key")
        self.assertEqual(received, [["my_key"]])

    def test_single_no_wrap_when_selected_key_used(self):
        received = []
        handler = lambda v: received.append(v)
        props = {
            "selected_key": "a",
            "default_selected_key": None,
            "selected_keys": None,
            "default_selected_keys": None,
            "on_change": handler,
        }
        self._process(props, is_multiple=False)
        props["on_change"]("my_key")
        self.assertEqual(received, ["my_key"])

    def test_single_no_wrap_when_default_selected_key_used(self):
        from deephaven.ui.types import Undefined

        received = []
        handler = lambda v: received.append(v)
        props = {
            "selected_key": Undefined,
            "default_selected_key": "b",
            "selected_keys": None,
            "default_selected_keys": None,
            "on_change": handler,
        }
        self._process(props, is_multiple=False)
        props["on_change"]("my_key")
        self.assertEqual(received, ["my_key"])

    def test_multiple_wraps_callbacks(self):
        from deephaven.ui.types import Undefined

        received = []
        handler = lambda v: received.append(v)
        props = {
            "selected_key": Undefined,
            "default_selected_key": None,
            "selected_keys": ["x"],
            "default_selected_keys": None,
            "on_change": handler,
        }
        self._process(props, is_multiple=True)
        # single props are stripped
        self.assertNotIn("selected_key", props)
        self.assertNotIn("default_selected_key", props)
        # callback wrapped but lists pass through unchanged
        props["on_change"](["a", "b"])
        self.assertEqual(received, [["a", "b"]])


class ComboBoxSelectionModeTest(BaseTestCase):
    def test_single_mode_renders_combo_box(self):
        from deephaven.ui import combo_box

        result = combo_box(label="Test")
        self.assertEqual(result.name, "deephaven.ui.components.ComboBox")

    def test_multiple_mode_renders_multi_select(self):
        from deephaven.ui import combo_box

        result = combo_box(selection_mode="multiple", label="Test")
        self.assertEqual(result.name, "deephaven.ui.components.MultiSelect")

    def test_multiple_mode_accepts_selected_keys(self):
        from deephaven.ui import combo_box

        result = combo_box(selection_mode="multiple", selected_keys=["a", "b"])
        self.assertEqual(result.name, "deephaven.ui.components.MultiSelect")


if __name__ == "__main__":
    unittest.main()
