from __future__ import annotations

import json
from collections.abc import Generator
from typing import Callable, Any
from plotly.graph_objects import Figure
from abc import abstractmethod
from copy import copy

from deephaven.table import PartitionedTable, Table
from deephaven.execution_context import ExecutionContext, get_exec_ctx
from deephaven.liveness_scope import LivenessScope

from ..shared import args_copy
from ..data_mapping import DataMapping
from ..exporter import Exporter
from .RevisionManager import RevisionManager


def has_color_args(call_args: dict[str, Any]) -> bool:
    """Check if any of the color args are in call_args

    Args:
      call_args: A dictionary of args

    Returns:
      True if color args are in, False otherwise

    """
    for arg in ["color_discrete_sequence_line", "color_discrete_sequence_marker"]:
        # convert to bool to ensure empty lists don't prevent removal of
        # colors on traces
        if arg in call_args and bool(call_args[arg]):
            return True
    return False


def has_arg(call_args: dict[str, Any] | None, check: str | Callable) -> bool:
    """Given either a string to check for in call_args or function to check,
    return True if the arg is in the call_args

    Args:
      call_args: A dictionary of args
      check: Either a string or a function that takes call_args

    Returns:
        True if the call_args passes the check, False otherwise
    """
    if call_args:
        if isinstance(check, str) and check in call_args:
            return bool(call_args[check])
        elif isinstance(check, Callable):
            return check(call_args)
    return False
    # check is either a function or string


class DeephavenNode:
    """
    A node in the DeephavenFigure graph. This is an abstract class that
    represents a node in the graph.
    """

    def __init__(self):
        self.cached_figure = None
        self.parent = None

    @abstractmethod
    def recreate_figure(self, update_parent: bool = True) -> None:
        """
        Recreate the figure. This is called when an underlying partition or
        child figure changes.
        """
        pass

    @abstractmethod
    def copy(
        self,
        parent: DeephavenNode | DeephavenHeadNode,
        partitioned_tables: dict[int, tuple[PartitionedTable, DeephavenNode]],
    ) -> DeephavenNode:
        """
        Copy this node and all children nodes

        Args:
            parent: The parent node
            partitioned_tables:
                A dictionary mapping node ids to partitioned tables and nodes

        Returns:
            DeephavenNode: The new node
        """
        pass

    @abstractmethod
    def get_figure(self) -> DeephavenFigure:
        """
        Get the figure for this node. It will be generated if not cached

        Returns:
            The figure for this node
        """
        pass


class DeephavenFigureNode(DeephavenNode):
    """
    A node in the DeephavenFigure graph that represents a figure.

    Attributes:
        parent: DeephavenNode | DeephavenHeadNode: The parent node
        exec_ctx: ExecutionContext: The execution context
        args: dict[str, Any]: The arguments to the function
        table: PartitionedTable: The table to pull data from
        func: Callable: The function to call
        cached_figure: DeephavenFigure: The cached figure
        revision_manager: RevisionManager: The revision manager to use for the figure node
    """

    def __init__(
        self,
        parent: DeephavenNode | DeephavenHeadNode | None = None,
        exec_ctx: ExecutionContext | None = None,
        args: dict[str, Any] | None = None,
        table: Table | PartitionedTable | None = None,
        func: Callable | None = None,
    ):
        """
        Create a new DeephavenFigureNode

        Args:
            parent: The parent node
            exec_ctx: The execution context
            args: The arguments to the function
            table: The table to pull data from
            func: The function to call
        """
        self.parent = parent
        self.exec_ctx = exec_ctx if exec_ctx else get_exec_ctx()
        self.args = args if args else {}
        self.table = table
        self.func = func if func else lambda **kwargs: None
        self.cached_figure = None
        self.revision_manager = RevisionManager()

    def recreate_figure(self, update_parent: bool = True) -> None:
        """
        Recreate the figure. This is called when the underlying partition
        changes

        Args:
            update_parent: If the parent should be updated
        """
        revision = self.revision_manager.get_revision()

        # release the lock to ensure there is no deadlock
        # as for some table operations an exclusive lock is required
        with self.exec_ctx:
            table = self.table
            copied_args = args_copy(self.args)
            copied_args["args"]["table"] = table
            new_figure = self.func(**copied_args)

        with self.revision_manager:
            if self.revision_manager.updated_revision(revision):
                self.cached_figure = new_figure

        if update_parent and self.parent:
            self.parent.recreate_figure()

    def copy(
        self,
        parent: DeephavenNode | DeephavenHeadNode,
        partitioned_tables: dict[int, tuple[PartitionedTable, DeephavenNode]],
    ) -> DeephavenFigureNode:
        """
        Copy this node

        Args:
            parent: The parent node
            partitioned_tables:
                A dictionary mapping node ids to partitioned tables and nodes

        Returns:
            The new node
        """
        # args need to be copied as the table key is modified
        new_args = args_copy(self.args)
        new_node = DeephavenFigureNode(
            self.parent, self.exec_ctx, new_args, self.table, self.func
        )

        if id(self) in partitioned_tables:
            table, _ = partitioned_tables[id(self)]
            partitioned_tables.pop(id(self))
            partitioned_tables[id(new_node)] = (table, new_node)

        new_node.cached_figure = self.cached_figure
        new_node.parent = parent
        return new_node

    def get_figure(self) -> DeephavenFigure | None:
        """
        Get the figure for this node. It will be generated if not cached

        Returns:
            The figure for this node
        """
        if not self.cached_figure:
            self.recreate_figure(update_parent=False)

        return self.cached_figure


