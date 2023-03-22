from collections import defaultdict
from itertools import count
from collections.abc import Generator, Iterable


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
        var_col_dicts: list[dict[str, str]],
        start_index: int
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
    :param start_index: What index this data mapping starts at
    :return: The generated dictionaries with json links
    """

    for i, var_col_dict in zip(count(start_index), var_col_dicts):
        merged = defaultdict(list)
        for k, v in zip(
                var_col_dict.values(),
                json_links(i, var_col_dict.keys())):
            merged[k].append(v)

        yield merged


def json_link_mapping(
        var_col_dicts: list[dict[str, str]],
        table_index: int,
        start_index: int,
) -> list[dict[any]]:
    """
    Create a data mapping of table and cols to json link

    Example input:
    var_col_dicts = [
        {
            "x: "Col1",
            "y": "Col2
        }
    ]

    Example output:
    [{
        table: 0,
        data_columns: {
            "Col1": "/plotly/data/0/x",
            "Col2": "/plotly/data/0/y"
        },
    }]


    :param var_col_dicts: A dictionary containing a mapping of strings to strings
    and lists of strings used to compute a cartesian product of all possible
    value groups
    :param start_index: What index this data mapping starts at
    :param table_index: The index of the table that this mapping is part of
    :return: A list containing dicts that have a table to ref mapping as well
    as a mapping from originating column to plotly data location
    """
    return [
        {"table": table_index, "data_columns": json_link_dict}
        for json_link_dict in
        convert_to_json_links(var_col_dicts, start_index)
    ]
