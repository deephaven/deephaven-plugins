# Tabs

Tabs organize related content into sections, allowing users to navigate between them.

## Example

```python
from deephaven import ui, empty_table

my_tabs_basic = ui.tabs(
    ui.tab("Hello World!", title="Tab 1"),
    ui.tab(
        ui.flex(
            "Hello World with table!",
            ui.flex(empty_table(10).update("I=i")),
        ),
        title="Tab 2",
    ),
)
```

## UI Recommendations

1. Use tabs to organize sections of equal importance. Avoid using tabs for content with varying levels of importance.
2. Use a vertical tabs layout when displaying shortcuts to sections of content on a single page.
3. Avoid nesting tabs more than three levels deep, as it can become overly complicated.


## Content

Tabs can be created using `ui.tab` or `ui.tab_list` and `ui.tab_panels`, but not both combined. 

If wanting a default tab layout with minimal customization for tab apperance, tabs should be created by passing in `ui.tab` to `ui.tabs`.

Note that both the `ui.tab` component can only be used within `ui.tabs`.

```python
from deephaven import ui


my_tabs_tab_content_example = ui.tabs(
    ui.tab("Arma virumque cano, Troiae qui primus ab oris.", title="Founding of Rome"),
    ui.tab("Senatus Populusque Romanus.", title="Monarchy and Republic"),
    ui.tab("Alea jacta est.", title="Empire"),
)
```

For more control over the layout, types, and styling of the tabs, they should be created `ui.tab_list` and `ui.tab_panels` with `ui.tabs`. 

The `ui.tab_list` specifies the titles of the tabs, while the `ui.tab_panels` specify the content within each of the tab panels.

When specifying tabs using the `ui.tab_list` and `ui.tab_panels`, keys must be provided and match for each of the respective tabs.

```python
from deephaven import ui


my_tabs_list_panels_content_example = ui.tabs(
    ui.tab_list(ui.item("Tab 1", key="Key 1"), ui.item("Tab 2", key="Key 2")),
    ui.tab_panels(
        ui.item(
            ui.calendar(
                aria_label="Calendar (uncontrolled)",
                default_value="2020-02-03",
            ),
            key="Key 1",
        ),
        ui.item(
            ui.radio_group(
                ui.radio("Yes", value="Yes"),
                ui.radio("No", value="No"),
                label="Is vanilla the best flavor of ice cream?",
            ),
            key="Key 2",
        ),
        flex_grow=1,
        position="relative",
    ),
    flex_grow=1,
    margin_bottom="size-400",
)
```

Note that both the `ui.tab_list` and `ui.tab_panels` components can also only be used within `ui.tabs`.


## Selection

With tabs, the `default_selected_key` or `selected_key` props can be set to have a selected tab.

```python
from deephaven import ui


@ui.component
def ui_tabs_selected_key_examples():
    selected_tab, set_selected_tab = ui.use_state("Tab 1")
    return [
        "Pick a tab (uncontrolled)",
        ui.tabs(
            ui.tab(
                "There is no prior chat history with John Doe.",
                title="John Doe",
                key="Tab 1",
            ),
            ui.tab(
                "There is no prior chat history with Jane Doe.",
                title="Jane Doe",
                key="Tab 2",
            ),
            ui.tab(
                "There is no prior chat history with Joe Bloggs.",
                title="Joe Bloggs",
                key="Tab 3",
            ),
            default_selected_key="Tab 2",
        ),
        "Pick a tab (controlled)",
        ui.tabs(
            ui.tab(
                "There is no prior chat history with John Doe.",
                title="John Doe",
                key="Tab 1",
            ),
            ui.tab(
                "There is no prior chat history with Jane Doe.",
                title="Jane Doe",
                key="Tab 2",
            ),
            ui.tab(
                "There is no prior chat history with Joe Bloggs.",
                title="Joe Bloggs",
                key="Tab 3",
            ),
            selected_key=selected_tab,
            on_selection_change=set_selected_tab,
        ),
    ]


my_tabs_selected_key_examples = ui_tabs_selected_key_examples()
```


## Events

The `on_change` property is triggered whenever the currently selected tab changes.


```python
from deephaven import ui


@ui.component
def ui_tabs_on_change_example():
    selected_tab, set_selected_tab = ui.use_state("Tab 1")
    return [
        ui.tabs(
            ui.tab(
                "There is no prior chat history with John Doe.",
                title="John Doe",
                key="Tab 1",
            ),
            ui.tab(
                "There is no prior chat history with Jane Doe.",
                title="Jane Doe",
                key="Tab 2",
            ),
            ui.tab(
                "There is no prior chat history with Joe Bloggs.",
                title="Joe Bloggs",
                key="Tab 3",
            ),
            selected_key=selected_tab,
            on_selection_change=set_selected_tab,
        ),
        ui.text(f"You have selected: {selected_tab}"),
    ]


my_tabs_on_change_example = ui_tabs_on_change_example()
```


