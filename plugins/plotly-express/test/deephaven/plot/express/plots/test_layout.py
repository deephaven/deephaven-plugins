import unittest

from ..BaseTest import BaseTestCase


class ScatterTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import empty_table

        self.source = empty_table(0).update(["x=i", "y=i*Math.random()*i", "z=i%5"])

    def test_empty_title(self):
        import src.deephaven.plot.express as dx

        chart = dx.line(
            self.source, x="x", y="y", by=["z"], title="Hello World0"
        ).to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        expected_title = {"text": "Hello World0"}

        self.assertEqual(plotly["layout"]["title"], expected_title)


if __name__ == "__main__":
    unittest.main()
