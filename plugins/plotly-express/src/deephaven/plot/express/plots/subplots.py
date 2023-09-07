from __future__ import annotations

import math
from typing import Any

from plotly.graph_objs import Figure

from ._layer import layer
from .. import DeephavenFigure


def get_shared_key(
    row: int,
    col: int,
    shared_axes: str,
) -> int | None:
    """
    Get a shared key where

    Args:
        row: int: The row this figure is in
        col: int: The column this figure is in
        shared_axes: str: "rows", "cols", "all" or None depending on what axes
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
    specs: list[list[dict[str, int | float]]],
    row_starts: list[float],
    row_ends: list[float],
    col_starts: list[float],
    col_ends: list[float],
    shared_xaxes: str | bool,
    shared_yaxes: str | bool,
) -> list[dict[str, list[float] | int]]:
    """Transforms the given specs and row and column lists to specs for layering

    Args:
      specs: list[list[dict[str, int | float]]]
        A 2 dimensional list that contains the specs per figure
      row_starts: list[float]:
        A list of domain values on the y-axis where the corresponding
        figure will start
      row_ends: list[float]:
        A list of domain values on the y-axis where the corresponding
        figure will end
      col_starts: list[float]:
        A list of domain values on the y-axis where the corresponding
        figure will start
      col_ends: list[float]:
        A list of domain values on the y-axis where the corresponding
        figure will end
      shared_xaxes: str | bool
        "rows", "cols"/True, "all" or None depending on what axes
        should be shared
      shared_yaxes: str | bool
        "rows"/True, "cols", "all" or None depending on what axes
        should be shared

    Returns:
      list[dict[str, list[float]]]:
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
            rowspan = spec.get("rowspan", 1)
            colspan = spec.get("colspan", 1)
            y_1 = row_ends[row + rowspan - 1]
            x_1 = col_ends[col + colspan - 1]
            new_spec = {"x": [x_0 + l, x_1 - r], "y": [y_0 + t, y_1 - b]}

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


def make_grid(
    items: list[Any], rows: int, cols: int, fill: Any = None
) -> list[list[Any]]:
    """Make a grid (list of lists) out of the provided items

    Args:
      items: int:
        A list of items to put in the grid
      rows: int:
        The number of rows in the grid
      cols: int:
        The number of cols in the grid
      fill: Any:  (Default value = None)
        If there are more slots (as defined by rows * columns) than
        provided items, then the remaining items in the grid have this value.

    Returns:
      list[list[Any]]: The generated grid

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
      values: list[float]:
        The list of values to scale due to spacing then
      spacing: float:
        The spacing between each value.

    Returns:
      tuple[list[float], list[float]]
        A tuple of (list of domain starts, list of domain ends)

    """
    # scale the values by however much the spacing uses between each col or row
    scale = 1 - (spacing * (len(values) - 1))
    scaled = [v * scale for v in values]

    # the first start value is just 0 since there is no spacing preceeding it
    starts = [0]
    # ignore the last value as it is not needed for the start of any domain
    for i in range(len(scaled) - 1):
        starts.append(starts[-1] + scaled[i] + spacing)

    # the first end value is just the first scaled value since there is no
    # spacing preceeding the figure
    ends = [scaled[0]]
    for i in range(1, len(scaled)):
        ends.append(ends[-1] + scaled[i] + spacing)

    return starts, ends


def make_subplots(
    *figs: Figure | DeephavenFigure,
    rows: int = None,
    cols: int = None,
    shared_xaxes: bool | int = None,
    shared_yaxes: bool | int = None,
    grid: list[list[Figure | DeephavenFigure]] = None,
    horizontal_spacing: float = None,
    vertical_spacing: float = None,
    column_widths: list[float] = None,
    row_heights: list[float] = None,
    specs: list[dict[str, int | float]] | list[list[dict[str, int | float]]] = None,
) -> DeephavenFigure:
    """Create subplots. Either figs and at least one of rows and cols or grid
    should be passed.

    Args:
      *figs: Figure | DeephavenFigure
        Figures to use. Should be used with rows and/or cols.
      rows: int: (Default value = None)
        A list of rows in the resulting subplot grid. This is
        calculated from cols and number of figs provided if not passed
        but cols is.
        One of rows or cols should be provided if passing figs directly.
      cols: int: (Default value = None)
        A list of cols in the resulting subplot grid. This is
        calculated from rows and number of figs provided if not passed
        but rows is.
        One of rows or cols should be provided if passing figs directly.
      shared_xaxes: str | bool (Default value = None)
        "rows", "cols"/True, "all" or None depending on what axes
        should be shared
      shared_yaxes: str | bool (Default value = None)
        "rows"/True, "cols", "all" or None depending on what axes
        should be shared
      grid: list[list[Figure | DeephavenFigure]] (Default value = None)
        A grid (list of lists) of figures to draw. None can be
        provided in a grid entry
      horizontal_spacing: float: (Default value = None)
        Spacing between each column. Default 0.2 / cols
      vertical_spacing: float: (Default value = None)
        Spacing between each row. Default 0.3 / rows
      column_widths: list[float] (Default value = None)
        The widths of each column. Should sum to 1.
      row_heights: list[float] (Default value = None)
        The heights of each row. Should sum to 1.
      specs: list[dict[str, int | float]] | list[list[dict[str, int | float]]]
        (Default value = None)
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

    Returns:
      DeephavenFigure: The DeephavenFigure with subplots

    """
    if rows or cols:
        rows = rows if rows else math.ceil(len(figs) / cols)
        cols = cols if cols else math.ceil(len(figs) / rows)

    grid = grid if grid else make_grid(list(figs), rows, cols)

    # reverse rows as plotly goes bottom to top
    grid.reverse()

    # grid must have identical number of columns per row at this point
    rows, cols = len(grid), len(grid[0])

    # only transform specs into a grid when dimensions of figure grid are known
    if specs:
        specs = (
            specs
            if isinstance(specs[0], list)
            else make_grid(specs, rows, cols, fill={})
        )
        specs.reverse()

    # same defaults as plotly
    if horizontal_spacing is None:
        horizontal_spacing = 0.2 / cols

    if vertical_spacing is None:
        vertical_spacing = 0.3 / rows

    if column_widths is None:
        column_widths = [1.0 / cols for _ in range(cols)]

    if row_heights is None:
        row_heights = [1.0 / rows for _ in range(rows)]

    row_heights.reverse()

    col_starts, col_ends = get_domains(column_widths, horizontal_spacing)
    row_starts, row_ends = get_domains(row_heights, vertical_spacing)

    return layer(
        *[fig for fig_row in grid for fig in fig_row],
        specs=get_new_specs(
            specs,
            row_starts,
            row_ends,
            col_starts,
            col_ends,
            shared_xaxes,
            shared_yaxes,
        ),
    )
