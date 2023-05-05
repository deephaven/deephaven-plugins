import math

from plotly.graph_objs import Figure

from ._private_utils import layer
from .. import DeephavenFigure


def get_new_specs(
        specs: list[list[dict[str, int | float]]],
        row_starts: list[float],
        row_ends: list[float],
        col_starts: list[float],
        col_ends: list[float],
) -> list[dict[str, list[float]]]:
    """
    Transforms the given specs and row and column lists to specs for layering

    :param specs: A 2 dimensional list that contains the specs per figure
    :param row_starts: A list of domain values on the y-axis where the
    corresponding figure will start
    :param row_ends: A list of domain values on the y-axis where the
    corresponding figure will end
    :param col_starts: A list of domain values on the x-axis where the
    corresponding figure will start
    :param col_ends: A list of domain values on the x-axis where the
    corresponding figure will end
    :return: The new specs with x and y domains, to be passed to layering
    """
    new_specs = []

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
            new_specs.append({
                "x": [x_0 + l, x_1 - r],
                "y": [y_0 + t, y_1 - b]
            })
    return new_specs


def make_grid(
        items: list[any],
        rows: int,
        cols: int,
        fill=None
) -> list[list[any]]:
    """
    Make a grid (list of lists) out of the provided items

    :param items: A list of items to put in the grid
    :param rows: The number of rows in the grid
    :param cols: The number of cols in the grid
    :param fill: If there are more slots (as defined by rows * columns) than
    provided items, then the remaining items in the grid have this value.
    Default None.
    :return: The generated grid
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


def get_domains(
        values: list[float],
        spacing: float
) -> tuple[list[float], list[float]]:
    """
    Get the domains from a list of percentage values. The domains are
    cumulative and account for spacing.

    :param values: The list of values to scale due to spacing then
    :param spacing: The spacing between each value.
    :return: A tuple of (list of domain starts, list of domain ends)
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
        grid: list[list[Figure | DeephavenFigure]] = None,
        horizontal_spacing: float = None,
        vertical_spacing: float = None,
        column_widths: list[float] = None,
        row_heights: list[float] = None,
        specs: list[dict[str, int | float]] |
               list[list[dict[str, int | float]]] = None,
) -> DeephavenFigure:
    """
    Create subplots. Either figs and at least one of rows and cols or grid
    should be passed.

    :param figs: Figures to use. Should be used with rows and/or cols.
    :param rows: A list of rows in the resulting subplot grid. This is
    calculated from cols and number of figs provided if not passed but cols is.
    One of rows or cols should be provided if passing figs directly.
    :param cols: A list of cols in the resulting subplot grid. This is
    calculated from rows and number of figs provided if not passed but rows is.
    One of rows or cols should be provided if passing figs directly.
    :param grid: A grid (list of lists) of figures to draw. None can be
    provided in a grid entry
    :param horizontal_spacing: Spacing between each column. Default 0.2 / cols
    :param vertical_spacing: Spacing between each row. Default 0.3 / rows
    :param column_widths: The widths of each column. Should sum to 1.
    :param row_heights: The heights of each row. Should sum to 1.
    :param specs: A list or grid of dicts that contain specs. An empty
    dictionary represents no specs, and None represents no figure, either
    to leave a gap on the subplots on provide room for a figure spanning
    multiple columns.
    'l' is a float that adds left padding
    'r' is a float that adds right padding
    't' is a float that adds top padding
    'b' is a float that adds bottom padding
    'rowspan' is an int to make this figure span multiple rows
    'colspan' is an int to make this figure span multiple columns
    :return: The DeephavenFigure with subplots
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
        specs = specs if isinstance(specs[0], list) else make_grid(specs, rows, cols, fill={})
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

    return layer(*[fig for fig_row in grid for fig in fig_row],
                 specs=get_new_specs(specs, row_starts, row_ends, col_starts, col_ends))
