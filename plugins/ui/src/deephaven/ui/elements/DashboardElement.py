from __future__ import annotations

import logging
from .BaseElement import BaseElement
from .FunctionElement import FunctionElement

logger = logging.getLogger(__name__)


class DashboardElement(BaseElement):
    def __init__(self, element: FunctionElement):
        super().__init__("deephaven.ui.components.Dashboard", element)
