from collections.abc import Generator


def combined_generator(
        generators: list[Generator[tuple | dict]],
        fill: any = None
) -> Generator[dict]:
    """
    Combines generators into dictionary updates iteratively
    One yield of this combined generator yields one yield from each dictionary,
    combined into a new dictionary.

    :param generators: Generators to combine. Each should yield
    either a tuple of a key, value pair or a dictionary.
    :param fill: Optional fill when the generators are exhausted
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
