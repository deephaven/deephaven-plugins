import deephaven.ui as ui
from deephaven.ui import use_state


@ui.component
def form_example():
    name, set_name = use_state("Homer")
    age, set_age = use_state(36)

    return [
        ui.text_field(value=name, on_change=set_name),
        ui.slider(value=age, on_change=set_age),
        ui.text(f"Hello {name}, you are {age} years old"),
    ]


fe = form_example()
