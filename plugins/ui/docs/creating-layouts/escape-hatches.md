# Escape Hatches

`deephaven.ui` offers a versatile API for building comprehensive UI layouts. However, there may be scenarios where the provided API does not cover specific customization needs. In such cases, three "escape hatches" are available to enable additional customization of `deephaven.ui` components. **Proceed with caution** when using these options.

1. [`ui.html`](../components/html.md) - Provides a set of functions for creating raw HTML elements.
2. `UNSAFE_class_name` - Allows a custom A CSS class to apply to most `deephaven.ui` components.
3. `UNSAFE_style` - Allows a custom A CSS style to apply to most `deephaven.ui` components.

## ui.html

## UNSAFE_class_name

`deephaven.ui` components do not support the traditional html `className` property.

## UNSAFE_style

`deephaven.ui` components do not support the traditional html `style` property.
