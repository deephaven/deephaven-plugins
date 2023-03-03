from collections import defaultdict
from itertools import cycle, product
from collections.abc import Generator, Iterable

from deephaven.table import Table

from .DataMapping import DataMapping
from .shared import combined_generator

# need to override some args since they aren't named in the trace directly
# based on the variable name
ERROR_OVERRIDES = {
    "error_x": "error_x/array",
    "error_x_minus": "error_x/arrayminus",
    "error_y": "error_y/array",
    "error_y_minus": "error_y/arrayminus"
}

OVERRIDES = {
    "names": "labels"
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

def overriden_keys(keys):
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
        yield dict(zip(overriden_keys(data_dict.keys()), data_group))


def add_marginals(
        var_col_dicts: Generator[dict[str, str]],
        marginals: list[str]
) -> Generator[dict[str, str]]:
    """
    Add marginal data objects to the generated data mappings.

    :param var_col_dicts: A base dictionary mapping variables to columns that
    needs marginals attached
    :param marginals: A list of marginals to attach
    :return: Generated dictionaries with marginals attached
    """
    for var_col_dict in var_col_dicts:
        yield var_col_dict
        for marginal in marginals:
            yield {
                marginal: var_col_dict[marginal]
            }

#TODO: could just pass the overriding arg and use key value generator
def error_bars_generator(
        error_var: str,
        error_cols: list[str]
) -> Generator[tuple[str, str]]:
    """
    Generate data mappings for error bars.

    :param error_var: The error arg to map to columns
    :param error_cols: The columns to map to
    :returns: Generates a tuple pair of (variable,
    """
    for error_col in cycle(error_cols):
        yield ERROR_OVERRIDES[error_var], error_col


def add_error_bars(
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

    for arg in ERROR_OVERRIDES:
        if arg in custom_call_args and (val := custom_call_args[arg]):
            generators.append(error_bars_generator(arg, val))

    update_generator = combined_generator(generators, fill={})

    for var_col_dict, error_dict in zip(var_col_dicts, update_generator):
        yield {**var_col_dict, **error_dict}


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


def create_data_mapping(
        data_dict: dict[str, str | list[str]],
        marginals: list[str],
        custom_call_args: dict[str, any],
        table: Table,
        start_index: int
) -> DataMapping:
    """
    Create a data mapping of data columns to json links, attaching marginals
    as needed.

    :param data_dict: A dictionary containing (variable, column) maps that need
    to be converted to (column, json link) maps
    :param marginals: Any marginals to attach
    :param custom_call_args: Extra args extracted from the call_args that require
    special processing
    :param table: The table that contains the data
    :param start_index: what index (of the corresponding traces) that this
    mapping starts with
    :return: A DataMapping for a specific table
    """

    var_col_dicts = get_var_col_dicts(data_dict)

    var_col_dicts = add_error_bars(var_col_dicts, custom_call_args)

    var_col_dicts = add_marginals(var_col_dicts, marginals)

    var_col_dicts = filter_none(var_col_dicts)

    return DataMapping(
        table,
        list(var_col_dicts),
        start_index)
