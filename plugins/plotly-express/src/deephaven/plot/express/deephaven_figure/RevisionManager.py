import threading
from typing import Any


class RevisionManager:
    """
    A manager for revisions. This is used to ensure that revisions are correctly ordered
    without overlap. Note that the RevisionManager context manager locks, and
    generally table operations should not be done within the body.

    Attributes:
        lock: threading.Lock: The lock to use for the manager
        rev_lock: threading.Lock: The lock to use for the revision. Note that
        this is a different lock than the one used for the manager, as
        acquiring a revision number should not block creating a new revision
        revision: int: The last revision that was assigned
        current_revision: int: The current revision that has been applied
    """

    def __init__(self):
        self.lock = threading.Lock()
        self.rev_lock = threading.Lock()
        self.revision = 0
        self.current_revision = 0

    def __enter__(self):
        self.lock.acquire()

    def __exit__(self, exc_type: Any, exc_value: Any, traceback: Any):

        self.lock.release()

    def get_revision(self) -> int:
        """
        Get the next revision

        Returns:
            The next revision

        """
        with self.rev_lock:
            self.revision += 1
            return self.revision

    def updated_revision(self, revision: int) -> bool:
        """
        Update the current revision if the passed revision is greater than the
        current revision. This should be called with the node lock held

        Args:
            revision: The revision to update to

        Returns:
            True if the revision was updated, False otherwise

        """
        can_update = self.current_revision < revision
        if can_update:
            self.current_revision = revision
        return can_update