class DeephavenLayerNode(DeephavenNode):
    """
    A node in the DeephavenFigure graph that represents a layer.

    Attributes:
        parent: DeephavenNode | DeephavenHeadNode: The parent node
        nodes: list[DeephavenNode]: The child nodes
        layer_func: Callable: The layer function
        args: dict[str, Any]: The arguments to the function
        cached_figure: DeephavenFigure: The cached figure
        exec_ctx: ExecutionContext: The execution context
        revision_manager: RevisionManager: The revision manager to use for the layer node
    """

    def __init__(
        self,
        layer_func: Callable,
        args: dict[str, Any],
        exec_ctx: ExecutionContext,
        cached_figure: DeephavenFigure | None = None,
        parent: DeephavenLayerNode | DeephavenHeadNode | None = None,
    ):
        """
        Create a new DeephavenLayerNode

        Args:
            layer_func: The layer function
            args: The arguments to the function
            exec_ctx: The execution context
        """
        self.parent = parent
        self.nodes = []
        self.layer_func = layer_func
        self.args = args
        self.cached_figure = cached_figure
        self.exec_ctx = exec_ctx
        self.revision_manager = RevisionManager()

    def recreate_figure(self, update_parent: bool = True) -> None:
        """
        Recreate the figure. This is called when the underlying partition
        or a child node changes

        Args:
            update_parent:
            If the parent should be updated
        """
        revision = self.revision_manager.get_revision()

        # release the lock to ensure there is no deadlock
        # as for some table operations an exclusive lock is required
        with self.exec_ctx:
            figs = [node.cached_figure for node in self.nodes]
            new_figure = self.layer_func(*figs, **self.args)

        with self.revision_manager:
            if self.revision_manager.updated_revision(revision):
                self.cached_figure = new_figure

        if update_parent and self.parent:
            self.parent.recreate_figure()

    def copy(
        self,
        parent: DeephavenLayerNode | DeephavenHeadNode,
        partitioned_tables: dict[int, tuple[PartitionedTable, DeephavenNode]],
    ) -> DeephavenLayerNode:
        """
        Copy this node and all children nodes

        Args:
            parent: The parent node
            partitioned_tables:
              A dictionary mapping node ids to partitioned table and nodes that
              need to be updated

        Returns:
            DeephavenLayerNode: The new node
        """
        new_node = DeephavenLayerNode(
            self.layer_func, self.args, self.exec_ctx, self.cached_figure, parent
        )
        new_node.nodes = [
            node.copy(new_node, partitioned_tables) for node in self.nodes
        ]
        return new_node

    def get_figure(self) -> DeephavenFigure | None:
        """
        Get the figure for this node. It will be generated if not cached

        Returns:
            The figure for this node
        """
        if not self.cached_figure:
            for node in self.nodes:
                node.get_figure()
            self.recreate_figure(update_parent=False)

        return self.cached_figure


