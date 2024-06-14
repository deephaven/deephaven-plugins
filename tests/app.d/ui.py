from deephaven import ui


@ui.component
def ui_basic_component():
    count, set_count = ui.use_state(0)
    text, set_text = ui.use_state("hello")

    return ui.flex(
        ui.action_button(
            f"You pressed me {count} times", on_press=lambda _: set_count(count + 1)
        ),
        ui.text_field(value=text, on_change=set_text),
        ui.text(f"You typed {text}"),
        direction="column",
    )


@ui.component
def ui_boom_component():
    raise Exception("BOOM!")


@ui.component
def ui_boom_counter_component():
    value, set_value = ui.use_state(0)

    if value > 1:
        raise ValueError("BOOM! Value too big.")

    return ui.button(f"Count is {value}", on_press=lambda _: set_value(value + 1))


ui_component = ui_basic_component()
ui_boom = ui_boom_component()
ui_boom_counter = ui_boom_counter_component()
