from collections.abc import Generator

from deephaven.table import Table


def combined_generator(
        generators: list[Generator[tuple | dict]],
        fill: any = None
) -> Generator[dict]:
    """Combines generators into dictionary updates iteratively
    One yield of this combined generator yields one yield from each dictionary,
    combined into a new dictionary.

    Args:
      generators: Generators to combine. Each should yield
    either a tuple of a key, value pair or a dictionary.
      fill: Optional fill when the generators are exhausted
      generators: list[Generator[tuple | dict]]: 
      fill: any:  (Default value = None)

    Returns:

    """
    try:
        while True:
            full_update = {}
            for generator in generators:
                update = next(generator)
                if isinstance(update, tuple):
                    full_update[update[0]] = update[1]
                else:
                    full_update.update(update)
            yield full_update
    except StopIteration:
        while fill is not None:
            yield fill


def get_unique_names(
        table: Table,
        orig_names: list[str]
) -> dict[str, str]:
    """Calculate names that do not occur in table, starting from the names in
    orig_names

    Args:
      table: The table to check against
      orig_names: return: A dictionary that maps orig_names to new names that are not found
    in the table
      table: Table: 
      orig_names: list[str]: 

    Returns:
      A dictionary that maps orig_names to new names that are not found
      in the table

    """
    new_names = {}

    table_columns = {column.name for column in table.columns}
    for name in orig_names:
        new_name = name
        while new_name in table_columns or new_name in new_names:
            new_name += '_'
        new_names[name] = new_name
    return new_names
