# Logic Button

A Logic Button shows an operator in a boolean logic sequence.

## Example

```python
from deephaven import ui

my_logic_button_basic = ui.logic_button("Or", variant="or")
```

## Events

Logic buttons handles user interaction through the `on_press` prop.

```python
from deephaven import ui


@ui.component
def ui_toggle_logic_button():
    variant, set_variant = ui.use_state("or")

    return ui.logic_button(
        variant,
        variant=variant,
        on_press=lambda: set_variant("and" if variant == "or" else "or"),
    )


my_toggle_logic_button = ui_toggle_logic_button()
```

## Variants

```python
from deephaven import ui


@ui.component
def ui_logic_button_variants():

    return [
        ui.logic_button("Or", variant="or"),
        ui.logic_button("And", variant="and"),
    ]


my_logic_button_variants = ui_logic_button_variants()
```

## Disabled state

```python
from deephaven import ui

my_logic_button_disabled = ui.logic_button("Or", variant="or", is_disabled=True)
```
