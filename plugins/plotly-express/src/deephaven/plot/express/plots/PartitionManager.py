from __future__ import annotations

from collections.abc import Generator, Callable
from copy import copy
from typing import Any, cast, Tuple, Dict

import plotly.express as px
from pandas import DataFrame

from deephaven.table import Table, PartitionedTable
from deephaven import pandas as dhpd, empty_table
from deephaven import merge

from ._layer import atomic_layer
from .. import DeephavenFigure
from ..preprocess.Preprocessor import Preprocessor
from ..shared import get_unique_names
from ..types import AttachedTransforms, HierarchicalTransforms
from .subplots import atomic_make_grid

PARTITION_ARGS = {
    "by": None,
    "color": ("color_discrete_sequence", "color_discrete_map"),
    "pattern_shape": ("pattern_shape_sequence", "pattern_shape_map"),
    "symbol": ("symbol_sequence", "symbol_map"),
    "size": ("size_sequence", "size_map"),
    "line_dash": ("line_dash_sequence", "line_dash_map"),
    "width": ("width_sequence", "width_map"),
    "increasing_color": ("increasing_color_sequence", "increasing_color_map"),
    "decreasing_color": ("decreasing_color_sequence", "decreasing_color_map"),
    "gauge_color": ("gauge_color_sequence", "gauge_color_map"),
}

FACET_ARGS = {"facet_row", "facet_col"}

NUMERIC_TYPES = {
    "short",
    "int",
    "long",
    "float",
    "double",
}

# color, symbol, line_dash and pattern_shape are plotly defaults
STYLE_DEFAULTS = {
    "color": px.colors.qualitative.Plotly,
    "symbol": ["circle", "diamond", "square", "x", "cross"],
    "line_dash": ["solid", "dot", "dash", "longdash", "dashdot", "longdashdot"],
    "pattern_shape": ["", "/", "\\", "x", "+", "."],
    "size": [4, 5, 6, 7, 8, 9],
    "width": [4, 5, 6, 7, 8, 9],
    # these are plot by but do not currently have a default sequence
    # setting them to None ensures they don't have to be removed in the
    # client for theming to work
    "increasing_color": None,
    "decreasing_color": None,
    "gauge_color": None,
}

# params that invoke plot bys and have no special cases like color and size
PLOT_BY_ONLY = {
    "pattern_shape",
    "symbol",
    "line_dash",
    "width",
    "gauge_color",
    "increasing_color",
    "decreasing_color",
}


def get_partition_key_column_tuples(
    key_column_table: DataFrame, columns: list[str]
) -> list[tuple[Any]]:
    """
    Get partition key column tuples from a table

    Args:
        key_column_table: DataFrame: The table containing the key columns
        columns: list[str]: The columns to pull from the table

    Returns:
        A list of tuples of the columns
    """
    list_columns = []
    for column in columns:
        list_columns.append(key_column_table[column].tolist())

    return list(zip(*list_columns))


def numeric_column_set(
    table: Table | PartitionedTable,
) -> set[str]:
    """Gets the set of numeric columns in the table

    Args:
      table: Table: The table to pull columns from

    Returns:
      set[str]: set of numeric columns
    """
    cols = (
        table.columns if isinstance(table, Table) else table.constituent_table_columns
    )
    numeric_cols = set()
    for col in cols:
        type_ = col.data_type.j_name
        if type_ in NUMERIC_TYPES:
            numeric_cols.add(col.name)
    return numeric_cols


def is_single_numeric_col(val: str | list[str], numeric_cols: set[str]) -> bool:
    """
    Get whether the val is a single numeric column or not

    Args:
        val: str | list[str]
        numeric_cols: set[str]

    Returns:
        bool: True if the column is a single numeric column, false otherwise
    """
    return (isinstance(val, str) or len(val) == 1) and val in numeric_cols


