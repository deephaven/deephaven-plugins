import unittest

from ..BaseTest import BaseTestCase


class LineTestCase(BaseTestCase):
    def setUp(self) -> None:
        from deephaven import new_table
        from deephaven.column import int_col, string_col

        self.source = new_table(
            [
                int_col("X", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                int_col("Y", [1, 2, 2, 3, 3, 3, 4, 4, 5]),
                string_col("cat_one", ["A", "B", "A", "B", "A", "B", "A", "B", "A"]),
                string_col("cat_two", ["C", "D", "C", "D", "C", "D", "C", "D", "C"])
            ]
        )

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

    def test_basic_line(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        #chart = dx.line(self.source, x="X", y="Y").to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

