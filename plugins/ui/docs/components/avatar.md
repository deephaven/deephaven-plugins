# Avatar

An avatar is a small image or icon representing a user or organization.

## Example

```python
from deephaven import ui


my_avatar_basic = ui.avatar(
    src="https://github.com/deephaven.png", alt="default avatar"
)
```


## Disabled State

The `is_disabled` prop disables avatars to prevent user interaction and gives them a silenced style.

```python
from deephaven import ui


my_avatar_is_disabled_example = ui.avatar(
    src="https://github.com/deephaven.png", alt="default avatar", is_disabled=True
)
```


## Size

The `size` of an avatar can be set to one of the preset sizes, or a custom pixel value.

```python
from deephaven import ui


@ui.component
def ui_avatar_sizing_examples():
    return [
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-50",
            size="avatar-size-50",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-75",
            size="avatar-size-75",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="davatar-size-100",
            size="avatar-size-100",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-200",
            size="avatar-size-200",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-300",
            size="avatar-size-300",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-400",
            size="avatar-size-400",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-500",
            size="avatar-size-500",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-600",
            size="avatar-size-600",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png",
            alt="avatar-size-700",
            size="avatar-size-700",
        ),
        ui.avatar(
            src="https://github.com/deephaven.png", alt="custom pixel size", size=80
        ),
    ]


my_avatar_sizing_examples = ui_avatar_sizing_examples()
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.avatar
```
