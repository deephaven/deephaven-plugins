# Flex
A [flexbox](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox)-based layout container that utilizes dimension values and supports the gap property for consistent spacing between items.

## Example

```python
from deephaven import ui


@ui.component
def flex():
    return ui.flex(
        ui.view(background_color="red", height="size-800", width="size-800"),
        ui.view(background_color="green", height="size-800", width="size-800"),
        ui.view(background_color="yellow", height="size-800", width="size-800"),
    )


my_flex = flex()
```

## Direction

The `direction` prop determines the direction in which the flex items are laid out.

Options:
- `row` (default): the flex items are arranged horizontally from left to right.
- `column`: the flex items are arranged vertically from top to bottom.
- `row-reverse`: the flex items are arranged horizontally from right to left.
- `column-reverse`: the flex items are arranged vertically from bottom to top.

```python
from deephaven import ui


@ui.component
def flex():
    return [
        ui.flex(
            ui.view(background_color="red", height="size-800", width="size-800"),
            ui.view(background_color="green", height="size-800", width="size-800"),
            ui.view(background_color="yellow", height="size-800", width="size-800"),
        ),
        ui.flex(
            ui.view(background_color="red", height="size-800", width="size-800"),
            ui.view(background_color="green", height="size-800", width="size-800"),
            ui.view(background_color="yellow", height="size-800", width="size-800"),
            direction="row-reverse",
        ),
        ui.flex(
            ui.view(background_color="red", height="size-800", width="size-800"),
            ui.view(background_color="green", height="size-800", width="size-800"),
            ui.view(background_color="yellow", height="size-800", width="size-800"),
            direction="column",
        ),
        ui.flex(
            ui.view(background_color="red", height="size-800", width="size-800"),
            ui.view(background_color="green", height="size-800", width="size-800"),
            ui.view(background_color="yellow", height="size-800", width="size-800"),
            direction="column-reverse",
        ),
    ]


my_flex = flex()
```

## Nesting

Flexboxes can be nested to create more complicated layouts. By using the `flex` prop on the children, the flexbox can expand to fill the remaining space.

```python
from deephaven import ui


@ui.component
def flex():
    return [
        ui.flex(
            ui.view(background_color="red", height="size-800"),
            ui.flex(
                ui.view(background_color="green", height="size-800", width="size-800"),
                ui.view(background_color="blue", height="size-800", width="size-800"),
            ),
            direction="column",
        ),
    ]


my_flex = flex()
```


## Wrapping

When enabled, items that overflow wrap into the next row. Resize your browser window to see the items reflow.

```python
from deephaven import ui


@ui.component
def flex():
    return ui.flex(
        ui.view(background_color="red", height="size-800", width="size-800"),
        ui.view(background_color="green", height="size-800", width="size-800"),
        ui.view(background_color="yellow", height="size-800", width="size-800"),
        ui.view(background_color="blue", height="size-800", width="size-800"),
        ui.view(background_color="orange", height="size-800", width="size-800"),
        wrap=True,
        width="200px",
        align_content="start",
    )


my_flex = flex()
```


## Alignment

The `align_items` prop aligns items along the cross-axis. When the direction is set to "column", it controls horizontal alignment, and when it is set to "row", it controls vertical alignment.

Options:
- `stretch` (default): the flex items are stretched to fill the container along the cross-axis.
- `start`: the flex items are aligned at the start of the cross-axis.
- `end`: the flex items are aligned at the end of the cross-axis.
- `center`: the flex items are centered along the cross-axis.
- `self-start`: the flex items are aligned at the start of their container.
- `self-end`: the flex items are aligned at the end of their container.
- `baseline`: the flex items are aligned based on their baselines.
- `first baseline`: the flex items are aligned based on the first baseline of the container.
- `last baseline`: the flex items are aligned based on the last baseline of the container.
- `safe center`: the flex items are centered along the cross-axis, ensuring they remain within the safe area.
- `unsafe center`: the flex items are centered along the cross-axis, without considering the safe area.

