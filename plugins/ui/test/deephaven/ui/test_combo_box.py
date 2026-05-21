import unittest

from .BaseTest import BaseTestCase


class ComboBoxTest(BaseTestCase):
    def test_renders_combo_box(self):
        from deephaven.ui import combo_box

        result = combo_box(label="Test")
        self.assertEqual(result.name, "deephaven.ui.components.ComboBox")

    def test_selected_key(self):
        from deephaven.ui import combo_box

        result = combo_box(selected_key="a", label="Test")
        self.assertEqual(result.name, "deephaven.ui.components.ComboBox")


class MultiSelectTest(BaseTestCase):
    def test_renders_multi_select(self):
        from deephaven.ui import multi_select

        result = multi_select(label="Test")
        self.assertEqual(result.name, "deephaven.ui.components.MultiSelect")

    def test_accepts_selected_keys(self):
        from deephaven.ui import multi_select

        result = multi_select(selected_keys=["a", "b"], label="Test")
        self.assertEqual(result.name, "deephaven.ui.components.MultiSelect")


if __name__ == "__main__":
    unittest.main()