## Keyboard activation

By default, pressing the arrow keys while currently focused on a tab will automatically switch selection to the adjacent tab in that key's direction.

To prevent this automatic selection change, the `keyboard_activation` prop can be set to "manual".

```python
from deephaven import ui


my_tabs_keyboard_activation_example = ui.tabs(
    ui.tab("Arma virumque cano, Troiae qui primus ab oris.", title="Founding of Rome"),
    ui.tab("Senatus Populusque Romanus.", title="Monarchy and Republic"),
    ui.tab("Alea jacta est.", title="Empire"),
    keyboard_activation="manual",
)
```


## Density

By default, the density of the tab list is "compact". To change this, the `density` prop can be set to "regular".

The difference in the spacing can be observed in the following example.

```python
from deephaven import ui


@ui.component
def ui_tabs_density_examples():
    return [
        ui.tabs(
            ui.tab("There is no prior chat history with John Doe.", title="John Doe"),
            ui.tab("There is no prior chat history with Jane Doe.", title="Jane Doe"),
            ui.tab(
                "There is no prior chat history with Joe Bloggs.", title="Joe Bloggs"
            ),
            density="regular",
        ),
        ui.tabs(
            ui.tab("There is no prior chat history with John Doe.", title="John Doe"),
            ui.tab("There is no prior chat history with Jane Doe.", title="Jane Doe"),
            ui.tab(
                "There is no prior chat history with Joe Bloggs.", title="Joe Bloggs"
            ),
        ),
    ]


my_tabs_density_examples = ui_tabs_density_examples()
```


## Quiet State

The `is_quiet` prop makes tabs "quiet", by removing the line seperating the tab titles' and panel contents. This can be useful when the tabs  should not distract users from surrounding content.

```python
from deephaven import ui


my_tabs_is_quiet_example = ui.tabs(
    ui.tab("There is no prior chat history with John Doe.", title="John Doe"),
    ui.tab("There is no prior chat history with Jane Doe.", title="Jane Doe"),
    ui.tab("There is no prior chat history with Joe Bloggs.", title="Joe Bloggs"),
    is_quiet=True,
)
```


## Disabled state

The `is_disabled` prop disables the tabs component to prevent user interaction. This is useful when tabs should be visible but not available for selection.

```python
from deephaven import ui


my_tabs_is_disabled_example = ui.tabs(
    ui.tab("There is no prior chat history with John Doe.", title="John Doe"),
    ui.tab("There is no prior chat history with Jane Doe.", title="Jane Doe"),
    ui.tab("There is no prior chat history with Joe Bloggs.", title="Joe Bloggs"),
    is_disabled=True,
)
```

## Orientation

By default, tabs are horizontally oriented. To have tabs be vertically orientated, the `orientation` prop can be set to "vertical".

```python
from deephaven import ui


@ui.component
def ui_tabs_orientation_examples():
    return [
        ui.tabs(
            ui.tab("There is no prior chat history with John Doe.", title="John Doe"),
            ui.tab("There is no prior chat history with Jane Doe.", title="Jane Doe"),
            ui.tab(
                "There is no prior chat history with Joe Bloggs.", title="Joe Bloggs"
            ),
            orientation="vertical",
        ),
        ui.tabs(
            ui.tab("There is no prior chat history with John Doe.", title="John Doe"),
            ui.tab("There is no prior chat history with Jane Doe.", title="Jane Doe"),
            ui.tab(
                "There is no prior chat history with Joe Bloggs.", title="Joe Bloggs"
            ),
        ),
    ]


my_tabs_orientation_examples = ui_tabs_orientation_examples()
```


## Overflow behaviour

If there isn't enough horizontal space to render all tabs on a single line, the component will automatically collapse all tabs into a Picker. 

Note this only occurs when tabs have a horizontal orientation; for vertical orientation of tabs, the list continues to extend downwards.

```python
from deephaven import ui


@ui.component
def ui_tabs_overflow_example():
    return [
        ui.view(
            ui.tabs(
                ui.tab(
                    "There is no prior chat history with John Doe.", title="John Doe"
                ),
                ui.tab(
                    "There is no prior chat history with Jane Doe.", title="Jane Doe"
                ),
                ui.tab(
                    "There is no prior chat history with Joe Bloggs.",
                    title="Joe Bloggs",
                ),
            ),
            width="80px",
        )
    ]


my_tabs_overflow_example = ui_tabs_overflow_example()
```


## Emphasized

The `is_emphasized` prop makes the line underneath the selected tab the user's accent color, adding a visual prominence to the selection.

```python
from deephaven import ui


my_tabs_is_emphasized_example = ui.tabs(
    ui.tab("There is no prior chat history with John Doe.", title="John Doe"),
    ui.tab("There is no prior chat history with Jane Doe.", title="Jane Doe"),
    ui.tab("There is no prior chat history with Joe Bloggs.", title="Joe Bloggs"),
    is_emphasized=True,
)
```


## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.tabs
```