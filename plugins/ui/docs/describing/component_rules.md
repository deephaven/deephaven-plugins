# Component Rules

Here are some important rules to understand about `deephaven.ui` components.

## Children and Props

Arguments passed to a component may be either `children` or `props`. `Children` refers to `child` components that are passed to a `parent` component as arguments. `Props` are properties that determine the behavior and rendering style of the component.

```python
from deephaven import ui

my_flex = ui.flex(
    ui.heading("Heading"),
    ui.button("Button"),
    ui.text("Text"),
    direction="column",
    wrap=True,
    width="200px",
)
```

In the above example, the `flex` component is the `parent`. It has three `children`: a `heading`, a `button`, and a `text` component. These `children` will be rendered inside the `flex`. It also has three props: `direction`, `wrap`, and `width`. These three props indicate that the flex should be rendered as a 200 pixel column with wrap enabled.

## Defining Your Own Children and Props

To define `children` and `props` for a custom component, add them as arguments to the component function. As a convention, you may declare the children using the `*` symbol to take any number of arguments.

```python
from deephaven import ui


@ui.component
def custom_flex(*children, is_column):
    return ui.flex(
        ui.heading("My Component"),
        children,
        direction="column" if is_column else "row",
    )


my_custom_flex = custom_flex(ui.text("text"), ui.button("button"), is_column=True)
```

## Component Return Values

You can return three values from a `deephaven.ui` component: a component, a list of components, or `None`. Returning a single component will render that component at the root level of a panel. Returning a list of components will render all the components in a panel. Returning `None` should be used when a component is used to perform logic but does not need to be rendered.

```python
from deephaven import ui


@ui.component
def return_component():
    return ui.text("component")


@ui.component
def list_of_components():
    return [ui.text("list"), ui.text("of"), ui.text("components")]


@ui.component
def return_none():
    print("return none")
    return None


my_return_component = return_component()
my_list_of_components = list_of_components()
my_return_none = return_none()
```

## Conditional Return

Return statements can be conditional in order to render different components based on inputs.

```python
from deephaven import ui


@ui.component
def return_conditional(is_button):
    if is_button:
        return ui.button("button")
    return ui.text("text")


my_button = return_conditional(True)
my_text = return_conditional(False)
```
