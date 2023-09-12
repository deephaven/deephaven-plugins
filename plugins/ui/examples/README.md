# Data

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()
```

# Simple table with required filters

```python
import deephaven.ui as ui
from deephaven.ui.hooks import *


@ui.component
def stock_widget_table(source, default_sym="", default_exchange=""):
    sym, set_sym = use_state(default_sym)
    exchange, set_exchange = use_state(default_exchange)

    ti1 = ui.text_field(sym, on_change=set_sym)
    ti2 = ui.text_field(exchange, on_change=set_exchange)
    t1 = (
        source.where([f"sym=`{sym.upper()}`", f"exchange=`{exchange.upper()}`"])
        if sym and exchange
        else ui.text("Please enter Sym and Exchange Above")
    )

    return [ti1, ti2, t1]


swt = stock_widget_table(stocks, "", "")
```

# Simple Plot with filters

```python
import deephaven.ui as ui
from deephaven.ui.hooks import *
from deephaven.plot.figure import Figure


@ui.component
def stock_widget_plot(source, default_sym="", default_exchange=""):
    sym, set_sym = use_state(default_sym)
    exchange, set_exchange = use_state(default_exchange)

    ti1 = ui.text_field(sym, on_change=set_sym)
    ti2 = ui.text_field(exchange, on_change=set_exchange)
    t1 = source.where([f"sym=`{sym.upper()}`", f"exchange=`{exchange}`"])
    p = (
        Figure()
        .plot_xy(series_name=f"{sym}-{exchange}", t=t1, x="timestamp", y="price")
        .show()
    )

    return [ti1, ti2, t1, p]


swp = stock_widget_plot(stocks, "CAT", "TPET")
```

# Listener

Really janky, and crashes

```python
import deephaven.ui as ui
from deephaven.ui.hooks import *
from deephaven import time_table

# Create a ticking table that we can listen to
table = time_table("PT1S").update(formulas=["X=i"]).tail(5)


@ui.component
def listening_component(source):
    value, set_value = use_state("Listening...")

    # Function that will be called whenever the table is updated
    def handle_update(update, is_replay):
        set_value(f"{update}")

    use_table_listener(source, handle_update)

    # Display the current update
    return ui.text(value)


lc = listening_component(table)
```
