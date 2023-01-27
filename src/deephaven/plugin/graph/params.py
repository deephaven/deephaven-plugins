import types


def rotated_list(ls, i):
    # rotate the list around the self.index value
    return ls[i:] + ls[:i]


class ParamGetter:

    def __init__(self, param):
        # TODO: expand this to other iterable types?
        if isinstance(param, list):
            self.param_type = "list"
            self.index = 0
        elif isinstance(param, dict):
            self.param_type = "dict"
        elif isinstance(param, types.FunctionType):
            self.param_type = "func"
        else:
            raise TypeError("Type of attribute not supported")
        self.param = param

    # helper class to get next param(s) to use in a graph
    def get_next(self, value=None):
        if self.param_type == 'list':
            return rotated_list(self.param, self.index)
        elif self.param_type == 'dict':
            return self.param[value]
        else:
            return self.param(value)

    # increment the array for the next possible value, 1 by default
    def increment(self, count=1):
        if self.param_type == 'list':
            self.index = (self.index + count) % len(self.param)


# Manage a set of param getters for convenience
class ParamGetterCollection:

    def __init__(self, **kwargs):
        self.collection = {}
        for k, v in kwargs.items():
            self.collection[k] = ParamGetter(v)

    def get_next_group(self, value=None):
        return {k: v.get_next(value) for k, v in self.collection.items()}

    # increment all param getters by a count so that they are ready for next arg
    def increment(self, count=1, key=None):
        if key:
            self.collection[key].increment(count)
        else:
            for param_getter in self.collection.values():
                param_getter.increment(count)

