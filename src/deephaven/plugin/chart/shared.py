def combined_generator(generators, fill=None):
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