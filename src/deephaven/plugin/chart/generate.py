import itertools
from collections.abc import Generator
from typing import Callable

from pandas import DataFrame

from deephaven import pandas as dhpd
from deephaven.table import Table
from deephaven import empty_table

from .deephaven_figure import DeephavenFigure

# TODO: this is not comprehensive
TYPE_NULL_MAPPING = {
    "int": "NULL_INT",
    "double": "NULL_DOUBLE"
}

# these are args that hold data that needs to be overriden on the client
DATA_ARGS = {"x", "y", "z", "r", "theta", "a", "b", "c"}

# these args map a marginal argument to what variable the data should be
# pulled from in the corresponding figure data
MARGINAL_ARGS = {
    "marginal_x": "x",
    "marginal_y": "y",
}

# any custom args should be specified here to prevent them from being passed
# to plotly express
# Note that table is not here because it is pulled off and converted to a
# pandas data frame separately
CUSTOM_ARGS = {
    "callback",
}


def col_null_mapping(
        table: Table, cols: set[str]
) -> Generator[tuple[str, str]]:
    """
    For every column in the table, check if it is in the provided cols,
    then yield a tuple with the column name and associated null value.

    :param table: The table to pull columns from
    :param cols: The column set to check against
    :return: tuple of the form (column name, associated null value)
    """
    # TODO: use deephaven data types directly rather than convert to string?
    for col in table.columns:
        if col.name in cols:
            yield col.name, TYPE_NULL_MAPPING[str(col.data_type)]


def construct_min_dataframe(table: Table,
                            data_cols: list[str]
                            ) -> DataFrame:
    """
    Construct a pandas dataframe that can be passed to plotly express with as
    little data as possible but maintaining the same plotly figure data
    structure. Currently, this results in a dataframe with columns containing
    a single null data entry.

    :param table: The table to construct the dataframe from
    :param data_cols: A list of columns that are needed in the final dataframe
    :return: The minimal dataframe
    """
    # add null valued columns as placeholders for plotly express
    update_result = empty_table(1).update([f"{col} = {null}" for col, null
                                           in col_null_mapping(table, set(data_cols))])

    return dhpd.to_pandas(update_result)


def get_data_cols(call_args: dict[any]) -> dict[str | list[str]]:
    """
    Pull out all arguments that contain columns from the table. These need to
    be overriden on the client.

    For example, "x": ["Col1", "Col2"] would end up in the resulting dictionary
    because x needs to be overriden with data from Col1 and Col2 in the table.

    :param call_args: A dictionary containing arguments that were passed to
    the chart creation call.
    :return: A dictionary containing a key of argument name and a value of
    column or list of columns
    """
    # get columns that need to be added to dataset
    return {k: v for k, v in call_args.items() if k in DATA_ARGS}


def get_marginals(call_args: dict[any]) -> list[str]:
    """
    Pull out any arguments that create marginal plots then map these arguments
    to what arg the data comes from.

    :param call_args: A dictionary containing arguments that were passed to
    the chart creation call.
    :return: a list containing any marginals that are needed
    """
    return [v for k, v in MARGINAL_ARGS.items()
            if k in call_args and call_args[k]]


def split_custom_args(
        call_args: dict[any]
) -> tuple[dict[str, any], dict[str, any]]:
    """
    Remove any custom args that are not supported in plotly express.
    Add these custom args to a separate object, then return both arg dicts

    :param call_args: The initial call args
    :return: A tuple containing (call_args, custom_call_args), where any
    custom arguments have been removed from call_args and are now in
    custom_call_args
    """
    custom_call_args = {}
    for k in call_args:
        if k in CUSTOM_ARGS:
            custom_call_args[k] = call_args.pop(k)

    return call_args, custom_call_args


def generate_figure(
        px_draw: Callable,
        call_args: dict[str, any],
) -> DeephavenFigure:
    """
    Generate a figure using a plotly express function as well as any args that
    should be used

    :param px_draw: The plotly express function to use to generate the figure
    :param call_args: Call arguments to use, either passing to plotly express
    or handled seperately
    :return: a Deephaven figure
    """
    table = call_args.pop("table")

    call_args, custom_call_args = split_custom_args(call_args)

    data_cols = get_data_cols(call_args)

    data_frame = construct_min_dataframe(table, data_cols=merge_cols(list(data_cols.values())))

    plot = px_draw(data_frame=data_frame, **call_args)

    fig = DeephavenFigure(plot, table, call_args=call_args, call=px_draw)

    marginal_vars = get_marginals(call_args)

    fig.add_data_mapping(extract_data_mapping(data_cols, marginal_vars))

    return fig


