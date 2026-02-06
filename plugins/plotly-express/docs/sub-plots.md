# Sub plots

Multiple sub plots can be combined into one plot using the `make_subplots` function. This function accepts multiple plot objects, and returns a single plot object. The plot objects can be any of the plot types supported by Deephaven Express. They can be arranged in a grid, or in a single row or column. The `shared_xaxes` and `shared_yaxes` parameters can be used to share axes between plots.

## Examples

### Four unique plots

Create a series of plots as subplots, all providing unique perspectives on the data of interest.

```python order=tipping_plots,tips
import deephaven.plot.express as dx

tips = dx.data.tips()  # import a ticking version of the Tips dataset

# create 4 plots from within make_subplots
tipping_plots = dx.make_subplots(
    dx.scatter(
        tips, x="TotalBill", y="Tip", by="Sex", title="Tip amount by total bill"
    ),
    dx.violin(tips, y="TotalBill", by="Day", title="Total bill distribution by day"),
    dx.pie(
        tips.count_by("Count", by=["Sex", "Smoker"])
        .update_view("SmokerStatus = Smoker == `No` ? `non-smoker` : `smoker`")
        .update_view("SmokerLabel = Sex + ` ` + SmokerStatus"),
        names="SmokerLabel",
        values="Count",
        title="Total bill by sex and smoking status",
    ),
    dx.bar(
        tips.view(["TotalBill", "Tip", "Day"]).avg_by("Day"),
        x="Day",
        y=["TotalBill", "Tip"],
        title="Average tip as a fraction of total bill",
    ),
    rows=2,
    cols=2,
    shared_xaxes=False,
    shared_yaxes=False,
)
```

### Adding Subplot Titles

You can add titles to individual subplots using the `subplot_titles` parameter. Provide a list or tuple of titles, ordered from left to right, top to bottom.

```python order=tipping_plots,lunch_tips,dinner_tips
import deephaven.plot.express as dx

tips = dx.data.tips()

lunch_tips = tips.where("Time = `Lunch`")
dinner_tips = tips.where("Time = `Dinner`")

# Add titles to subplots
tipping_plots = dx.make_subplots(
    dx.scatter(lunch_tips, x="TotalBill", y="Tip"),
    dx.scatter(dinner_tips, x="TotalBill", y="Tip"),
    cols=2,
    subplot_titles=["Lunch Tips", "Dinner Tips"],
)
```

### Using Existing Titles

You can automatically use the titles from the original figures as subplot titles by setting `subplot_titles=True`.

```python order=tipping_plots,lunch_tips,dinner_tips
import deephaven.plot.express as dx

tips = dx.data.tips()

lunch_tips = tips.where("Time = `Lunch`")
dinner_tips = tips.where("Time = `Dinner`")

# Figures with titles
lunch_chart = dx.scatter(lunch_tips, x="TotalBill", y="Tip", title="Lunch Tips")
dinner_chart = dx.scatter(dinner_tips, x="TotalBill", y="Tip", title="Dinner Tips")

# Use existing titles as subplot titles
tipping_plots = dx.make_subplots(
    lunch_chart, dinner_chart, cols=2, subplot_titles=True
)
```

### Adding a Title

You can add a title to the combined subplot figure using the `title` parameter.

```python order=tipping_plots,tips
import deephaven.plot.express as dx

tips = dx.data.tips()

tipping_plots = dx.make_subplots(
    dx.scatter(tips, x="TotalBill", y="Tip", by="Day"),
    dx.histogram(tips, x="TotalBill"),
    cols=2,
    title="Tipping Analysis",
)
```

### Share Axes

Share axes between plots with the `shared_xaxes` and `shared_yaxes` parameters.

#### Share All Axes

When `shared_xaxes` or `shared_yaxes` is set to `"all"`, all axes of the same type are shared.
When one axis is adjusted, all axes are adjusted to match.

