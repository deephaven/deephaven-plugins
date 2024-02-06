from typing import Any

from ..elements import DashboardElement
from .ElementType import ElementType


class DashboardType(ElementType):
    """
    Defines the Dashboard type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "deephaven.ui.Dashboard"

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, DashboardElement)
