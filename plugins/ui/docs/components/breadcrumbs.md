# Breadcrumbs

Breadcrumbs show hierarchy and navigational context for a user's location within an application.

```python
from deephaven import ui


@ui.component
def breadcrumbs_example():
    return (
        ui.view(
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
            ),
            width="100%",
        ),
    )


my_breadcrumbs_example = breadcrumbs_example()
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
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                on_action=set_selected,
            ),
            ui.text(f"{selected} clicked"),
            width="100%",
        ),
    )


my_breadcrumbs_action_example = breadcrumbs_action_example()
```

## Links

By default, interacting with an item in breadcrumbs triggers `on_action`. By passing the `href` prop to the `ui.item` component, items may also be links to another page or website.

## Size

The size of the breadcrumbs including spacing and layout can be set using the `size` prop. By default this is set to `"L"`.

```python
from deephaven import ui


@ui.component
def breadcrumbs_size_example():
    return (
        ui.view(
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
            ),
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                size="M",
            ),
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                size="S",
            ),
            width="100%",
        ),
    )


my_breadcrumbs_size_example = breadcrumbs_size_example()
```

## Multiline

Use the `is_multiline` prop to place the last item below the other items. This adds emphasis to the current location as a page title or heading.

```python
from deephaven import ui


@ui.component
def breadcrumbs_multiline_example():
    return (
        ui.view(
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                is_multiline=True,
            ),
            width="100%",
        ),
    )


my_breadcrumbs_multiline_example = breadcrumbs_multiline_example()
```

## Root context

Some applications find that always displaying the root item is useful to orient users. Use the `show_root` prop to keeps the root visible when other items are truncated into the menu.

```python
from deephaven import ui


@ui.component
def breadcrumbs_root_context_example():
    return (
        ui.view(
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                ui.item("Winter", key="winter"),
                ui.item("Holiday", key="holiday"),
                show_root=True,
            ),
            width="200px",
        ),
    )


my_breadcrumbs_root_context_example = breadcrumbs_root_context_example()
```

## Disabled

Use the `is_disabled` prop to show items but indicate that navigation is not available. This can be used to maintain layout continuity.

```python
from deephaven import ui


@ui.component
def breadcrumbs_disabled_example():
    return (
        ui.view(
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                is_disabled=True,
            ),
            width="100%",
        ),
    )


my_breadcrumbs_disabled_example = breadcrumbs_disabled_example()
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
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                ui.item("Winter", key="winter"),
                ui.item("Holiday", key="holiday"),
                show_root=True,
            ),
            border_width="thin",
            border_color="accent-400",
            width="100%",
        ),
        ui.view(
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                ui.item("Winter", key="winter"),
                ui.item("Holiday", key="holiday"),
                show_root=True,
            ),
            border_width="thin",
            border_color="accent-400",
            width="150px",
        ),
        ui.view(
            ui.breadcrumbs(
                ui.item("Home", key="home"),
                ui.item("Trendy", key="trendy"),
                ui.item("March 2020 Assets", key="march 2020 assets"),
                ui.item("Winter", key="winter"),
                ui.item("Holiday", key="holiday"),
            ),
            border_width="thin",
            border_color="accent-400",
            width="100px",
        ),
    ]


my_breadcrumbs_overflow_example = breadcrumbs_overflow_example()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.breadcrumbs
```