```python
from deephaven import ui


@ui.component
def flex():
    vertical = ui.flex(
        ui.flex(
            ui.view(background_color="red", height="size-800", width="size-400"),
            ui.view(background_color="green", height="size-800", width="size-800"),
            ui.view(background_color="blue", height="size-800", width="size-200"),
            direction="column",
            align_items="start",
        ),
        ui.flex(
            ui.view(background_color="red", height="size-800", width="size-400"),
            ui.view(background_color="green", height="size-800", width="size-800"),
            ui.view(background_color="blue", height="size-800", width="size-200"),
            direction="column",
            align_items="center",
        ),
        ui.flex(
            ui.view(background_color="red", height="size-800", width="size-400"),
            ui.view(background_color="green", height="size-800", width="size-800"),
            ui.view(background_color="blue", height="size-800", width="size-200"),
            direction="column",
            align_items="end",
        ),
    )
    horizontal = ui.flex(
        ui.flex(
            ui.view(background_color="red", width="size-800", height="size-400"),
            ui.view(background_color="green", width="size-800", height="size-800"),
            ui.view(background_color="blue", width="size-800", height="size-200"),
            align_items="start",
        ),
        ui.flex(
            ui.view(background_color="red", width="size-800", height="size-400"),
            ui.view(background_color="green", width="size-800", height="size-800"),
            ui.view(background_color="blue", width="size-800", height="size-200"),
            align_items="center",
        ),
        ui.flex(
            ui.view(background_color="red", width="size-800", height="size-400"),
            ui.view(background_color="green", width="size-800", height="size-800"),
            ui.view(background_color="blue", width="size-800", height="size-200"),
            align_items="end",
        ),
        direction="column",
    )

    return ui.flex(vertical, horizontal)


my_flex = flex()
```


## Justification

The `justify_content` prop is used to align items along the main axis. When the direction is set to "column", it controls the vertical alignment, and when the direction is set to "row", it controls the horizontal alignment.

Options:
- `stretch` (default): the flex items are stretched to fill the container along the cross-axis.
- `start`: the flex items are aligned at the start of the cross-axis.
- `end`: the flex items are aligned at the end of the cross-axis.
- `center`: the flex items are centered along the cross-axis.
- `left`: the flex items are packed toward the left edge of the container.
- `right`: the flex items are packed toward the right edge of the container.
- `space-between`: the flex items are evenly distributed with the first item at the start and the last item at the end.
- `space-around`: the flex items are evenly distributed with equal space around them.
- `space-evenly`: the flex items are evenly distributed with equal space between them.
- `baseline`: the flex items are aligned based on their baselines.
- `first baseline`: the flex items are aligned based on the first baseline of the container.
- `last baseline`: the flex items are aligned based on the last baseline of the container.
- `safe center`: the flex items are centered along the cross-axis, ensuring they remain within the safe area.
- `unsafe center`: the flex items are centered along the cross-axis, without considering the safe area.

```python
from deephaven import ui


@ui.component
def flex():
    start = ui.flex(
        ui.view(background_color="red", height="size-800", width="size-400"),
        ui.view(background_color="green", height="size-800", width="size-800"),
        ui.view(background_color="blue", height="size-800", width="size-200"),
        justify_content="start",
        width="500px",
    )
    center = ui.flex(
        ui.view(background_color="red", height="size-800", width="size-400"),
        ui.view(background_color="green", height="size-800", width="size-800"),
        ui.view(background_color="blue", height="size-800", width="size-200"),
        justify_content="center",
        width="500px",
    )
    end = ui.flex(
        ui.view(background_color="red", height="size-800", width="size-400"),
        ui.view(background_color="green", height="size-800", width="size-800"),
        ui.view(background_color="blue", height="size-800", width="size-200"),
        justify_content="end",
        width="500px",
    )

    return ui.flex(start, center, end, direction="column")


my_flex = flex()
```


## API reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.flex
```