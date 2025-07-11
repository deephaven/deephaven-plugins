from __future__ import annotations

import json
from collections.abc import Generator
from pathlib import Path
from typing import Callable, Any
from plotly.graph_objects import Figure
from abc import abstractmethod
from copy import copy

from deephaven.table import PartitionedTable, Table
from deephaven.execution_context import ExecutionContext, get_exec_ctx
from deephaven.liveness_scope import LivenessScope
import deephaven.pandas as dhpd

from ..shared import args_copy
from ..data_mapping import DataMapping
from ..exporter import Exporter
from .RevisionManager import RevisionManager
from .FigureCalendar import FigureCalendar, Calendar
from ..types import FilterColumn

SINGLE_VALUE_REPLACEMENTS = {
    "indicator": {"value", "delta/reference", "title/text"},
}


def is_single_value_replacement(
    figure_type: str,
    split_path: list[str],
) -> bool:
    """
    Check if the trace element needs to be replaced with a single value instead of a list.

    Args:
        figure_type: The type of the figure
        split_path: The split path of the trace element

    Returns:
        True if the trace element needs to be replaced with a single value, False otherwise
    """
    remaining_path = "/".join(split_path)

    is_single_value = False

    if remaining_path in SINGLE_VALUE_REPLACEMENTS.get(figure_type, set()):
        is_single_value = True

    return is_single_value


def color_in_colorway(trace_element: dict, colorway: list[str]) -> bool:
    """
    Check if the color in the trace element is in the colorway.
    Colors in the colorway should be lower case.

    Args:
        trace_element: The trace element to check
        colorway: The colorway to check against

    Returns:
        True if the color is in the colorway, False otherwise
    """
    if not isinstance(trace_element.get("color"), str):
        return False

    color = trace_element["color"]

    if color.lower() in colorway:
        return True
    return False


def remove_data_colors(
    figure: dict[str, Any],
) -> None:
    """
    Deephaven plotly express (and plotly express itself) apply custom colors
    to traces, but in many cases they need to be removed for theming
    to work properly. This function removes the colors from the traces
    if they are in the colorway.

    Args:
        figure: The plotly figure dict to remove colors from
    """
    colorway = (
        figure.get("layout", {})
        .get("template", {})
        .get("layout", {})
        .get("colorway", [])
    )
    for i in range(len(colorway)):
        colorway[i] = colorway[i].lower()

    for trace in figure.get("data", []):
        if color_in_colorway(trace.get("marker", {}), colorway):
            trace["marker"]["color"] = None
        if color_in_colorway(trace.get("line", {}), colorway):
            trace["line"]["color"] = None


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


def get_filter_name_set(
    filter_columns: set[FilterColumn],
) -> set[str]:
    """
    Get the filter name set for the given filter columns.

    Args:
        filter_columns: The filter columns to match against

    Returns:
        The matching input filters
    """
    # At the moment, input filters do not have a column type when sent from the client, so simplify the set
    return {filter_column.name for filter_column in filter_columns}


def get_filter_set(
    filter_columns: set[FilterColumn],
    filters: dict[str, Any],
) -> set[tuple[str, Any]]:
    """
    Get the filter set for the given filter columns.

    Args:
        filters: The input filters to match against
        filter_columns: The filter columns to match against

    Returns:
        The matching input filters
    """
    # At the moment, input filters do not have a column type when sent from the client, so simplify the set
    name_set = get_filter_name_set(filter_columns)
    return {(column, value) for column, value in filters.items() if column in name_set}


