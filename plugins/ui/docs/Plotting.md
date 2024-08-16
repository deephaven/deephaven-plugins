# Plotting and dh.ui

Creating dynamic plots that respond to user input is a common task in data analysis. The `dh.ui` module provides a simple interface for creating interactive plots using the `deephaven-express` library. This guide will show you how to create plots that updates based on user input.

## Plotting a filtered table

This example demonstrates how to create a simple line plot that updates based on user input. The plot will display the price of a stock filtered based on the stock symbol entered by the user. Here we have used a `ui.text_field` to get the value, but it could be driven by any dh.ui input, including double clicking on a value from a `ui.table`. We've previously referred to this sort of behaviour as a "one-click" component in enterprise, as the plot updates as soon as the user enters a filter.

```python
import deephaven.plot.express as dx
import deephaven.ui as ui

_stocks = dx.data.stocks()


@ui.component
def plot_filtered_table(table, initial_value):
    text, set_text = ui.use_state("DOG")
    # the filter is memoized so that it is only recalculated when the text changes
    filtered_table = ui.use_memo(
        lambda: table.where(f"Sym = `{text.upper()}`"), [table, text]
    )
    return [
        ui.text_field(value=text, on_change=set_text),
        dx.line(filtered_table, x="Timestamp", y="Price", title=f"Filtered by: {text}"),
    ]


p = plot_filtered_table(_stocks, "DOG")
```

## Plotting a partitioned table

Using a partitioned table, as opposed to a where, can be more efficient if you are going to be filtering the same table multiple times with different values. This is because the partitioning is only done once, and then the key is selected from the partitioned table. Compared to using a where statement, it can be faster to return results, but at the expense of the query engine using more memory. Depending on the size of your table and the number of unique values in the partition key, this can be a tradeoff worth making or not.

```python
import deephaven.plot.express as dx
import deephaven.ui as ui

_stocks = dx.data.stocks()


@ui.component
def plot_partitioned_table(table, initial_value):
    text, set_text = ui.use_state(initial_value)
    # memoize the partition by so that it only performed once
    partitioned_table = ui.use_memo(lambda: table.partition_by(["Sym"]), [table])
    constituent_table = ui.use_memo(
        lambda: partitioned_table.get_constituent(text.upper()),
        [partitioned_table, text],
    )
    return [
        ui.text_field(value=text, on_change=set_text),
        # only attempt to plot valid partition keys
        dx.line(
            constituent_table, x="Timestamp", y="Price", title=f"partition key: {text}"
        )
        if constituent_table != None
        else ui.text("Please enter a valid partition."),
    ]


p = plot_partitioned_table(_stocks, "DOG")
```

## Combining a filter and a partition by

Deephaven Plotly Express allows you to plot by a partition and assign unique colors to each key. Sometimes as a user you may also want to filter the data in addition to partitioning it. We've previously referred to this as a "one-click plot by" behaviour in enterprise. This can be done by either filtering the table first and then partitioning it, or partitioning it first and then filtering it. The choice of which to use depends on the size of the table and the number of unique values in the partition key. The first example is more like a traditional "one-click" component, and the second is more like a parameterized query. Both will give you the same result, but the first one may return results faster, whereas the second one may be more memory efficient.

```python
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
    return [
        ui.text_field(value=text, on_change=set_text),
        dx.line(filtered, x="Timestamp", y="Price", by=[f"{by[1]}"]),
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
    return [
        ui.text_field(value=text, on_change=set_text),
        dx.line(filtered, x="Timestamp", y="Price", by=[f"{by[1]}"]),
    ]


# outputs the same thing, done two different ways depending on how you want the work done
ptf = partition_then_filter(_stocks, ["Sym", "Exchange"], "DOG")
wtp = where_then_partition(_stocks, ["Sym", "Exchange"], "DOG")
```
