from __future__ import annotations

import pandas as pd
import numpy as np
from plotly import express as px
import math
import random
import typing

from deephaven.pandas import to_table
from deephaven.replay import TableReplayer
from deephaven.table import Table
from deephaven import empty_table, time_table, merge
from deephaven.time import (
    to_j_instant,
    to_pd_timestamp,
)
from deephaven.updateby import rolling_sum_tick, ema_tick

SECOND = 1_000_000_000  #: One second in nanoseconds.
MINUTE = 60 * SECOND  #: One minute in nanoseconds.


def _cast_timestamp(time: pd.Timestamp | None) -> pd.Timestamp:
    """
    Casts a pd.Timestamp to be non-None.
    Args:
        time: the timestamp to cast

    Returns:
        the timestamp
    """
    if not time:
        raise ValueError("pd_base_time is None")
    return time


def iris(ticking: bool = True) -> Table:
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
        ticking:
            If true, the table will tick using a replayer starting
            with a third of the table already ticked. If false the
            whole table will be returned as a static table.

    Returns:
        A Deephaven Table

    References:
        - Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems.
          Annals of Eugenics, 7(2), 179-188.

    Examples:
        ```
        from deephaven.plot import express as dx
        iris = dx.data.iris()
        ```
    """
    species_list: list[str] = ["setosa", "versicolor", "virginica"]
    # Give this dataset a timestamp column based on original year from this data
    base_time = to_j_instant("1936-01-01T08:00:00 ET")

    # Load the iris dataset and cast the species column to string
    # group it and get the mean and std of each species
    df = px.data.iris().astype({"species": "string"})
    grouped_df = df.groupby("species")
    species_descriptions = grouped_df.describe()

    df_len = len(df)
    # add index column using pandas, which is faster than an update() call
    df.insert(0, "index", np.ndarray(range(df_len)))

    # Get a random gaussian value based on the mean and std of the existing
    # data, where col is the column name ('sepal_length', etc) and index is the
    # row number used as a random seed so that the data is deterministically generated
    def get_random_value(col: str, index: int, species: str) -> float:
        mean = float(typing.cast(float, species_descriptions[col]["mean"][species]))
        std = float(typing.cast(float, species_descriptions[col]["std"][species]))
        random.seed(index)
        return round(random.gauss(mean, std), 1)

    # Lookup species_id by index and add one as original dataset is not zero indexed
    def get_index(species: str) -> int:
        return species_list.index(species) + 1

    # convert the pandas DataFrame to a Deephaven Table
    source_table = to_table(df)

    if ticking:
        ticking_table = (
            time_table("PT1S")
            .update(
                [
                    # need an index created before the merge, to use it after
                    "index = ii + df_len",
                    # pick a random species from the list, using the index as a seed
                    "species = (String)species_list[(int)new Random(ii).nextInt(3)]",
                    "sepal_length = get_random_value(`sepal_length`, ii, species)",
                    "sepal_width = get_random_value(`sepal_width`, ii, species)",
                    "petal_length = get_random_value(`petal_length`, ii, species)",
                    "petal_width = get_random_value(`petal_width`, ii, species)",
                    "species_id = get_index(species)",
                ]
            )
            .drop_columns("Timestamp")
        )
        t = merge([source_table, ticking_table])
    else:
        t = source_table

    return (
        t.update("timestamp = base_time + (long)(index * SECOND)")
        .move_columns_up("timestamp")
        .drop_columns("index")
    )


def stocks(ticking: bool = True, hours_of_data: int = 1) -> Table:
    """Returns a Deephaven table containing a generated example data set.

    Data is 1 hour of randomly generated (but deterministic) fictional
    stock market data, and starts with the first 5 minutes of data
    already initilized so your example plots won't start empty.

    Notes:
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
        ticking:
            If true, the table will tick using a replayer, if
            false the whole table will be returned as a static table.
        hours_of_data:
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

    pd_base_time = _cast_timestamp(to_pd_timestamp(base_time))

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

    def random_trade_size(rand: float) -> int:
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


