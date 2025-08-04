from __future__ import annotations

import math
from typing import Any, TypeVar, List, cast, TypedDict, Callable
from deephaven.execution_context import make_user_exec_ctx
from plotly.graph_objs import Figure

from ._layer import layer, LayerSpecDict, atomic_layer
from .. import DeephavenFigure
from ..shared import default_callback

# generic grid that is a list of lists of anything
T = TypeVar("T")
Grid = List[List[T]]


class SubplotSpecDict(TypedDict, total=False):
    l: float
    r: float
    t: float
    b: float
    rowspan: int
    colspan: int


def get_shared_key(
    row: int,
    col: int,
    shared_axes: str,
) -> int | None:
    """
    Get a shared key where

    Args:
        row: The row this figure is in
        col: The column this figure is in
        shared_axes: "rows", "cols", "all" or None depending on what axes
          should be shared

    Returns:
        The shared key, if shared_axes is specified, otherwise None
    """

    if shared_axes == "rows":
        return row
    elif shared_axes == "columns":
        return col
    elif shared_axes == "all":
        return 1
    return None


def get_new_specs(
    specs: Grid[SubplotSpecDict] | None,
    row_starts: list[float],
    row_ends: list[float],
    col_starts: list[float],
    col_ends: list[float],
    shared_xaxes: str | bool | None,
    shared_yaxes: str | bool | None,
) -> list[LayerSpecDict]:
    """Transforms the given specs and row and column lists to specs for layering

    Args:
      specs:
        A 2 dimensional list that contains the specs per figure
      row_starts:
        A list of domain values on the y-axis where the corresponding
        figure will start
      row_ends:
        A list of domain values on the y-axis where the corresponding
        figure will end
      col_starts:
        A list of domain values on the y-axis where the corresponding
        figure will start
      col_ends:
        A list of domain values on the y-axis where the corresponding
        figure will end
      shared_xaxes:
        "rows", "cols"/True, "all" or None depending on what axes
        should be shared
      shared_yaxes:
        "rows"/True, "cols", "all" or None depending on what axes
        should be shared

    Returns:
      The new specs with x and y domains, to be passed to layering

    """
    new_specs = []

    shared_xaxes = "columns" if shared_xaxes is True else shared_xaxes
    shared_yaxes = "rows" if shared_yaxes is True else shared_yaxes

    for row, (y_0, y_1) in enumerate(zip(row_starts, row_ends)):
        for col, (x_0, x_1) in enumerate(zip(col_starts, col_ends)):
            spec = {} if not specs or specs[row][col] is None else specs[row][col]
            l = spec.get("l", 0)
            r = spec.get("r", 0)
            t = spec.get("t", 0)
            b = spec.get("b", 0)
            rowspan: int = int(spec.get("rowspan", 1))
            colspan: int = int(spec.get("colspan", 1))
            y_1 = row_ends[row + rowspan - 1]
            x_1 = col_ends[col + colspan - 1]
            new_spec: LayerSpecDict = {
                "x": [x_0 + l, x_1 - r],
                "y": [y_0 + t, y_1 - b],
            }

            if (
                shared_xaxes
                and (key := get_shared_key(row, col, shared_xaxes)) is not None
            ):
                new_spec["matched_xaxis"] = key

            if (
                shared_yaxes
                and (key := get_shared_key(row, col, shared_yaxes)) is not None
            ):
                new_spec["matched_yaxis"] = key

            new_specs.append(new_spec)

    return new_specs


def make_grid(items: list[T], rows: int, cols: int, fill: Any = None) -> Grid[T]:
    """Make a grid (list of lists) out of the provided items

    Args:
      items:
        A list of items to put in the grid
      rows:
        The number of rows in the grid
      cols:
        The number of cols in the grid
      fill:
        If there are more slots (as defined by rows * columns) than
        provided items, then the remaining items in the grid have this value.

    Returns:
      The generated grid

    """
    grid = []
    index = 0
    for row in range(rows):
        grid_row = []
        for col in range(cols):
            # if there are more slots in the grid then there are items, pad
            # the grid
            item = items[index] if index < len(items) else fill
            grid_row.append(item)

            index += 1
        grid.append(grid_row)
    return grid


