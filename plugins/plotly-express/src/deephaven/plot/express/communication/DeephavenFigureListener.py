from __future__ import annotations

import json
from functools import partial
from typing import Any

from deephaven.plugin.object_type import MessageStream
from deephaven.table_listener import listen

from ..deephaven_figure import Exporter, DeephavenFigure


class DeephavenFigureListener:
    """
    Listener for DeephavenFigure
    """

    def __init__(self, figure, connection, liveness_scope):
        self._connection: MessageStream = connection
        self._figure = figure
        self._exporter = Exporter()
        self._liveness_scope = liveness_scope

        self._listeners = []

        head_node = figure.get_head_node()
        self._partitioned_tables = head_node.partitioned_tables

        self._setup_listeners()

    def _setup_listeners(self):
        """
        Setup listeners for the partitioned tables
        """
        for table, node in self._partitioned_tables.values():
            listen_func = partial(self._on_update, node)
            handle = listen(table.table, listen_func)
            self._liveness_scope.manage(handle.listener)

        self._figure.listener = self

    def _get_figure(
        self,
    ) -> DeephavenFigure:
        """
        Get the current figure

        Returns:
            The current figure
        """
        return self._figure.get_figure()

    def _on_update(self, node, update, is_replay):
        """
        Update the figure. Because this is called when the PartitionedTable
        meta table is updated, it will always trigger a rerender.

        Args:
            node: The node to update. Changes will propagate up from this node.
            update: Not used. Required for the listener.
            is_replay: Not used. Required for the listener.
        """
        if self._connection:
            node.recreate_figure()
            self._connection.on_data(*self._build_figure_message(self._get_figure()))

    def _handle_retrieve_figure(self) -> tuple[bytes, list[Any]]:
        """
        Handle a retrieve message. This will return a message with the current
        figure.

        Returns:
            tuple[bytes, list[Any]]: The result of the message as a tuple of
              (new payload, new references)
        """
        return self._build_figure_message(self._get_figure())

    def _build_figure_message(self, figure) -> tuple[bytes, list[Any]]:
        """
        Build a message to send to the client with the current figure.

        Args:
            figure: The figure to send

        Returns:
            tuple[bytes, list[Any]]: The result of the message as a tuple of
              (new payload, new references)
        """
        message = {
            "type": "NEW_FIGURE",
            "figure": figure.to_dict(exporter=self._exporter),
        }

        return json.dumps(message).encode(), self._exporter.reference_list()

    def process_message(
        self, payload: bytes, references: list[Any]
    ) -> tuple[bytes, list[Any]]:
        """
        The main message processing function. This will handle the message
        and return the result.

        Args:
            payload: bytes: The payload to process
            references:  list[Any]: References to objects on the server

        Returns:
            tuple[bytes, list[Any]]: The result of the message as a tuple of
              (new payload, new references)

        """
        message = json.loads(payload.decode())
        if message["type"] == "RETRIEVE":
            return self._handle_retrieve_figure()
