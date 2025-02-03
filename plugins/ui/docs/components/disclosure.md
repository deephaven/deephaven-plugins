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
            is_expanded=is_expanded,
            on_expanded_change=lambda: set_is_expanded(not is_expanded),
        ),
        ui.text("Disclosure is ", "expanded" if is_expanded else "collapsed"),
        direction="column",
    )


my_toggle_disclosure = ui_toggle_disclosure()
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

my_disclosure_expanded = ui.disclosure(
    title="Heading", panel="Content", default_expanded=True
)
```
