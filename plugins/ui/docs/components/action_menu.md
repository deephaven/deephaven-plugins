# Action Menu

An action menu merges an action button with a menu for easy access to more actions.

## Example

```python
from deephaven import ui


my_action_menu_basic = ui.action_menu("Cut", "Copy", "Paste")
```

## UI recommendations

Consider using an [`action_group`] to group multiple action buttons together. 


## Events

The `on_action` property is triggered whenever the value in the action group selection changes.

```python
from deephaven import ui


@ui.component
def ui_action_menu_on_change_example():
    selected_action, set_selected_action = ui.use_state("")
    return [
        ui.action_menu(
            "Cut",
            "Copy",
            "Paste",
            on_action=set_selected_action,
        ),
        ui.text(f"The action you have selected is: {selected_action}"),
    ]


my_action_menu_on_change_example = ui_action_menu_on_change_example()
```


## Sections

The action menu supports sections that group options. Sections can be used by wrapping groups of items in a `ui.section` element. Each section takes a `title` and `key` prop.

```python
from deephaven import ui


my_action_menu_section_example = ui.action_menu(
    ui.section(ui.item("Write"), ui.item("Append"), title="Addition"),
    ui.section(ui.item("Erase"), ui.item("Remove"), title="Deletion"),
)
```


## Complex items

Items within an action menu include additional content to better convey options. You can add icons, avatars, and descriptions to the children of an `ui.item`. When adding a description, set the `slot` prop to "description" to differentiate between the text elements.


```python
from deephaven import ui


my_action_menu_complex_items_example = ui.action_menu(
    ui.item(
        ui.icon("github_alt"),
        ui.text("Github"),
        ui.text("Github Option", slot="description"),
        text_value="Github",
    ),
    ui.item(
        ui.icon("azure_devops"),
        ui.text("Azure"),
        ui.text("Azure Option", slot="description"),
        text_value="Azure",
    ),
)
```


## Quiet State

The `is_quiet` prop makes an action menu "quiet". This can be useful when the action menu and its corresponding styling should not distract users from surrounding content.


```python
from deephaven import ui


my_action_menu_basic = ui.action_menu("Cut", "Copy", "Paste", is_quiet=True)
```


## Disabled State

Through the ' is_disabled ' prop, an action menu can be disabled to prevent user interaction. This is useful when the action menu is currently unavailable, but the button should still be visible.


```python
from deephaven import ui


my_action_menu_basic = ui.action_menu("Cut", "Copy", "Paste", is_disabled=True)
```


## Flip

By default, the action menu automatically flips direction when space is limited. To disable this behavior, set the `should_flip` prop to `false`.

```python
from deephaven import ui


@ui.component
def ui_action_menu_flip_examples():
    return [
        ui.action_menu(
            "Cut", "Copy", "Paste", align="start", direction="top", should_flip=True
        ),
        ui.action_menu(
            "Cut", "Copy", "Paste", align="start", direction="top", should_flip=False
        ),
    ]


my_action_menu_flip_examples = ui_action_menu_flip_examples()
```


## Align and direction

The `align` prop positions the action menu relative to the trigger, while the `direction` prop determines the direction in which the action menu will render.


```python
from deephaven import ui


@ui.component
def ui_action_menu_align_direction_examples():
    return [
        ui.action_menu("Cut", "Copy", "Paste", align="start"),
        ui.action_menu(
            "Cut", "Copy", "Paste", align="start", direction="top", should_flip=False
        ),
        ui.action_menu(
            "Cut",
            "Copy",
            "Paste",
            align="start",
            direction="start",
        ),
        ui.action_menu(
            "Cut",
            "Copy",
            "Paste",
            align="end",
            direction="end",
        ),
    ]


my_action_menu_align_direction_examples = ui_action_menu_align_direction_examples()
```


## Open

The `is_open` and `default_open` props on the action menu control whether the menu is open by default. They apply controlled and uncontrolled behavior on the menu respectively.


```python
from deephaven import ui


@ui.component
def ui_action_menu_open_examples():
    is_open, set_is_open = ui.use_state(False)
    return [
        ui.text(f"Controlled menu open state: {is_open}"),
        ui.action_menu(
            "Cut",
            "Copy",
            "Paste",
            is_open=is_open,
            on_open_change=set_is_open,
        ),
        ui.action_menu(
            "Cut",
            "Copy",
            "Paste",
            default_open=True,
        ),
    ]


my_action_menu_open_examples = ui_action_menu_open_examples()
```



## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.action_menu
```


