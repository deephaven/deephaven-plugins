# Breadcrumbs

Breadcrumbs show hierarchy and navigational context for a user's location within an application.

```python
from deephaven import ui


breadcrumbs_example = ui.view(
    ui.breadcrumbs(
        ui.item("Deephaven", key="deephaven"),
        ui.item("Products", key="products"),
        ui.item("Community Core", key="community_core"),
    ),
    width="100%",
)
```

## Content

`ui.breadcrumbs` accepts `item` elements as children, each with a `key` prop. Basic usage of breadcrumbs, seen in the example above, shows multiple items populated with a string.

## Events

Use the `on_action` prop to specify a callback to handle press events on items.

```python
from deephaven import ui


@ui.component
def breadcrumbs_action_example():
    selected, set_selected = ui.use_state("None")

    return (
        ui.view(
            ui.breadcrumbs(
                ui.item("Deephaven", key="deephaven"),
                ui.item("Products", key="products"),
                ui.item("Community Core", key="community_core"),
                on_action=set_selected,
            ),
            ui.text(f"{selected} clicked"),
            width="100%",
        ),
    )


my_breadcrumbs_action_example = breadcrumbs_action_example()
```

## Links

By default, interacting with an item in breadcrumbs triggers `on_action`. By passing the `href` prop to the `ui.item` component, items may also be links to another page or website. The target window to open the link in can be configured using the `target` prop.

```python
from deephaven import ui


breadcrumbs_link_example = ui.view(
    ui.breadcrumbs(
        ui.item(
            "Deephaven",
            key="deephaven",
            href="https://deephaven.io/",
            target="_blank",
        ),
        ui.item(
            "Community Core",
            key="community_core",
            href="https://deephaven.io/community/",
            target="_blank",
        ),
        ui.item(
            "Getting Started",
            key="getting_started",
            href="https://deephaven.io/core/docs/getting-started/quickstart/",
            target="_blank",
        ),
    ),
    width="100%",
)
```

## Size

The size of the breadcrumbs including spacing and layout can be set using the `size` prop. By default this is set to `"L"`.

```python
from deephaven import ui


breadcrumbs_size_example = ui.view(
    ui.breadcrumbs(
        ui.item("Deephaven", key="deephaven"),
        ui.item("Products", key="products"),
        ui.item("Community Core", key="community_core"),
    ),
    ui.breadcrumbs(
        ui.item("Deephaven", key="deephaven"),
        ui.item("Products", key="products"),
        ui.item("Community Core", key="community_core"),
        size="M",
    ),
    ui.breadcrumbs(
        ui.item("Deephaven", key="deephaven"),
        ui.item("Products", key="products"),
        ui.item("Community Core", key="community_core"),
        size="S",
    ),
    width="100%",
)
```

## Multiline

Use the `is_multiline` prop to place the last item below the other items. This adds emphasis to the current location as a page title or heading.

```python
from deephaven import ui


breadcrumbs_multiline_example = ui.view(
    ui.breadcrumbs(
        ui.item("Deephaven", key="deephaven"),
        ui.item("Products", key="products"),
        ui.item("Community Core", key="community_core"),
        is_multiline=True,
    ),
    width="100%",
)
```

## Root context

Some applications find that always displaying the root item is useful to orient users. Use the `show_root` prop to keeps the root visible when other items are truncated into the menu.

```python
from deephaven import ui


breadcrumbs_root_context_example = ui.view(
    ui.breadcrumbs(
        ui.item("Deephaven", key="deephaven"),
        ui.item("Products", key="products"),
        ui.item("Community Core", key="community_core"),
        ui.item("Getting Started", key="getting_started"),
        ui.item("Create Tables", key="create_tables"),
        show_root=True,
    ),
    width="300px",
)
```

## Disabled

Use the `is_disabled` prop to show items but indicate that navigation is not available. This can be used to maintain layout continuity.

```python
from deephaven import ui


breadcrumbs_disabled_example = ui.view(
    ui.breadcrumbs(
        ui.item("Deephaven", key="deephaven"),
        ui.item("Products", key="products"),
        ui.item("Community Core", key="community_core"),
        is_disabled=True,
    ),
    width="100%",
)
```

