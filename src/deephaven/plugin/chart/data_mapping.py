from collections import defaultdict
from itertools import cycle, zip_longest, product
from collections.abc import Generator
from typing import Iterable

from .shared import combined_generator

# need to override some args since they aren't named in the trace directly
# based on the variable name
OVERRIDES = {
    "error_x": "error_x/array",
    "error_x_minus": "error_x/arrayminus",
    "error_y": "error_y/array",
    "error_y_minus": "error_y/arrayminus",
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
    data_groups = get_data_groups(data_dict.values())

    for data_group in data_groups:
        yield dict(zip(data_dict.keys(), data_group))


def json_links(
        i: int,
        _vars: Iterable[str]
) -> Generator[str]:
    """
    Create json links to a plotly data object at a specific index and with a
    list of variables to link at that index

    :param i: index to link to
    :param _vars: variables to link to
    :return: a generator that returns the links
    """
    for var in _vars:
        yield f'/plotly/data/{i}/{var}'


def convert_to_json_links(
        var_col_dicts: Generator[dict[str, str]]
) -> Generator[dict[str, str]]:
    """
    Convert the provided dictionaries to json links

    Example input:
    [
        {
            "x": "Col1",
            "y": "Col2"
        },
        {
            "x": "Col1",
            "y": "Col3"
        }
    ]

    Example output:
    [
        {
            "Col1": "/plotly/data/0/x",
            "Col2": "/plotly/data/0/y",
        },
        {
            "Col1": "/plotly/data/1/x",
            "Col3": "/plotly/data/1/y",
        }
    ]

    :param var_col_dicts: A list of dictionaries to convert to json links
    :return: The generated dictionaries with json links
    """

    """
    this code fixes the issue where columns are overriden if associated with
    with multiple columns but results in a list for every column
    """
    """
    for i, var_col_dict in enumerate(var_col_dicts):
        merged = defaultdict(list)
        for k, v in zip(
                var_col_dict.values(),
                json_links(i, var_col_dict.keys())):
            merged[k].append(v)

        yield merged
    """
    for i, var_col_dict in enumerate(var_col_dicts):
        yield dict(zip(
            var_col_dict.values(),
            json_links(i, var_col_dict.keys())
        ))


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
        yield OVERRIDES[error_var], error_col


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

    for arg in OVERRIDES:
        if arg in custom_call_args and (val := custom_call_args[arg]):
            generators.append(error_bars_generator(arg, val))

    update_generator = combined_generator(generators, fill={})

    for var_col_dict, error_dict in zip(var_col_dicts, update_generator):
        yield {**var_col_dict, **error_dict}


def create_data_mapping(
        data_dict: dict[str, str | list[str]],
        marginals: list[str],
        custom_call_args: dict[str, any] = None
) -> Generator[dict[str, str]]:
    """
    Create a data mapping of data columns to json links, attaching marginals
    as needed

    :param data_dict: A dictionary containing (variable, column) maps that need
    to be converted to (column, json link) maps
    :param marginals: Any marginals to attach
    :param custom_call_args: Extra args extracted from the call_args that require
    special processing
    :return: Generated data mappings
    """

    var_col_dicts = get_var_col_dicts(data_dict)

    var_col_dicts = add_error_bars(var_col_dicts, custom_call_args)

    var_col_dicts = add_marginals(var_col_dicts, marginals)

    # note that it is assumed that data_groups_dict is in the same order
    # and the same length as the data in the plotly figure at this point
    return convert_to_json_links(var_col_dicts)


def extract_data_mapping(
        data_dict: dict[str, str | list[str]],
        marginals: list[str] = None,
        custom_call_args: dict[str, str | list[str]] = None
) -> list[dict[any]]:
    """
    Create a data mapping of table and cols to json link
    Note that ref is just a placeholder for the table. The actual table is
    substituted when the figure is sent to the client

    Example input:
    data_dict = [
        "x: "Col1",
        "y" : "Col2
    ]

    marginals = [x]

    Example output:
    [{
        table: "ref",
        data_columns: {
            "Col1": "/plotly/data/0/x",
            "Col2": "/plotly/data/0/y"
        },
    },
    {
        "table": "ref",
        data_columns: {
            "Col1": "/plotly/data/1/x"
        }
    }]

    :param data_dict: A dictionary containing a mapping of strings to strings
    and lists of strings used to compute a cartesian product of all possible
    value groups
    :param marginals: A list of any marginal vars to append
    :param custom_call_args: Extra args extracted from the call_args that require
    special processing
    :return: A list containing dicts that have a table to ref mapping as well
    as a mapping from originating column to plotly data location
    """

    return [{"table": "ref", "data_columns": col_dict} for col_dict in
            create_data_mapping(data_dict, marginals, custom_call_args)]
