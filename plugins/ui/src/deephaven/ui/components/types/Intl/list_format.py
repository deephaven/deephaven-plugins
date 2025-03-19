from typing import Literal

import sys

if sys.version_info < (3, 11):
    from typing_extensions import TypedDict, NotRequired
else:
    from typing import TypedDict, NotRequired


class ListFormatOptions(TypedDict):
    """
    Options for formatting lists of values.
    """

    locale_matcher: NotRequired[Literal["lookup", "best fit"]]
    """
    The locale matching algorithm to use.
    Possible values are "lookup" to use the runtime's locale matching algorithm, or "best fit" to use the CLDR locale matching algorithm.
    The default is "best fit".
    """

    type: NotRequired[Literal["conjunction", "disjunction", "unit"]]
    """
    The type of grouping to use. 
    Possible values are "conjunction" for "and"-based grouping of list items, "disjunction" for "or"-based grouping, and "unit" for grouping the list items as a compound unit (neither conjunction or disjunction).
    """

    style: NotRequired[Literal["long", "short", "narrow"]]
    """
    The grouping style to use. 
    Possible values are "long" for a typical list, or "short" to reduce the length of the output, or "narrow" to further abbreviate the output.
    """
