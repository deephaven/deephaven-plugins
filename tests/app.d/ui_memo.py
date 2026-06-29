from deephaven import ui
import random


@ui.component(memo=True)
def memo_greeting(name: str):
    """Memoized component that takes an input (``name``) and renders a child.

    Because it is memoized, it only re-renders when ``name`` changes. This lets
    us verify that the child renders correctly after an input change, but is
    skipped when unrelated parent state (the count) updates.
    """
    return ui.text(f"Hello, {name}!", UNSAFE_class_name="memo-greeting")


@ui.component(memo=True)
def memo_random_value(label: str):
    """Memoized component that renders a random value.

    The random value is generated during render. Because the component is
    memoized and its ``label`` prop never changes, it should not re-render when
    the parent updates, so the value stays the same across parent re-renders.
    """
    value = random.randint(0, 1_000_000_000)
    return ui.text(f"Random: {value}", UNSAFE_class_name="memo-random")


@ui.component
def ui_memo_example_component():
    count, set_count = ui.use_state(0)
    value, set_value = ui.use_state("World")

    return ui.flex(
        ui.button("Increment", on_press=lambda: set_count(count + 1)),
        ui.text(f"Count: {count}", UNSAFE_class_name="memo-count"),
        ui.text_field(default_value=value, on_change=set_value, label="Input value"),
        memo_greeting(value),  # Won't re-render when count changes
        memo_random_value("constant"),  # Random value stays the same on re-render
        direction="column",
    )


ui_memo_example = ui_memo_example_component()
