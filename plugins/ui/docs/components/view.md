# View

View is a general purpose container with no specific semantics that can be used for custom styling purposes. It supports Deephaven UI style props to ensure consistency with other components.

View is useful when adding padding, as flex only accepts margin.

Views accept theme colors such as `accent-400`. Theme colors adjust based on a user's selected theme.

## Example

```python
from deephaven import ui

view = ui.view(
    ui.text_field(label="Name"),
    border_width="thin",
    border_color="accent-400",
    background_color="seafoam-500",
    border_radius="medium",
    padding="size-250",
)
```

## UI recommendations

Recommendations for creating views:

1. Views are analogous to HTML <div>'s, and can be used in a similar regard to ensure consistency in styling across components.
2. Views lose their value when overused. Use them sparingly to avoid creating unnecessary complexity.
3. A view's height is flexible; it should accommodate the amount of content inside.
4. Views should be used when a flexible layout container is needed that can handle various combinations of components (ie., `text_field`s, `text_area`s, or buttons).

## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.view
```
