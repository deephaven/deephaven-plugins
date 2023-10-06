# ⚠️This plugin is a work in progress and is subject to change. Use at your own risk.⚠️

# Introduction

deephaven.ui is a plugin for Deephaven that allows for programmatic layouts and callbacks. It uses a React-like approach to building components and rendering them in the UI, allowing for creating reactive components that can be re-used and composed together, as well as reacting to user input from the UI.

Below are some examples to demonstrate some of the functionality you can do so far with deephaven.ui. At this point it is only showcasing the subset of the planned functionality that has been implemented, but should give an idea of what is possible. Most notably, all examples will only appear within one panel in the UI, the `ui.table` functionality (allowing interactivity and customization of displayed tables), and ability to use other plugins (such as deephaven.plot.express) is not yet implemented.

You can run the example Docker container with the following command:

```
docker run --rm --name deephaven-ui -p 10000:10000 ghcr.io/deephaven/server-ui:edge
```

You'll need to find the link to open the UI in the Docker logs:
![docker](assets/docker.png)

# Basic `use_state` Examples

deephaven.ui uses functional components with "hooks" to create components. The most useful and basic hook is the `use_state` hook, which allows you to create a stateful component. The `use_state` hook returns a tuple of the current value of the state and a function to update the state. The function returned by `use_state` can be called with a new value to update the state, and the component will re-render with the new value. People familiar with React will be familiar with this paradigm.

