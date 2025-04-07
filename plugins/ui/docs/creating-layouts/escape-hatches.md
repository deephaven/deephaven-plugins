# Escape Hatches

`deephaven.ui` offers a versatile API for building comprehensive UI layouts. However, there may be scenarios where the provided API does not cover specific customization needs. In such cases, three "escape hatches" are available to enable additional customization of `deephaven.ui` components. **Proceed with caution** when using these options.

1. [`ui.html`](../components/html.md) - Provides a set of functions for creating raw HTML elements.
2. `UNSAFE_class_name` - Allows a custom A CSS class to apply to most `deephaven.ui` components.
3. `UNSAFE_style` - Allows a custom A CSS style to apply to most `deephaven.ui` components.

## ui.html

`deephaven.ui` provides a large list of components for building a UI. If you need a UI element that is not available, you can use [`ui.html`](../components/html.md) to inject html tags into your UI.

```python
from deephaven import ui

component_with_html = ui.view(
    ui.heading("HTML inside a component"),
    ui.html.div(
        ui.html.h1("Welcome to Deephaven"),
        ui.html.p("This is a custom HTML component."),
        id="html_div",
    ),
)
```

## UNSAFE_class_name

If a component's styling props are not sufficient, you can set the `UNSAFE_class_name` prop which set the html [`className`](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) attribute on the element. To do this, you will need to define a `style` using `ui.html`.

```python
from deephaven import ui

p = ui.panel(
    ui.html.style(
        """
.my_class { background: red !important;}
"""
    ),
    ui.button("test", UNSAFE_class_name="my_class"),
    ui.html.div("test", class_name="my_class"),
)
```

## UNSAFE_style

TODO
