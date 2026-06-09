from typing import Any

from deephaven.plugin.object_type import BidirectionalObjectType, MessageStream
from ..elements import Element
from .ElementMessageStream import ElementMessageStream

# Escape-hatch configuration property. When set to true, deephaven.ui declares no authorization export behavior
# ("unset"), deferring to the server's default policy instead of enforcing the transform.
_DISABLE_AUTHORIZATION_EXPORT_TRANSFORM_PROPERTY = (
    "deephaven.ui.disableAuthorizationExportTransform"
)


class ElementType(BidirectionalObjectType):
    """
    Defines the Element type for the Deephaven plugin system.
    """

    @property
    def name(self) -> str:
        return "deephaven.ui.Element"

    @property
    def authorization_export_behavior(self) -> str:
        """Declares that deephaven.ui must export its references through the authorization transform.

        Server objects (tables, etc.) handed to the client via a deephaven.ui component are run through the
        authorization transform in the viewer's context, so they carry the viewer's ACLs rather than the query
        owner's. Setting the configuration property ``deephaven.ui.disableAuthorizationExportTransform`` to true
        reverts to the server's default ("unset") behavior. If the configuration cannot be read, the transform is
        enforced (fail secure).
        """
        try:
            from deephaven.configuration import get_configuration

            if get_configuration().get_bool(
                _DISABLE_AUTHORIZATION_EXPORT_TRANSFORM_PROPERTY, False
            ):
                return "unset"
        except Exception:
            # Fail secure: if the escape hatch cannot be evaluated, enforce the transform.
            pass
        return "transform"

    def is_type(self, obj: Any) -> bool:
        return isinstance(obj, Element)

    def create_client_connection(
        self, obj: object, connection: MessageStream
    ) -> MessageStream:
        if not isinstance(obj, Element):
            raise TypeError(f"Expected Element, got {type(obj)}")
        client_connection = ElementMessageStream(obj, connection)
        client_connection.start()
        return client_connection
