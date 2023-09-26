import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def checkbox_example():
    liked, set_liked = use_state(True)
    return [
        ui.checkbox("I liked this", is_selected=liked, on_change=set_liked),
        ui.text("You liked this" if liked else "You didn't like this"),
    ]


ce = checkbox_example()
