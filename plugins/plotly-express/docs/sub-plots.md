# Sub plots

Multiple sub plots can be combined into one plot using the `make_subplots` function. This function accepts multiple plot objects, and returns a single plot object. The plot objects can be any of the plot types supported by Deephaven Express. They can be arranged in a grid, or in a single row or column. The `shared_xaxes` and `shared_yaxes` parameters can be used to share axes between plots.

## Examples

### Four unique plots

Create a series of plots as subplots, all providing unique perspectives on the data of interest.

```python order=tipping_plots,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# create 4 plots from within make_subplots
tipping_plots = dx.make_subplots(
    dx.scatter(tips, x="total_bill", y="tip", by="sex",
        title="Tip amount by total bill"),
    dx.violin(tips, y="total_bill", by="day",
        title="Total bill distribution by day"),
    dx.pie(
        tips
        .count_by("count", by=["sex", "smoker"])
        .update_view("smoker_status = smoker == `No` ? `non-smoker` : `smoker`")
        .update_view("smoker_label = sex + ` ` + smoker_status"),
        names="smoker_label", values="count",
        title="Total bill by sex and smoking status"),
    dx.bar(tips
        .view(["total_bill", "tip", "day"])
        .avg_by("day"),
        x="day", y=["total_bill", "tip"],
        title="Average tip as a fraction of total bill"),
    rows=2, cols=2, shared_xaxes=False, shared_yaxes=False
)
```

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.make_subplots
```