def get_domains(values: list[float], spacing: float) -> tuple[list[float], list[float]]:
    """Get the domains from a list of percentage values. The domains are
    cumulative and account for spacing.

    Args:
      values:
        The list of values to scale due to spacing then
      spacing:
        The spacing between each value.

    Returns:
      A tuple of (list of domain starts, list of domain ends)

    """
    # scale the values by however much the spacing uses between each col or row
    scale = 1 - (spacing * (len(values) - 1))
    scaled = [v * scale for v in values]

    # the first start value is just 0 since there is no spacing preceeding it
    starts = [0.0]
    # ignore the last value as it is not needed for the start of any domain
    for i in range(len(scaled) - 1):
        starts.append(starts[-1] + scaled[i] + spacing)

    # the first end value is just the first scaled value since there is no
    # spacing preceeding the figure
    ends = [scaled[0]]
    for i in range(1, len(scaled)):
        ends.append(ends[-1] + scaled[i] + spacing)

    # the last end value is always 1.0, and sometimes it ends up off due to rounding errors
    ends[-1] = 1.0

    return starts, ends


def is_grid(specs: list[SubplotSpecDict] | Grid[SubplotSpecDict]) -> bool:
    """Check if the given specs is a grid

    Args:
      specs:
        The specs to check

    Returns:
      True if the specs is a grid, False otherwise

    """
    list_count = sum(isinstance(spec, list) for spec in specs)
    if 0 < list_count < len(specs):
        raise ValueError("Specs is a mix of lists and non-lists")
    return list_count == len(specs) and list_count > 0


