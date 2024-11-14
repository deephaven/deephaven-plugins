# Badge

Badges display small, color-coded pieces of metadata to capture a user's attention. They are useful for highlighting important information, such as notifications, statuses, or counts.

## Example

```python
from deephaven import ui

my_badge_basic = ui.badge("Licensed", variant="positive")
```

## UI recommendations

Consider using [`text`](./text.md) to provide descriptive text for elements without the colored emphasis of a badge.


## Content

Badges can include a label, an icon, or both as children.

```python
from deephaven import ui


my_badge_context_example = ui.badge(
    ui.icon("vsWarning"), "Rejected", variant="negative"
)
```


## Variants

Badges can have different colors to indicate their purpose.

```python
from deephaven import ui


@ui.component
def ui_badge_variant_examples():
    return [
        ui.badge(
            "Green: Approved, Complete, Success, New, Purchased, Licensed",
            variant="positive",
        ),
        ui.badge("Blue: Active, In Use, Live, Published", variant="info"),
        ui.badge("Red: Error, Alert, Rejected, Failed", variant="negative"),
        ui.badge(
            "Gray: Archived, Deleted, Paused, Draft, Not Started, Ended",
            variant="neutral",
        ),
    ]


my_badge_variant_examples = ui_badge_variant_examples()
```

Use badges with label colors to color-code categories, ideally for 8 or fewer categories.


```python
from deephaven import ui


@ui.component
def ui_badge_variant_color_examples():
    return [
        ui.badge("Seafoam", variant="seafoam"),
        ui.badge("Indigo", variant="indigo"),
        ui.badge("Purple", variant="purple"),
        ui.badge("Fuchsia", variant="fuchsia"),
        ui.badge("Magenta", variant="magenta"),
        ui.badge("Yellow", variant="yellow"),
    ]


my_badge_variant_color_examples = ui_badge_variant_color_examples()
```

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.badge
```
