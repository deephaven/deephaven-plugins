from deephaven import time_table
from package_with_absolute_imports.utils.constants import DEFAULT_PERIOD


def create_simple_ticking():
    return time_table(DEFAULT_PERIOD)
