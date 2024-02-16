from __future__ import annotations

from copy import deepcopy
from itertools import cycle, product, zip_longest
from collections.abc import Generator, Iterable
from typing import Any

from deephaven.table import Table

from .DataMapping import DataMapping
from .data_mapping_constants import CUSTOM_DATA_ARGS, OVERRIDES, REMOVE
from ..shared import combined_generator


def get_data_groups(data_vals: Iterable[str | list[str]]) -> Iterable[tuple[str, ...]]:
    """Generate a cartesian product between all items in the provided iterable

    Args:
      data_vals: An iterable to generate the cartesian product with

    Returns:
      An iterable containing tuples that contain all possible combinations of the values in the data_vals

    """

    data_groups = []
    for val in data_vals:
        if isinstance(val, str):
            data_groups.append([val])
        else:
            data_groups.append(val)

    return product(*data_groups)


def overriden_keys(keys: list[str]) -> Generator[str, None, None]:
    """Override all keys provided with values in OVERRIDES if applicable

    Args:
      keys: The keys to override

    Yields:
      The overriden keys

    """
    for key in keys:
        yield OVERRIDES[key] if key in OVERRIDES else key


def get_var_col_dicts(
    data_dict: dict[str, str | list[str]]
) -> Generator[dict[str, str], None, None]:
    """Generate variable to column mappings. The keys in the dictionary will be
    the keys in the new dictionary items, and a cartesian product will be
    computed on the dictionary values to create the new values.

    Args:
      data_dict: A dictionary contain var to column or column list mappings

    Yields:
      Generated var to column mappings

    Examples:
        Input:
        {
            "x": "Col1",
            "y": ["Col2", "Col3"]
        }

        Output:
        {
            "x": "Col1",
            "y": "Col2"
        },
        {
            "x": "Col1",
            "y": "Col3"
        }

    """
    for data_group in get_data_groups(data_dict.values()):
        yield dict(zip(overriden_keys(list(data_dict.keys())), data_group))


def custom_data_args_generator(
    var: str, cols: list[str]
) -> Generator[tuple[str, str], None, None]:
    """Generate data mappings for custom data args

    Args:
      var: The arg to map to columns
      cols: The columns to map to

    Yields:
      A tuple pair of (variable, column value)

    """
    for col in cycle(cols):
        yield CUSTOM_DATA_ARGS[var], col


def add_custom_data_args(
    var_col_dicts: Generator[dict[str, str], None, None],
    custom_call_args: dict[str, Any] | None = None,
) -> Generator[dict[str, str], None, None]:
    """Given the existing variable to column mappings, add error bars

    Args:
      var_col_dicts: Existing var to col map
      custom_call_args: Arguments to check for any error bar-related vars

    Yields:
      New dictionary with var_col_dicts modified to have error bars if needed

    """
    generators = []

    for arg in CUSTOM_DATA_ARGS:
        if (
            custom_call_args
            and arg in custom_call_args
            and (val := custom_call_args[arg])
        ):
            generators.append(custom_data_args_generator(arg, val))

    update_generator = combined_generator(generators, fill={})

    for var_col_dict, custom_dict in zip(var_col_dicts, update_generator):
        yield {**var_col_dict, **custom_dict}


def filter_none(
    var_col_dicts: Generator[dict[str, str], None, None]
) -> Generator[dict[str, str], None, None]:
    """Filters key, value pairs that have None values from the dictionaries.

    Args:
      var_col_dicts: The dictionaries to filter

    Yields:
      The filtered dicts

    """
    for var_col_dict in var_col_dicts:
        yield {k: v for k, v in var_col_dict.items() if v is not None}


def remove_unmapped_args(
    data_dict: dict[str, str | list[str]]
) -> dict[str, str | list[str]]:
    """Removed any args that do not need to be in the data mapping

    Args:
      data_dict: The dict to remove args from

    Returns:
      The filtered dict

    """
    for arg in REMOVE:
        if arg in data_dict:
            data_dict.pop(arg)

    return data_dict


def zip_args(
    data_dict: dict[str, str | list[str]]
) -> Generator[dict[str, str], None, None]:
    """Yields var_col_dicts, similarly to get_var_col_dicts
    Special case for OHLC and Candlestick as their data mappings are applied
    sequentially rather than in a product

    Args:
      data_dict: The data

    Yields:
      A dictionary with zipped args
    """
    for x_f, o, h, l, c in zip_longest(
        data_dict["x_finance"],
        data_dict["open"],
        data_dict["high"],
        data_dict["low"],
        data_dict["close"],
        fillvalue=data_dict["x_finance"][0],
    ):
        yield {
            "x": x_f,
            "open": o,
            "high": h,
            "low": l,
            "close": c,
        }


def create_data_mapping(
    data_dict: dict[str, str | list[str]],
    custom_call_args: dict[str, Any],
    table: Table,
    start_index: int,
) -> tuple[DataMapping, list[dict[str, str]]]:
    """Create a data mapping of variable to table column as well as a mapping
    copy for the hover text.

    Args:
      data_dict: A dictionary containing
        (variable, column) maps that need to be converted to
        (variable, table column) maps
      custom_call_args: Extra args extracted from the call_args
        that require special processing
      table: The table that contains the data
      start_index: what index (of the corresponding traces) that this
        mapping starts with

    Returns:
      A DataMapping for a specific table and the hover mapping

    """
    # color is needed to create the color axis, but might need to set it to
    # colors if dealing with some types of charts
    if "colors" in custom_call_args:
        data_dict["colors"] = data_dict.pop("color")

    data_dict = remove_unmapped_args(data_dict)

    # in case of finance, zip instead of take product
    if "x_finance" in data_dict:
        var_col_dicts = zip_args(data_dict)
    else:
        var_col_dicts = get_var_col_dicts(data_dict)

    var_col_dicts = add_custom_data_args(var_col_dicts, custom_call_args)

    var_col_dicts = filter_none(var_col_dicts)

    mappings = list(var_col_dicts)

    # must copy mappings as they might be relabeled
    return DataMapping(table, mappings, start_index), deepcopy(mappings)
