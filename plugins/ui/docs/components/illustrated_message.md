# Illustrated Message

An IllustratedMessage displays an illustration along with a message, typically used for empty states or error pages.


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

Recommendations for creating a IllustratedMessage:

1. The message should be concise and, if applicable, describe the next step that a user can take.
2. The heading should no longer than 6 words, and should not be a replacement for the message text.
2. Use sentence case for the heading and message text.
3. Use illustrations that are relevant to the message and help convey the context effectively.
4. Reserve IllustratedMessage for situations where it adds value and clarity, rather than using it for minor notifications or messages.

## Content

An IllustratedMessage is made up of three parts: an illustration, a heading, and a body. 

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

If the heading of an IllustratedMessage isn't specified, the illustration should have the `aria-label` prop set for accessibility purposes.

```python
from deephaven import ui


my_illustrated_message_labeling_example = ui.illustrated_message(
    ui.icon("vsWorkspaceTrusted", aria_label="Trusted Workspace")
)
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.illustrated_message
```
