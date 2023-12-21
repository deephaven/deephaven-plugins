# deephaven.ui

## A Python web framework for building real-time data focused apps

deephaven.ui is a new framework for building reactive UI components for real-time data apps, entirely in Python. No front-end engineering needed. Users can turn kafka feeds, event streams, and data lakes into live BI dashboards and data apps in minutes, not days.

Below are some examples to demonstrate some of the functionality you can do so far with deephaven.ui. At this point it is only showcasing the subset of the planned functionality that has been implemented, but should give an idea of what is possible.

First, you need to import the `deephaven.ui` module. This will automatically load the plugin and make the `ui` module available.

```python
from deephaven import ui
```

# Basic `use_state` Examples

deephaven.ui uses functional components with "hooks" to create components. The most useful and basic hook is the `use_state` hook, which allows you to create a stateful component. The `use_state` hook returns a tuple of the current value of the state and a function to update the state. The function returned by `use_state` can be called with a new value to update the state, and the component will re-render with the new value. People familiar with modern UI frameworks will be familiar with this paradigm.

The below examples show a simple usage of the `use_state` hook, building some of the basic examples on the [React useState docs](https://react.dev/reference/react/useState#examples-basic).

## Counter (number)

A simple example to demonstrate how state can be used using the `use_state` hook. `count` holds the value of the counter, and pressing the button increments the number.

We define our `counter` component as a function using the `@ui.component` decorator. This decorator allows the component to be rendered in the UI, when we assign the result of it to a value with the `c = counter()` line. The `counter` function returns a `ui.action_button` component, which is a [button that can be pressed](https://react-spectrum.adobe.com/react-spectrum/ActionButton.html). The `on_press` argument is a callback that is called when the button is pressed. In this case, we call the `set_count` function returned by `use_state` to update the value of `count`.

```python
@ui.component
def counter():
    count, set_count = ui.use_state(0)
    return ui.action_button(
        f"You pressed me {count} times", on_press=lambda: set_count(count + 1)
    )


result = counter()
```

## Text field (string)

You can create a [TextField](https://react-spectrum.adobe.com/react-spectrum/TextField.html) that takes input from the user. You can also use a [Flex](https://react-spectrum.adobe.com/react-spectrum/Flex.html) component to display multiple components in a row (or column, depending on the `direction` argument).

```python
@ui.component
def my_input():
    text, set_text = ui.use_state("hello")
    count, set_count = ui.use_state(0)

    return ui.flex(
        ui.action_button(
            f"You pressed me {count} times", on_press=lambda: set_count(count + 1)
        ),
        ui.text_field(value=text, on_change=set_text),
        ui.text(f"You typed {text}"),
        gap=10,
        margin=10,
        direction="column",
    )


result = my_input()
```

## Using Tables

You can open a Deephaven Table and control it using callbacks, as well. Let\'s create a table with some data, and then create a component that allows us to filter the table, and a button group it or ungroup it.

We're going to use a sample table of mock data for demonstration purposes:

```python
from deephaven.plot import express as dx

stocks = dx.data.stocks().reverse()
# stocks creates a fictional stock market of pets
```

Then we can use that source table to create a groupable table component:

```python
from deephaven import agg


@ui.component
def groupable_table(source, column, aggs, default_value=""):
    value, set_value = ui.use_state(default_value)
    grouped, set_grouped = ui.use_state(False)

    t = source.where(f"{column}.contains(`{value.upper()}`)")

    return ui.flex(
        ui.flex(
            ui.text_field(
                value=value,
                on_change=set_value,
                label="Sym",
                label_position="side",
            ),
            ui.toggle_button(ui.text("Group"), on_change=set_grouped),
            gap=10,
            margin=4,
        ),
        t if not grouped else t.rollup(aggs=aggs, by=column),
        direction="column",
        flex_grow=1,
    )


result = groupable_table(
    stocks, "sym", agg.avg(cols=["size", "price", "dollars"]), "fish"
)
```

## Using Plots

We can display a plot instead of tables as well. Let\'s create a plot using plotly that shows the average price of each symbol over time.

```python
@ui.component
def filterable_plot(source):
    value, set_value = ui.use_state("fish")

    t = source.where(f"sym.contains(`{value.upper()}`)")

    return [
        ui.text_field(
            value=value,
            on_change=set_value,
            label="Sym",
            label_position="side",
            marginX=10,
            marginTop=10,
        ),
        dx.line(t, x="timestamp", y="price", by=["exchange"]),
    ]


result = filterable_plot(stocks)
```

## Table Actions

You can react to a wide variety of user actions in a table as well. Let\'s display a table that when you double click on a row, will filter a table and plot in another panel to show just that symbol:

```python
@ui.component
def stock_table_input(source, default_sym="", default_exchange=""):
    sym, set_sym = ui.use_state(default_sym)
    exchange, set_exchange = ui.use_state(default_exchange)

    t1 = source.select_distinct(["sym", "exchange"])
    t2 = source.where([f"sym=`{sym.upper()}`", f"exchange=`{exchange}`"])
    p = dx.line(t2, x="timestamp", y="price")

    def handle_row_double_press(row, data):
        set_sym(data["sym"]["value"])
        set_exchange(data["exchange"]["value"])

    return [
        ui.panel(
            # Add a callback for when user double clicks a row in the table
            ui.table(t1).on_row_double_press(handle_row_double_press),
            title="Stock Row Press",
        ),
        ui.panel(t2, title="Stock Filtered Table"),
        ui.panel(p, title="Stock Plot"),
    ]


sti = stock_table_input(stocks, "CAT", "TPET")
```

## Ranged Components

deephaven.ui contains a library of elements you can use to build your own components. For example, you can create a histogram that you can modify the bin count and range using sliders:

```python
@ui.component
def hist_demo(source, column):
    bin_count, set_bin_count = ui.use_state(10)
    hist_range, set_hist_range = ui.use_state({"start": 0, "end": 100000})

    p = ui.use_memo(
        lambda: dx.histogram(
            source.where(
                f"{column}>={hist_range['start']} && {column}<={hist_range['end']}"
            ),
            x=column,
            nbins=bin_count,
        ),
        [bin_count, hist_range, source, column],
    )

    return [
        ui.flex(
            ui.slider(label="Bin Count", value=bin_count, on_change=set_bin_count),
            ui.range_slider(
                label="Range",
                value=hist_range,
                on_change=set_hist_range,
                min_value=0,
                max_value=100000,
            ),
            gap=20,
            marginX=20,
            marginTop=10,
        ),
        p,
    ]


result = hist_demo(stocks, "size")
```

## Creating an Order Table

You can also take action when a button is clicked. In this example, we have a simple form that user can enter orders and submit:

```python
from deephaven import dtypes as dht, empty_table, ui
from deephaven.stream.table_publisher import table_publisher
from deephaven.stream import blink_to_append_only


@ui.component
def order_table():
    sym, set_sym = ui.use_state("")
    size, set_size = ui.use_state(0)

    blink_table, publisher = ui.use_memo(
        lambda: table_publisher(
            "Order table", {"sym": dht.string, "size": dht.int32, "side": dht.string}
        ),
        [],
    )
    t = ui.use_memo(lambda: blink_to_append_only(blink_table), [blink_table])

    def submit_order(order_sym, order_size, side):
        publisher.add(
            empty_table(1).update(
                [f"sym=`{order_sym}`", f"size={order_size}", f"side=`{side}`"]
            )
        )

    def handle_buy():
        submit_order(sym, size, "buy")

    def handle_sell():
        submit_order(sym, size, "sell")

    return [
        ui.flex(
            ui.text_field(
                label="Sym", label_position="side", value=sym, on_change=set_sym
            ),
            ui.number_field(
                label="Size", label_position="side", value=size, on_change=set_size
            ),
            ui.button("Buy", on_press=handle_buy, variant="accent", style="fill"),
            ui.button("Sell", on_press=handle_sell, variant="negative", style="fill"),
            gap=10,
            marginX=10,
            marginTop=4,
            wrap=True,
        ),
        t,
    ]


result = order_table()
```

## Using Tabs

You can add [Tabs](https://react-spectrum.adobe.com/react-spectrum/Tabs.html) within a panel by using the `ui.tabs` method. In this example, we create a tabbed panel with multiple tabs:

- Unfiltered table
- Table filtered on sym `CAT`. We also include an icon in the tab header.
- Table filtered on sym `DOG`

```python
@ui.component
def table_tabs(source):
    return ui.tabs(
        ui.tab_list(
            ui.item("Unfiltered", key="Unfiltered"),
            ui.item(ui.icon("vsGithubAlt"), "CAT", key="CAT"),
            ui.item("DOG", key="DOG"),
        ),
        ui.tab_panels(
            ui.item(source, key="Unfiltered"),
            ui.item(source.where("sym=`CAT`"), key="CAT"),
            ui.item(source.where("sym=`DOG`"), key="DOG"),
        ),
        flex_grow=1,
    )


result = table_tabs(stocks)
```