def get_matching_filters(
    filter_columns: set[FilterColumn],
    filters: dict[str, Any],
) -> dict[str, Any]:
    """
    Get the matching input filters for the given filter columns.

    Args:
        filters: The input filters to match against
        filter_columns: The filter columns to match against

    Returns:
        The matching input filters
    """
    # At the moment, input filters do not have a column type when sent from the client, so simplify the set
    name_set = get_filter_name_set(filter_columns)
    return {
        column: filter_ for column, filter_ in filters.items() if column in name_set
    }


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

    @abstractmethod
    def update_filters(self, filters: dict[str, Any]) -> None:
        """
        Update filters on the node.

        Args:
            filters: A dict with column name keys and values that are categories within the columns
        """
        pass

    @property
    @abstractmethod
    def filter_columns(self) -> set[FilterColumn]:
        """
        Get the input filter columns for this node

        Returns:
            The input filter columns
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
        filter_columns: set[FilterColumn] | None = None,
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
        self._filter_columns = filter_columns if filter_columns else set()
        self.filters = None
        self.prev_filter_set = None

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
        new_figure = None
        with self.exec_ctx:
            copied_args = args_copy(self.args)
            copied_args["args"]["table"] = self.table
            if self.filters is not None:
                filter_set = get_filter_set(self.filter_columns, self.filters)

                if filter_set != self.prev_filter_set:
                    # when filters are passed in, only update the chart when the filters change
                    # otherwise, subplots would be recreated unnecessarily
                    self.prev_filter_set = filter_set
                    copied_args["args"]["filters"] = get_matching_filters(
                        self.filter_columns, self.filters
                    )
                    new_figure = self.func(**copied_args)
                else:
                    # if the filters haven't changed, just use the cached figure
                    new_figure = self.cached_figure
            else:
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
            self.parent,
            self.exec_ctx,
            new_args,
            self.table,
            self.func,
            self.filter_columns,
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

    def update_filters(self, filters: dict[str, Any]) -> None:
        """
        Update filters on the node.

        Args:
            filters: A dict with column name keys and values that are categories within the columns
        """
        self.filters = filters
        # don't update the parent as it will be updated after the figure is recreated
        self.recreate_figure(update_parent=False)

    @property
    def filter_columns(self) -> set[FilterColumn]:
        """
        Get the input filter columns for this node

        Returns:
            The input filter columns
        """
        return self._filter_columns


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

    def update_filters(self, filters: dict[str, Any]) -> None:
        """
        Update filters on the node.

        Args:
            filters: A dict with column name keys and values that are categories within the columns
        """
        for node in self.nodes:
            node.update_filters(filters)

        self.recreate_figure(update_parent=False)

    @property
    def filter_columns(self) -> set[FilterColumn]:
        """
        Get the input filter columns for this node

        Returns:
            The input filter columns
        """
        new_filter_columns = set()
        for node in self.nodes:
            new_filter_columns.update(node.filter_columns)

        return new_filter_columns


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

    def update_filters(self, filters: dict[str, Any]) -> None:
        """
        Update filters on the node.

        Args:
            filters: A dict with column name keys and values that are categories within the columns
        """
        if self.node:
            self.node.update_filters(filters)

        self.recreate_figure()

    @property
    def filter_columns(self) -> set[FilterColumn]:
        """
        Get the input filter columns for this node

        Returns:
            The input filter columns
        """
        if self.node:
            return self.node.filter_columns
        return set()


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
        calendar: Calendar = False,
        filter_columns: set[FilterColumn] | None = None,
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

        self._calendar = calendar

        self._figure_calendar = FigureCalendar(calendar)

        self._sent_calendar = False

        self._filter_columns = filter_columns if filter_columns else set()

        self._sent_filter_columns = False

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

        # currently, there is one calendar and it only needs to be sent once
        if not self._sent_calendar and (
            calendar_dict := self._figure_calendar.to_dict()
        ):
            deephaven["calendar"] = calendar_dict
            self._sent_calendar = True

        # the input filters do not update so they only need to be sent once
        if not self._sent_filter_columns and (filter_columns := self.filter_columns):
            deephaven["filterColumns"] = {
                "columns": [
                    # _asdict is not actually protected, it is just given an underscore
                    # to prevent conflicts with field names
                    filter_column._asdict()
                    for filter_column in filter_columns
                ],
            }
            self._sent_filter_columns = True

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
        filter_columns: set[FilterColumn] | None = None,
    ) -> None:
        """
        Add a figure to the graph. It is assumed that this is the first figure

        Args:
            exec_ctx: The execution context
            args: The arguments to the function
            table: The table to pull data from
            key_column_table: The table with partitions, used by the DeephavenFigureListener
            func: The function to call
            filter_columns: The filter columns to use for this figure node

        """
        if isinstance(table, Table) and not table.is_refreshing:
            # static tables should not be managed
            # check because it doesn't throw an error on first manage attempt, but leads to errors later
            pass
        else:
            self._liveness_scope.manage(table)

        node = DeephavenFigureNode(
            self._head_node,
            exec_ctx,
            args,
            table,
            func,
            filter_columns,
        )

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

        figure = self._head_node.get_figure()

        if figure is not None:
            # there is currently only one calendar for the entire figure, so it's stored in the top level
            # and attached as needed
            figure.calendar = self._calendar

        if figure is not None:
            # filters are managed through the nodes, so attach them when creating the figure
            figure.filter_columns = self._head_node.filter_columns

        return figure

    def get_plotly_fig(self) -> Figure | None:
        """
        Get the plotly figure for this figure
        Note that this will have placeholder data in it
        See get_hydrated_figure for a hydrated version with the underlying data

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
            self._calendar,
            self._filter_columns,
        )
        new_figure._head_node = self._head_node.copy_graph()
        return new_figure

    def recreate_figure(self) -> None:
        """
        Recreate the figure. This is called to ensure the figure is up-to-date
        """
        self._head_node.recreate_figure()

    @property
    def calendar(self) -> Calendar:
        """
        Get the calendar for this figure

        Returns:
            The calendar
        """
        return self._calendar

    @calendar.setter
    def calendar(self, calendar: Calendar) -> None:
        """
        Set the calendar for this figure

        Args:
            calendar: The calendar to set
        """
        self._calendar = calendar
        self._figure_calendar = FigureCalendar(calendar)

    def get_hydrated_figure(self, template: str | dict | None = None) -> Figure:
        """
        Get the hydrated plotly figure for this Deephaven figure. This will replace all
        placeholder data within traces with the actual data from the Deephaven table.

        At this time this does not have any client-side features such as calendar and system theme
        but a template theme can be applied to the figure.

        Args:
            template: The theme to use for the figure

        Returns:
            The hydrated plotly figure
        """
        exporter = Exporter()

        figure = self.to_dict(exporter)
        tables, _, _ = exporter.references()

        for mapping in figure["deephaven"]["mappings"]:
            table = tables[mapping["table"]]
            data = dhpd.to_pandas(table)

            for column, paths in mapping["data_columns"].items():
                for path in paths:
                    split_path = path.split("/")
                    # remove empty str, "plotly", and "data"
                    split_path = split_path[3:]
                    figure_update = figure["plotly"]["data"]

                    # next should always be an index within the data
                    index = int(split_path.pop(0))
                    figure_update = figure_update[index]

                    # at this point, the figure_update is a figure trace with a specific type
                    figure_type = figure_update["type"]

                    is_single_value = is_single_value_replacement(
                        figure_type, split_path
                    )

                    while len(split_path) > 1:
                        item = split_path.pop(0)
                        figure_update = figure_update[item]

                    column_data = data[column].tolist()
                    if is_single_value:
                        column_data = column_data[0]
                    figure_update[split_path[0]] = column_data

        if template:
            remove_data_colors(figure["plotly"])
            figure["plotly"]["layout"].update(template=template)

        new_figure = Figure(figure["plotly"])

        return new_figure

    def to_image(
        self,
        format: str | None = "png",
        width: int | None = None,
        height: int | None = None,
        scale: float | None = None,
        validate: bool = True,
        template: str | dict | None = None,
    ) -> bytes:
        """
        Convert the figure to an image bytes string
        This API is based off of Plotly's Figure.to_image
        https://plotly.github.io/plotly.py-docs/generated/plotly.io.to_image.html

        Args:
            format: The format of the image
                One of png, jpg, jpeg, webp, svg, pdf
            width: The width of the image in pixels
            height: The height of the image in pixels
            scale: The scale of the image
                A scale of larger than one will increase the resolution of the image
                A scale of less than one will decrease the resolution of the image
            validate: If the image should be validated before being converted
            template: The theme to use for the image

        Returns:
            The image as bytes
        """
        return self.get_hydrated_figure(template).to_image(
            format=format, width=width, height=height, scale=scale, validate=validate
        )

    def write_image(
        self,
        file: str | Path,
        format: str = "png",
        width: int | None = None,
        height: int | None = None,
        scale: float | None = None,
        validate: bool = True,
        template: str | dict | None = None,
    ) -> None:
        """
        Convert the figure to an image bytes string
        This API is based off of Plotly's Figure.write_image
        https://plotly.github.io/plotly.py-docs/generated/plotly.io.write_image.html

        Args:
            file: The file to write the image to
            format: The format of the image
                One of png, jpg, jpeg, webp, svg, pdf
            width: The width of the image in pixels
            height: The height of the image in pixels
            scale: The scale of the image
                A scale of larger than one will increase the resolution of the image
                A scale of less than one will decrease the resolution of the image
            validate: If the image should be validated before being converted
            template: The theme to use for the image
        """
        return self.get_hydrated_figure(template).write_image(
            file=file,
            format=format,
            width=width,
            height=height,
            scale=scale,
            validate=validate,
        )

    def update_filters(
        self,
        filters: dict[str, Any],
    ) -> None:
        """
        Update filters on the chart.

        Args:
            filters: A dict with column name keys and values that are categories within the columns
        """
        self._head_node.update_filters(filters)

    @property
    def filter_columns(self) -> set[FilterColumn]:
        """
        Get the input filter columns for this figure

        Returns:
            The input filter columns
        """
        if self._is_plotly_fig:
            # if this is a plotly figure, it does not have filter columns
            return set()
        figure = self.get_figure()
        if not figure:
            return self._filter_columns
        return figure.filter_columns

    @filter_columns.setter
    def filter_columns(self, value: set[FilterColumn]) -> None:
        """
        Set the input filter columns for this figure.

        Args:
            value: The input filter columns to set
        """
        self._filter_columns = value
