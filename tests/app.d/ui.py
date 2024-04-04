import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def my_component():
    count, set_count = use_state(0)
    text, set_text = use_state("hello")

    return ui.flex(
        ui.action_button(
            f"You pressed me {count} times", on_press=lambda _: set_count(count + 1)
        ),
        ui.text_field(value=text, on_change=set_text),
        ui.text(f"You typed {text}"),
        direction="column",
    )


ui_component = my_component()
