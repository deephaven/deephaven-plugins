# Panel

The `panel` component is a versatile [flex](./flex.md) container designed to group and organize elements within a layout. Panels are presented as individual tabs that can be moved to different positions by dragging the tabs around. By default, the top-level return of a `@ui.component` is automatically wrapped in a panel, so you only need to define a panel explicitly if you want to customize it. Customizations can include setting a custom tab title, background color or customizing the flex layout.

## Example

```python
from deephaven import ui


@ui.component
def ui_panel():
    text = ui.text_field()

    return ui.panel(text, title="Text Field")


my_panel = ui_panel()
```

![Panel Basic Example](../_assets/panel_basic.png)

## Nesting

Panels can only be nested within [ui.row](./dashboard.md#row-api-reference), [ui.column](./dashboard.md#column-api-reference), [ui.stack](./dashboard.md#stack-api-reference) or [ui.dashboard](./dashboard.md).

```python
from deephaven import ui

my_nested_panel = ui.dashboard([ui.panel("A"), ui.panel("B")])
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.panel
```
