from .BaseElement import BaseElement
from .._internal import dict_to_camel_case, remove_empty_keys


class SpectrumElement(BaseElement):
    """
    Base class for UI elements that are part of the Spectrum design system.
    All names are automatically prefixed with "deephaven.ui.spectrum.", and all props are automatically camelCased.
    """

    def __init__(self, name: str, *children, **props):
        super().__init__(
            f"deephaven.ui.spectrum.{name}",
            *children,
            **dict_to_camel_case(remove_empty_keys(props)),
        )
