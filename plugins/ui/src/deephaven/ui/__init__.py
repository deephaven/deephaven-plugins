"""
deephaven.ui is a plugin for Deephaven that provides a Python API for creating UIs.

The API is designed to be similar to React, but with some differences to make it more Pythonic.
"""

from deephaven.plugin import Registration, Callback
from .components import *
from .elements import *
from .hooks import *
from .object_types import *

__version__ = "0.6.0"


class UIRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        callback.register(DashboardType)
        callback.register(ElementType)
