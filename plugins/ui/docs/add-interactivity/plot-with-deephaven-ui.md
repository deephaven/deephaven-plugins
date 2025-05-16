# Plotting

In addition to tables, Deephaven supports [dynamic plots](/core/docs/how-to-guides/plotting/) as an excellent way to visualize real-time data. You can add plots to your `deephaven.ui` components. Like tables, plots will update in real time and react to changes in the UI.

The `deephaven.ui` module provides a simple interface for creating interactive plots using the `deephaven-express` library. This guide will show you how to create plots that update based on user input.

## Memoize plots

Just as you should memoize table operations, it’s important to memoize plots based on the table used to create them and any arguments that may change. This process of memoization prevents the plot from being recreated during every re-render. Instead, the plot will only be recreated when an argument related to `plot `changes.

```python
from deephaven import time_table, ui
import deephaven.plot.express as dx


@ui.component
def ui_memo_plot_app():
    n, set_n = ui.use_state(1)

    result_table = ui.use_memo(
        lambda: time_table("PT1s").update(f"y=i*{n}").reverse(), [n]
    )

    # memoize the plot
    plot = ui.use_memo(
        lambda: dx.line(result_table, x="Timestamp", y="y"), [result_table]
    )

    return ui.view(
        ui.flex(
            ui.slider(value=n, min_value=1, max_value=10, on_change=set_n, label="n"),
            plot,
            direction="column",
            height="100%",
        ),
        align_self="stretch",
        flex_grow=1,
    )


memo_plot_app = ui_memo_plot_app()
```

## Plot a filtered table

This example demonstrates how to create a simple line plot that updates based on user input. The plot will display the price of a stock filtered based on the stock symbol entered by the user. Here, we have used a `ui.text_field` to get the value, but it could be driven by any deephaven.ui input, including double clicking on a value from a `ui.table`. We've previously referred to this sort of behavior as a "one-click" component in Enterprise, as the plot updates as soon as the user enters a filter.

```python order=p,_stocks
import deephaven.plot.express as dx
import deephaven.ui as ui

_stocks = dx.data.stocks()


@ui.component
def plot_filtered_table(table, initial_value):
    text, set_text = ui.use_state(initial_value)
    # the filter is memoized so that it is only recalculated when the text changes
    filtered_table = ui.use_memo(
        lambda: table.where(f"Sym = `{text.upper()}`"), [table, text]
    )
    plot = ui.use_memo(
        lambda: dx.line(
            filtered_table, x="Timestamp", y="Price", title=f"Filtered by: {text}"
        ),
        [filtered_table, text],
    )
    return [ui.text_field(value=text, on_change=set_text), plot]


p = plot_filtered_table(_stocks, "DOG")
```

## Plot a partitioned table

Using a partitioned table, as opposed to a `where` statement, can be more efficient if you filter the same table multiple times with different values. This is because the partitioning is only done once, and then the key is selected from the partitioned table. Compared to using `where`, it can be faster to return results, but at the expense of the query engine using more memory. Depending on the size of your table and the number of unique values in the partition key, this trade-off can be worthwhile.

```python order=p,_stocks
import deephaven.plot.express as dx
import deephaven.ui as ui

_stocks = dx.data.stocks()


@ui.component
def plot_partitioned_table(table, initial_value):
    text, set_text = ui.use_state(initial_value)
    # memoize the partition by so that it only performed once
    partitioned_table = ui.use_memo(lambda: table.partition_by(["Sym"]), [table])
    constituent_table = ui.use_memo(
        lambda: partitioned_table.get_constituent(text.upper()) if text != "" else None,
        [partitioned_table, text],
    )
    # only attempt to plot valid partition keys
    plot = ui.use_memo(
        lambda: dx.line(
            constituent_table, x="Timestamp", y="Price", title=f"partition key: {text}"
        )
        if constituent_table != None
        else ui.text("Please enter a valid partition."),
        [constituent_table, text],
    )
    return [
        ui.text_field(value=text, on_change=set_text),
        plot,
    ]


p = plot_partitioned_table(_stocks, "DOG")
```

## Combine a filter and a partition by

Deephaven Plotly Express allows you to plot by a partition and assign unique colors to each key. Sometimes, as a user, you may also want to filter the data in addition to partitioning it. We've previously referred to this as "one-click plot by" behavior in Enterprise. This can be done by either filtering the table first and then partitioning it, or partitioning it first and then filtering it. The choice of which to use depends on the size of the table and the number of unique values in the partition key. The first example is more like a traditional "one-click" component, and the second is more like a parameterized query. Both will give you the same result, but the first one may return results faster, whereas the second one may be more memory efficient.

```python order=wtp,ptf,_stocks
import deephaven.plot.express as dx
import deephaven.ui as ui

_stocks = dx.data.stocks()


@ui.component
def partition_then_filter(table, by, initial_value):
    """
    Partition the table by both passed columns, then filter it by the value entered by the user
    """
    text, set_text = ui.use_state(initial_value)
    partitioned_table = ui.use_memo(lambda: table.partition_by(by), [table, by])
    filtered = ui.use_memo(
        lambda: partitioned_table.filter(f"{by[0]} = `{text.upper()}`"),
        [text, partitioned_table],
    )
    plot = ui.use_memo(
        lambda: dx.line(filtered, x="Timestamp", y="Price", by=[f"{by[1]}"]),
        [filtered, by],
    )
    return [
        ui.text_field(value=text, on_change=set_text),
        plot,
    ]


@ui.component
def where_then_partition(table, by, initial_value):
    """
    Filter the table by the value entered by the user, then re-partition it by the second passed column
    """
    text, set_text = ui.use_state(initial_value)
    filtered = ui.use_memo(
        lambda: table.where(f"{by[0]} = `{text.upper()}`"), [text, table]
    )
    plot = ui.use_memo(
        lambda: dx.line(filtered, x="Timestamp", y="Price", by=[f"{by[1]}"]),
        [filtered, by],
    )
    return [ui.text_field(value=text, on_change=set_text), plot]


# outputs the same thing, done two different ways depending on how you want the work done
ptf = partition_then_filter(_stocks, ["Sym", "Exchange"], "DOG")
wtp = where_then_partition(_stocks, ["Sym", "Exchange"], "DOG")
```

## Change a plot

In response to user events, you can change data for a plot and you can change the plot itself. In this example, the plot type changes by selecting it from a picker.

```python order=change_plot_type_example,_stocks
import deephaven.plot.express as dx
import deephaven.ui as ui

_stocks = dx.data.stocks().where("Sym = `DOG`")

plot_types = ["Line", "Scatter", "Area"]


@ui.component
def change_plot_type(table):
    plot_type, set_plot_type = ui.use_state("Line")

    def create_plot(t, pt):
        match pt:
            case "Line":
                return dx.line(t, x="Timestamp", y="Price")
            case "Scatter":
                return dx.scatter(t, x="Timestamp", y="Price")
            case "Area":
                return dx.area(t, x="Timestamp", y="Price")
            case _:
                return ui.text(f"Unknown plot type {pt}")

    plot = ui.use_memo(lambda: create_plot(table, plot_type), [table, plot_type])
    return [
        ui.picker(plot_types, selected_key=plot_type, on_change=set_plot_type),
        plot,
    ]


change_plot_type_example = change_plot_type(_stocks)
```

## Plots and Liveness

While you may need to use a liveness scope for Deephaven tables, you do not for Deephaven Express plots.

Deephaven Express tracks liveness internally for the tables used by the plot. It cleans up when the figure is deleted or cleaned up by garbage collection. You should not need to explicitly use liveness scope for Deephaven Express.