def atomic_make_subplots(
    *figs: Figure | DeephavenFigure,
    rows: int = 0,
    cols: int = 0,
    shared_xaxes: str | bool | None = None,
    shared_yaxes: str | bool | None = None,
    grid: Grid[Figure | DeephavenFigure] | None = None,
    horizontal_spacing: float | None = None,
    vertical_spacing: float | None = None,
    column_widths: list[float] | None = None,
    row_heights: list[float] | None = None,
    specs: list[SubplotSpecDict] | Grid[SubplotSpecDict] | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Create subplots. Either figs and at least one of rows and cols or grid
    should be passed.

    Args:
      *figs: See make_subplots
      rows: See make_subplots
      cols: See make_subplots
      shared_xaxes: See make_subplots
      shared_yaxes: See make_subplots
      grid: See make_subplots
      horizontal_spacing: See make_subplots
      vertical_spacing: See make_subplots
      column_widths: See make_subplots
      row_heights: See make_subplots
      specs: See make_subplots

    Returns:
      DeephavenFigure: The DeephavenFigure with subplots

    """
    if rows or cols:
        rows = rows if rows else math.ceil(len(figs) / cols)
        cols = cols if cols else math.ceil(len(figs) / rows)

    grid = grid if grid else make_grid(list(figs), rows, cols)

    # reverse rows as plotly goes bottom to top
    grid = list(reversed(grid))

    # grid must have identical number of columns per row at this point
    rows, cols = len(grid), len(grid[0])

    # only transform specs into a grid when dimensions of figure grid are known
    spec_grid: Grid[SubplotSpecDict] | None = None
    if specs and isinstance(specs, list):
        if is_grid(specs):
            spec_grid = cast(Grid[Any], specs)
        else:
            specs = cast(List[SubplotSpecDict], specs)
            spec_grid = cast(Grid[Any], make_grid(specs, rows, cols, fill={}))
        spec_grid = list(reversed(spec_grid))
    elif specs:
        raise ValueError("specs must be a list or a grid")

    # same defaults as plotly
    if horizontal_spacing is None:
        horizontal_spacing = 0.2 / cols

    if vertical_spacing is None:
        vertical_spacing = 0.3 / rows

    if column_widths is None:
        column_widths = [1.0 / cols for _ in range(cols)]

    if row_heights is None:
        row_heights = [1.0 / rows for _ in range(rows)]

    row_heights = list(reversed(row_heights))

    col_starts, col_ends = get_domains(column_widths, horizontal_spacing)
    row_starts, row_ends = get_domains(row_heights, vertical_spacing)

    return atomic_layer(
        *[fig for fig_row in grid for fig in fig_row],
        specs=get_new_specs(
            spec_grid,
            row_starts,
            row_ends,
            col_starts,
            col_ends,
            shared_xaxes,
            shared_yaxes,
        ),
        unsafe_update_figure=unsafe_update_figure,
        # remove the legend title as it is likely incorrect
        remove_legend_title=True,
    )


def atomic_make_grid(
    *figs: Figure | DeephavenFigure,
    rows: int | None,
    cols: int | None,
) -> DeephavenFigure:
    """
    Create a grid of figures.
    The number of rows and columns are calculated to be approximately square if both are None.

    Args:
        *figs: Figures to use
        rows: Rows in the grid. Can be None if cols is provided or if a square grid is desired.
        cols: Columns in the grid. Can be None if rows is provided or if a square grid is desired.

    Returns:
        DeephavenFigure: The DeephavenFigure with the grid of figures
    """
    # grid size is approximately sqrt(len(figs))
    if rows is None and cols is None:
        cols = math.ceil(math.sqrt(len(figs)))
        rows = math.ceil(len(figs) / cols)
    elif rows is None:
        # if cols is not None, then rows is calculated from cols in atomic_make_subplots
        rows = 0
    elif cols is None:
        cols = 0
    if rows is None or cols is None:
        raise ValueError("Invalid rows and cols")
    return atomic_make_subplots(*figs, rows=rows, cols=cols)


def make_subplots(
    *figs: Figure | DeephavenFigure,
    rows: int = 0,
    cols: int = 0,
    shared_xaxes: str | bool | None = None,
    shared_yaxes: str | bool | None = None,
    grid: Grid[Figure | DeephavenFigure] | None = None,
    horizontal_spacing: float | None = None,
    vertical_spacing: float | None = None,
    column_widths: list[float] | None = None,
    row_heights: list[float] | None = None,
    specs: list[SubplotSpecDict] | Grid[SubplotSpecDict] | None = None,
    unsafe_update_figure: Callable = default_callback,
) -> DeephavenFigure:
    """Create subplots. Either figs and at least one of rows and cols or grid
    should be passed.

    Args:
      *figs: Figures to use. Should be used with rows and/or cols.
      rows: A list of rows in the resulting subplot grid. This is
        calculated from cols and number of figs provided if not passed
        but cols is.
        One of rows or cols should be provided if passing figs directly.
      cols: A list of cols in the resulting subplot grid. This is
        calculated from rows and number of figs provided if not passed
        but rows is.
        One of rows or cols should be provided if passing figs directly.
      shared_xaxes: "rows", "columns"/True, "all" or None depending on what axes
        should be shared
      shared_yaxes: "rows"/True, "columns", "all" or None depending on what axes
        should be shared
      grid: A grid (list of lists) of figures to draw. None can be
        provided in a grid entry
      horizontal_spacing: Spacing between each column. Default 0.2 / cols
      vertical_spacing: Spacing between each row. Default 0.3 / rows
      column_widths: The widths of each column. Should sum to 1.
      row_heights: The heights of each row. Should sum to 1.
      specs: (Default value = None)
        A list or grid of dicts that contain specs. An empty
        dictionary represents no specs, and None represents no figure, either
        to leave a gap on the subplots on provide room for a figure spanning
        multiple columns.
        'l' is a float that adds left padding
        'r' is a float that adds right padding
        't' is a float that adds top padding
        'b' is a float that adds bottom padding
        'rowspan' is an int to make this figure span multiple rows
        'colspan' is an int to make this figure span multiple columns
      unsafe_update_figure: An update function that takes a plotly figure
        as an argument and optionally returns a plotly figure. If a figure is not
        returned, the plotly figure passed will be assumed to be the return value.
        Used to add any custom changes to the underlying plotly figure. Note that
        the existing data traces should not be removed. This may lead to unexpected
        behavior if traces are modified in a way that break data mappings.

    Returns:
      DeephavenFigure: The DeephavenFigure with subplots

    """
    args = locals()

    func = atomic_make_subplots

    new_fig = atomic_make_subplots(
        *figs,
        rows=rows,
        cols=cols,
        shared_xaxes=shared_xaxes,
        shared_yaxes=shared_yaxes,
        grid=grid,
        horizontal_spacing=horizontal_spacing,
        vertical_spacing=vertical_spacing,
        column_widths=column_widths,
        row_heights=row_heights,
        specs=specs,
    )

    exec_ctx = make_user_exec_ctx()

    new_fig.add_layer_to_graph(func, args, exec_ctx)

    return new_fig
