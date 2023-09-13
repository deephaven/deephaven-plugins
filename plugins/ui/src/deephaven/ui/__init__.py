# The deephaven.ui plugin

from deephaven.plugin import Registration, Callback
from .components import *
from .hooks import *


__version__ = "0.0.1.dev0"


class UIRegistration(Registration):
    @classmethod
    def register_into(cls, callback: Callback) -> None:
        callback.register(UINodeType)
        callback.register(TextFieldType)
        callback.register(TextType)
