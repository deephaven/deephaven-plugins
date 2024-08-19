# Illustrated Message

An Illustrated Message displays an illustration along with a message, typically used for empty states or error pages.


## Example

```python
from deephaven import ui

my_illustrated_message_basic = ui.illustrated_message(
    ui.icon("vsError"),
    ui.heading("Access denied"),
    ui.content("You do not have permissions to access this page."),
)
```

## UI recommendations

Recommendations for creating an Illustrated Message:

1. The message should be concise and, if applicable, describe the next step a user can take.
2. The heading should be no longer than 6 words and should not be a replacement for the message text.
2. Use sentence case for the heading and message text.
3. Use illustrations that are relevant to the message and help convey the context effectively.
4. Reserve Illustrated Message for situations where it adds value and clarity, rather than using it for minor notifications or messages.

## Content

An Illustrated Message is made up of three parts: an illustration, a heading, and a body. 

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

If the heading of an Illustrated Message isn't specified, the illustration should have the `aria-label` prop set for accessibility purposes.

```python
from deephaven import ui


my_illustrated_message_labeling_example = ui.illustrated_message(
    ui.icon("vsWorkspaceTrusted", aria_label="Trusted Workspace")
)
```

## Placeholder

Using an Illustrated Message as a placeholder for a table or list can clearly indicating the absence of data and provide context-specific guidance.

```python
from deephaven import ui

my_illustrated_message = ui.illustrated_message("Please enter a filter")


@ui.component
def illustrated_message_placeholder_example():
    filter, set_filter = ui.use_state("")
    ui.text_field(value=filter)
    return [my_illustrated_message if filter == "" else stocks.where(f"sym=`{filter}`")]


my_illustrated_message_placeholder_example = illustrated_message_placeholder_example()
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.illustrated_message
```
