# Illustrated Message

An illustrated message displays an illustration along with a message, typically used for empty states or error pages.

## Example

```python
from deephaven import ui

my_illustrated_message_basic = ui.illustrated_message(
    ui.icon("vsError"),
    ui.heading("Access denied"),
    ui.content("You do not have permissions to access this page."),
)
```

![Illustrated Message Basic Example](../_assets/illustrated_message_basic.png)

## UI recommendations

Recommendations for creating an illustrated message:

1. The message should be concise and, if applicable, describe the next step a user can take.
2. The heading should be no longer than 6 words and should not be a replacement for the message text.
3. Use sentence case for the heading and message text.
4. Use illustrations that are relevant to the message and help convey the context effectively.
5. Reserve illustrated messages for situations where they add value and clarity, rather than using them for minor notifications or messages.

## Content

An illustrated message is made up of three parts: an illustration, a heading, and a body.

You can populate these sections by providing the following components as children: an `ui.icon` for the illustration, a `ui.heading` for the heading, and `ui.content` for the body.

```python
from deephaven import ui


my_illustrated_message_content_example = ui.illustrated_message(
    ui.icon("vsWarning"),
    ui.heading("Invalid input"),
    ui.content("No special characters allowed."),
)
```

## Labeling

If the heading of an illustrated message isn't specified, set the `aria-label` prop for accessibility purposes.

```python
from deephaven import ui


my_illustrated_message_labeling_example = ui.illustrated_message(
    ui.icon("vsWorkspaceTrusted", aria_label="Trusted Workspace")
)
```

## Placeholder

Using an illustrated message as a placeholder for a table or list can clearly indicate the absence of data and provide context-specific guidance.

```python order=my_illustrated_message_placeholder_example,_stocks
from deephaven import ui
import deephaven.plot.express as dx

_stocks = dx.data.stocks()


@ui.component
def illustrated_message_placeholder_example():
    filter, set_filter = ui.use_state("")
    return [
        ui.text_field(
            value=filter, label="Sym Filter", is_required=True, on_change=set_filter
        ),
        ui.illustrated_message(
            ui.icon("vsFilter"),
            ui.heading("Filter required"),
            ui.content("Enter a filter to display filtered table"),
            width="100%",
        )
        if filter == ""
        else _stocks.where(f"Sym=`{filter.upper()}`"),
    ]


my_illustrated_message_placeholder_example = illustrated_message_placeholder_example()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.illustrated_message
```
