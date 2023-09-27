from __future__ import annotations

from typing import Any
import threading


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

    Attributes:
        _ref_count: int: The number of references that have been created
        _references: dict[object, Reference]: A map of objects to their references
        _new_references: list[Reference]: A list of new references that have been created
        _ref_lock: threading.Lock: A lock to ensure that references are created atomically
    """

    def __init__(
        self,
    ):
        self._ref_count: int = 0
        self._references: dict[object, Reference] = {}
        self._new_references: list[Reference] = []
        self._ref_lock: threading.Lock = threading.Lock()
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
        with self._ref_lock:
            if obj not in self._references:
                new_ref = self._ref_count
                self._ref_count += 1
                self._references[obj] = Reference(new_ref, obj)
                self._new_references.append(self._references[obj])
        return self._references[obj]

    def reference_list(self) -> list[Any]:
        """
        Creates a list of references for a list of objects

        Returns:
            list[Reference]: The list of references to the objects

        """
        with self._ref_lock:
            new_references = self._new_references
            self._new_references = []
        return new_references
