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

### Single-Expanded (default)
```python
from deephaven import ui


@ui.component
def ui_accordion_event():
    expanded_keys, set_expanded_keys = ui.use_state([])

    return ui.view(
        ui.accordion(
            ui.disclosure(
                id="How can I find which Core version to which a particular feature or fix was added?",
                title="How can I find which Core version to which a particular feature or fix was added?",
                panel="At the bottom of a Deephaven Community Core commit message you can see branches and tags containing that particular change. You can browse commits in the deephaven-core GitHub repository. Click on any title for details.",
            ),
            ui.disclosure(
                id="Is docker compose required to run deephaven?",
                title="Is docker compose required to run deephaven?",
                panel="No. You can run Deephaven via Docker without compose. See here for an example. Docker compose does make customizing your deployment easier, though, so we recommend it for users who want to do that.",
            ),
            expanded_keys=expanded_keys,
            on_expanded_change=set_expanded_keys,
        ),
        ui.heading("Currently expanded: ", expanded_keys, margin_top="20px"),
    )


my_accordion_event = ui_accordion_event()
```

### Multiple-Expanded
```python
from deephaven import ui


@ui.component
def ui_accordion_event():
    expanded_keys, set_expanded_keys = ui.use_state([])

    return ui.view(
        ui.accordion(
            ui.disclosure(
                id="How can I find which Core version to which a particular feature or fix was added?",
                title="How can I find which Core version to which a particular feature or fix was added?",
                panel="At the bottom of a Deephaven Community Core commit message you can see branches and tags containing that particular change. You can browse commits in the deephaven-core GitHub repository. Click on any title for details.",
            ),
            ui.disclosure(
                id="Is docker compose required to run deephaven?",
                title="Is docker compose required to run deephaven?",
                panel="No. You can run Deephaven via Docker without compose. See here for an example. Docker compose does make customizing your deployment easier, though, so we recommend it for users who want to do that.",
            ),
            ui.disclosure(
                id="Can I reset the Python kernel without restarting the Deephaven Docker container?",
                title="Can I reset the Python kernel without restarting the Deephaven Docker container?",
                panel="At this time, there is no way to restart the Python kernel without restarting Docker as well.",
            ),
            expanded_keys=expanded_keys,
            on_expanded_change=set_expanded_keys,
            allows_multiple_expanded=True,
        ),
        ui.heading("Currently expanded: ", ", ".join(expanded_keys), margin_top="20px"),
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
