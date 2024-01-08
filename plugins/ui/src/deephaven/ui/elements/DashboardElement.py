from __future__ import annotations
import logging
from .FunctionElement import FunctionElement

logger = logging.getLogger(__name__)


class DashboardElement(FunctionElement):
    def __init__(self, *args, **kwargs):
        super(DashboardElement, self).__init__(*args, **kwargs)

    @property
    def name(self):
        return self._name
