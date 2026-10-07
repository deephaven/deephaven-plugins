from __future__ import annotations

import json
import logging
import threading
from functools import partial
from typing import Any
import io

from deephaven.plugin.object_type import MessageStream
from deephaven.server.executors import submit_task
from deephaven.table import PartitionedTable
from deephaven.table_listener import listen, TableUpdate
from deephaven.liveness_scope import LivenessScope

from ..exporter import Exporter
from ..deephaven_figure import DeephavenFigure, DeephavenFigureNode, RevisionManager

logger = logging.getLogger(__name__)


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
        _dirty_nodes: set[DeephavenFigureNode]: Nodes whose tables changed since
            their last rebuild started
        _update_task_active: bool: Whether an update task is queued or running
        _update_lock: threading.Lock: Guards _dirty_nodes, _update_task_active and _closed
        _closed: bool: Whether the connection is closed
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
        self._dirty_nodes = set()
        self._update_task_active = False
        self._update_lock = threading.Lock()
        self._closed = False

        head_node = self._figure.get_head_node()
        self._partitioned_tables = head_node.partitioned_tables

        self._setup_listeners()

        # after registration and off the UG lock; anything newer reaches _on_update
        for table, node in self._partitioned_tables.values():
            if table.is_refreshing:
                node.recreate_figure()

    def _setup_listeners(self) -> None:
        """
        Setup listeners for the partitioned tables
        """
        for table, node in self._partitioned_tables.values():
            listen_func = partial(self._on_update, node)
            # if a table is not refreshing, it will never update, so no need to listen
            if table.is_refreshing:
                # If the table is a partitioned table, add the constituent
                # table as a dependency to ensure the constituents are ready
                # when the callback fires
                dependencies = (
                    [node.table.table]
                    if isinstance(node.table, PartitionedTable)
                    else None
                )
                handle = listen(table, listen_func, dependencies=dependencies)
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
        Mark the node as changed and make sure an update task will rebuild it.
        This runs on the update graph thread, so it must not build anything.

        Args:
            node: The node to update. Changes will propagate up from this node.
            update: Not used. Required for the listener.
            is_replay: Not used. Required for the listener.
        """
        with self._update_lock:
            self._dirty_nodes.add(node)
            if self._update_task_active or self._closed:
                # the active task picks this node up before it finishes
                return
            self._update_task_active = True
        submit_task("concurrent", self._process_updates)

    def _process_updates(self) -> None:
        """
        Rebuild dirty nodes and send the new figure until none are left.
        Updates that arrive during a rebuild are merged into one more rebuild.
        """
        while True:
            with self._update_lock:
                if not self._dirty_nodes or self._closed:
                    self._update_task_active = False
                    return
                # take the nodes before reading any tables so no update is lost
                nodes = list(self._dirty_nodes)
                self._dirty_nodes.clear()

            for node in nodes:
                with self._update_lock:
                    if self._closed:
                        self._update_task_active = False
                        return
                try:
                    revision = self._revision_manager.get_revision()
                    node.recreate_figure()
                    figure = self._get_figure()
                    message = self._build_figure_message(figure, revision)
                except Exception:
                    logger.exception("Error updating figure")
                    continue
                try:
                    self._connection.on_data(*message)
                except RuntimeError:
                    # trying to send data when the connection is closed, ignore
                    pass

    def close(self) -> None:
        """
        Stop listening for updates. Called when the connection closes.
        """
        with self._update_lock:
            self._closed = True
            self._dirty_nodes.clear()
        for handle in self._handles:
            handle.stop()

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
        elif message["type"] == "CALLABLE_EVENT":
            return self._handle_callable_event(message)
        return b"", []

    def _handle_callable_event(
        self, message: dict[str, Any]
    ) -> tuple[bytes, list[Any]]:
        """
        Handle a CALLABLE_EVENT message. Invokes the Python callback and
        optionally returns a response for preventable events.

        Args:
            message: The message dict containing callback_id, args, and optionally request_id

        Returns:
            The result as a tuple of (payload, references)
        """
        from ..types import wrap_callable

        callback_id = message.get("callback_id")
        args = message.get("args", {})
        request_id = message.get("request_id")

        figure = self._get_figure()
        fn = (
            figure.get_callback_by_id(callback_id)
            if figure and callback_id is not None
            else None
        )
        result = None

        if fn is not None:
            try:
                result = wrap_callable(fn)(args)
            except Exception:
                import logging

                logging.getLogger(__name__).exception(
                    "Error in plotly event callback %s", callback_id
                )

        # For preventable events, send back the result via the client connection
        if request_id is not None:
            response = json.dumps(
                {
                    "type": "CALLABLE_RESPONSE",
                    "request_id": request_id,
                    "result": result,
                }
            )
            try:
                self._connection.on_data(response.encode(), [])
            except RuntimeError:
                pass

        return b"", []

    def __del__(self):
        self._liveness_scope.release()
