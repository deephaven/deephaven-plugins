# State: A Component's Memory

Components often need to change what’s on the screen as a result of an interaction. Typing into the form should update the input field, clicking “next” on an image carousel should change which image is displayed, clicking “buy” should put a product in the shopping cart. Components need to “remember” things: the current input value, the current image, the shopping cart. In `deephaven.ui`, this kind of component-specific memory is called state.

## When a regular variable is not enough

Here’s a component that renders a word from a list. Clicking the “Next” button should show the next word by changing the index to 1, then 2, and so on. However, this does not work.

```python
from deephaven import ui

word_list = ["apple", "banana", "cherry", "orange", "kiwi", "strawberry"]


@ui.component
def word_display():
    index = 0

    def handle_press():
        nonlocal index
        index = index + 1

    word = word_list[index]

    return [
        ui.button("Next", on_press=handle_press),
        ui.text(f"({index+1} of {len(word_list)})"),
        ui.heading(word),
    ]


word_display_example = word_display()
```

The `handle_press` event handler is updating a local variable, `index`. But two things prevent that change from being visible:

1. Local variables do not persist between renders. When `deephaven.ui` renders this component a second time, it renders it from scratch. It does not consider any changes to the local variables.
2. Changes to local variables do not trigger renders. `deephaven.ui` does not realize it needs to render the component again with the new data.

To update a component with new data, two things need to happen:

1. Retain the data between renders.
2. Trigger `deephaven.ui` to render the component with new data (re-rendering).

The [`use_state`](../hooks/use_state.md) hook provides those two things:

1. A state variable to retain the data between renders.
2. A state setter function to update the variable and trigger `deephaven.ui` to render the component again.

## Add a star=te variable
