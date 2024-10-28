# Panel

Similar to a flex container, panel can be used to group elements together. By dragging the tab, panels can be moved to different positions.

Note: By default, the top-level `@ui.component` is automatically wrapped in a panel. Therefore, you only need to define it if you want to customize the panel, such as setting a custom tab name, color, or invoking methods like focus.

## Example

```python
from deephaven import ui


@ui.component
def ui_panel():
    text = ui.text_field()

    return ui.panel(text, title="Text Field")


my_panel = ui_panel()
```

## Nesting

A panel cannot be nested within other components (other than the layout ones such as [ui.row](#uirow), [ui.column](#uicolumn), [ui.stack](#uistack), [ui.dashboard](#uidashboard)).

```python
from deephaven import ui

my_nested_panel = ui.dashboard([ui.panel("A"), ui.panel("B")])
```


## Style Props

These are the available props to adjust how the items within the panel will be displayed

`title`: The title of the panel, displayed in the tab.
`direction`: The direction of the panel's content layout, either "row" or "column".
`wrap`: Determines if the panel's content should wrap when it overflows.
`justify_content`: Defines how the panel's content is aligned along the main axis.
`align_content`: Aligns the panel's content along the cross axis.
`align_items`: Aligns the panel's items along the cross axis.
`gap`: The gap between items in the panel.
`column_gap`: The gap between columns in the panel.
`row_gap`: The gap between rows in the panel.
`overflow`: Controls the panel's overflow behavior.
`padding`: The padding inside the panel.
`padding_top`: The padding at the top of the panel.
`padding_bottom`: The padding at the bottom of the panel.
`padding_start`: The padding at the start of the panel.
`padding_end`: The padding at the end of the panel.
`padding_x`: The horizontal padding of the panel.
`padding_y`: The vertical padding of the panel.
`key`: A unique key for the panel.