## Overflow behavior

Breadcrumbs collapses items into a menu when space is limited. It will only show a maximum of 4 visible items including the root and menu button, if either are visible.

If the root item cannot be rendered in the available horizontal space, it will be collapsed into the menu regardless of the `show_root` prop.

Note that the last breadcrumb item will automatically truncate with an ellipsis instead of collapsing into the menu.

```python
from deephaven import ui


@ui.component
def breadcrumbs_overflow_example():
    return [
        ui.view(
            ui.breadcrumbs(
                ui.item("Deephaven", key="deephaven"),
                ui.item("Products", key="products"),
                ui.item("Community Core", key="community_core"),
                ui.item("Getting Started", key="getting_started"),
                ui.item("Create Tables", key="create_tables"),
                show_root=True,
            ),
            border_width="thin",
            border_color="accent-400",
            width="100%",
        ),
        ui.view(
            ui.breadcrumbs(
                ui.item("Deephaven", key="deephaven"),
                ui.item("Products", key="products"),
                ui.item("Community Core", key="community_core"),
                ui.item("Getting Started", key="getting_started"),
                ui.item("Create Tables", key="create_tables"),
                show_root=True,
            ),
            border_width="thin",
            border_color="accent-400",
            width="200px",
        ),
        ui.view(
            ui.breadcrumbs(
                ui.item("Deephaven", key="deephaven"),
                ui.item("Products", key="products"),
                ui.item("Community Core", key="community_core"),
                ui.item("Getting Started", key="getting_started"),
                ui.item("Create Tables", key="create_tables"),
            ),
            border_width="thin",
            border_color="accent-400",
            width="100px",
        ),
    ]


my_breadcrumbs_overflow_example = breadcrumbs_overflow_example()
```

## Detailed Example

Below is an example using the generated `tips` dataset from the Deephaven Express API. It allows you to explore the data in a hierarchical order of day, time, sex, and smoker status.

```python
import deephaven.plot.express as dx
from deephaven import ui

OPTIONS = ["Day", "Time", "Sex", "Smoker", ""]
OPTION_ITEMS = {
    "Day": [
        ui.item("Thur", key="Thur"),
        ui.item("Fri", key="Fri"),
        ui.item("Sat", key="Sat"),
        ui.item("Sun", key="Sun"),
    ],
    "Time": [
        ui.item("Lunch", key="Lunch"),
        ui.item("Dinner", key="Dinner"),
    ],
    "Sex": [
        ui.item("Male", key="Male"),
        ui.item("Female", key="Female"),
    ],
    "Smoker": [
        ui.item("Yes", key="Yes"),
        ui.item("No", key="No"),
    ],
}


@ui.component
def tips_filterer():
    tips = dx.data.tips(ticking=False)

    items, set_items = ui.use_state([ui.item("All Tips")])
    option, set_option = ui.use_state(OPTIONS[0])
    filters, set_filters = ui.use_state([])

    def handle_action(key):
        set_items(items + [ui.item(f"{key}", key=option)])
        set_option(OPTIONS[OPTIONS.index(option) + 1])
        set_filters(filters + [f"{option} == '{key}'"])

    def handle_back(key):
        if key not in OPTIONS:
            set_items([ui.item("All Tips")])
            set_option(OPTIONS[0])
            set_filters([])
            return

        selected_index = OPTIONS.index(key)
        set_items(items[: selected_index + 2])
        set_option(OPTIONS[selected_index + 1])
        set_filters(filters[: selected_index + 1])

    return ui.flex(
        ui.flex(
            ui.breadcrumbs(*items, show_root=True, on_action=handle_back, flex_grow=1),
            ui.view(
                ui.menu_trigger(
                    ui.action_button(f"Filter by {option}"),
                    ui.menu(*OPTION_ITEMS[option], on_action=handle_action),
                ),
            )
            if not option == ""
            else None,
        ),
        tips.where(filters=filters).view(
            formulas=["TotalBill", "Tip", "Size"] + OPTIONS[OPTIONS.index(option) : -1]
        ),
        direction="column",
    )


my_tips = tips_filterer()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.breadcrumbs
```
