from __future__ import annotations

import pandas as pd
from deephaven.replay import TableReplayer
from deephaven.table import Table
from deephaven import empty_table
from deephaven.time import (
    to_j_instant,
    to_pd_timestamp,
)
from deephaven.updateby import rolling_sum_tick, ema_tick
import random, math

SECOND = 1000000000  #: One second in nanoseconds.
MINUTE = 60 * SECOND  #: One minute in nanoseconds.


def iris(ticking: bool = True, size: int = 300) -> Table:
    """
    Returns a ticking version of the 1936 Iris flower dataset.

    This function generates a deterministically random dataset inspired by the
    classic 1936 Iris flower dataset commonly used for classification tasks, with an
    additional "ticking" feature. The ticking feature represents a continuously
    increasing simulated timestamp.

    Notes:
        - The ticking feature starts from 1936-01-01T08:00:00UTC and increases
          by 1 second for each observation.
        - The dataset contains a default of 300 number of samples but can be
          set to any size, with 4 original features (sepal length, sepal width,
          petal length, and petal width), along with a timestamp, id and species.
        - The original Iris species labels are included (setosa, versicolor, and virginica).

    Args:
        ticking: bool:  (Default value = True)
            If true, the table will tick using a replayer starting
            with a third of the table already ticked. If false the
            whole table will be returned as a static table.
        size: int:  (Default value = 300)
            The number of rows to create for the table

    Returns:
        A Deephaven Table

    References:
        - Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems.
          Annals of Eugenics, 7(2), 179-188.

    Examples:
        ```
        import deephaven.plot.express as dx
        iris = dx.data.iris()
        ```
    """

    base_time = to_j_instant("1936-01-01T08:00:00 UTC")
    pd_base_time = to_pd_timestamp(base_time)

    species_list: list[str] = ["setosa", "versicolor", "virginica"]
    col_ids = {"sepal_length": 0, "sepal_width": 1, "petal_length": 2, "petal_width": 3}
    # statistical values extracted from the iris data set https://en.wikipedia.org/wiki/Iris_flower_data_set
    # average [setosa, versicolor, virginica] and [sepal_length, sepal_width, petal_length, petal_width]
    avg: list[list[float]] = [
        [5.01, 3.42, 1.46, 0.24],
        [5.94, 2.77, 4.26, 1.33],
        [6.59, 2.97, 5.55, 2.03],
    ]
    # std [setosa, versicolor, virginica] and [sepal_length, sepal_width, petal_length, petal_width]
    std: list[list[float]] = [
        [0.35, 0.38, 0.17, 0.11],
        [0.52, 0.31, 0.47, 0.20],
        [0.64, 0.32, 0.55, 0.27],
    ]

    def generate_value(seed: int, species_id: int, col: str) -> float:
        col_id = col_ids[col]
        if col_id == 0:
            random.seed(
                5001 + seed
            )  # set seed once per row + offset that made it look nice
        return round(
            random.gauss(avg[species_id][col_id], std[species_id][col_id]),
            1,
        )

    static_table = (
        empty_table(size)
        .update(
            [
                "timestamp = base_time + (long)(ii * SECOND)",
                "species_id = i % 3",
                "species = (String)species_list[species_id]",
                "sepal_length = generate_value(i, species_id,`sepal_length`)",
                "sepal_width = generate_value(i, species_id, `sepal_width`)",
                "petal_length = generate_value(i, species_id,`petal_length`)",
                "petal_width = generate_value(i, species_id, `petal_width`)",
            ]
        )
        .move_columns_down("species_id")
    )

    if ticking:
        result_replayer = TableReplayer(
            # start with one third of the table already ticked
            pd_base_time + pd.Timedelta(round(size * 0.33) * SECOND),
            pd_base_time + pd.Timedelta(size * SECOND),
        )
        replayer_table = result_replayer.add_table(static_table, "timestamp")
        result_replayer.start()
        return replayer_table
    else:
        return static_table


