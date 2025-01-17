# Accordion
A collection of expandable and collapsible disclosure elements

## Example

```python
from deephaven import ui

my_accordion_basic = ui.accordion(
    ui.disclosure(title="FAQ #1", panel="Answer"),
    ui.disclosure(title="FAQ #2", panel="Answer"),
)
```

## Events

Accordion accepts an `on_expanded_change` prop which triggers when a disclosure element is expanded or collapsed.

```python
from deephaven import ui


@ui.component
def ui_accordion_event():
    expanded_keys, set_expanded_keys = ui.use_state([])

    def handle_expanded_keys_change(e):
        set_expanded_keys(e)
        print("Expanded key changed")

    return ui.accordion(
        ui.disclosure(title="FAQ #1", panel="Answer", id="a"),
        ui.disclosure(title="FAQ #2", panel="Answer", id="b"),
        expanded_keys=expanded_keys,
        on_expanded_change=lambda k: set_expanded_keys(k),
    )


my_accordion_event = ui_accordion_event()
```

## Disabled state

```python
from deephaven import ui

my_accordion_disabled = ui.accordion(
    ui.disclosure(title="FAQ #1", panel="Answer"),
    ui.disclosure(title="FAQ #2", panel="Answer"),
    is_disabled=True,
)
```

## Quiet State

```python
from deephaven import ui

my_accordion_quiet = ui.accordion(
    ui.disclosure(title="FAQ #1", panel="Answer"),
    ui.disclosure(title="FAQ #2", panel="Answer"),
    is_quiet=True,
)
```