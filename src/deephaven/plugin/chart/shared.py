def combined_generator(generators, fill=None):
    try:
        while True:
            yield dict(next(zip(*generators)))
    except StopIteration:
        while fill:
            yield fill
