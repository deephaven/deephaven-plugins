from __future__ import annotations

import json
from functools import partial
from typing import Any
import io

from deephaven.plugin.object_type import MessageStream
from deephaven.table_listener import listen, TableUpdate
from deephaven.liveness_scope import LivenessScope

from ..exporter import Exporter
from ..deephaven_figure import DeephavenFigure, DeephavenFigureNode, RevisionManager


class DeephavenFigureListener:
    """
    Listener for DeephavenFigure

    Attributes:
        _connection: MessageStream: The connection to send messages to
        _figure: DeephavenFigure: The figure to listen to
        _exporter: Exporter: The exporter to use for exporting the figure
        _liveness_scope: Any: The liveness scope to use for the listeners
        _listeners: list[Any]: The listeners for the partitioned tables
        _partitioned_tables: dict[str, tuple[PartitionedTable, DeephavenFigureNode]]:
            The partitioned tables to listen to
        _revision_manager: RevisionManager: The revision manager to use for the figure
        _handles: list[Any]: The handles for the listeners
    """

    def __init__(
        self,
        figure: DeephavenFigure,
        connection: MessageStream,
    ):
        """
        Create a new listener for the figure

        Args:
            figure: The figure to listen to
            connection: The connection to send messages to
        """
        self._connection = connection

        # copy the figure so only this session's figure is updated
        # the liveness scope is needed to keep any tables alive
        self._figure = figure.copy()
        self._exporter = Exporter()
        self._liveness_scope = LivenessScope()
        # store hard references to the handles so they don't get garbage collected
        self._handles = []
        self._listeners = []
        self._revision_manager = RevisionManager()

        head_node = self._figure.get_head_node()
        self._partitioned_tables = head_node.partitioned_tables

        self._setup_listeners()

        # force figure to be recreated after listeners are setup
        # this ensures the figures are created correctly
        # such as when partitions have been added but no listeners have been running
        self._figure.recreate_figure()

    def _setup_listeners(self) -> None:
        """
        Setup listeners for the partitioned tables
        """
        for table, node in self._partitioned_tables.values():
            listen_func = partial(self._on_update, node)
            # if a table is not refreshing, it will never update, so no need to listen
            if table.is_refreshing:
                handle = listen(table, listen_func)
                self._handles.append(handle)
                self._liveness_scope.manage(handle)

    def _get_figure(self) -> DeephavenFigure | None:
        """
        Get the current figure

        Returns:
            The current figure
        """
        return self._figure.get_figure()

    def _on_update(
        self, node: DeephavenFigureNode, update: TableUpdate, is_replay: bool
    ) -> None:
        """
        Update the figure. Because this is called when the PartitionedTable
        meta table is updated, it will always trigger a rerender.

        Args:
            node: The node to update. Changes will propagate up from this node.
            update: Not used. Required for the listener.
            is_replay: Not used. Required for the listener.
        """
        if self._connection:
            revision = self._revision_manager.get_revision()
            node.recreate_figure()
            figure = self._get_figure()
            try:
                self._connection.on_data(*self._build_figure_message(figure, revision))
            except RuntimeError:
                # trying to send data when the connection is closed, ignore
                pass

    def _handle_retrieve_figure(self) -> tuple[bytes, list[Any]]:
        """
        Handle a retrieve message. This will return a message with the current
        figure.

        Returns:
            The result of the message as a tuple of (new payload, new references)
        """
        return self._build_figure_message(self._get_figure())

    def _build_figure_message(
        self, figure: DeephavenFigure | None, revision: int | None = None
    ) -> tuple[bytes, list[Any]]:
        """
        Build a message to send to the client with the current figure.

        Args:
            figure: The figure to send
            revision: The revision to send

        Returns:
            The result of the message as a tuple of (new payload, new references)
        """
        exporter = self._exporter

        if not figure:
            raise ValueError("Figure is None")

        with self._revision_manager:
            # if revision is None, just send the figure
            if revision is not None:
                self._revision_manager.updated_revision(revision)

            new_figure = figure.to_dict(exporter=exporter)

            new_objects, new_references, removed_references = exporter.references()

            message = {
                "type": "NEW_FIGURE",
                "figure": new_figure,
                "revision": self._revision_manager.current_revision,
                "new_references": new_references,
                "removed_references": removed_references,
            }
            return json.dumps(message).encode(), new_objects
            # otherwise, don't need to send anything, as a newer revision has
            # already been sent

    def process_message(
        self, payload: bytes, references: list[Any]
    ) -> tuple[bytes, list[Any]]:
        """
        The main message processing function. This will handle the message
        and return the result.

        Args:
            payload: The payload to process
            references:  References to objects on the server

        Returns:
            The result of the message as a tuple of (new payload, new references)

        """
        # need to create a new exporter for each message
        message = json.loads(io.BytesIO(payload).read().decode())
        if message["type"] == "RETRIEVE":
            return self._handle_retrieve_figure()
        elif message["type"] == "FILTER":
            self._figure.update_filters(message["filterMap"])
            revision = self._revision_manager.get_revision()
            # updating the filters automatically recreates the figure, so it's ready to send
            figure = self._get_figure()
            try:
                self._connection.on_data(*self._build_figure_message(figure, revision))
            except RuntimeError:
                # trying to send data when the connection is closed, ignore
                pass
        return b"", []

    def __del__(self):
        self._liveness_scope.release()
