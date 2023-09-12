from __future__ import annotations

from typing import Any


class Reference:
    """A reference to an object

    Attributes:
        index: int: The index of the reference
        obj: object: The object that the reference points to
    """

    def __init__(self, index: int, obj: object):
        """
        Create a new reference
        Args:
            index: int: The index of the reference
            obj: object: The object that the reference points to
        """
        self.index = index
        self.obj = obj


class Exporter:
    """
    An exporter that keeps track of references to objects that need to be sent
    """

    def __init__(
        self,
    ):
        self.references = {}
        pass

    def reference(self, obj: object) -> Reference:
        """Creates a reference for an object, ensuring that it is exported for
        use on the client. Each time this is called, a new reference will be
        returned, with the index of the export in the data to be sent to the
        client.

        Args:
        obj: object: The object to create a reference for

        Returns:
            Reference: The reference to the object

        """
        if obj not in self.references:
            self.references[obj] = Reference(len(self.references), obj)
        return self.references[obj]

    def reference_list(self) -> list[Any]:
        """
        Creates a list of references for a list of objects

        Returns:
            list[Reference]: The list of references to the objects

        """
        return list(self.references.keys())
