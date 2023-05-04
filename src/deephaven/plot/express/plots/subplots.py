from itertools import product
import math

from plotly.graph_objs import Figure

from ._private_utils import layer
from .. import DeephavenFigure

def get_new_specs(
specs, row_starts, row_ends, col_starts, col_ends
):
    new_specs = []

    for row, (y_0, y_1) in enumerate(zip(row_starts, row_ends)):
        for col, (x_0, x_1) in enumerate(zip(col_starts, col_ends)):
            spec = {} if specs[row][col] is None else specs[row][col]
            l = spec.get("l", 0)
            r = spec.get("r", 0)
            t = spec.get("t", 0)
            b = spec.get("b", 0)
            rowspan = spec.get("rowspan", 1)
            colspan = spec.get("colspan", 1)
            y_1 = row_ends[row + rowspan - 1]
            x_1 = col_ends[col + colspan - 1]
            new_specs.append({
                "x": [x_0 + l, x_1 - r],
                "y": [y_0 + t, y_1 - b]
            })
    return new_specs


def fig_generator(
        grid
):
    figs = []
    for grid_row in grid:
        for fig in grid_row:
            figs.append(fig)

    return figs


def make_grid(ls, rows, cols, fill=None):
    grid = []
    index = 0
    for row in range(rows):
        grid_row = []
        for col in range(cols):
            # if there are more slots in the grid then there are items, pad
            # the grid
            next_fig = ls[index] if index < len(ls) else fill
            grid_row.append(next_fig)

            index += 1
        grid.append(grid_row)
    return grid

def get_domain(values, spacing):
    # scale the values by however much the spacing uses
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
        *figs,
        rows: int = None,
        cols: int = None,
        grid=None,
        horizontal_spacing=None,
        vertical_spacing=None,
        column_widths=None,
        row_heights=None,
        specs=None,
):
    if rows or cols:
        rows = rows if rows else math.ceil(len(figs) / cols)
        cols = cols if cols else math.ceil(len(figs) / rows)

    if specs:
        specs = specs if isinstance(specs[0], list) else make_grid(specs, rows, cols, fill={})
        specs.reverse()

    grid = grid if grid else make_grid(figs, rows, cols)

    # reverse rows as plotly goes bottom to top
    grid.reverse()

    # grid must have identical number of columns per row at this point
    rows, cols = len(grid), len(grid[0])

    if horizontal_spacing is None:
        horizontal_spacing = 0.2 / cols

    if vertical_spacing is None:
        vertical_spacing = 0.3 / rows

    if column_widths is None:
        column_widths = [1.0 / cols for _ in range(cols)]

    if row_heights is None:
        row_heights = [1.0 / rows for _ in range(rows)]

    row_heights.reverse()

    col_starts, col_ends = get_domain(column_widths, horizontal_spacing)
    row_starts, row_ends = get_domain(row_heights, vertical_spacing)

    return layer(*fig_generator(grid),
                 specs=get_new_specs(specs, row_starts, row_ends, col_starts, col_ends))
