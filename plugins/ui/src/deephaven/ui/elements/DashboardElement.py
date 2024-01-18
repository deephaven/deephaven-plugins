from __future__ import annotations

from typing import Any
import logging
from .BaseElement import BaseElement

logger = logging.getLogger(__name__)


class DashboardElement(BaseElement):
    def __init__(self, *children: Any, **props: Any):
        super(DashboardElement, self).__init__(
            "deephaven.ui.components.Dashboard", *children, **props
        )