def update_title(
    args: dict[str, Any], count: int, title: str | None, types: set[str]
) -> dict[str, Any]:
    """
    Update the title

    Args:
        args: Args used to determine the title
        count: The number of partitions
        title: The title to update
        types: The types of the plot

    Returns:
        dict[str, Any]: The updated title args
    """
    title_args = {}
    if "indicator" in types:
        text_indicator = args.get("text_indicator")

        if "current_partition" in args:
            partition_title = ", ".join(args["current_partition"].values())
            if count == 1:
                # if there is only one partition, the title should still be on the indicator itself
                # because of excessive padding when using the layout title
                title_args["title"] = title
            else:
                title_args["layout_title"] = title

            if text_indicator is None:
                # if there is no text column, the partition names should be used
                # text can be False, which doesn't show text, so check for None specifically
                if title:
                    # add the title to the layout as it could be possibly overwritten if count == 1
                    title_args["layout_title"] = title
                title_args["title"] = partition_title
        elif title is not None:
            # there must be only one trace, so put the title on the indicator itself
            # this will be overwritten if there is a text column
            title_args["title"] = title

        # regardless of if there is a partition or not, the title should be on the layout
        # if there is a text column
        if text_indicator and title:
            # there is text, so add the title to the layout as it could be possibly overwritten if count == 1
            title_args["layout_title"] = title

    elif title is not None:
        # currently, only indicators that are partitions have custom title behavior
        # so this is the default behavior
        title_args["title"] = title
    return title_args


