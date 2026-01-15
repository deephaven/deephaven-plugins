# Dashboard for theme testing - contains table, chart, markdown, and UI controls
from deephaven import ui
import deephaven.plot.express as dx

# Get stocks data (non-ticking for stable screenshots)
_stocks = dx.data.stocks(ticking=False).tail(100)

_last_prices = _stocks.last_by("Sym")
_chart = dx.bar(_last_prices, x="Sym", y="Price", by="Sym")

# Fibonacci code example for markdown panel
_fibonacci_code = """
# Fibonacci Sequence Generator

```python
def fibonacci(n: int) -> list[int]:
    if n <= 0:
        return []
    if n == 1:
        return [0]

    sequence = [0, 1]
    while len(sequence) < n:
        next_val = sequence[-1] + sequence[-2]
        sequence.append(next_val)

    return sequence


# Generate first 10 Fibonacci numbers
fib_10 = fibonacci(10)
print(fib_10)
# Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```
"""


@ui.component
def theme_controls():
    """Component with basic UI controls for theme testing."""
    theme_name, set_theme_name = ui.use_state("")
    count, set_count = ui.use_state(0)

    return [
        ui.text_field(
            label="Current Theme",
            value=theme_name,
            on_change=set_theme_name,
            id="theme-name-input",
        ),
        ui.button(
            f"Clicked {count} times",
            on_press=lambda _: set_count(count + 1),
        ),
        ui.switch("Enable feature"),
        ui.slider(label="Opacity", default_value=75, min_value=0, max_value=100),
    ]


@ui.component
def layout():
    """Dashboard layout for theme demo."""
    return ui.column(
        ui.row(
            ui.stack(
                ui.panel(ui.table(_stocks), title="Stocks Table"),
            ),
            ui.stack(
                ui.panel(_chart, title="Price by Symbol"),
            ),
        ),
        ui.row(
            ui.stack(
                ui.panel(ui.markdown(_fibonacci_code), title="Example Code"),
            ),
            ui.stack(
                ui.panel(theme_controls(), title="Theme Controls"),
            ),
        ),
    )


theme_demo = ui.dashboard(layout())
