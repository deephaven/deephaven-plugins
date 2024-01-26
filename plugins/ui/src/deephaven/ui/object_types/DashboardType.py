from ..elements import DashboardElement
from .._internal import get_component_name
from .ElementMessageStream import ElementMessageStream
from .ElementType import ElementType


class DashboardType(ElementType):
    """
    Defines the Dashboard type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "deephaven.ui.Dashboard"

    def is_type(self, obj: any) -> bool:
        return isinstance(obj, DashboardElement)
