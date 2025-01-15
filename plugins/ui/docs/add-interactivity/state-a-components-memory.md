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

## Add a state variable

To add a state variable, replace this line:

`index = 0`

with

`index, set_index = ui.use_state(0)`

`index` is a state variable and `set_index` is the setter function.

This is how they work together in `handle_press`:

`set_index(index + 1)`

Now clicking the “Next” button switches the current word:

```python
from deephaven import ui

word_list = ["apple", "banana", "cherry", "orange", "kiwi", "strawberry"]


@ui.component
def word_display():
    index, set_index = ui.use_state(0)

    def handle_press():
        set_index(index + 1)

    word = word_list[index]

    return [
        ui.button("Next", on_press=handle_press),
        ui.text(f"({index+1} of {len(word_list)})"),
        ui.heading(word),
    ]


word_display_example = word_display()
```

## Meet your first hook

In `deephaven.ui`, [`use_state`](../hooks/use_state.md), as well as any other function starting with “use”, is called a [`hook`](../describing/use_hooks.md).

Hooks are special functions that are only available while `deephaven.ui` is rendering. They let you “hook into” different `deephaven.ui` features.

State is just one of those features, but you will meet the other hooks later.

Hooks can only be called at the top level of your components or your own hooks. You cannot call hooks inside conditions, loops, or other nested functions. Hooks are functions, but it is helpful to think of them as unconditional declarations about your component’s needs. You “use” `deephaven.ui` features at the top of your component similar to how you “import” at the top of your file.

## Anatomy of `use_state`
