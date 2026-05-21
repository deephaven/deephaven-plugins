from deephaven import ui
import time


@ui.component
def ui_slow_text_field_component(initial: str = "hello"):
    """Text field whose on_change is slow and transforms the value to uppercase.

    Used for verifying that lagging server updates do not clobber what the
    user is currently typing while focused.
    """
    text, set_text = ui.use_state(initial)

    def handle_change(new_value: str):
        # Simulate slow server-side processing.
        time.sleep(1.5)
        set_text(new_value.upper())

    return ui.text_field(
        label="Slow Text",
        value=text,
        on_change=handle_change,
    )


ui_slow_text_field = ui_slow_text_field_component()


@ui.component
def ui_text_field_events_component(initial: str = "hi"):
    """Text field that logs on_focus, on_change, on_blur events to a textarea.

    Used by the e2e test to verify the events fire with the expected payloads,
    including the new `value` field on the focus events.
    """
    log, set_log = ui.use_state("")

    def append(entry: str):
        set_log(lambda prev: f"{prev}{entry}\n" if prev else f"{entry}\n")

    def handle_focus(e: dict) -> None:
        append(f"focus:{e.get('value')}")

    def handle_change(new_value: str) -> None:
        append(f"change:{new_value}")

    def handle_blur(e: dict) -> None:
        append(f"blur:{e.get('value')}")

    return ui.flex(
        ui.text_field(
            label="Events Text",
            default_value=initial,
            on_focus=handle_focus,
            on_change=handle_change,
            on_blur=handle_blur,
        ),
        ui.text_area(
            label="Event Log",
            value=log,
            is_read_only=True,
        ),
        direction="column",
    )


ui_text_field_events = ui_text_field_events_component()
