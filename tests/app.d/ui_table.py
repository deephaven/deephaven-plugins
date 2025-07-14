from deephaven import ui
from deephaven import empty_table
import deephaven.plot.express as dx

_t = empty_table(100).update(["x = i", "y = sin(i)"])
_stocks = dx.data.stocks(False)

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
    _stocks,
    format_=[
        ui.TableFormat(value="0.00"),
        ui.TableFormat(cols="Timestamp", value="MM/dd/yyyy"),
        ui.TableFormat(cols=["Price", "Dollars"], value="$0.00"),
    ],
)

t_display_names = ui.table(
    _stocks,
    column_display_names={"Price": "Price (USD)", "Dollars": "$$$"},
)

from deephaven import ui
import deephaven.plot.express as dx


@ui.component
def toggle_table_component():
    with_format, set_with_format = ui.use_state(True)
    with_lower, set_with_lower = ui.use_state(False)
    with_databars, set_with_databars = ui.use_state(True)
    t = ui.use_memo(
        lambda: dx.data.stocks().update("SymColor=Sym==`FISH` ? `positive` : `salmon`"),
        [],
    )
    return [
        ui.flex(
            ui.button(
                f"Turn formatting {'off' if with_format else 'on'}",
                on_press=lambda _: set_with_format(lambda prev: not prev),
            ),
            ui.button(
                f"Turn databars {'off' if with_databars else 'on'}",
                on_press=lambda _: set_with_databars(lambda prev: not prev),
            ),
            ui.button(
                "Original case" if with_lower else "Lowercase",
                on_press=lambda _: set_with_lower(lambda prev: not prev),
            ),
            direction="row",
        ),
        ui.table(
            t,
            hidden_columns=["SymColor"],
            format_=(
                [
                    ui.TableFormat(value="0.00%"),
                    ui.TableFormat(cols="Timestamp", value="E, dd MMM yyyy HH:mm:ss z"),
                    ui.TableFormat(cols="Size", color="info", if_="Size < 10"),
                    ui.TableFormat(cols="Size", color="notice", if_="Size > 100"),
                    ui.TableFormat(cols=["Sym", "Exchange"], alignment="center"),
                    ui.TableFormat(
                        cols=["Sym", "Exchange"],
                        background_color="negative",
                        if_="Sym=`CAT`",
                    ),
                    ui.TableFormat(if_="Sym=`DOG`", color="oklab(0.6 -0.3 -0.25)"),
                    ui.TableFormat(cols="Sym", color="SymColor"),
                ]
                if with_format
                else None
            ),
            column_display_names=(
                {item: item.lower() for item in t.column_names} if with_lower else None
            ),
            databars=(
                [
                    {"column": "Random", "value_placement": "hide"},
                    {
                        "column": "SPet500",
                        "color": "info",
                        "value_placement": "overlap",
                    },
                    {
                        "column": "Size",
                        "max": 1000,
                        "direction": "RTL",
                        "color": ["notice", "positive"],
                    },
                    {
                        "column": "Sym",
                        "value_column": "Price",
                        "color": ["magenta-200", "magenta-800"],
                    },
                ]
                if with_databars
                else None
            ),
        ),
    ]


toggle_table = toggle_table_component()

aggs = [
    ui.TableAgg("count", cols=["Sym", "Exchange"]),
    ui.TableAgg("MAX", ignore_cols="Timestamp"),
    ui.TableAgg("Min", cols="Random"),
    ui.TableAgg("FiRsT", ignore_cols=["Sym", "Exchange"]),
    ui.TableAgg("Last"),
]

t_bottom_agg = ui.table(
    _stocks,
    aggregations=aggs,
)

t_top_agg = ui.table(
    _stocks,
    aggregations=aggs,
    aggregations_position="top",
)

t_single_agg = ui.table(
    _stocks,
    aggregations=ui.TableAgg("sum"),
)


@ui.component
def t_selection_component():
    selection, set_selection = ui.use_state([])
    selection_str = (
        ", ".join(
            [f"{row['Sym']['text']}/{row['Exchange']['text']}" for row in selection]
        )
        if len(selection) > 0
        else "None"
    )
    return ui.flex(
        ui.text(
            f"Selection: {selection_str}",
        ),
        ui.table(
            _stocks,
            on_selection_change=lambda d: set_selection(d),
            always_fetch_columns=["Sym", "Exchange"],
        ),
        direction="column",
    )


t_selection = t_selection_component()
