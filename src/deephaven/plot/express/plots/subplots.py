from itertools import product

from plotly.graph_objs import Figure

from ._private_utils import layer
from .. import DeephavenFigure

def calculate_new_domain(
        row,
        col,
        rowspan,
        colspan,
        total_rows,
        total_cols
):
    row_start = row / total_rows
    col_start = col / total_cols
    row_end = row_start + (rowspan / total_rows)
    col_end = col_start + (colspan / total_cols)
    return {
        "x": [col_start, col_end],
        "y": [row_start, row_end]
    }


def get_new_specs(
        specs,
        rows,
        cols
):
    if specs:
        new_specs = []
        row = 0
        col = 0
        # If none, width of 0
        for specs_row in specs:
            for spec in specs_row:
                row_span = spec.get("rowspan", 1) if spec else 0
                col_span = spec.get("colspan", 1) if spec else 0
                new_specs.append(
                    calculate_new_domain(
                        row, col,
                        row_span, col_span, rows, cols)
                )
                row += row_span
                col += col_span
        return new_specs

    return [calculate_new_domain(
        row, col, 1, 1, rows, cols
    ) for row, col in product(range(rows), range(cols))]

def fig_generator(
        grid
):
    for grid_row in grid:
        for fig in grid_row:
            yield fig

def make_grid(ls, rows, cols):
    grid = []
    index = 0
    for row in range(rows):
        grid_row = []
        for col in range(cols):
            # if there are more slots in the grid then there are items, pad
            # the grid with None
            next_fig = ls[index] if index < len(ls) else None
            grid_row.append(next_fig)

            index += 1
        grid.append(grid_row)
    return grid

def make_subplots(
        *figs,
        rows: int = 1,
        cols: int = 1,
        grid = None,
        specs = None,
):
    if specs:
        specs = specs if isinstance(specs[0], list) else make_grid(specs, rows, cols)
        specs.reverse()

    grid = grid if grid else make_grid(figs, rows, cols)

    # reverse rows as plotly goes bottom to top
    grid.reverse()

    # grid must have identical number of columns per row at this point
    rows, cols = len(grid), len(grid[0])

    return layer(fig_iterator=fig_generator(grid), specs=get_new_specs(specs, rows, cols))