class DeephavenHeadNode:
    """
    A node in the DeephavenFigure graph that represents the head of the graph.

    Attributes:
        node: DeephavenNode: The child node
        partitioned_tables:
            A dictionary mapping node ids to partitioned table and nodes that
            need to be updated
        cached_figure: The cached figure
    """

    def __init__(self):
        """
        Create a new DeephavenHeadNode
        """
        # there is only one child node of the head, either a layer or a figure
        self.node: DeephavenNode | None = None
        self.partitioned_tables = {}
        self.cached_figure = None

    def copy_graph(self) -> DeephavenHeadNode:
        """
        Copy this node and all children nodes

        Returns:
            The new head node
        """
        new_head = DeephavenHeadNode()
        new_partitioned_tables = copy(self.partitioned_tables)
        if self.node:
            new_head.node = self.node.copy(new_head, new_partitioned_tables)
        new_head.partitioned_tables = new_partitioned_tables
        return new_head

    def recreate_figure(self) -> None:
        """
        Recreate the figure. This is called when the underlying partition
        or a child node changes
        """
        if self.node:
            self.node.recreate_figure(update_parent=False)
            self.cached_figure = self.node.cached_figure

    def get_figure(self) -> DeephavenFigure | None:
        """
        Get the figure for this node. This will be called by a communication to get
        the initial figure.
        Returns:
            The figure
        """
        if not self.cached_figure and self.node:
            self.cached_figure = self.node.get_figure()
        return self.cached_figure