def merge_cols(args: list[str | list[str]]) -> list[str]:
    """
    Merge the strings or list of strings passed into one list.

    :param args: A list contain strings and list of strings to merge
    :return: A flattened list with all columns
    """
    prepared_cols = []
    for arg in args:
        if isinstance(arg, list):
            prepared_cols += arg
        else:
            prepared_cols.append(arg)
    return prepared_cols


def json_link(i: int, keys: list[str]) -> Generator[str]:
    """
    Create json links to a plotly data object at a specific index and with a
    specific variable

    :param i: The index of the plotly data object to link to
    :param keys: The variables such as x, y, theta, etc. to link to
    :return: Yield the json links
    """
    for key in keys:
        yield ['plotly/data/', i, '/', key]
        yield f'/plotly/data/{i}/{key}'

def column_link_dict(
        col_dict: tuple[str],
        i: int,
        keys: list[str]
) -> dict[str, str]:
    """
    Return a dictionary mapping columns to json links

    Example output:
    {
        "Col1": "/plotly/data/0/x"
        "Col2": "/plotly/data/0/y"
    }

    :param col_dict: A tuple containing columns from the table
    :param i: The index of the plotly data object to link to
    :param keys: The variables such as x, y, theta, etc. to link to
    :return: A dictionary
    """
    # get a dict that maps column to a json link
    return dict(zip(col_dict, json_link(i, keys)))


def col_prod(
        data_cols: dict[str | list[str]]
) -> Generator[tuple[dict[str, str], dict[str, str]]]:
    """
    Generate a product of all column groupings for the data mapping.

    Example output:
    A tuple with the following 2 values
    First:
    {
        "Col1": "/plotly/data/0/x"
        "Col2": "/plotly/data/0/y"
    }
    Second:
    {
        "x": "Col1",
        "y": "Col2"
    }

    :param data_cols:
    :return: A tuple containing (dict of column name to json link, dict of
    variable to column name)
    """
    # todo: maybe clean up how this is done

    # generate a product of all column groupings for the data mapping
    col_names = []
    for val in data_cols.values():
        if isinstance(val, str):
            col_names.append([val])
        else:
            col_names.append(val)

    col_name_groups = itertools.product(*col_names)

    for i, col_dict in enumerate(col_name_groups):
        keys = data_cols.keys()
        col_dict = column_link_dict(col_dict, i, list(data_cols.keys()))
        var_col_dict = dict(zip(keys, col_dict))
        yield col_dict, var_col_dict

"""

"""


def col_prod_with_marg(
        data_cols: dict[str | list[str]],
        marginal_vars: list[str],
) -> Generator[dict[str, str]]:
    """
    Yield a product of all column groupings for the data mapping.

    Example output with a marginal_vars={x}:
    First yield:
    {
        "Col1": "/plotly/data/0/x"
        "Col2": "/plotly/data/0/y"
    }

    Then yield:
    {
        "Col1": "/plotly/data/1/x"
    }

    :param data_cols: A dictionary containing strings and lists of strings used
    to compute a cartesian product of all possible value groups
    :param marginal_vars: A list of any marginal values to append
    :return: yield a dictionary mapping cols to json links
    """
    for col_dict, var_col_dict in col_prod(data_cols):
        # yield the original col_dict, then any marginals in the order they
        # are provided
        yield col_dict
        for marginal_var in marginal_vars:
            col = var_col_dict[marginal_var]
            yield {col: col_dict[col]}


def extract_data_mapping(
        data_cols: dict[str | list[str]],
        marginal_vars: list[str] = None
) -> list[dict[any]]:
    """
    Create a data mapping of table and cols to json link
    Note that ref is just a placeholder for the table. The actual table is
    substituted when the plotly figure is sent to the client

    Example output:
    [{
        table: "ref",
        data_columns: {
            "Col1": "/plotly/data/0/x",
            "Col2": "/plotly/data/0/y"
        },
    }
    {
        "table": "ref",
        {
            "Col1": "/plotly/data/1/x"
        }
    }]

    :param data_cols: A dictionary containing strings and lists of strings used
    to compute a cartesian product of all possible value groups
    :param marginal_vars: A list of any marginal values to append
    :return: A list containing dicts that have a table to ref mapping
    """
    return [{"table": "ref", "data_columns": col_dict} for col_dict in
            col_prod_with_marg(data_cols, marginal_vars)]
