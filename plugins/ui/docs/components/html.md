# HTML Component Documentation

The `html` module provides utilities for rendering HTML content within the `deephaven.ui`. This allows users to embed custom HTML elements into their applications.

## Example

```python
from deephaven import ui

basic_html_example = ui.html.div("basic html example")
```

## HTML Element

The `html_element` method allows to specify any html `tag` along with any `children` and `attributes`.

```python
from deephaven import ui

simple_html = ui.html.html_element("div", "Welcome to Deephaven", id="simple")

nested_html = ui.html.html_element(
    "div",
    ui.html.html_element("h1", "Welcome to Deephaven"),
    ui.html.html_element("p", "This is a custom HTML component."),
    id="nested",
)
```

## Common Tags

`ui.html` also provides methods for common tags.

```python
from deephaven import ui

simple_html = ui.html.div("Welcome to Deephaven", id="simple")

nested_html = ui.html.div(
    ui.html.h1("Welcome to Deephaven"),
    ui.html.p("This is a custom HTML component."),
    id="nested",
)
```

For a full list of methods, see the API reference below.

## Use with `deephaven.ui`

The `ui.html` component can be nested inside other `deephaven.ui` components and vice versa.

```python
from deephaven import ui

component = ui.view(
    ui.heading("HTML inside a component"), ui.html.label("this is html")
)

html = ui.html.div(ui.html.h1("Component inside html"), ui.text("this is a component"))
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.html.html_element
```
