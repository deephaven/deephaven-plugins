import deephaven.ui as ui
from deephaven.ui import use_memo, use_state
from deephaven import agg
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def get_by_filter(**byargs):
    """
    Gets a by filter where the arguments are all args passed in where the value is true.
    e.g.
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

    t = use_memo(
        lambda: source.format_row_where(f"sym=`{highlight}`", "LEMONCHIFFON"),
        [source, highlight],
    )
    t = use_memo(
        lambda: t if len(by) == 0 else t.rollup(aggs=aggs, by=by), [t, aggs, by]
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
        ),
        t,
        direction="column",
        flex_grow=1,
    )


st = stock_table(stocks)