class PartitionManager:
    """
    Handles all partitions for the given args

    Attributes:
        by_vars: set[str]: The set of by_vars that can be used in a plot by
        list_param: str: "x" or "y" depending on which param is a list
        cols: str | list: The columns set by the list_param
        stacked_column_names: dict[str, str]: A dictionary that stores the "real" column
          names if there is a list_param. This is needed in case the column names
          used are already in the table.
        has_color: bool: True if this figure has user set color, False otherwise
        facet_row: str: The facet row
        facet_col: str: The facet col
        attached_transforms: to be used for AttachedProcessor when dealing with an "always_attached" plot
        hierarchical_transforms: HierarchicalTransforms: to be used for HierarchicalProcessor when dealing with
            a hierarchical plot with a path
        marginal_x: Type of marginal on the x-axis, if applicable
        marginal_y: Type of marginal on the y-axis, if applicable
        marg_args: dict[str, Any]: The dictionary of args to pass to marginals
        attach_marginals: Callable: the function to use to attach marginals
        marg_color: str | list[str]: The columns to pass to marginal creation
        args: dict[str, Any]: Args used to create the plot
        groups: set[str]:: The special groups that apply to this plot
        preprocessor: Preprocessor: The preprocessor, used for some plot types
        partitioned_table: PartitionedTable: The partitioned table created (or
          passed in if already created)
        draw_figure: Callable: The function used to draw the figure
        constituents: list[Table]: The list of constituent tables
    """

    def __init__(
        self,
        args: dict[str, Any],
        draw_figure: Callable,
        groups: set[str] | None,
        marg_args: dict[str, Any] | None,
        marg_func: Callable,
    ):
        self.by = None
        self.by_vars = None
        self.list_param = None
        self.cols = None
        self.stacked_column_names = {}
        self.has_color = None
        self.facet_row = None
        self.facet_col = None
        self.attached_transforms = AttachedTransforms()
        self.hierarchical_transforms = HierarchicalTransforms()

        self.marginal_x = args.pop("marginal_x", None)
        self.marginal_y = args.pop("marginal_y", None)
        self.marg_args = marg_args if marg_args else {}
        self.attach_marginals = marg_func
        self.marg_color = None

        self.args = args
        # in some cases, such as violin plots, the default groups are a static object that is shared and should
        # be copied to not modify the original
        self.groups = copy(groups) if groups else set()
        self.grid_rows = args.pop("rows", None)
        self.grid_cols = args.pop("cols", None)
        self.indicator = "indicator" in self.groups
        self.preprocessor = None
        self.set_long_mode_variables()
        self.convert_table_to_long_mode()
        self.key_column_table = None
        self.send_default_figure = False
        self.partitioned_table = self.process_partitions()
        self.draw_figure = draw_figure
        self.constituents = []

        self.title = args.pop("title", None)

    def set_long_mode_variables(self) -> None:
        """
        If dealing with a "supports_lists" plot, set variables that will be
        used to restructure the table

        """
        if "supports_lists" not in self.groups:
            return

        args = self.args
        table = args["table"]
        x = args.get("x", None)
        y = args.get("y", None)

        if isinstance(table, PartitionedTable):
            # if given a partitioned table, pivoting is not supported
            return

        if isinstance(x, list):
            var, cols = "x", x
        elif isinstance(y, list):
            var, cols = "y", y
        else:
            # if there is no list, there is no need to convert to long mode
            self.groups.discard("supports_lists")
            return

        self.list_param = var
        self.cols = cols

        args["current_var"] = self.list_param

        self.stacked_column_names = get_unique_names(table, ["variable", "value"])
        self.args["stacked_column_names"] = self.stacked_column_names

    def convert_table_to_long_mode(
        self,
    ) -> None:
        """
        Convert a table to long mode if this plot supports lists
        If there is no by arg, the new column becomes it

        """
        if "supports_lists" not in self.groups:
            return

        args = self.args
        table = args["table"]

        if isinstance(table, PartitionedTable):
            # partitioned tables are assumed to already be properly formatted
            return

        # if there is no plot by arg, the variable column becomes it
        if not self.args.get("by", None):
            args["by"] = self.stacked_column_names["variable"]

        args["table"] = self.to_long_mode(table, self.cols)

    def is_by(self, arg: str, map_val: str | list[str] | dict | None = None) -> None:
        """
        Given that the specific arg is a by arg, prepare the arg depending on
        if it is attached or not

        Args:
            arg: The arg that is a by arg
            map_val: The value of the map
        """
        seq_arg = PARTITION_ARGS[arg][0]
        if not self.args[seq_arg]:
            self.args[seq_arg] = STYLE_DEFAULTS[arg]

        if "always_attached" in self.groups:
            new_col = get_unique_names(self.args["table"], [arg])[arg]
            if not isinstance(map_val, dict) and map_val is not None:
                raise TypeError(
                    f"Expected a dictionary for {arg} map, got {type(map_val)}"
                )
            self.attached_transforms.add(
                by_col=self.args[arg],
                new_col=new_col,
                style_map=map_val,
                style_list=self.args[seq_arg],
                style=arg,
            )
            # a new column will be constructed so this color is always updated
            self.args[f"attached_{arg}"] = new_col
            self.args.pop(arg)
        else:
            map_arg = PARTITION_ARGS[arg][1]
            map_val = self.args[map_arg]

            if map_val == "by":
                self.args[map_arg] = None
            if isinstance(map_val, tuple):
                # the first element should be "by" and the map should be in the second, although a tuple with only "by"
                # in it should also work
                self.args[map_arg] = map_val[1] if len(map_val) == 2 else None
            if self.args[arg] is None and self.by_vars and arg in self.by_vars:
                # if there is no column specified for this specific arg, the by column is used
                self.args[arg] = self.args["by"]
            self.args[f"{arg}_by"] = self.args.pop(arg)

    def handle_plot_by_arg(
        self, arg: str, val: str | list[str]
    ) -> tuple[str, str | list[str] | None]:
        """
        Handle all args that are possibly plot bys.
        If the "val" is none and the "by" arg is specified,
        Otherwise, there are three cases, depending on the argument
        1. If "color", a single numeric column creates a color axis. Otherwise
        the columns are treated as columns to partition on
        2. If "size", a single numeric column binds the markers to size. Otherwise
        the columns are treated as columns to partition on.
        3. If any other plot by arg, the columns are treated as columns to partition on.

        These behaviors are adjusted by the appropriate map. If the map is "identity",
        the values are bound directly to the marker (like size is by default).
        If "by" or a tuple of ("by", dict) where the dict is the normal column
        value to style dictionary, the argument is forced to a plot by,
        regardless of column type.

        Args:
            arg: The argument
            val: The column or columns for the arguments

        Returns:
            A tuple of (f"{arg}_by", arg_by value to use to partition the table
        """
        args = self.args
        table = args["table"]
        numeric_cols = numeric_column_set(table)

        plot_by_cols = args.get("by", None)

        if arg == "color":
            map_name = "color_discrete_map"
            map_ = args[map_name]
            if map_ == "by" or isinstance(map_, dict):
                self.is_by(arg, args[map_name])
            elif map_ == "identity":
                args.pop(map_name)
                args["attached_color"] = args.pop("color")
            elif (
                val
                and is_single_numeric_col(val, numeric_cols)
                and "color_continuous_scale" in self.args
            ):
                if "always_attached" in self.groups:
                    args["colors"] = args.pop("color")
                    if self.args.get("path"):
                        # is_single_numeric_col must be true so it is safe to pull the first element
                        if not isinstance(val, str):
                            val = val[0]
                        # numeric column that is the source of color need to be aggregated if path is passed
                        self.hierarchical_transforms.add(avg_col=val)
                    # otherwise the colors are attached directly
            elif val:
                self.is_by(arg, args[map_name])
            elif plot_by_cols and (
                args.get("color_discrete_sequence")
                or (self.by_vars and "color" in self.by_vars)
            ):
                # this needs to be last as setting "color" in any sense will override
                if not self.args["color_discrete_sequence"]:
                    self.args["color_discrete_sequence"] = STYLE_DEFAULTS[arg]
                args["color_by"] = plot_by_cols

            # save whatever column is being used for colors for marginals
            self.marg_color = args.get("color_by", None)

        elif arg == "size":
            map_ = args["size_map"]
            if map_ == "by" or isinstance(map_, dict):
                self.is_by(arg)
            elif val and is_single_numeric_col(val, numeric_cols):
                # just keep the argument in place so it can be passed to plotly
                # express directly
                pass
            elif val:
                self.is_by(arg)
            elif plot_by_cols and (
                args.get("size_sequence") or (self.by_vars and "size" in self.by_vars)
            ):
                if not self.args["size_sequence"]:
                    self.args["size_sequence"] = STYLE_DEFAULTS[arg]
                args["size_by"] = plot_by_cols

        elif arg in PLOT_BY_ONLY:
            seq_name, map_name = PARTITION_ARGS[arg][0], PARTITION_ARGS[arg][1]
            seq, map_ = args[seq_name], args[map_name]
            if map_ == "by" or isinstance(map_, dict):
                self.is_by(arg, args[map_name])
            elif map_ == "identity":
                args.pop(map_name)
                args[f"attached_{arg}"] = args.pop(arg)
            elif val:
                self.is_by(arg, args[map_name])
            elif plot_by_cols and (
                args.get(seq_name) or (self.by_vars and arg in self.by_vars)
            ):
                if not seq:
                    self.args[seq_name] = STYLE_DEFAULTS[arg]
                args[f"{arg}_by"] = plot_by_cols

        return f"{arg}_by", args.get(f"{arg}_by", None)

    def process_partitions(self) -> Table | PartitionedTable:
        """
        Process the partitions. This will pull the arguments that are plot bys
        then combine them into a dictionary.

        If the table is already partitioned, that is used as the partitioned
        table, although the plot by columns are still pulled for styling.

        Returns:
            The new table
        """
        args = self.args

        partitioned_table = None
        partition_cols = set()
        partition_map = {}

        by_vars = args.get("by_vars", None)
        if by_vars:
            self.by_vars = set([by_vars] if isinstance(by_vars, str) else by_vars)
        else:
            self.by_vars = set()

        filter_by = args.pop("filter_by", [])
        required_filter_by = args.pop("required_filter_by", [])

        partition_cols.update(filter_by)
        partition_cols.update(required_filter_by)

        filters = args.pop("filters", None)
        if filters is None and (filter_by or required_filter_by):
            # if there are input filters wait for them before creating the proper chart
            # the python figure is created, then the filters are sent from the client
            self.send_default_figure = True
        elif filters is not None:
            for required_filter in required_filter_by:
                if (filters and required_filter not in filters) or not filters:
                    self.send_default_figure = True

        if isinstance(args["table"], PartitionedTable):
            partitioned_table = args["table"]

            required_filters_available = True
            for required_filter in required_filter_by:
                if (filters and required_filter not in filters) or not filters:
                    required_filters_available = False

            if filters and required_filters_available:
                built_filter = [f"{k}=`{v}`" for k, v in filters.items()]
                partitioned_table = partitioned_table.filter(built_filter)

        # save the by arg so it can be reused in renders,
        # especially if it was overriden
        self.by = args.get("by", None)

        for arg, val in list(args.items()):
            if (val or self.by) and arg in PARTITION_ARGS:
                arg_by, cols = self.handle_plot_by_arg(arg, val)
                if cols:
                    partition_map[arg_by] = cols
                    if isinstance(cols, list):
                        partition_cols.update([col for col in cols])
                    else:
                        partition_cols.add(cols)
            elif val and arg in FACET_ARGS:
                partition_cols.add(val)
                if arg == "facet_row":
                    self.facet_row = val
                else:
                    self.facet_col = val
            """
            if arg == "text":
                if self.by and val is None and self.indicator:
                    # if by is set, text should be set to "by" by default
                    # note that text can be False, which doesn't show text,
                    # so check for None specifically
                    args["text"] = self.by
            """

        # it's possible that by vars are set but by_vars is None,
        # so partitioning is still needed, but it won't affect styles
        if not self.by_vars and self.by:
            partition_cols.update(self.by if isinstance(self.by, list) else [self.by])

        # preprocessor needs to be initialized after the always attached arguments are found
        self.preprocessor = Preprocessor(
            args,
            self.groups,
            self.attached_transforms,
            self.hierarchical_transforms,
            self.stacked_column_names,
            self.list_param,
        )

        if partition_cols:
            if not partitioned_table:
                partitioned_table = cast(Table, args["table"]).partition_by(
                    list(partition_cols)
                )

            if not self.key_column_table:
                self.key_column_table = partitioned_table.table.drop_columns(
                    "__CONSTITUENT__"
                )

            key_column_pandas = dhpd.to_pandas(self.key_column_table)

            for arg_by, val in partition_map.items():
                # remove "by" from arg
                arg = arg_by[:-3]
                if arg in PARTITION_ARGS and isinstance(PARTITION_ARGS[arg], tuple):
                    # replace the sequence with the sequence, map and distinct keys
                    # so they can be easily used together
                    keys = get_partition_key_column_tuples(
                        key_column_pandas, val if isinstance(val, list) else [val]
                    )
                    sequence, map_ = PARTITION_ARGS[arg]
                    args[sequence] = {
                        "ls": args[sequence],
                        "map_": args[map_],
                        "keys": keys,
                    }
                    args.pop(arg_by)
                    args.pop(PARTITION_ARGS[arg][1])
            args.pop("by")
            args.pop("by_vars", None)
            return partitioned_table

        args.pop("by", None)
        args.pop("by_vars", None)
        return args["table"]

    def build_ternary_chain(self, cols: list[str]) -> str:
        """
        Build a ternary chain that will collapse the columns into one

        Args:
            cols: the list of columns to collapse into one column

        Returns:
            The ternary string that builds the new column
        """
        ternary_string = f"{self.stacked_column_names['value']} = "
        for i, col in enumerate(cols):
            if i == len(cols) - 1:
                ternary_string += f"{col}"
            else:
                ternary_string += (
                    f"{self.stacked_column_names['variable']} == `{col}` ? {col} : "
                )
        return ternary_string

    def to_long_mode(self, table: Table, cols: list[str] | None) -> Table:
        """
        Convert a table to long mode. This will take the name of the columns,
        make a new "variable" column that contains the column names, and create
        a new "value" column that contains the values.

        Args:
            table: The table to convert to long mode
            cols: The columns to combine

        Returns:
            The table converted to long mode

        """
        cols = cols if cols else []
        new_tables = []
        for col in cols:
            new_tables.append(
                table.update_view(f"{self.stacked_column_names['variable']} = `{col}`")
            )

        merged = merge(new_tables)

        transposed = merged.update_view(self.build_ternary_chain(cols))

        return transposed.drop_columns(cols)

    def current_partition_generator(self) -> Generator[dict[str, str], None, None]:
        """
        Generate a partition dictionary for the current partition that maps
        column to value

        Yields:
            The partition dictionary mapping column to value
        """
        # the table is guaranteed to be a partitioned table here
        key_columns = cast(PartitionedTable, self.partitioned_table).key_columns
        # sort the columns so the order is consistent
        key_columns.sort()

        for table in self.constituents:

            key_column_table = dhpd.to_pandas(table.select(key_columns))
            key_column_tuples = get_partition_key_column_tuples(
                key_column_table, key_columns
            )

            if len(key_column_tuples) < 1:
                # this partition might have no data, so skip it
                continue

            current_partition = dict(
                zip(
                    key_columns,
                    key_column_tuples[0],
                )
            )
            yield current_partition

    def table_partition_generator(
        self,
    ) -> Generator[tuple[Table, dict[str, str]], None, None]:
        """
        Generates a tuple of (table, current partition). The table is the possibly
        preprocessed partition of the current_partition

        Yields:
            The tuple of table and current partition
        """
        column = (
            self.stacked_column_names["value"] if self.stacked_column_names else None
        )

        if self.preprocessor is None:
            return

        tables = self.preprocessor.preprocess_partitioned_tables(
            self.constituents, column
        )
        for table, current_partition in zip(tables, self.current_partition_generator()):
            # since this is preprocessed it will always be a tuple
            yield cast(Tuple[Table, Dict[str, str]], (table, current_partition))

    def partition_generator(self) -> Generator[dict[str, Any], None, None]:
        """
        Generates args that can be used to create one layer of a partitioned
        figure.

        Yields:
            The args used to create a figure
        """
        args, partitioned_table = self.args, self.partitioned_table
        if hasattr(partitioned_table, "constituent_tables"):
            for table, current_partition in self.table_partition_generator():
                if isinstance(table, tuple):
                    # if a tuple is returned here, it was preprocessed already so pivots aren't needed
                    table, arg_update = table
                    args.update(arg_update)
                elif (
                    self.stacked_column_names
                    and self.stacked_column_names["value"]
                    and self.list_param
                ):
                    # there is a list of variables, so replace them with the combined column
                    args[self.list_param] = self.stacked_column_names["value"]

                args["current_partition"] = current_partition
                args["table"] = table
                yield args
        elif self.preprocessor:
            # still need to preprocess the base table if preprocessors were created
            table, arg_update = cast(
                Tuple,
                [*self.preprocessor.preprocess_partitioned_tables([args["table"]])][0],
            )
            args["table"] = table
            args.update(arg_update)
            yield args
        else:
            yield args

    def default_figure(self) -> DeephavenFigure:
        """
        Create a default figure if there are no partitions

        Returns:
            The default figure
        """
        # this is very hacky but it's needed to prevent errors when
        # there are no partitions until a better solution can be done
        # also need the px template to be set
        # the title can also be set here as it will never change
        title = self.title
        default_fig = px.scatter(x=[0], y=[0], title=title)
        default_fig.update_traces(x=[], y=[])
        default_fig.update_layout(margin=None)
        return DeephavenFigure(default_fig)

    def create_figure(self) -> DeephavenFigure:
        """
        Create a figure. This handles layering different partitions as necessary as well
        as any special preprocessing or postprocessing needed for different types of plots

        Returns:
            The new figure
        """
        if self.send_default_figure:
            return self.default_figure()

        if isinstance(self.partitioned_table, PartitionedTable):
            # lock constituents in case they are deleted
            self.constituents = [*self.partitioned_table.constituent_tables]

            if len(self.constituents) == 0:
                return self.default_figure()

        trace_generator = None
        figs = []
        for i, args in enumerate(self.partition_generator()):
            title_update = update_title(
                args, len(self.constituents), self.title, self.groups
            )

            args = {**args, **title_update}

            fig = self.draw_figure(call_args=args, trace_generator=trace_generator)
            if not trace_generator:
                trace_generator = fig.get_trace_generator()

            facet_key = []
            if "current_partition" in args:
                partition = args["current_partition"]
                if (
                    "preprocess_hist" in self.groups
                    or "preprocess_spread" in self.groups
                ):
                    # offsetgroup is needed mostly to prevent spacing issues in
                    # marginals
                    # not setting the offsetgroup and having both marginals set to box,
                    # violin, etc. leads to extra spacing in each marginal
                    # offsetgroup needs to be unique within the subchart as columns
                    # could have the same name
                    fig.get_plotly_fig().update_traces(
                        offsetgroup=f"{'-'.join(args['current_partition'])}{i}"
                    )
                facet_key.extend(
                    [
                        partition.get(self.facet_col, None),
                        partition.get(self.facet_row, None),
                    ]
                )
            facet_key = tuple(facet_key)

            if "preprocess_hist" in self.groups or "preprocess_spread" in self.groups:
                if "current_partition" in args:
                    fig.get_plotly_fig().update_layout(legend_tracegroupgap=0)
                else:
                    fig.get_plotly_fig().update_layout(showlegend=False)

            figs.append(fig)

        try:
            if self.indicator:
                layered_fig = atomic_make_grid(
                    *figs, rows=self.grid_rows, cols=self.grid_cols
                )
            else:
                layered_fig = atomic_layer(*figs, which_layout=0)
        except ValueError:
            return self.default_figure()

        if self.has_color is False:
            layered_fig._has_color = False

        if self.marg_args:
            # the marginals need to use the already partitioned table as they
            # will have the same partitions although they will only be styled
            # by color (colors might be used multiple times)
            self.marg_args["table"] = self.partitioned_table

            if self.stacked_column_names and self.stacked_column_names["value"]:
                self.marg_args[self.list_param] = self.stacked_column_names["value"]

            self.marg_args["color"] = self.marg_color

            return self.attach_marginals(
                layered_fig, self.marg_args, self.marginal_x, self.marginal_y
            )

        return layered_fig
