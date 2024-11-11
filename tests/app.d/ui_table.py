from deephaven import ui
from deephaven import empty_table
import deephaven.plot.express as dx

_t = empty_table(100).update(["x = i", "y = sin(i)"])

t_alignment = ui.table(
    _t,
    format_=[
        ui.TableFormat(alignment="left"),
        ui.TableFormat(cols="x", alignment="center"),
    ],
)

t_background_color = ui.table(
    _t,
    format_=[
        ui.TableFormat(cols="x", if_="x > 5", background_color="salmon"),
        ui.TableFormat(cols="y", if_="y < 0", background_color="negative"),
        ui.TableFormat(cols="y", if_="y > 0", background_color="positive"),
    ],
)

t_color = ui.table(
    _t,
    format_=[
        ui.TableFormat(background_color="subdued-content-bg"),
        ui.TableFormat(
            cols="x", if_="x > 5", color="lemonchiffon", background_color="salmon"
        ),
        ui.TableFormat(cols="y", if_="y < 0", color="negative"),
        ui.TableFormat(cols="y", if_="y > 0", color="positive"),
    ],
)

t_color_column_source = ui.table(
    _t.update("bg_color = x % 2 == 0 ? `positive` : `negative`"),
    format_=[
        ui.TableFormat(cols="x", background_color="bg_color"),
    ],
    hidden_columns=["bg_color"],
)

t_priority = ui.table(
    _t,
    format_=[
        ui.TableFormat(background_color="accent-100"),
        ui.TableFormat(background_color="accent-200", if_="x > 0"),
        ui.TableFormat(background_color="accent-300", if_="x > 1"),
        ui.TableFormat(background_color="accent-400", if_="x > 2"),
        ui.TableFormat(background_color="accent-500", if_="x > 3"),
        ui.TableFormat(background_color="accent-600", if_="x > 4"),
    ],
)

t_value_format = ui.table(
    dx.data.stocks(False),
    format_=[
        ui.TableFormat(value="0.00"),
        ui.TableFormat(cols="Timestamp", value="MM/dd/yyyy"),
        ui.TableFormat(cols=["Price", "Dollars"], value="$0.00"),
    ],
)