def stocks(ticking: bool = True, hours_of_data: int = 1) -> Table:
    """Returns a Deephaven table containing a generated example data set.

    Data is 1 hour of randomly generated (but deterministic) fictional
    stock market data, and starts with the first 5 minutes of data
    already initilized so your example plots won't start empty.

    Notes:
        Containts the following columns:
        - timestamp: a time column starting from the date deephaven.io was registered
        - sym: a string representing a fictional stock symbol
        - exchange: a string representing a fictional stock exchange
        - size: the number of shares in the trade
        - price: the transaction price of the trade
        - dollars: the dollar value of the trade (price * size)
        - side: buy or sell side of the trade
        - SPet500: A comparison to a fictional index
        - index: an incrementing row index
        - random: A random gaussian value using row index as seed

    Args:
        ticking: bool:  (Default value = True)
            If true, the table will tick using a replayer, if
            false the whole table will be returned as a static table.
        hours_of_data: int: (Default value = 1)
            The number of hours of data to return

    Returns:
        A Deephaven Table

    Examples:
        ```
        import deephaven.plot.express as dx
        stocks = dx.data.stocks()
        ```
    """

    base_time = to_j_instant(
        "2018-06-01T08:00:00 ET"
    )  # day deephaven.io was registered
    pd_base_time = to_pd_timestamp(base_time)
    sym_list = ["CAT", "DOG", "FISH", "BIRD", "LIZARD"]
    sym_dict = {v: i for i, v in enumerate(sym_list)}
    sym_weights = [95, 100, 70, 45, 35]
    exchange = ["NYPE", "PETX", "TPET"]
    exchange_weights = [50, 100, 45]
    init_value = 100  # is used inside query string

    ticks_per_second = 10
    size_in_seconds: int = hours_of_data * 60 * 60 * ticks_per_second

    # base time is 8am, start at 9am so there's already data showing and tick until 5pm
    start_time = pd_base_time + pd.Timedelta((int)(MINUTE * 5))
    end_time = pd_base_time + pd.Timedelta(size_in_seconds * SECOND)

    def random_gauss(seed: int) -> float:
        random.seed(seed)  # set seed once per row
        return random.gauss(0, 1)

    def random_list_sym(seed: int) -> str:
        return random.choices(sym_list, sym_weights)[0]

    def random_list_exchange(seed: int) -> str:
        return random.choices(exchange, exchange_weights)[0]

    def random_trade_size(rand: int) -> int:
        """
        Random distribution of trade size, approximately mirroring market data
        """
        # cubic
        abs_rand = abs(rand**3)
        # rough model of the distribution of trade sizes in real market data
        # they bucket into human sized trade blocks
        size_dist = random.choices(
            [0, 2, 3, 4, 5, 10, 20, 50, 100, 150, 200, 250, 300, 400, 500, 1000],
            [1000, 30, 25, 20, 15, 5, 5, 20, 180, 5, 15, 5, 8, 7, 8, 2],
        )[0]
        if size_dist == 0:
            size = math.ceil(1000 * abs_rand)
            # round half of the numbers above 1000 to the nearest ten
            return round(size, -1) if (size > 1000 and rand > 0) else size
        else:
            return size_dist

    static_table = (
        empty_table(size_in_seconds)
        .update(
            formulas=[
                "timestamp = base_time + (long)(ii * SECOND / ticks_per_second)",
                # must be first as it sets python seed
                "random_double = (double)random_gauss(i)",  # nicer looking starting seed
                "sym = random_list_sym(i)",
                "exchange = random_list_exchange(i)",
                "side = random_double >= 0 ? `buy` : `sell`",
                "size = random_trade_size(random_double)",
                "sym_index = (int)sym_dict[sym]",
                "index = i",
            ]
        )
        # generate data for price column
        .update_by(
            ops=[
                rolling_sum_tick(
                    cols=["rolling_sum = random_double"], rev_ticks=2000, fwd_ticks=0
                )
            ],
            by=["sym"],
        )
        .update_by(
            ops=[ema_tick(decay_ticks=2, cols=["ema = rolling_sum"])], by=["sym"]
        )
        # generate date for "SPet500" a hypothetical composite index
        .update_by(
            ops=[
                rolling_sum_tick(
                    cols=["rolling_sum_individual = random_double"],
                    rev_ticks=1000,
                    fwd_ticks=0,
                )
            ],
        )
        .update_by(
            ops=[
                ema_tick(
                    decay_ticks=5, cols=["ema_individual = rolling_sum_individual"]
                )
            ]
        )
        # spread the staring values based on symbol and round to 2 decimals
        .update(
            [
                "price = Math.round((ema + init_value + Math.pow(1 + sym_index, 3))*100)/100",
                "SPet500 = ema_individual + init_value + 50",
                "dollars = size * price",
            ]
        )
        # drop intermediary columns, and order the output nicely
        .view(
            [
                "timestamp",
                "sym",
                "exchange",
                "size",
                "price",
                "dollars",
                "side",
                "SPet500",
                "index",
                "random = random_double",
            ]
        )
    )

    if ticking:
        result_replayer = TableReplayer(start_time, end_time)
        replayer_table = result_replayer.add_table(static_table, "timestamp")
        result_replayer.start()
        return replayer_table
    else:
        return static_table
