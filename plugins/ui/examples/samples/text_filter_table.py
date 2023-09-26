import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def text_filter_table(source, column):
    value, set_value = use_state("FISH")
    t = source.where(f"{column}=`{value}`")
    return [ui.text_field(value=value, on_change=set_value), t]


pp = text_filter_table(stocks, "sym")
