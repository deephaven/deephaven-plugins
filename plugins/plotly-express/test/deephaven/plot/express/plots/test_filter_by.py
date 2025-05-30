import unittest

from ..BaseTest import BaseTestCase

DEFAULT_PLOTLY = None

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

        self.partitioned_source = self.source.partition_by(["cat_one", "cat_two"])

    def test_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        exported_chart = chart.to_dict(self.exporter)
        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        print("first")
        import pprint

        pprint.pprint(plotly, deephaven)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

        plotly, deephaven = chart["plotly"], chart["deephaven"]

        # pop template as we currently do not modify it
        plotly["layout"].pop("template")

        print("second")
        import pprint

        pprint.pprint(plotly, deephaven)

    def test_filters(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by=["cat_one", "cat_two"])

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A",
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_required_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", required_filter_by="cat_one")

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_required_filters(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", required_filter_by=["cat_one", "cat_two"])

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A",
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_mixed_filters(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", filter_by="cat_one", required_filter_by="cat_two")

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A",
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)


    def test_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", by="cat_one", filter_by="cat_two")

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_required_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.source, x="X", y="Y", by="cat_one", required_filter_by="cat_two")

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_partitioned_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.partitioned_source, x="X", y="Y", filter_by=True)

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A",
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_partitioned_required_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.partitioned_source, x="X", y="Y", required_filter_by=True)

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A",
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_partitioned_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.partitioned_source, x="X", y="Y", filter_by="cat_one")

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_partitioned_required_filter_plot_by(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart = dx.line(self.partitioned_source, x="X", y="Y", required_filter_by="cat_one")

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_subplot_same_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart_one = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        chart_two = dx.line(self.source, x="X", y="Y", required_filter_by="cat_one")

        chart = dx.make_subplots(chart_one, chart_two, rows=2)

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

    def test_subplot_different_filter(self):
        import src.deephaven.plot.express as dx
        from deephaven.constants import NULL_INT

        chart_one = dx.line(self.source, x="X", y="Y", filter_by="cat_one")

        chart_two = dx.line(self.source, x="X", y="Y", required_filter_by="cat_two")

        chart = dx.make_subplots(chart_one, chart_two, rows=2)

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A"
        })

        exported_chart = chart.to_dict(self.exporter)

        chart.update_filters({
            "cat_one": "A",
            "cat_two": "C"
        })

        exported_chart = chart.to_dict(self.exporter)

