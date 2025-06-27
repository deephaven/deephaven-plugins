from __future__ import annotations
from deephaven import ui


@ui.component
def confetti(
    number_of_pieces: int = 200,
    friction: float = 0.99,
    wind: float = 0.0,
    gravity: float = 0.1,
    initial_velocity_x: float = 0.0,
    initial_velocity_y: float = 0.0,
    colors: list[str] | None = None,
    opacity: float = 1.0,
) -> ui.BaseElement:
    """
    A simple confetti animation

    Args:
        number_of_pieces: The number of confetti pieces to generate.
        friction: The friction applied to the confetti pieces.
        wind: The wind effect applied to the confetti pieces.
        gravity: The gravity effect applied to the confetti pieces.
        initial_velocity_x: The initial horizontal velocity of the confetti pieces.
        initial_velocity_y: The initial vertical velocity of the confetti pieces.
        colors: A list of colors for the confetti pieces. If None, defaults to a set of colors.
        opacity: The opacity of the confetti pieces.
    Returns:
        A component that renders the confetti animation.
    """
    props = locals()
    return ui.BaseElement(
        "confetti_plugin.confetti",
        **props,
    )


@ui.component
def fish_confetti(
    number_of_pieces: int = 200,
    friction: float = 0.99,
    wind: float = 0.0,
    gravity: float = 0.1,
    initial_velocity_x: float = 0.0,
    initial_velocity_y: float = 0.0,
    colors: list[str] | None = None,
    opacity: float = 1.0,
) -> ui.BaseElement:
    """
    A simple confetti animation

    Args:
        number_of_pieces: The number of confetti pieces to generate.
        friction: The friction applied to the confetti pieces.
        wind: The wind effect applied to the confetti pieces.
        gravity: The gravity effect applied to the confetti pieces.
        initial_velocity_x: The initial horizontal velocity of the confetti pieces.
        initial_velocity_y: The initial vertical velocity of the confetti pieces.
        colors: A list of colors for the confetti pieces. If None, defaults to a set of colors.
        opacity: The opacity of the confetti pieces.
    Returns:
        A component that renders the confetti animation.
    """
    props = locals()
    return ui.BaseElement(
        "confetti_plugin.fish_confetti",
        **props,
    )
