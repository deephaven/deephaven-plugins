from __future__ import annotations
from typing import Callable, Literal, TypedDict


class FocusEvent(TypedDict):
    type: Literal["focus", "blur"]
    """
    The type of focus event being fired.
    """

    target: str | None
    """
    The name of the target element of the focus event.
    """

    relatedTarget: str | None
    """
    The name of the related target element of the focus event.
    """


class KeyboardEvent(TypedDict):
    code: str
    """
    Returns a string with the code value of the key represented by the event.
    """

    key: str
    """
    Returns a string with the key value of the key represented by the event.
    """

    shiftKey: bool
    """
    Whether the shift keyboard modifier was held during the press event.
    """

    ctrlKey: bool
    """
    Whether the ctrl keyboard modifier was held during the press event.
    """

    metaKey: bool
    """
    Whether the meta keyboard modifier was held during the press event.
    """

    altKey: bool
    """
    Whether the alt keyboard modifier was held during the press event.
    """

    repeat: bool
    """
    Returns a boolean value that is `True` if the key is being held down such that it is automatically repeating.
    """


class PressEvent(TypedDict):
    type: PressEventType
    """
    The type of press event being fired.
    """

    pointerType: PointerType
    """
    The pointer type that triggered the press event.
    """

    target: str | None
    """
    The name of the target element of the press event.
    """

    shiftKey: bool
    """
    Whether the shift keyboard modifier was held during the press event.
    """

    ctrlKey: bool
    """
    Whether the ctrl keyboard modifier was held during the press event.
    """

    metaKey: bool
    """
    Whether the meta keyboard modifier was held during the press event.
    """

    altKey: bool
    """
    Whether the alt keyboard modifier was held during the press event.
    """


class SliderChange(TypedDict):
    """
    Data for a range slider change event.
    """

    start: float
    """
    Minimum value of the range slider.
    """

    end: float
    """
    Maximum value of the range slider.
    """


SliderChangeCallable = Callable[[SliderChange], None]

PointerType = Literal["mouse", "touch", "pen", "keyboard", "virtual"]
PressEventType = Literal["pressstart", "pressend", "pressup", "press"]
TriggerType = Literal["press", "longPress"]
KeyboardActivationType = Literal["automatic", "manual"]

StaticColor = Literal["white", "black"]
ButtonType = Literal["button", "submit", "reset"]
ButtonLabelBehavior = Literal["show", "collapse", "hide"]
ButtonVariant = Literal["accent", "primary", "secondary", "negative"]
ButtonStyle = Literal["fill", "outline"]
ElementTypes = Literal["div", "button", "a"]
Orientation = Literal["horizontal", "vertical"]

FocusEventCallable = Callable[[FocusEvent], None]
KeyboardEventCallable = Callable[[KeyboardEvent], None]
PressEventCallable = Callable[[PressEvent], None]
