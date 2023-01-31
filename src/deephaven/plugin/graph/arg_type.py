from enum import StrEnum, auto


class ArgType(StrEnum):
    CATEGORICAL = auto()
    NUMERICAL = auto()
    CONDITIONAL = auto()
