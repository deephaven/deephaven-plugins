# Action Group

An action group is a UI component that groups multiple actions together. 

## Example

```python
from deephaven import ui


my_action_group_basic = ui.action_group(
    ui.action_button("Add"),
    ui.action_button("Edit"),
    ui.action_button("Delete"),
)
```

## UI recommendations

Recommendations for creating action groups:

1. Every action group should have a [label](#labeling) specified. Without one, the action group is ambiguous. In the rare case that context is sufficient, the label is unnecessary; you must still include an aria-label via the `aria_label` prop.
2. Emphasized actions in the action group are ideal for forms and settings where they need to stand out, while non-emphasized actions are best for monochrome application panels to keep the focus on the application.
3. The label and options should all be in sentence case.


Consider using a [`radio_group`](./radio_group.md) when users should select one option from a set of mutually exclusive choices. If you want to manage multiple selections or no selections within a group at once, consider using a [`checkbox_group`](./checkbox_group.md). If you want to align multiple buttons that do not necessarily correspond to action, consider using a [`button_group`]


## Icons

Icons can be added to action group items by wrapping the label in a `ui.text` element, and adding a `ui.icon` as a sibling component.

```python
from deephaven import ui


my_action_group_icon_example = ui.action_group(
    ui.item(ui.text("Edit"), ui.icon("vsEdit")),
    ui.item(ui.text("Copy"), ui.icon("vsCopy")),
    ui.item(ui.text("Delete"), ui.icon("vsTrash")),
)
```

The `button_label_behavior` prop can be set to "hide" label text within buttons and show it in a tooltip on hover.

```python
from deephaven import ui


my_action_group_button_label_behavior_example = ui.flex(
    ui.action_group(
        ui.item(
            ui.text("Edit"),
            ui.icon("vsEdit"),
        ),
        ui.item(ui.text("Copy"), ui.icon("vsCopy")),
        ui.item(ui.text("Delete"), ui.icon("vsTrash")),
        button_label_behavior="hide",
    ),
    margin_top="50px",
)
```


## Selection

Action groups support multiple selection modes, configurable via the `selection_mode` prop. 

The `default_selected_keys` can be used for uncontrolled default selections.

```python
from deephaven import ui


my_action_group_default_selected_keys_example = ui.action_group(
    ui.item("Grid view", key="grid"),
    ui.item("List view", key="list"),
    ui.item("Gallery view", key="gallery"),
    selection_mode="single",
    default_selected_keys=["list"],
)
```

The `selected_keys` prop for can be used for controlled selections.

```python
from deephaven import ui


@ui.component
def ui_action_group_selected_keys_example():
    selected, set_selected = ui.use_state([])
    return [
        ui.action_group(
            ui.item("Grid view", key="grid"),
            ui.item("List view", key="list"),
            ui.item("Gallery view", key="gallery"),
            selection_mode="multiple",
            selected_keys=selected,
            on_change=set_selected,
        ),
        ui.text(f"Current selection (controlled): {selected}"),
    ]


my_action_group_selected_keys_example = ui_action_group_selected_keys_example()
```


## Events

The `on_selection_change` property is triggered whenever the value in the action group selection is changed.

```python
from deephaven import ui


@ui.component
def ui_action_group_on_change_example():
    selected_option, set_selected_option = ui.use_state("")
    return [
        ui.action_group(
            ui.item("Grid view", key="grid"),
            ui.item("List view", key="list"),
            ui.item("Gallery view", key="gallery"),
            selection_mode="single",
            on_selection_change=set_selected_option,
        ),
        ui.text(f"You have selected: {selected_option}"),
    ]


my_action_group_on_change_example = ui_action_group_on_change_example()
```


## Collapsing Behavior

By default, the items of an action group wrap to a new line when space is limited. To keep them in a single line, set the `overflow_mode` prop to "collapse", which collapses the items into a menu.

```python
from deephaven import ui


my_action_group_overflow_example = ui.action_group(
    ui.item(ui.text("Edit"), ui.icon("vsEdit")),
    ui.item(ui.text("Copy"), ui.icon("vsCopy")),
    ui.item(ui.text("Delete"), ui.icon("vsTrash")),
    ui.item(ui.text("Move"), ui.icon("vsMove")),
    ui.item(ui.text("Duplicate"), ui.icon("vsDiffMultiple")),
    overflow_mode="collapse",
    max_width=250,
)
```

When selection is enabled, action group collapses all items into a menu when space is limited, with a highlighted menu button indicating a selection

```python
from deephaven import ui

my_action_group_selection_collapsing_example = ui.action_group(
    ui.item(ui.text("Edit"), ui.icon("vsEdit")),
    ui.item(ui.text("Copy"), ui.icon("vsCopy")),
    ui.item(ui.text("Delete"), ui.icon("vsTrash")),
    static_color="white",
    summary_icon=ui.icon("vsSearch"),
    overflow_mode="collapse",
    selection_mode="multiple",
    is_emphasized=True,
    max_width=10,
)
```


## Quiet State

The `is_quiet` prop makes action groups "quiet". This can be useful when the action group and its corresponding styling should not distract users from surrounding content.

```python
from deephaven import ui


my_action_group_is_quiet_example = ui.action_group(
    ui.item("Add"),
    ui.item("Edit"),
    ui.item("Delete"),
    is_quiet=True,
)
```


## Emphasized

The `is_emphasized` prop makes the selected action item the user's accent color, adding a visual prominence to the selection.


```python
from deephaven import ui


my_action_group_is_emphasized_example = ui.action_group(
    ui.item("Add"),
    ui.item("Edit"),
    ui.item("Delete"),
    is_emphasized=True,
)
```


## Static Color

The `static_color` prop can be used when the action group is placed over a color background.

```python
from deephaven import ui


my_action_group_static_color_example = ui.view(
    ui.action_group(
        ui.item(ui.text("Edit"), ui.icon("vsEdit")),
        ui.item(ui.text("Copy"), ui.icon("vsCopy")),
        ui.item(ui.text("Delete"), ui.icon("vsTrash")),
        static_color="white",
    ),
    background_color="blue-700",
    padding="size-500",
)
```


## Disabled State

Action groups can be disabled to prevent user interaction. This is useful when the group is not currently available, but the button should still be visible.

```python
from deephaven import ui


my_action_group_is_disabled_example = ui.action_group(
    ui.item("Add"),
    ui.item("Edit"),
    ui.item("Delete"),
    is_disabled=True,
)
```


## Orientation

While aligned vertically by default, the axis the action items align with can be changed via the `orientation` prop.

```python
from deephaven import ui


my_action_group_orientation_example = ui.action_group(
    ui.item("Add"),
    ui.item("Edit"),
    ui.item("Delete"),
    orientation="horizontal",
)
```


## Density

Using the `density` prop with value compact reduces margins between action buttons. By default, it merges neighboring borders. If the action group has the `is_quiet` prop set to true, it reduces the margin size.

```python
from deephaven import ui


@ui.component
def ui_action_group_density_examples():
    return [
        ui.action_group(
            ui.item(ui.icon("vsEdit")),
            ui.item(ui.icon("vsCopy")),
            ui.item(ui.icon("vsTrash")),
            density="compact",
        ),
        ui.action_group(
            ui.item(ui.icon("vsEdit")),
            ui.item(ui.icon("vsCopy")),
            ui.item(ui.icon("vsTrash")),
            is_quiet=True,
            density="compact",
        ),
    ]


my_action_group_density_examples = ui_action_group_density_examples()
```


## Justified

The `is_justified` prop evenly divides all available horizontal space among the action items.

```python
from deephaven import ui


my_action_group_is_justified_example = ui.flex(
    ui.action_group(
        ui.item(ui.icon("vsEdit")),
        ui.item(ui.icon("vsCopy")),
        ui.item(ui.icon("vsTrash")),
        is_justified=True,
        density="compact",
    ),
    width="size-3000",
    direction="column",
)
```
