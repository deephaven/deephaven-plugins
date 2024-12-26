# Disclosure

A collapsible section of content with a heading that toggles the visibility of a panel.

## Example

```python
from deephaven import ui

my_disclosure_basic = ui.disclosure(title="Heading", panel="Content")
```

## Events

Disclosure accepts an `on_expanded_change` prop which triggers when it is expanded or collapsed.

```python
from deephaven import ui


@ui.component
def ui_toggle_disclosure():
    is_expanded, set_is_expanded = ui.use_state(False)

    return ui.flex(
        ui.disclosure(
            title="Heading",
            panel="Content",
            on_expanded_change=lambda: set_is_expanded(
                True if is_expanded == False else False
            ),
        ),
        ui.text("Expanded" if is_expanded == True else "Collapsed"),
        direction="column",
    )


my_toggle_disclosure = ui_toggle_disclosure()
```

## Variants

```python
from deephaven import ui


@ui.component
def ui_disclosure_variants():

    return [
        ui.disclosure("Or", variant="or"),
        ui.disclosure("And", variant="and"),
    ]


my_disclosure_variants = ui_disclosure_variants()
```

## Disabled state

```python
from deephaven import ui

my_disclosure_disabled = ui.disclosure(
    title="Heading", panel="Content", is_disabled=True
)
```

## Quiet state

```python
from deephaven import ui

my_disclosure_disabled = ui.disclosure(title="Heading", panel="Content", is_quiet=True)
```

## Expanded state

```python
from deephaven import ui

my_disclosure_disabled = ui.disclosure(
    title="Heading", panel="Content", default_expanded=True
)
```
