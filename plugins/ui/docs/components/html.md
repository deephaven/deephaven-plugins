# HTML Component Documentation

The `html` module provides utilities for rendering HTML content within the `deephaven.ui`. This allows users to embed custom HTML elements into their applications.

## Example

```python
from deephaven import ui

basic_html_example = ui.html.div("basic html example")
```

## UI recommendations

**Avoid using `html` components unless necessary**: This is an advanced feature that should only be used when creating an HTML component not covered by other `deephaven.ui` components. HTML components are not themed and may respond incorrectly to different user layouts.

## HTML Element

The `html_element` method allows you to specify any html `tag` along with any `children` and `attributes`.

```python order=simple_html,nested_html
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

```python order=simple_html,nested_html
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

```python order=component,html
from deephaven import ui

component = ui.view(
    ui.heading("HTML inside a component"), ui.html.label("this is html")
)

html = ui.html.div(ui.html.h1("Component inside html"), ui.text("this is a component"))
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.html.html_element

.. dhautofunction:: deephaven.ui.html.a

.. dhautofunction:: deephaven.ui.html.button

.. dhautofunction:: deephaven.ui.html.code

.. dhautofunction:: deephaven.ui.html.div

.. dhautofunction:: deephaven.ui.html.form

.. dhautofunction:: deephaven.ui.html.h1

.. dhautofunction:: deephaven.ui.html.h2

.. dhautofunction:: deephaven.ui.html.h3

.. dhautofunction:: deephaven.ui.html.h4

.. dhautofunction:: deephaven.ui.html.h5

.. dhautofunction:: deephaven.ui.html.h6

.. dhautofunction:: deephaven.ui.html.i

.. dhautofunction:: deephaven.ui.html.img

.. dhautofunction:: deephaven.ui.html.input

.. dhautofunction:: deephaven.ui.html.label

.. dhautofunction:: deephaven.ui.html.li

.. dhautofunction:: deephaven.ui.html.ol

.. dhautofunction:: deephaven.ui.html.option

.. dhautofunction:: deephaven.ui.html.p

.. dhautofunction:: deephaven.ui.html.pre

.. dhautofunction:: deephaven.ui.html.select

.. dhautofunction:: deephaven.ui.html.span

.. dhautofunction:: deephaven.ui.html.table

.. dhautofunction:: deephaven.ui.html.tbody

.. dhautofunction:: deephaven.ui.html.td

.. dhautofunction:: deephaven.ui.html.textarea

.. dhautofunction:: deephaven.ui.html.th

.. dhautofunction:: deephaven.ui.html.thead

.. dhautofunction:: deephaven.ui.html.tr

.. dhautofunction:: deephaven.ui.html.ul
```
