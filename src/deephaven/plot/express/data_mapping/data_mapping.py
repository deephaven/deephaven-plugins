from itertools import cycle, product, zip_longest
from collections.abc import Generator, Iterable

from deephaven.table import Table

from .DataMapping import DataMapping
from ..shared import combined_generator

# need to override some args since they aren't named in the trace directly
# based on the variable name
# these are appended
CUSTOM_DATA_ARGS = {
    "error_x": "error_x/array",
    "error_x_minus": "error_x/arrayminus",
    "error_y": "error_y/array",
    "error_y_minus": "error_y/arrayminus",
    "error_z": "error_z/array",
    "error_z_minus": "error_z/arrayminus",
    "x_diff": "x",
    "size": "marker/size",
}

# override these data columns with different names
OVERRIDES = {
    "names": "labels",
    "x_start": "base",
}

# x_end is not used, the calculations are made in preprocessing step and passed to x
REMOVE = {
    "x_end"
}


def get_data_groups(
        data_vals: Iterable[str | list[str]]
) -> Iterable[tuple[str, ...]]:
    """
    Generate a cartesian product between all items in the provided iterable

    :param data_vals: An iterable
    :return: An iterable containing tuples that contain all possible
    combinations of the values in the data_vals
    """

    data_groups = []
    for val in data_vals:
        if isinstance(val, str):
            data_groups.append([val])
        else:
            data_groups.append(val)

    return product(*data_groups)


def overriden_keys(
        keys: list[str]
) -> Generator[str]:
    """
    Override all keys provided with values in OVERRIDES if applicable

    :param keys: The keys to override
    :returns: A generator that yields the overriden keys
    """
    for key in keys:
        yield OVERRIDES[key] if key in OVERRIDES else key


def get_var_col_dicts(
        data_dict: dict[str, str | list[str]]
) -> Generator[dict[str, str]]:
    """
    Generate variable to column mappings. The keys in the dictionary will be
    the keys in the new dictionary items, and a cartesian product will be
    computed on the dictionary values to create the new values.

    Example input:
    {
        "x": "Col1",
        "y": ["Col2", "Col3"]
    }

    Example output:
    {
        "x": "Col1",
        "y": "Col2"
    },
    {
        "x": "Col1",
        "y": "Col3"
    }

    :param data_dict: A dictionary contain var to column or column list mappings
    :return: Generated var to column mappings
    """
    for data_group in get_data_groups(data_dict.values()):
        yield dict(zip(overriden_keys(list(data_dict.keys())), data_group))


def custom_data_args_generator(
        var: str,
        cols: list[str]
) -> Generator[tuple[str, str]]:
    """
    Generate data mappings for custom data args

    :param var: The arg to map to columns
    :param cols: The columns to map to
    :returns: Generates a tuple pair of (variable, column value)
    """
    for col in cycle(cols):
        yield CUSTOM_DATA_ARGS[var], col


def add_custom_data_args(
        var_col_dicts: Generator[dict[str, str]],
        custom_call_args: dict[str, any] = None
) -> Generator[dict[str, str]]:
    """
    Given the existing variable to column mappings, add error bars

    :param var_col_dicts: Existing var to col map
    :param custom_call_args: Arguments to check for any error bar-related vars
    :returns: Generates new dictionary with var_col_dicts modified to have
    error bars if needed
    """
    generators = []

    for arg in CUSTOM_DATA_ARGS:
        if arg in custom_call_args and (val := custom_call_args[arg]):
            generators.append(custom_data_args_generator(arg, val))

    update_generator = combined_generator(generators, fill={})

    for var_col_dict, custom_dict in zip(var_col_dicts, update_generator):
        yield {**var_col_dict, **custom_dict}


def filter_none(
        var_col_dicts: Generator[dict[str, str]]
) -> Generator[dict[str, str]]:
    """
    Filters key, value pairs that have None values from the dictionaries.

    :param var_col_dicts: The dictionaries to filter
    :returns: A generator that yields the filtered dicts
    """
    for var_col_dict in var_col_dicts:
        yield {k: v for k, v in var_col_dict.items() if v is not None}


def remove_unmapped_args(
        data_dict: dict[str, str | list[str]]
) -> dict[str, str | list[str]]:
    """
    Removed any args that do not need to be in the data mapping

    :param data_dict: The dict to remove args from
    :return: The filtered dict
    """
    for arg in REMOVE:
        if arg in data_dict:
            data_dict.pop(arg)

    return data_dict


def zip_args(
        data_dict: dict[str, str | list[str]]
) -> Generator[dict[str, str]]:
    """
    Yields var_col_dicts, similarly to get_var_col_dicts
    Special case for OHLC and Candlestick as their data mappings are applied
    sequentially rather than in a product

    :param data_dict: The data
    """
    for x_f, o, h, l, c in zip_longest(
            data_dict["x_finance"], data_dict["open"], data_dict["high"],
            data_dict["low"], data_dict["close"],
            fillvalue=data_dict["x_finance"][0]):

        yield {
            "x": x_f,
            "open": o,
            "high": h,
            "low": l,
            "close": c,
        }


def create_data_mapping(
        data_dict: dict[str, str | list[str]],
        custom_call_args: dict[str, any],
        table: Table,
        start_index: int,
) -> DataMapping:
    """
    Create a data mapping of variable to table column

    :param data_dict: A dictionary containing (variable, column) maps that need
    to be converted to (variable, table column) maps
    :param custom_call_args: Extra args extracted from the call_args that require
    special processing
    :param table: The table that contains the data
    :param start_index: what index (of the corresponding traces) that this
    mapping starts with
    :return: A DataMapping for a specific table
    """

    data_dict = remove_unmapped_args(data_dict)

    # in case of finance, zip instead of take product
    if "x_finance" in data_dict:
        var_col_dicts = zip_args(data_dict)
    else:
        var_col_dicts = get_var_col_dicts(data_dict)

    var_col_dicts = add_custom_data_args(var_col_dicts, custom_call_args)

    var_col_dicts = filter_none(var_col_dicts)

    return DataMapping(
        table,
        list(var_col_dicts),
        start_index)
