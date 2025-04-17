import unittest

from ..BaseTest import BaseTestCase


class AttachedPreprocessorTestCase(BaseTestCase):
    def test_style_manager(self):
        from deephaven.plot.express.preprocess.StyleManager import StyleManager

        style_manager = StyleManager(
            map={"X": "salmon", "Y": "lemonchiffon"},
            ls=["grey", "lightgrey"],
        )

        # If the mask is True, the color is assigned from the map or the list
        self.assertEqual(style_manager.assign_style("X", True), "salmon")
        self.assertEqual(style_manager.assign_style("Y", True), "lemonchiffon")
        self.assertEqual(style_manager.assign_style("Z", True), "grey")
        # If the mask is False, the color is assigned from the list
        # and all subsequent False values are assigned the same color
        self.assertEqual(style_manager.assign_style("X", False), "lightgrey")
        self.assertEqual(style_manager.assign_style("Z", False), "lightgrey")


if __name__ == "__main__":
    unittest.main()
