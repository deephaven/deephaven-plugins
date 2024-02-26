from __future__ import annotations

from deephaven import agg
from deephaven.table import Table
from deephaven.updateby import cum_sum


def preprocess_ecdf(table: Table, column: str) -> Table:
    """

    Args:
      table:
      column:

    Returns:

    """
    # TODO
    col_dup = f"{column}_2"
    tot_count_col = f"TOTAL_COUNT"
    tot_count_dup = f"{tot_count_col}_2"
    prob_col = "probability"

    # count up how many of each value occurs in the column,
    # ordered and cumulative
    cumulative_counts = (
        table.view([column, f"{col_dup}={column}"])
        .count_by(col_dup, by=column)
        .sort(column)
        .update_by(cum_sum(f"{tot_count_col}={col_dup}"))
    )

    # convert the counts to arrays to calculate the percentages then
    # convert back to columns
    probabilities = (
        cumulative_counts.update_view(f"{tot_count_dup}={tot_count_col}")
        .agg_by([agg.last(cols=tot_count_col), agg.group(cols=[tot_count_dup, column])])
        .update_view(f"{prob_col} = {tot_count_dup} / {tot_count_col}")
        .view([column, prob_col])
        .ungroup([column, prob_col])
    )

    return probabilities, column, prob_col  # type: ignore
