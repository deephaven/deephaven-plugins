from __future__ import annotations

from .use_state import use_state
from typing import Generic, overload, TypeVar, Optional

T = TypeVar("T")


class Ref(Generic[T]):
    """
    A simple object that just stores a reference to a value in `current`
    Use it with a `use_ref` hook.
    """

    current: T

    def __init__(self, current: T):
        self.current = current


@overload
def use_ref(initial_value: T) -> Ref[T]:
    ...


@overload
def use_ref(initial_value: T | None) -> Ref[T | None]:
    ...


def use_ref(initial_value: T | None = None) -> Ref[T] | Ref[T | None]:
    """
    Store a reference to a value that will persist across renders.

    Args:
      initial_value: The initial value of the reference.

    Returns:
      A Ref object with a current property that you can get/set
    """
    ref, _ = use_state(Ref(initial_value))
    return ref
