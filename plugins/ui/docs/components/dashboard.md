# Dashboard

Dashboards allow you to layout a collection of ui components as panels as individuals pages.

## Rules
1. Dashboards must be a child of the root script and not nested inside a `@ui.component`. Otherwise the application is unable to correctly determine the type of the component
2. Dashboards must have one and only one child, typically a row or column.
3. Height and width of panels are summed to 100%

## Key Components
There are 3 main children that make up dashboard: row, column, and stack.

- **Row**: A container used to group elements horizontally. Each element is placed to the right of the previous one.
- **Column**: A container used to group elements vertically. Each element is placed below the previous one.
- **Stack**: A container used to group elements into tabs. Each element gets its own tab, with only one element visible at a time.

## Layout Examples
### Row split (2x1)
```python
from deephaven import ui

my_dash = ui.dashboard(ui.row(ui.panel("A"), ui.panel("B")))
```

### Column split (1x2)
```python
from deephaven import ui

my_dash = ui.dashboard(ui.column(ui.panel("A"), ui.panel("B")))
```

### 2x2
```python
from deephaven import ui

my_dash = ui.dashboard(
    ui.row(
        ui.column(ui.panel("A"), ui.panel("C")), ui.column(ui.panel("B"), ui.panel("D"))
    )
)
```

### 3x1
```python
from deephaven import ui

my_dash = ui.dashboard(ui.row(ui.panel("A"), ui.panel("B"), ui.panel("C")))
```

### Basic stack
```python
from deephaven import ui

my_dash = ui.dashboard(ui.stack(ui.panel("A"), ui.panel("B"), ui.panel("C")))
```

### Stack in a layout
```python
from deephaven import ui

my_dash = ui.dashboard(
    ui.row(
        ui.stack(ui.panel("A"), ui.panel("B"), ui.panel("C")),
        ui.panel("D"),
        ui.panel("E"),
    )
)
```

### Varying widths
```python
from deephaven import ui

my_dash = ui.dashboard(ui.row(ui.stack(ui.panel("A"), width=70), ui.panel("B")))
```

### Varying height
```python
from deephaven import ui

my_dash = ui.dashboard(ui.column(ui.stack(ui.panel("A"), height=70), ui.panel("B")))
```

### Holy Grail
```python
from deephaven import ui

my_dash = ui.dashboard(
    ui.column(
        ui.panel("Header"),
        ui.row(
            ui.panel("Left Sidebar"),
            ui.stack(ui.panel("Main Content"), width=70),
            ui.panel("Right Sidebar"),
        ),
        ui.panel("Footer"),
    )
)
```

## Stateful Example
### Simple
```python
from deephaven import ui


@ui.component
def layout():
    message, set_message = ui.use_state("Hello! How are you doing today?")

    return ui.row(
        ui.panel(ui.text_field(value=message, on_change=set_message, width="100%")),
        ui.panel(message),
    )


my_dash = ui.dashboard(layout())
```

### Complex
```python
from deephaven import ui, time_table
from deephaven.ui import use_memo, use_state
from deephaven.plot.figure import Figure


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

    return ui.column(
        ui.row(
            ui.stack(
                ui.panel(wave_input, title="Wave Input"),
                ui.panel(t, title="Wave Table"),
                activeItemIndex=0,
            ),
            height=25,
        ),
        ui.row(
            ui.stack(ui.panel(p_sin, title="Sine"), width=50),
            ui.stack(ui.panel(p_cos, title="Cosine"), width=30),
            ui.stack(ui.panel(p_tan, title="Tangent")),
        ),
    )


mw = ui.dashboard(multiwave())
```