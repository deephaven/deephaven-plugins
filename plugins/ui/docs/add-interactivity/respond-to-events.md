# Respond to Events

`deephaven.ui` lets you add event handlers to your components. Event handlers are your own functions that will be triggered in response to interactions like clicking, hovering, focusing form inputs, and so on.

## Add event handlers

To add an event handler, first define a function and then pass it as a prop to the appropriate component. For example, here is a button that doesn’t do anything yet:

```python
from deephaven import ui


@ui.component
def my_button():
    return ui.button("I don't do anything")


no_button_event = my_button()
```

You can make it print a message when a user clicks by following these three steps:

1. Declare a function called `handle_press`.
2. Implement the logic inside that function.
3. Add `on_press=handle_press` to the button component.

```python
from deephaven import ui


@ui.component
def my_button():
    def handle_press():
        print("You clicked me!")

    return ui.button("Click me", on_press=handle_press)


button_with_event = my_button()
```

You defined the `handle_press` function and then passed it as a prop to `ui.button`. `handle_press` is an event handler. Event handler functions:

- Are usually defined inside your components.
- Have names that start with handle, followed by the name of the event.

By convention, it is common to name event handlers as handle followed by the event name. You’ll often see `on_press=handle_press`, `on_mouse_enter=handle_mouse_enter`, and so on.

Alternatively, you can define an event handler inline with a lambda in the component:

```python
from deephaven import ui


@ui.component
def my_button():
    return ui.button("Click me", on_press=lambda: print("You clicked me!"))


button_with_inline_event = my_button()
```

These styles are equivalent. Inline event handlers are convenient for short functions.

## Functions must be passed, not called

Functions passed to event handlers must be passed, not called. For example:

| passing a function (correct)       | calling a function (incorrect)                   |
| ---------------------------------- | ------------------------------------------------ |
| `ui.button(on_press=handle_press)` | `ui.button("Click me", on_press=handle_press())` |

The difference is subtle. In the first example, the `handle_press` function is passed as an `on_press` event handler. This tells `deephaven.ui` to remember it and only call your function when the user clicks the button.

In the second example, the `()` at the end of `handle_press()` fires the function immediately during rendering, without any clicks.

When you write code inline, the same pitfall presents itself in a different way:

| passing a function (correct)                 | calling a function (incorrect)                            |
| -------------------------------------------- | --------------------------------------------------------- |
| `ui.button(on_press=lambda: print("click"))` | `ui.button("Click me", on_press=on_press=print("click"))` |

The first example uses lambda to create an anonymous function which is called every time the button is clicked.

The second example will execute the code every time the component renders.

In both cases, what you want to pass is a function:

- `ui.button(on_press=handle_press)` passes the `handle_press` function.
- `ui.button(on_press=lambda: print("click"))` pass the `lambda: print("click")` function.

## Read props in event handlers

Because event handlers are declared inside of a component, they have access to the component’s props. Here is a button that, when clicked, prints its message prop:

```python
from deephaven import ui


@ui.component
def custom_button(label, message):
    return ui.button(label, on_press=lambda: print(message))


@ui.component
def toolbar():
    return [
        custom_button("Play Movie", "Playing!"),
        custom_button("Upload Image", "Uploading!"),
    ]


read_props_example = toolbar()
```

This lets these two buttons show different messages. Try changing the messages passed to them.

## Pass event handlers as props

Often you’ll want the parent component to specify a child’s event handler. Consider buttons: depending on where you’re using a Button component, you might want to execute a different function—perhaps one plays a movie and another uploads an image.

To do this, pass a prop the component receives from its parent as the event handler like so:

```python
from deephaven import ui


@ui.component
def custom_button(label, on_press):
    return ui.button(label, on_press=on_press)


@ui.component
def play_button(movie_name):
    def handle_play_press():
        print(f"Playing {movie_name}")

    return custom_button(f"Play {movie_name}", on_press=handle_play_press)


@ui.component
def upload_button():
    return custom_button("Upload Image", on_press=lambda: print("Uploading!"))


@ui.component
def toolbar():
    return [play_button("Alice in Wonderland"), upload_button()]


pass_event_handlers = toolbar()
```

Here, the `toolbar` component renders a `play_button` and an `upload_button`:

- `play_button` passes `handle_play_press` as the `on_press` prop to the `custom_button` inside.
- `upload_button` passes `lambda: print("Uploading!")` as the `on_press` prop to the `custom_button` inside.

Finally, `custom_button` component accepts a prop called `on_press`. It passes that prop directly to the `ui.button` with `on_press=on_press`. This tells `deephaven.ui` to call the passed function on press.

## Name even handler props
