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
    t1 = (
        source.where([f"sym=`{sym.upper()}`", f"exchange=`{exchange.upper()}`"])
        if sym and exchange
        else ui.illustrated_message(
            ui.icon("vsWarning", style={"fontSize": "48px"}),
            ui.heading("Invalid Input"),
            ui.content("Please enter 'Sym' and 'Exchange' above"),
        )
    )

    return [ui.flex(ti1, ti2), t1]


swt = stock_widget_table(stocks, "", "")
