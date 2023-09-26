import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def counter():
    count, set_count = use_state(0)
    return ui.action_button(
        f"You pressed me {count} times", on_press=lambda: set_count(count + 1)
    )


c = counter()