def tips(ticking: bool = True) -> Table:
    """
    Returns a ticking version of the Tips dataset.
    One waiter recorded information about each tip he received over a period of
    a few months working in one restaurant. This data was published in 1995.
    This function generates a deterministically random dataset inspired by Tips dataset.
    Notes:
        - The total_bill and tip amounts are generated from a statistical linear model,
        where total_bill is generated from the significant covariates 'smoker' and 'size'
        plus a random noise term, and then tip is generated from total_bill plus a random
        noise term.
    Args:
        ticking:
            If true, a ticking table containing the entire Tips dataset will be returned,
            and new rows of synthetic data will tick in every second. If false, the Tips
            dataset will be returned as a static table.
    Returns:
        A Deephaven Table
    References:
        - Bryant, P. G. and Smith, M (1995) Practical Data Analysis: Case Studies in Business Statistics.
        Homewood, IL: Richard D. Irwin Publishing.
    Examples:
        ```
        from deephaven.plot import express as dx
        tips = dx.data.tips()
        ```
    """
    sex_list: list[str] = ["Male", "Female"]
    smoker_list: list[str] = ["No", "Yes"]
    day_list: list[str] = ["Thur", "Fri", "Sat", "Sun"]
    time_list: list[str] = ["Dinner", "Lunch"]
    size_list: list[int] = [1, 2, 3, 4, 5, 6]

    # explicitly set empirical frequencies for categorical groups
    sex_probs: list[float] = [0.64, 0.36]
    smoker_probs: list[float] = [0.62, 0.38]
    day_probs: list[float] = [0.25, 0.08, 0.36, 0.31]
    time_probs: list[float] = [0.72, 0.28]
    size_probs: list[float] = [0.02, 0.64, 0.15, 0.15, 0.02, 0.02]

    # Load the tips dataset and cast the category columns to strings
    df = px.data.tips().astype(
        {
            "sex": "string",
            "smoker": "string",
            "day": "string",
            "time": "string",
            "size": "int",
        }
    )


    # the following functions use the above category frequencies as well as an independent
    # statistical analysis to generate values for each column in the data frame
    # row number used as a random seed so that the data is deterministically generated
    def generate_sex(index: int) -> str:
        random.seed(index)
        return random.choices(sex_list, weights=sex_probs)[0]

    def generate_smoker(index: int) -> str:
        random.seed(index)
        return random.choices(smoker_list, weights=smoker_probs)[0]

    def generate_day(index: int) -> str:
        random.seed(index)
        return random.choices(day_list, weights=day_probs)[0]

    def generate_time(index: int) -> str:
        random.seed(index)
        return random.choices(time_list, weights=time_probs)[0]

    def generate_size(index: int) -> int:
        random.seed(index)
        return random.choices(size_list, weights=size_probs)[0]

    def generate_total_bill(smoker: str, size: int, index: int) -> float:
        random.seed(index)
        return round(
            3.68
            + 3.08 * (smoker == "Yes")
            + 5.81 * size
            + (random.gauss(3.41, 0.99) ** 2 - 12.63),
            2,
        )

    def generate_tip(total_bill: float, index: int) -> float:
        random.seed(index)
        return max(1, round(0.92 + 0.11 * total_bill + random.gauss(0.0, 1.02), 2))

    # convert the pandas DataFrame to a Deephaven Table
    source_table = to_table(df)

    if ticking:
        ticking_table = (
            time_table("PT1S")
            .update(
                [
                    "sex = generate_sex(ii)",
                    "smoker = generate_smoker(ii)",
                    "day = generate_day(ii)",
                    "time = generate_time(ii)",
                    "size = generate_size(ii)",
                    "total_bill = generate_total_bill(smoker, size, ii)",
                    "tip = generate_tip(total_bill, ii)",
                ]
            )
            .drop_columns("Timestamp")
        )
        return merge([source_table, ticking_table])

    return source_table
