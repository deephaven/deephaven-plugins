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
def ui_slow_text_area_component(initial: str = "hello"):
    """Text area whose on_change is slow and transforms the value to uppercase.

    Used for verifying that lagging server updates do not clobber what the
    user is currently typing while focused.
    """
    text, set_text = ui.use_state(initial)

    def handle_change(new_value: str):
        # Simulate slow server-side processing.
        time.sleep(1.5)
        set_text(new_value.upper())

    return ui.text_area(
        label="Slow Area",
        value=text,
        on_change=handle_change,
    )


ui_slow_text_area = ui_slow_text_area_component()


@ui.component
def ui_slow_search_field_component(initial: str = "hello"):
    """Search field whose on_change is slow and transforms the value to uppercase.

    Used for verifying that lagging server updates do not clobber what the
    user is currently typing while focused.
    """
    text, set_text = ui.use_state(initial)

    def handle_change(new_value: str):
        # Simulate slow server-side processing.
        time.sleep(1.5)
        set_text(new_value.upper())

    return ui.search_field(
        label="Slow Search",
        value=text,
        on_change=handle_change,
    )


ui_slow_search_field = ui_slow_search_field_component()


@ui.component
def ui_slow_number_field_component(initial: float = 1):
    """Number field whose on_change is slow and increments the value.

    Used for verifying that lagging server updates do not clobber what the
    user is currently typing while focused.
    """
    number, set_number = ui.use_state(initial)

    def handle_change(new_value: float):
        # Simulate slow server-side processing.
        time.sleep(1.5)
        set_number(new_value + 1)

    return ui.number_field(
        label="Slow Number",
        value=number,
        on_change=handle_change,
    )


ui_slow_number_field = ui_slow_number_field_component()


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


@ui.component
def ui_text_area_events_component(initial: str = "hi"):
    """Text area that logs on_focus, on_change, on_blur events to a textarea.

    Used by the e2e test to verify the events fire with the expected payloads,
    including the `value` field on the focus events.
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
        ui.text_area(
            label="Events Area",
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


ui_text_area_events = ui_text_area_events_component()


@ui.component
def ui_number_field_events_component(initial: float = 1):
    """Number field that logs on_focus, on_change, on_blur events to a textarea.

    Used by the e2e test to verify the events fire with the expected payloads,
    including the `value` field on the focus events.
    """
    log, set_log = ui.use_state("")

    def append(entry: str):
        set_log(lambda prev: f"{prev}{entry}\n" if prev else f"{entry}\n")

    def handle_focus(e: dict) -> None:
        append(f"focus:{e.get('value')}")

    def handle_change(new_value: float) -> None:
        append(f"change:{new_value}")

    def handle_blur(e: dict) -> None:
        append(f"blur:{e.get('value')}")

    return ui.flex(
        ui.number_field(
            label="Events Number",
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


ui_number_field_events = ui_number_field_events_component()


@ui.component
def ui_search_field_events_component(initial: str = "hi"):
    """Search field that logs on_focus, on_change, on_blur events to a textarea.

    Used by the e2e test to verify the events fire with the expected payloads,
    including the `value` field on the focus events.
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
        ui.search_field(
            label="Events Search",
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


ui_search_field_events = ui_search_field_events_component()