class DeephavenFigure:
    """A DeephavenFigure that contains a plotly figure and mapping from Deephaven
    data tables to the plotly figure

    Attributes:
        _head_node: DeephavenHeadNode: The head node of the graph
        _plotly_fig: Figure: The plotly figure
        _trace_generator: Generator[dict[str, Any]]: The trace generator
        _has_template: bool: If this figure has a template
        _has_color: bool: If this figure has color
        _data_mappings: list[DataMapping]: The data mappings
        _has_subplots: bool: If this figure has subplots
        _liveness_scope: LivenessScope: The liveness scope to use for the figure
    """

    def __init__(
        self: DeephavenFigure,
        fig: Figure | None = None,
        call_args: dict[str, Any] | None = None,
        data_mappings: list[DataMapping] | None = None,
        has_template: bool = False,
        has_color: bool = False,
        trace_generator: Generator[dict[str, Any], None, None] | None = None,
        has_subplots: bool = False,
        is_plotly_fig: bool = False,
    ):
        """
        Create a new DeephavenFigure

        Args:
            fig: The plotly figure
            call_args: Call args, used to determine if the figure
                has a template or color
            data_mappings: The data mappings
            has_template: If this figure has a template
            has_color: If this figure has color
            trace_generator: The trace generator
            has_subplots: If this figure has subplots
            is_plotly_fig: If this is a plotly figure
        """
        # keep track of function that called this, and it's args
        self._head_node = DeephavenHeadNode()

        # note: these variables might not be up-to-date with the latest
        # figure if the figure is updated
        self._plotly_fig = fig
        self._trace_generator = trace_generator

        self._has_template = (
            has_template if has_template else has_arg(call_args, "template")
        )

        self._has_color = has_color if has_color else has_arg(call_args, has_color_args)

        self._call_args = call_args

        self._data_mappings = data_mappings if data_mappings else []

        self._has_subplots = has_subplots

        self._is_plotly_fig = is_plotly_fig

        self._liveness_scope = LivenessScope()

    def copy_mappings(self: DeephavenFigure, offset: int = 0) -> list[DataMapping]:
        """Copy all DataMappings within this figure, adding a specific offset

        Args:
          offset: The offset to offset the copy by

        Returns:
          The new DataMappings

        """
        return [mapping.copy(offset) for mapping in self._data_mappings]

    def get_json_links(
        self: DeephavenFigure, exporter: Exporter
    ) -> list[dict[str, str]]:
        """Convert the internal data mapping to the JSON data mapping with
        tables and proper plotly indices attached

        Args:
          exporter: The exporter to use to send tables

        Returns:
          The list of json links that map table columns to the plotly figure

        """
        return [
            links
            for mapping in self._data_mappings
            for links in mapping.get_links(exporter)
        ]

    def to_dict(self: DeephavenFigure, exporter: Exporter) -> dict[str, Any]:
        """Convert the DeephavenFigure to dict

        Args:
          exporter: The exporter to use to send tables

        Returns:
          The DeephavenFigure as a dictionary

        """
        return json.loads(self.to_json(exporter))

    def to_json(self: DeephavenFigure, exporter: Exporter) -> str:
        """Convert the DeephavenFigure to JSON

        Args:
          exporter: The exporter to use to send tables

        Returns:
          The DeephavenFigure as a JSON string

        """
        plotly = None
        if self._plotly_fig and (fig_json := self._plotly_fig.to_json()) is not None:
            plotly = json.loads(fig_json)
        mappings = self.get_json_links(exporter)
        deephaven = {
            "mappings": mappings,
            "is_user_set_template": self._has_template,
            "is_user_set_color": self._has_color,
        }
        payload = {"plotly": plotly, "deephaven": deephaven}
        return json.dumps(payload)

    def add_layer_to_graph(
        self, layer_func: Callable, args: dict[str, Any], exec_ctx: ExecutionContext
    ) -> None:
        """
        Add a layer to the graph

        Args:
            layer_func: The layer function
            args: The arguments to the function
            exec_ctx: The execution context
        """

        new_head = DeephavenHeadNode()
        self._head_node = new_head

        layer_node = DeephavenLayerNode(layer_func, args, exec_ctx)

        new_head.node = layer_node
        layer_node.parent = new_head

        figs = args.pop("figs")
        children = []
        partitioned_tables = {}
        for fig in figs:
            if isinstance(fig, Figure):
                new_node = DeephavenFigureNode()
                children.append(new_node)
                # this is a plotly figure, so we need to create a new node
                # but we don't need to recreate it ever
                new_node.cached_figure = fig
                pass
            elif isinstance(fig, DeephavenFigure):
                tmp_head = fig._head_node.copy_graph()
                children.append(tmp_head.node)
                partitioned_tables.update(tmp_head.partitioned_tables)

        layer_node.nodes = children
        new_head.partitioned_tables = partitioned_tables

        for node in children:
            node.parent = layer_node

    def add_figure_to_graph(
        self,
        exec_ctx: ExecutionContext,
        args: dict[str, Any],
        table: Table | PartitionedTable,
        key_column_table: Table | None,
        func: Callable,
    ) -> None:
        """
        Add a figure to the graph. It is assumed that this is the first figure

        Args:
            exec_ctx: The execution context
            args: The arguments to the function
            table: The table to pull data from
            key_column_table: The table with partitions, used by the DeephavenFigureListener
            func: The function to call

        """
        self._liveness_scope.manage(table)

        node = DeephavenFigureNode(self._head_node, exec_ctx, args, table, func)

        partitioned_tables = {}
        if isinstance(table, PartitionedTable):
            partitioned_tables = {id(node): (key_column_table, node)}

        self._head_node.node = node
        self._head_node.partitioned_tables = partitioned_tables

    def get_head_node(self) -> DeephavenHeadNode:
        """
        Get the head node for this figure

        Returns:
            The head node

        """
        return self._head_node

    def get_figure(self) -> DeephavenFigure | None:
        """
        Get the true DeephavenFigure for this figure.

        Returns:
            The figure
        """
        if self._is_plotly_fig:
            # a plotly figure was passed directly
            # just return this figure since it will never be updated
            return self
        return self._head_node.get_figure()

    def get_plotly_fig(self) -> Figure | None:
        """
        Get the plotly figure for this figure

        Returns:
            The plotly figure
        """
        figure = self.get_figure()
        if not figure:
            return self._plotly_fig
        return figure.get_plotly_fig()

    def get_data_mappings(self) -> list[DataMapping]:
        """
        Get the data mappings for this figure

        Returns:
            The data mappings
        """
        figure = self.get_figure()
        if not figure:
            return self._data_mappings
        return figure.get_data_mappings()

    def get_trace_generator(self) -> Generator[dict[str, Any], None, None] | None:
        """
        Get the trace generator for this figure

        Returns:
            The trace generator
        """
        figure = self.get_figure()
        if not figure:
            return self._trace_generator
        return figure.get_trace_generator()

    def get_has_template(self) -> bool:
        """
        Get if this figure has a template

        Returns:
            True if has a template, False otherwise
        """
        figure = self.get_figure()
        if not figure:
            return self._has_template
        return figure.get_has_template()

    def get_has_color(self) -> bool:
        """
        Get if this figure has color

        Returns:
            True if has color, False otherwise
        """
        figure = self.get_figure()
        if not figure:
            return self._has_color
        return figure.get_has_color()

    def get_has_subplots(self) -> bool:
        """
        Get if this figure has subplots

        Returns:
            True if has subplots, False otherwise
        """
        figure = self.get_figure()
        if not figure:
            return self._has_subplots
        return figure.get_has_subplots()

    def __del__(self):
        self._liveness_scope.release()

    def copy(self) -> DeephavenFigure:
        """
        Copy the figure

        Returns:
            The new figure
        """
        new_figure = DeephavenFigure(
            self._plotly_fig,
            self._call_args,
            self._data_mappings,
            self._has_template,
            self._has_color,
            self._trace_generator,
            self._has_subplots,
            self._is_plotly_fig,
        )
        new_figure._head_node = self._head_node.copy_graph()
        return new_figure

    def recreate_figure(self) -> None:
        """
        Recreate the figure. This is called to ensure the figure is up-to-date
        """
        self._head_node.recreate_figure()
