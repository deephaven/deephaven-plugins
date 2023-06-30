from __future__ import annotations

from deephaven.replay import TableReplayer
from deephaven.time import parse_instant
from deephaven.table import Table
from deephaven import empty_table
from deephaven.time import (
    parse_instant,
    plus_period,
    MINUTE,
    seconds_to_nanos,
)
from deephaven.updateby import rolling_sum_tick, ema_tick
import random, math


def example_data(ticking: bool = True, hours_of_data: int = 1) -> Table:
    """Returns a Deephaven table containing a generated example data set.
    Data is 1 hour of randomly generated (but deterministic) fictional
    stock market data, and starts with the first 5 minutes of data
    already initilized so your example plots won't start empty.

    Contains the following columns:
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

    """

    base_time = parse_instant(
        "2018-06-01T08:00:00 ET"
    )  # day deephaven.io was registered
    sym_list = ["CAT", "DOG", "FISH", "BIRD", "LIZARD"]
    sym_dict = {v: i for i, v in enumerate(sym_list)}
    sym_weights = [95, 100, 70, 45, 35]
    exchange = ["NYPE", "PETX", "TPET"]
    exchange_weights = [50, 100, 45]
    init_value = 100  # is used inside query string

    ticks_per_second = 10
    size_in_seconds: int = hours_of_data * 60 * 60 * ticks_per_second

    # base time is 8am, start at 9am so there's already data showing and tick until 5pm
    start_time = plus_period(base_time, (int)(MINUTE * 5))
    end_time = plus_period(base_time, seconds_to_nanos(size_in_seconds))

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