```python order=tipping_plots,lunch_tips,dinner_tips
import deephaven.plot.express as dx

tips = dx.data.tips()  # import a ticking version of the Tips dataset

# filter the tips dataset for separate lunch and dinner charts
lunch_tips = tips.where("Time = `Lunch`")
dinner_tips = tips.where("Time = `Dinner`")

# create chart that shares all axes
tipping_plots = dx.make_subplots(
    dx.scatter(lunch_tips, x="TotalBill", y="Tip", labels={"Tip": "Lunch Tips"}),
    dx.scatter(dinner_tips, x="TotalBill", y="Tip", labels={"Tip": "Dinner Tips"}),
    rows=2,
    shared_yaxes="all",
    shared_xaxes="all",
)
```

#### Share Y Axes

When `shared_yaxis` is set to `True`, all y axes are shared along the same row.
When one y-axis is adjusted, all axes along the same row are adjusted to match.

```python order=tipping_plots,lunch_tips,dinner_tips
import deephaven.plot.express as dx

tips = dx.data.tips()  # import a ticking version of the Tips dataset

# filter the tips dataset for separate lunch and dinner charts
lunch_tips = tips.where("Time = `Lunch`")
dinner_tips = tips.where("Time = `Dinner`")

# create chart that shares y axes along the row
tipping_plots = dx.make_subplots(
    dx.scatter(lunch_tips, x="TotalBill", y="Tip", labels={"Tip": "Lunch Tips"}),
    dx.scatter(dinner_tips, x="TotalBill", y="Tip", labels={"Tip": "Dinner Tips"}),
    cols=2,
    shared_yaxes=True,
)
```

To share the y axes along the same column, set `shared_yaxes` to `"columns"`.

```python order=tipping_plots,lunch_tips,dinner_tips
import deephaven.plot.express as dx

tips = dx.data.tips()  # import a ticking version of the Tips dataset

# filter the tips dataset for separate lunch and dinner charts
lunch_tips = tips.where("Time = `Lunch`")
dinner_tips = tips.where("Time = `Dinner`")

# create chart that shares y axes along the column
tipping_plots = dx.make_subplots(
    dx.scatter(lunch_tips, x="TotalBill", y="Tip", labels={"Tip": "Lunch Tips"}),
    dx.scatter(dinner_tips, x="TotalBill", y="Tip", labels={"Tip": "Dinner Tips"}),
    rows=2,
    shared_yaxes="columns",
)
```

#### Share X Axes

When `shared_xaxis` is set to `True`, all x axes are shared along the same column.
When one x-axis is adjusted, all axes along the same column are adjusted to match.

```python order=tipping_plots,lunch_tips,dinner_tips
import deephaven.plot.express as dx

tips = dx.data.tips()  # import a ticking version of the Tips dataset

# filter the tips dataset for separate lunch and dinner charts
lunch_tips = tips.where("Time = `Lunch`")
dinner_tips = tips.where("Time = `Dinner`")

# create chart that shares x axes along the column
tipping_plots = dx.make_subplots(
    dx.scatter(lunch_tips, x="TotalBill", y="Tip", labels={"Tip": "Lunch Tips"}),
    dx.scatter(dinner_tips, x="TotalBill", y="Tip", labels={"Tip": "Dinner Tips"}),
    rows=2,
    shared_xaxes=True,
)
```

To share the x axes along the same column, set `shared_yaxes` to `"columns"`.

```python order=tipping_plots,lunch_tips,dinner_tips
import deephaven.plot.express as dx

tips = dx.data.tips()  # import a ticking version of the Tips dataset

# filter the tips dataset for separate lunch and dinner charts
lunch_tips = tips.where("Time = `Lunch`")
dinner_tips = tips.where("Time = `Dinner`")

# create chart that shares x axes along the row
tipping_plots = dx.make_subplots(
    dx.scatter(lunch_tips, x="TotalBill", y="Tip", labels={"Tip": "Lunch Tips"}),
    dx.scatter(dinner_tips, x="TotalBill", y="Tip", labels={"Tip": "Dinner Tips"}),
    cols=2,
    shared_xaxes="rows",
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.make_subplots
```