The below examples show a simple usage of the `use_state` hook, building some of the basic examples on the [React useState docs](https://react.dev/reference/react/useState#examples-basic).

## Counter (number)

A simple example to demonstrate how state can be used using the `use_state` hook. `count` holds the value of the counter, and pressing the button increments the number.

We define our `counter` component as a function using the `@ui.component` decorator. This decorator allows the component to be rendered in the UI, when we assign the result of it to a value with the `c = counter()` line. The `counter` function returns a `ui.action_button` component, which is a [button that can be pressed](https://react-spectrum.adobe.com/react-spectrum/ActionButton.html). The `on_press` argument is a callback that is called when the button is pressed. In this case, we call the `set_count` function returned by `use_state` to update the value of `count`.

```python
import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def counter():
    count, set_count = use_state(0)
    return ui.action_button(
        f"You pressed me {count} times", on_press=lambda: set_count(count + 1)
    )


c = counter()
```

![Counter](assets/counter.png)

## Text field (string)

You can create a [TextField](https://react-spectrum.adobe.com/react-spectrum/TextField.html) that takes input from the user.

```python
import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def my_input():
    text, set_text = use_state("hello")

    return [ui.text_field(value=text, on_change=set_text), ui.text(f"You typed {text}")]


mi = my_input()
```

![Text Field](assets/text_field.png)

## Checkbox (boolean)

You can use a [checkbox](https://react-spectrum.adobe.com/react-spectrum/Checkbox.html) to get a boolean value from the user.

```python
import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def checkbox_example():
    liked, set_liked = use_state(True)
    return [
        ui.checkbox("I liked this", is_selected=liked, on_change=set_liked),
        ui.text("You liked this" if liked else "You didn't like this"),
    ]


ce = checkbox_example()
```

![Checkbox](assets/checkbox.png)

## Form (two variables)

You can have state with multiple different variables in one component. In this example, we have a [text field](https://react-spectrum.adobe.com/react-spectrum/TextField.html) and a [slider](https://react-spectrum.adobe.com/react-spectrum/Slider.html), and we display the values of both of them.

```python
import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def form_example():
    name, set_name = use_state("Homer")
    age, set_age = use_state(36)

    return [
        ui.text_field(value=name, on_change=set_name),
        ui.slider(value=age, on_change=set_age),
        ui.text(f"Hello {name}, you are {age} years old"),
    ]


fe = form_example()
```

# Data Examples

Many of the examples below use the stocks table provided by `deephaven.plot.express` package:

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()
```

## Table with input filter

You can take input from a user to filter a table using the `where` method. In this example, we have a [text field](https://react-spectrum.adobe.com/react-spectrum/TextField.html) that takes input from the user, and we filter the table based on the input. By simply returning the table `t` from the component, it will be displayed in the UI (as if we had set it to a variable name).

```python
import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def text_filter_table(source, column):
    value, set_value = use_state("FISH")
    t = source.where(f"{column}=`{value}`")
    return [ui.text_field(value=value, on_change=set_value), t]


pp = text_filter_table(stocks, "sym")
```

![Text Filter Table](assets/text_filter_table.png)

## Table with required filters

In the previous example, we took a users input. But we didn't display anything if the user didn't enter any text. We can display a different message prompting the user for input if they haven't entered anything. We use a few new components in this example:

- [IllustratedMessage](https://react-spectrum.adobe.com/react-spectrum/IllustratedMessage.html) (ui.illustrated_message): A component that displays an icon, heading, and content. In this case, we display a warning icon, a heading, and some content.
- [Icon](https://react-spectrum.adobe.com/react-spectrum/Icon.html) (ui.icon): A component that displays an icon. In this case, we display the warning icon, and set the font size to 48px so it appears large in the UI.
- [Flex](https://react-spectrum.adobe.com/react-spectrum/Flex.html) (ui.flex): A component that displays its children in a row. In this case, we display the input text fields beside eachother in a row.

```python
import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def stock_widget_table(source, default_sym="", default_exchange=""):
    sym, set_sym = use_state(default_sym)
    exchange, set_exchange = use_state(default_exchange)

    ti1 = ui.text_field(
        label="Sym", label_position="side", value=sym, on_change=set_sym
    )
    ti2 = ui.text_field(
        label="Exchange", label_position="side", value=exchange, on_change=set_exchange
    )
    error_message = ui.illustrated_message(
        ui.icon("vsWarning", style={"fontSize": "48px"}),
        ui.heading("Invalid Input"),
        ui.content("Please enter 'Sym' and 'Exchange' above"),
    )
    t1 = (
        source.where([f"sym=`{sym.upper()}`", f"exchange=`{exchange.upper()}`"])
        if sym and exchange
        else error_message
    )

    return [ui.flex(ti1, ti2), t1]


swt = stock_widget_table(stocks, "", "")
```

![Stock Widget Table Invalid Input](assets/stock_widget_table_invalid.png)

![Stock Widget Table Valid Input](assets/stock_widget_table_valid.png)

## Plot with filters

You can also do plots as you would expect.

```python
import deephaven.ui as ui
from deephaven.ui import use_state
from deephaven.plot.figure import Figure


@ui.component
def stock_widget_plot(source, default_sym="", default_exchange=""):
    sym, set_sym = use_state(default_sym)
    exchange, set_exchange = use_state(default_exchange)

    ti1 = ui.text_field(
        label="Sym", label_position="side", value=sym, on_change=set_sym
    )
    ti2 = ui.text_field(
        label="Exchange", label_position="side", value=exchange, on_change=set_exchange
    )
    t1 = source.where([f"sym=`{sym.upper()}`", f"exchange=`{exchange}`"])
    p = (
        Figure()
        .plot_xy(series_name=f"{sym}-{exchange}", t=t1, x="timestamp", y="price")
        .show()
    )

    return [ui.flex(ti1, ti2), t1, p]


swp = stock_widget_plot(stocks, "CAT", "TPET")
```

![Stock Widget Plot](assets/stock_widget_plot.png)

# Other Examples

## Memoization

We can use the `use_memo` hook to memoize a value. This is useful if you have a value that is expensive to compute, and you only want to compute it when the inputs change. In this example, we create a time table with a new column `y_sin` that is a sine wave. We use `use_memo` to memoize the time table, so that it is only re-computed when the inputs to the `use_memo` function change (in this case, the function is a lambda that takes no arguments, so it will only re-compute when the dependencies change, which is never). We then use the `update` method to update the table with the new column, based on the values inputted on the sliders.

```python
import deephaven.ui as ui
from deephaven.ui import use_memo, use_state
from deephaven import time_table


@ui.component
def waves():
    amplitude, set_amplitude = use_state(1)
    frequency, set_frequency = use_state(1)
    phase, set_phase = use_state(1)

    tt = use_memo(lambda: time_table("PT1s").update("x=i"), [])
    t = tt.update_view([f"y_sin={amplitude}*Math.sin({frequency}*x+{phase})"])

    return ui.flex(
        ui.flex(
            ui.slider(
                label="Amplitude",
                default_value=amplitude,
                min_value=-100,
                max_value=100,
                on_change=set_amplitude,
            ),
            ui.slider(
                label="Frequency",
                default_value=frequency,
                min_value=-100,
                max_value=100,
                on_change=set_frequency,
            ),
            ui.slider(
                label="Phase",
                default_value=phase,
                min_value=-100,
                max_value=100,
                on_change=set_phase,
            ),
            direction="column",
        ),
        t,
        flex_grow=1,
    )


w = waves()
```

![Waves](assets/waves.png)

## Custom hook

We can write custom hooks that can be re-used. In this example, we create a custom hook that creates an input panel that controls the amplitude, frequency, and phase for a wave. We then use this custom hook in our `waves` component.

```python
import deephaven.ui as ui
from deephaven.ui import use_memo, use_state
from deephaven import time_table


def use_wave_input():
    """
    Demonstrating a custom hook.
    Creates an input panel that controls the amplitude, frequency, and phase for a wave
    """
    amplitude, set_amplitude = use_state(1.0)
    frequency, set_frequency = use_state(1.0)
    phase, set_phase = use_state(1.0)

    input_panel = ui.flex(
        ui.slider(
            label="Amplitude",
            default_value=amplitude,
            min_value=-100.0,
            max_value=100.0,
            on_change=set_amplitude,
            step=0.1,
        ),
        ui.slider(
            label="Frequency",
            default_value=frequency,
            min_value=-100.0,
            max_value=100.0,
            on_change=set_frequency,
            step=0.1,
        ),
        ui.slider(
            label="Phase",
            default_value=phase,
            min_value=-100.0,
            max_value=100.0,
            on_change=set_phase,
            step=0.1,
        ),
        direction="column",
    )

    return amplitude, frequency, phase, input_panel


@ui.component
def waves():
    amplitude, frequency, phase, wave_input = use_wave_input()

    tt = use_memo(lambda: time_table("PT1s").update("x=i"), [])
    t = tt.update([f"y_sin={amplitude}*Math.sin({frequency}*x+{phase})"])

    return ui.flex(wave_input, t, flex_grow=1)


w = waves()
```

![Wave Input](assets/wave_input.png)

We can then re-use that hook to make a component that displays a plot as well:

```python
import deephaven.ui as ui
from deephaven.ui import use_memo
from deephaven.plot.figure import Figure


@ui.component
def waves_with_plot():
    amplitude, frequency, phase, wave_input = use_wave_input()

    tt = use_memo(lambda: time_table("PT1s").update("x=i"), [])
    t = use_memo(
        lambda: tt.update(
            [
                f"y_sin={amplitude}*Math.sin({frequency}*x+{phase})",
            ]
        ),
        [amplitude, frequency, phase],
    )
    p = use_memo(
        lambda: Figure().plot_xy(series_name="Sine", t=t, x="x", y="y_sin").show(), [t]
    )

    return ui.flex(wave_input, ui.flex(t, max_width=200), p, flex_grow=1)


wp = waves_with_plot()
```

![Waves with plot](assets/waves_with_plot.png)

## Using Panels

When you return an array of elements, they automatically get created as individual panels. You can use the `ui.panel` component to name the panel.

```python
from deephaven import ui
from deephaven.ui import use_state
from deephaven.plot.figure import Figure


@ui.component
def multiwave():
    amplitude, frequency, phase, wave_input = use_wave_input()

    tt = use_memo(lambda: time_table("PT1s").update("x=i"), [])
    t = use_memo(
        lambda: tt.update(
            [
                f"y_sin={amplitude}*Math.sin({frequency}*x+{phase})",
                f"y_cos={amplitude}*Math.cos({frequency}*x+{phase})",
                f"y_tan={amplitude}*Math.tan({frequency}*x+{phase})",
            ]
        ),
        [amplitude, frequency, phase],
    )
    p_sin = use_memo(
        lambda: Figure().plot_xy(series_name="Sine", t=t, x="x", y="y_sin").show(), [t]
    )
    p_cos = use_memo(
        lambda: Figure().plot_xy(series_name="Cosine", t=t, x="x", y="y_cos").show(),
        [t],
    )
    p_tan = use_memo(
        lambda: Figure().plot_xy(series_name="Tangent", t=t, x="x", y="y_tan").show(),
        [t],
    )

    return [
        ui.panel(wave_input, title="Wave Input"),
        ui.panel(t, title="Wave Table"),
        ui.panel(p_sin, title="Sine"),
        ui.panel(p_cos, title="Cosine"),
        ui.panel(p_tan, title="Tangent"),
    ]


mw = multiwave()
```

## Re-using components

In a previous example, we created a text_filter_table component. We can re-use that component, and display two tables with an input filter side-by-side:

```python
import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def text_filter_table(source, column, default_value=""):
    value, set_value = use_state(default_value)
    return ui.flex(
        ui.text_field(
            label=column, label_position="side", value=value, on_change=set_value
        ),
        source.where(f"{column}=`{value}`"),
        direction="column",
        flex_grow=1,
    )


@ui.component
def double_table(source):
    return ui.flex(
        text_filter_table(source, "sym", "FISH"),
        text_filter_table(source, "exchange", "PETX"),
        flex_grow=1,
    )


dt = double_table(stocks)
```

![Double Table](assets/double_table.png)

## Stock rollup

You can use the `rollup` method to create a rollup table. In this example, we create a rollup table that shows the average price of each stock and/or exchange. You can toggle the rollup by clicking on the [ToggleButton](https://react-spectrum.adobe.com/react-spectrum/ToggleButton.html). You can also highlight a specific stock by entering the symbol in the text field.

```python
import deephaven.ui as ui
from deephaven.ui import use_memo, use_state
from deephaven import agg
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def get_by_filter(**byargs):
    """
    Gets a by filter where the arguments are all args passed in where the value is true.

    Examples:
        get_by_filter(sym=True, exchange=False) == ["sym"]
        get_by_filter(exchange=False) == []
        get_by_filter(sym=True, exchange=True) == ["sym", "exchange"]

    """
    return [k for k in byargs if byargs[k]]


@ui.component
def stock_table(source):
    is_sym, set_is_sym = use_state(False)
    is_exchange, set_is_exchange = use_state(False)
    highlight, set_highlight = use_state("")
    aggs, set_aggs = use_state(agg.avg(cols=["size", "price", "dollars"]))

    by = get_by_filter(sym=is_sym, exchange=is_exchange)

    formatted_table = use_memo(
        lambda: source.format_row_where(f"sym=`{highlight}`", "LEMONCHIFFON"),
        [source, highlight],
    )
    rolled_table = use_memo(
        lambda: formatted_table
        if len(by) == 0
        else formatted_table.rollup(aggs=aggs, by=by),
        [formatted_table, aggs, by],
    )

    return ui.flex(
        ui.flex(
            ui.toggle_button(ui.icon("vsSymbolMisc"), "By Sym", on_change=set_is_sym),
            ui.toggle_button(
                ui.icon("vsBell"), "By Exchange", on_change=set_is_exchange
            ),
            ui.text_field(
                label="Highlight Sym",
                label_position="side",
                value=highlight,
                on_change=set_highlight,
            ),
            ui.contextual_help(
                ui.heading("Highlight Sym"),
                ui.content("Enter a sym you would like highlighted."),
            ),
            align_items="center",
            gap="size-100",
            margin="size-100",
            margin_bottom="0",
        ),
        rolled_table,
        direction="column",
        flex_grow=1,
    )


st = stock_table(stocks)
```

![Stock Rollup](assets/stock_rollup.png)
