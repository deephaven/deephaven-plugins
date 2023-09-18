import json
from typing import Any, List
from deephaven.plugin.object_type import Exporter, FetchOnlyObjectType
from .._internal import get_component_name
from ..elements import Element


class ElementType(FetchOnlyObjectType):
    @property
    def name(self) -> str:
        return get_component_name(Element)

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, Element)

    def to_bytes(self, exporter: Exporter, element: Element) -> bytes:
        props = element.props
        if props is None:
            props = {}
        return json.dumps(props, separators=(",", ":")).encode()
