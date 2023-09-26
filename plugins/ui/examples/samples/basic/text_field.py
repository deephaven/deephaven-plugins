import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def my_input():
    text, set_text = use_state("hello")

    return [ui.text_field(value=text, on_change=set_text), ui.text(f"You typed {text}")]


mi = my_input()
