from __future__ import annotations

import pandas as pd
import numpy as np
from plotly import express as px
import math

# Use Random() class as seperate instances to avoid global state issues,
# as Deephaven may evaluate columns in parallel.
from random import Random

import jpy
from typing import Any, cast

from deephaven.pandas import to_table
from deephaven.table import Table
from deephaven import empty_table, time_table, merge
from deephaven.time import (
    to_j_instant,
    to_pd_timestamp,
)
from deephaven.updateby import rolling_sum_tick, ema_tick, cum_max, delta, DeltaControl


SECOND = 1_000_000_000  #: One second in nanoseconds.
MINUTE = 60 * SECOND  #: One minute in nanoseconds.
STARTING_TIME = "2018-06-01T08:00:00 ET"  # day deephaven.io was registered

# Constants for easy access in charts
OUTAGE_LAT = 44.97
OUTAGE_LON = -93.17
FLIGHT_LAT = 50
FLIGHT_LON = -100


# Helper converters to satisfy static type checkers when dealing with pandas/numpy scalars
def _to_py_float(x: Any) -> float:
    return float(x)


def _to_py_int(x: Any) -> int:
    return int(x)


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
        - The initial dataset contains 150 samples and includes the 4 original
          features (sepal length, sepal width, petal length, and petal width),
          along with a timestamp, id and species name.
        - The original Iris species names are included (setosa, versicolor, and virginica).

    Columns:
        - Timestamp (Instant): The timestamp of the observation
        - SepalLength (Double): The length of the sepal in centimeters
        - SepalWidth (Double): The width of the sepal in centimeters
        - PetalLength (Double): The length of the petal in centimeters
        - PetalWidth (Double): The width of the petal in centimeters
        - Species (String): The species of the iris flower
        - SpeciesID (Long): A numerical ID for the species

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table

    References:
        - Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems.
          Annals of Eugenics, 7(2), 179-188.
    """
    species_list: list[str] = ["setosa", "versicolor", "virginica"]
    # Give this dataset a timestamp column based on original year from this data
    base_time = to_j_instant("1936-01-01T08:00:00 ET")
    pd_base_time = _cast_timestamp(to_pd_timestamp(base_time))

    # Load the iris dataset and cast the species column to string, get length for timestamp col creation
    df = px.data.iris().astype({"species": "string"})
    df_len = len(df)

    # rename columns to match Deephaven convention
    df = df.rename(
        columns={
            "sepal_length": "SepalLength",
            "sepal_width": "SepalWidth",
            "petal_length": "PetalLength",
            "petal_width": "PetalWidth",
            "species": "Species",
            "species_id": "SpeciesID",
        }
    )

    # group it and get the mean and std of each species
    grouped_df = df.groupby("Species")
    species_descriptions = grouped_df.describe()

    # Add a timestamp column to the DataFrame
    df["Timestamp"] = pd_base_time + pd.to_timedelta(df.index * SECOND)

    # Get a random gaussian value based on the mean and std of the existing
    # data, where col is the column name ('sepal_length', etc) and index is the
    # row number used as a random seed so that the data is deterministically generated
    def get_random_value(col: str, index: int, species: str) -> float:
        mean = float(cast(float, species_descriptions[col]["mean"][species]))
        std = float(cast(float, species_descriptions[col]["std"][species]))
        return round(Random(index).gauss(mean, std), 1)

    # Lookup species_id by index and add one as original dataset is not zero indexed
    def get_index(species: str) -> int:
        return species_list.index(species) + 1

    # convert the pandas DataFrame to a Deephaven Table
    source_table = to_table(df).move_columns_up("Timestamp")

    if ticking:
        ticking_table = time_table("PT1S").update(
            [
                # make timestamp start after the source table timestamp
                "Timestamp = base_time + (long)((ii + df_len) * SECOND)",
                # pick a random species from the list, using the index as a seed
                "Species = (String)species_list[(int)new Random(ii).nextInt(3)]",
                "SepalLength = get_random_value(`SepalLength`, ii + 1, Species)",
                "SepalWidth = get_random_value(`SepalWidth`, ii + 2, Species)",
                "PetalLength = get_random_value(`PetalLength`, ii + 3, Species)",
                "PetalWidth = get_random_value(`PetalWidth`, ii + 4, Species)",
                "SpeciesID = get_index(Species)",
            ]
        )
        return merge([source_table, ticking_table])

    return source_table


def jobs(ticking: bool = True) -> Table:
    """
    Returns a synthetic dataset containing five different jobs and their durations over time.

    This dataset is intended to be used with a timeline plot. It demonstrates five different "jobs", each starting
    two days after the previous, and each lasting 5 days in total. The job's "resource", or the name of the individual
    assigned to the job, is randomly selected. The dataset continues to loop in this way, moving across time until
    it is deleted or the server is shut down.

    Columns:
        - Job (String): Denoting the name of the job, ranging from Job1 to Job5
        - StartTime (Instant): Containing the start time of the job
        - EndTime (Instant): Containing the end time of the job
        - Resource (String): Indicating the name of the person that the job is assigned to

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table
    """

    def generate_resource(index: int) -> str:
        return Random(index).choice(["Mike", "Matti", "Steve", "John", "Jane"])

    jobs_query_strings = [
        "Job = `Job` + String.valueOf((ii % 5) + 1)",
        "StartTime = '2020-01-01T00:00:00Z' + ('P1d' * i * 2)",
        "EndTime = StartTime + 'P5d'",
        "Resource = generate_resource(ii)",
    ]

    static_jobs = empty_table(5).update(jobs_query_strings)

    if not ticking:
        return static_jobs

    ticking_jobs = merge(
        [
            static_jobs,
            time_table("PT1s")
            .drop_columns("Timestamp")
            .update(jobs_query_strings)
            .update("StartTime = StartTime + 'P10d'"),
        ]
    ).last_by("Job")

    return ticking_jobs


def marketing(ticking: bool = True) -> Table:
    """
    Returns a synthetic ticking dataset tracking the movement of customers from website visit to product purchase.

    This dataset is intended to be used with the `dx.funnel` and `dx.funnel_area` plot types. Each row in this dataset
    represents an individual that has visited a company website. The individual may download an instance of the product,
    be considered a potential customer, formally request the price of the product, or purchase the product and receive
    an invoice. Each of these categories is a strict subset of the last, so it lends itself well to funnel plots.

    Columns:
        - Stage (String): A string column containing the stage of a customers interest:
                 VisitedWebsite, Downloaded, PotentialCustomer, RequestedPrice, and InvoiceSent
        - Count (Long): Column counting the number of customers to fall into each category

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table
    """
    _ColsToRowsTransform = jpy.get_type(
        "io.deephaven.engine.table.impl.util.ColumnsToRowsTransform"
    )

    def weighted_selection(prob: float, index: int) -> bool:
        return Random(index).uniform(0, 1) < prob

    marketing_query_strings = [
        "VisitedWebsite = true",  # appearing in this table assumes a website visit
        "Downloaded = VisitedWebsite ? weighted_selection(0.45, ii) : false",  # 45% of visits download product
        "PotentialCustomer = Downloaded ? weighted_selection(0.77, ii + 1) : false",  # 77% of downloads are potential customers
        "RequestedPrice = PotentialCustomer ? weighted_selection(0.82, ii + 2) : false",  # 82% of flagged potential customers request price
        "InvoiceSent = RequestedPrice ? weighted_selection(0.24, ii + 3) : false",  # 24% of those who requested price get invoice
    ]

    marketing_table = empty_table(100).update(marketing_query_strings)

    if ticking:
        marketing_table = merge(
            [
                marketing_table,
                time_table("PT1s")
                .update(marketing_query_strings)
                .drop_columns("Timestamp"),
            ]
        )

    return Table(
        _ColsToRowsTransform.columnsToRows(
            marketing_table.sum_by().j_table,
            "Stage",
            "Count",
            "VisitedWebsite",
            "Downloaded",
            "PotentialCustomer",
            "RequestedPrice",
            "InvoiceSent",
        )
    )


def stocks(
    ticking: bool = True,
    starting_time: str = STARTING_TIME,
) -> Table:
    """Returns a Deephaven table containing a generated example data set.

    Randomly generated (but deterministic) fictional
    stock market data. Starts with the first 5 minutes of data
    already initialized so example plots won't start empty.

    Columns:
        - Timestamp (Instant): A time column starting from the date deephaven.io was registered
        - Sym (String): A string representing a fictional stock symbol
        - Exchange (String): A string representing a fictional stock exchange
        - Size (Long): The number of shares in the trade
        - Price (Double): The transaction price of the trade
        - Dollars (Double): The dollar value of the trade (price * size)
        - Side (String): Buy or sell side of the trade
        - SPet500 (Double): A comparison to a fictional index
        - Index (Long): An incrementing row index
        - Random (Double): A random gaussian value using row index as seed

    Args:
        ticking:
            If true, the table will tick using a replayer, if
            false the whole table will be returned as a static table.
        starting_time:
            The starting time for the data generation, defaults to 2018-06-01T08:00:00 ET

    Returns:
        A Deephaven Table
    """
    ticks_per_second = 10

    def generate(
        t: Table,
        ticks_per_second: int = ticks_per_second,
        starting_time: str = starting_time,
    ) -> Table:
        base_time = to_j_instant(starting_time)
        pd_base_time = _cast_timestamp(to_pd_timestamp(base_time))

        sym_list = ["CAT", "DOG", "FISH", "BIRD", "LIZARD"]
        sym_dict = {v: i for i, v in enumerate(sym_list)}  # is used inside query string
        sym_weights = [95, 100, 70, 45, 35]
        exchange = ["NYPE", "PETX", "TPET"]
        exchange_weights = [50, 100, 45]
        init_value = 100  # is used inside query string

        def random_gauss(seed: int) -> float:
            return Random(seed).gauss(0, 1)

        def random_list_sym(seed: int) -> str:
            return Random(seed).choices(sym_list, sym_weights)[0]

        def random_list_exchange(seed: int) -> str:
            return Random(seed).choices(exchange, exchange_weights)[0]

        def random_trade_size(rand: float) -> int:
            """
            Random distribution of trade size, approximately mirroring market data
            """
            # cubic
            abs_rand = abs(rand**3)
            # rough model of the distribution of trade sizes in real market data
            # they bucket into human sized trade blocks
            size_dist = Random(rand).choices(
                [0, 2, 3, 4, 5, 10, 20, 50, 100, 150, 200, 250, 300, 400, 500, 1000],
                [1000, 30, 25, 20, 15, 5, 5, 20, 180, 5, 15, 5, 8, 7, 8, 2],
            )[0]
            if size_dist == 0:
                size = math.ceil(1000 * abs_rand)
                # round half of the numbers above 1000 to the nearest ten
                return round(size, -1) if (size > 1000 and rand > 0) else size
            else:
                return size_dist

        return (
            t.update(
                formulas=[
                    "Timestamp = base_time + (long)(Index * SECOND / ticks_per_second)",
                    "RandomDouble = (double)random_gauss(Index + 99999)",  # nicer looking starting seed
                    "Sym = random_list_sym(Index)",
                    "Exchange = random_list_exchange(Index)",
                    "Side = RandomDouble >= 0 ? `buy` : `sell`",
                    "Size = random_trade_size(RandomDouble)",
                    "SymIndex = (int)sym_dict[Sym]",
                ]
            )
            # generate data for price column
            .update_by(
                ops=[
                    rolling_sum_tick(
                        cols=["RollingSum = RandomDouble"], rev_ticks=800, fwd_ticks=0
                    )
                ],
                by=["Sym"],
            )
            .update_by(
                ops=[ema_tick(decay_ticks=10, cols=["Ema = RollingSum"])], by=["Sym"]
            )
            # generate date for "SPet500" a hypothetical composite index
            .update_by(
                ops=[
                    rolling_sum_tick(
                        cols=["RollingSumIndividual = RandomDouble"],
                        rev_ticks=1000,
                        fwd_ticks=0,
                    )
                ],
            )
            .update_by(
                ops=[
                    ema_tick(
                        decay_ticks=5, cols=["EmaIndividual = RollingSumIndividual"]
                    )
                ]
            )
            # spread the staring values based on symbol and round to 2 decimals
            .update(
                [
                    "Price = Math.round((Ema + init_value + Math.pow(1 + SymIndex, 3))*100)/100",
                    "SPet500 = EmaIndividual + init_value + 50",
                    "Dollars = Size * Price",
                ]
            )
            # drop intermediary columns, and order the output nicely
            .view(
                [
                    "Timestamp",
                    "Sym",
                    "Exchange",
                    "Size",
                    "Price",
                    "Dollars",
                    "Side",
                    "SPet500",
                    "Index",
                    "Random = RandomDouble",
                ]
            )
        )

    if ticking:
        return generate(
            merge(
                [
                    empty_table(60 * 5 * ticks_per_second).update("Index = ii"),
                    time_table("PT0.1S")
                    .update("Index = ii + 60 * 5 * ticks_per_second")
                    .drop_columns("Timestamp"),
                ]
            )
        )
    else:
        return generate(empty_table(60 * 60 * ticks_per_second).update("Index = ii"))


def tips(ticking: bool = True) -> Table:
    """
    Returns a ticking version of the Tips dataset.
    One waiter recorded information about each tip he received over a period of
    a few months working in one restaurant. This data was published in 1995.
    This function generates a deterministically random dataset inspired by Tips dataset.

    Notes:
        The total_bill and tip amounts are generated from a statistical linear model,
        where total_bill is generated from the significant covariates 'smoker' and 'size'
        plus a random noise term, and then tip is generated from total_bill plus a random
        noise term.

    Columns:
        - TotalBill (Double): The total bill amount for the table
        - Tip (Double): The tip amount for the table
        - Sex (String): The sex of the individual who paid the bill
        - Smoker (String): Whether the individual was a smoker or not
        - Day (String): The day of the week the bill was paid
        - Time (String): The time of day the bill was paid
        - Size (Long): The size of the party at the table

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
    """
    # load the tips dataset, cast the category columns to strings, convert to Deephaven table
    tips_df = px.data.tips().astype(
        {
            "sex": "string",
            "smoker": "string",
            "day": "string",
            "time": "string",
            "size": "int",
        }
    )

    # convert columns to PascalCase by Deephaven convention
    tips_df = tips_df.rename(
        columns={
            "total_bill": "TotalBill",
            "tip": "Tip",
            "sex": "Sex",
            "smoker": "Smoker",
            "day": "Day",
            "time": "Time",
            "size": "Size",
        }
    )

    tips_table = to_table(tips_df)

    if not ticking:
        return tips_table

    # constants that will be used for data generation
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

    # the following functions use the above category frequencies as well as an independent
    # statistical analysis to generate values for each column in the data frame
    # row number used as a random seed so that the data is deterministically generated
    def generate_sex(index: int) -> str:
        return Random(index).choices(sex_list, weights=sex_probs)[0]

    def generate_smoker(index: int) -> str:
        return Random(index + 1).choices(smoker_list, weights=smoker_probs)[0]

    def generate_day(index: int) -> str:
        return Random(index + 2).choices(day_list, weights=day_probs)[0]

    def generate_time(index: int) -> str:
        return Random(index + 3).choices(time_list, weights=time_probs)[0]

    def generate_size(index: int) -> int:
        return Random(index + 4).choices(size_list, weights=size_probs)[0]

    def generate_total_bill(smoker: str, size: int, index: int) -> float:
        return round(
            3.68
            + 3.08 * (smoker == "Yes")
            + 5.81 * size
            + (Random(index + 5).gauss(3.41, 0.99) ** 2 - 12.63),
            2,
        )

    def generate_tip(total_bill: float, index: int) -> float:
        return max(
            1, round(0.92 + 0.11 * total_bill + Random(index + 6).gauss(0.0, 1.02), 2)
        )

    # create synthetic ticking version of the tips dataset that generates one new observation per period
    ticking_table = (
        time_table("PT1S")
        .update(
            [
                "Sex = generate_sex(ii)",
                "Smoker = generate_smoker(ii)",
                "Day = generate_day(ii)",
                "Time = generate_time(ii)",
                "Size = generate_size(ii)",
                "TotalBill = generate_total_bill(Smoker, Size, ii)",
                "Tip = generate_tip(TotalBill, ii)",
            ]
        )
        .drop_columns("Timestamp")
    )

    # combine new synthetic data with real static dataset and return as one
    return merge([tips_table, ticking_table])


def election(ticking: bool = True) -> Table:
    """
    Returns a ticking version of the Election dataset included in the plotly-express package.

    When this function is called, it will return a table containing the first 19 rows of the dataset.
    Then, a new row will tick in each second, until all 58 rows are included in the table. The table will
    then reset to the first 19 rows, and continue ticking in this manner until it is deleted or otherwise cleaned up.

    Columns:
        - District (String): The name of the district that the votes were cast in
        - Coderre (Long): The number of votes that the candidate Coderre received in the district
        - Bergeron (Long): The number of votes that the candidate Bergeron received in the district
        - Joly (Long): The number of votes that the candidate Joly received in the district
        - Total (Long): The total number of votes cast in the district
        - Winner (String): The name of the winning candidate for that district
        - Result (String): Whether the victory was by majority or plurality
        - DistrictID (Long): A numerical ID for the district

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table
    """
    # read in election data, cast types appropriately, convert to Deephaven table
    election_df = px.data.election().astype(
        {"district": "string", "winner": "string", "result": "string"}
    )

    # convert column names to PascalCase per Deephaven convention
    election_df = election_df.rename(
        columns={
            "district": "District",
            "total": "Total",
            "winner": "Winner",
            "result": "Result",
            "district_id": "DistrictID",
        }
    )

    election_table = to_table(election_df)

    if not ticking:
        return election_table

    # functions to get correctly-typed values out of columns by index
    def get_str_val(column: str, index: int) -> str:
        return str(election_df.loc[index, column])

    def get_long_val(column: str, index: int) -> int:
        # Convert to a numeric scalar and cast directly to int. This works for
        # Python numbers and NumPy/Pandas scalar types without needing `.item()`.
        return _to_py_int(election_df.loc[index, column])

    TOTAL_ROWS = len(election_df)
    STATIC_ROWS = math.floor(TOTAL_ROWS * 0.33)
    TICKING_ROWS = TOTAL_ROWS - STATIC_ROWS

    # create ticking table
    ticking_table = (
        time_table("PT1S")
        .update_view(
            [
                "iteration_num = (long)floor(ii / TICKING_ROWS) + 1",
                "idx = iteration_num * STATIC_ROWS + ii",
                "mod_idx = idx % TOTAL_ROWS",
            ]
        )
        .last_by("mod_idx")
        .update_by(cum_max("max_iteration = iteration_num"))
        .where("iteration_num == max_iteration")
        .drop_columns(["Timestamp", "iteration_num", "idx", "max_iteration"])
        .update_view(
            [
                "District = get_str_val(`District`, mod_idx)",
                "Coderre = get_long_val(`Coderre`, mod_idx)",
                "Bergeron = get_long_val(`Bergeron`, mod_idx)",
                "Joly = get_long_val(`Joly`, mod_idx)",
                "Total = get_long_val(`Total`, mod_idx)",
                "Winner = get_str_val(`Winner`, mod_idx)",
                "Result = get_str_val(`Result`, mod_idx)",
                "DistrictID = get_long_val(`DistrictID`, mod_idx)",
            ]
        )
        .drop_columns("mod_idx")
    )

    # combine initial static table and looping ticking table into one
    return merge([election_table.head(STATIC_ROWS - 1), ticking_table])


def wind(ticking: bool = True) -> Table:
    """
    Returns a ticking version of the Wind dataset included in the plotly-express package.

    When this function is called, it will return a table containing the first 42 rows of the dataset.
    Then, a new row will tick in each second, until all 128 rows are included in the table. The table will
    then reset to the first 42 rows, and continue ticking in this manner until it is deleted or otherwise cleaned up.

    Columns:
        - Direction (String): The direction of the wind gust
        - Strength (String): A string indicating the strength of the wind gust, from 0-1 to 6+
        - Frequency (double): The frequency of each gust strength in each direction

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table
    """
    wind_df = px.data.wind().astype({"direction": "string", "strength": "string"})

    # convert column names to PascalCase by Deephaven convention
    wind_df = wind_df.rename(
        columns={
            "direction": "Direction",
            "strength": "Strength",
            "frequency": "Frequency",
        }
    )

    wind_table = to_table(wind_df)

    if not ticking:
        return wind_table

    # functions to get correctly-typed values out of columns by index
    def get_str_val(column: str, index: int) -> str:
        return str(wind_df.loc[index, column])

    def get_float_val(column: str, index: int) -> float:
        return _to_py_float(wind_df.loc[index, column])

    TOTAL_ROWS = len(wind_df)
    STATIC_ROWS = math.floor(TOTAL_ROWS * 0.33)
    TICKING_ROWS = TOTAL_ROWS - STATIC_ROWS

    # create ticking table
    ticking_table = (
        time_table("PT1S")
        .update_view(
            [
                "iteration_num = (long)floor(ii / TICKING_ROWS) + 1",
                "idx = iteration_num * STATIC_ROWS + ii",
                "mod_idx = idx % TOTAL_ROWS",
            ]
        )
        .last_by("mod_idx")
        .update_by(cum_max("max_iteration = iteration_num"))
        .where("iteration_num == max_iteration")
        .drop_columns(["Timestamp", "iteration_num", "idx", "max_iteration"])
        .update_view(
            [
                "Direction = get_str_val(`Direction`, mod_idx)",
                "Strength = get_str_val(`Strength`, mod_idx)",
                "Frequency = get_float_val(`Frequency`, mod_idx)",
            ]
        )
        .drop_columns("mod_idx")
    )

    # combine initial static table and looping ticking table into one
    return merge([wind_table.head(STATIC_ROWS - 1), ticking_table])


def gapminder(ticking: bool = True) -> Table:
    """
    Returns a ticking version of the Gapminder world statistics dataset.

    The original Gapminder dataset from the plotly-express package has a single measurement per country once every five
    years, starting in 1952 and ending in 2007. This resolution is not ideal for ticking data. So, this ticking version
    creates new data points for every country at every month between measurements. For example, between two real
    observations in 1952 and 1957, there are 12 * 5 - 1 synthetic observations for population, life expectancy, and GDP.
    The synthetic data are simply computed by linear interpolation of the two nearest real observations. Finally, the
    dataset ticks in one new month every second, and every country in the dataset gets updated each time, so a total of
    142 rows tick in per second. The dataset starts with years up to 1961, ticks in each month till 2007, and then
    repeats until the table is cleaned up or deleted.

    Columns:
        - Country (String): Name of the country
        - Continent (String): Name of the continent the country belongs to
        - Year (Long): Year of the measurement
        - Month (Long): Month (1-12) of the measurement
        - LifeExp (Double): Average life expectancy
        - Pop (Long): Population total
        - GdpPerCap (Double): Per-capita GDP

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table

    References:
        - https://www.gapminder.org/data/
    """
    # create dict to rename columns in advance, since it is needed twice
    col_renaming_dict = {
        "country": "Country",
        "continent": "Continent",
        "year": "Year",
        "lifeExp": "LifeExp",
        "pop": "Pop",
        "gdpPercap": "GdpPerCap",
    }

    # static and ticking cases are treated differently due to different types needed for pandas manipulation
    if not ticking:
        gapminder_df = (  # type: ignore
            px.data.gapminder()
            .astype(
                {
                    "country": "string",
                    "continent": "string",
                    "year": "int",
                    "lifeExp": "float",
                    "pop": "int",
                    "gdpPercap": "float",
                }
            )
            .drop(["iso_alpha", "iso_num"], axis=1)
            .rename(columns=col_renaming_dict)
        )

        return to_table(cast(pd.DataFrame, gapminder_df))

    gapminder_df = (  # type: ignore
        px.data.gapminder()
        .astype(
            {
                "country": "string",
                "continent": "string",
                "year": "object",
                "lifeExp": "object",
                "pop": "object",
                "gdpPercap": "object",
            }
        )
        .drop(["iso_alpha", "iso_num"], axis=1)
        .rename(columns=col_renaming_dict)
    )

    ### First, we're going to construct the expanded, interpolated dataset

    # functions for producing lists to expand original dataset
    def create_months(reps: int) -> list[list[int]]:
        months = [month for month in range(1, 13)]
        return [months for _ in range(reps)]

    def create_years(year: int, reps: int) -> list[int]:
        return [year + i for i in range(reps)]

    def create_empty(val: Any, reps: int) -> list[Any]:
        return [val, *[np.nan for _ in range(reps - 1)]]

    # split gapminder into pre-2007 and 2007, since 2007 need not be expanded in the same way as previous years
    gapminder_no_2007 = cast(pd.DataFrame, gapminder_df[gapminder_df["Year"] != 2007])
    gapminder_2007 = cast(pd.DataFrame, gapminder_df[gapminder_df["Year"] == 2007])

    # expand pre-2007 dataset into consecutive years, where each new year gets filled with np.nan
    gapminder_no_2007.loc[:, ["Year"]] = gapminder_no_2007["Year"].apply(
        lambda x: create_years(x, 5)
    )
    for col in ["LifeExp", "Pop", "GdpPerCap"]:
        gapminder_no_2007.loc[:, [col]] = gapminder_no_2007[col].apply(
            lambda x: create_empty(x, 5)
        )
    gapminder_no_2007 = gapminder_no_2007.explode(
        column=["Year", "LifeExp", "Pop", "GdpPerCap"]
    )

    # insert month column, where each element is a list of all 12 months
    gapminder_no_2007.insert(
        loc=3,
        column="Month",
        value=cast(
            pd.Series,
            create_months(len(gapminder_no_2007)),
        ),
    )

    # expand pre-2007 dataset into consecutive months
    for col in ["LifeExp", "Pop", "GdpPerCap"]:
        gapminder_no_2007.loc[:, [col]] = gapminder_no_2007[col].apply(
            lambda x: create_empty(x, 12)
        )
    gapminder_no_2007 = gapminder_no_2007.explode(
        column=["Month", "LifeExp", "Pop", "GdpPerCap"]
    )

    # insert a month column into the 2007 dataset to merge the two easily
    gapminder_2007.insert(
        loc=3,
        column="Month",
        value=cast(pd.Series, [1 for _ in range(len(gapminder_2007))]),
    )

    # combine expanded pre-2007 dataset with 2007 dataset, sort by country and year
    gapminder_combined = (
        pd.concat([gapminder_no_2007, gapminder_2007])
        .sort_values(by=["Country", "Year"])
        .reset_index(drop=True)
    )

    # define types of new combined dataset
    gapminder_combined = gapminder_combined.astype(
        {
            "Year": "int",
            "Month": "int",
            "LifeExp": "float",
            "Pop": "float",
            "GdpPerCap": "float",
        }
    )

    # compute linearly interpolated values for each month, round population
    gapminder_interp_vals = cast(
        pd.DataFrame,
        (
            gapminder_combined.groupby("Country", observed=True, as_index=True)[
                ["LifeExp", "Pop", "GdpPerCap"]
            ]
            .apply(lambda country: country.interpolate(method="linear"))
            .reset_index(drop=True)
        ),
    )
    gapminder_interp_vals.loc[:, "Pop"] = gapminder_interp_vals["Pop"].apply(round)

    # create new expanded dataset with interpolated values filled in
    gapminder_interp = gapminder_combined
    gapminder_interp.loc[:, ["LifeExp", "Pop", "GdpPerCap"]] = gapminder_interp_vals

    # drop 2007, since we will not use that single point in the ticking version
    gapminder_interp = gapminder_interp[gapminder_interp["Year"] != 2007]

    # final processing before ticking - convert population to int, sort, reset index
    gapminder_interp = (
        gapminder_interp.astype({"Pop": "int"})
        .sort_values(by=["Year", "Month", "Country"])  # type: ignore
        .reset_index(drop=True)
    )

    ### Now, use Deephaven to create a ticking version of the dataset

    # create Java arrays of countries and continents - assumed constant, so compute once
    j_countries = jpy.array("java.lang.String", list(gapminder_2007["Country"]))
    j_continents = jpy.array("java.lang.String", list(gapminder_2007["Continent"]))
    j_counter = jpy.array("long", [i for i in range(142)])

    def get_life_expectancy(index: int) -> float:
        return _to_py_float(gapminder_interp.loc[index, "LifeExp"])

    def get_population(index: int) -> int:
        return _to_py_int(gapminder_interp.loc[index, "Pop"])

    def get_gdp_per_cap(index: int) -> float:
        return _to_py_float(gapminder_interp.loc[index, "GdpPerCap"])

    TOTAL_YEARS = 55
    STATIC_YEARS = 9
    TICKING_YEARS = TOTAL_YEARS - STATIC_YEARS

    TOTAL_MONTHS = TOTAL_YEARS * 12
    STATIC_MONTHS = STATIC_YEARS * 12
    TICKING_MONTHS = TOTAL_MONTHS - STATIC_MONTHS

    TOTAL_ROWS = TOTAL_MONTHS * 142
    STATIC_ROWS = STATIC_MONTHS * 142
    TICKING_ROWS = TOTAL_ROWS - STATIC_ROWS

    # create ticking version of interpolated dataset
    # query requires some complex steps due to looping, and ticking in all countries at once
    ticking_table = (
        time_table("PT1S")
        .update_view(
            [
                "iteration_num = (long)floor(ii / TICKING_MONTHS) + 1",
                "idx = iteration_num * STATIC_ROWS + ii + (ii * 141)",
                "mod_idx = idx % TOTAL_ROWS",
                "Year = 1961 + (long)floor((ii % TICKING_MONTHS) / 12)",
                "Month = (ii % 12) + 1",
            ]
        )
        .last_by(["Year", "Month"])
        .update_by(cum_max("max_iteration = iteration_num"))
        .where("iteration_num == max_iteration")
        .drop_columns(["Timestamp", "iteration_num", "idx", "max_iteration"])
        .update_view(
            ["counter = j_counter", "Country = j_countries", "Continent = j_continents"]
        )
        .ungroup(["Country", "Continent", "counter"])
        .update_view("mod_idx = mod_idx + counter")
        .update(
            [
                "LifeExp = get_life_expectancy(mod_idx)",
                "Pop = get_population(mod_idx)",
                "GdpPerCap = get_gdp_per_cap(mod_idx)",
            ]
        )
        .drop_columns(["mod_idx", "counter"])
        .view(["Country", "Continent", "Year", "Month", "LifeExp", "Pop", "GdpPerCap"])
    )

    return merge(
        [
            to_table(
                cast(pd.DataFrame, gapminder_interp[gapminder_interp["Year"] <= 1960])
            ),
            ticking_table,
        ]
    )


def fish_market(ticking: bool = True) -> Table:
    """
    Returns a fish market sales dataset designed for pivot table examples. Ticks every second,
    is random but deterministic, and contains lots of categorical data for pivoting.

    Columns:
        - SaleID (Int): Index of sale
        - Revenue (Double): Revenue generated from the sale
        - WeightKg (Double): Weight of the fish sold (in kg)
        - PricePerKg (Double): Price per kg of the fish
        - MarketPriceDiff (Double): Difference between market price and sale price
        - HandlingFee (Double): Handling fee for the sale
        - ProductName (String): Name of the fish product
        - ProductType (String): Type of the fish product
        - ProductForm (String): Form of the fish product
        - FishingGround (String): Fishing ground where the fish was caught
        - LandingCountry (String): Country where the fish was landed
        - LandingPort (String): Port where the fish was landed
        - CatchDate (Instant): Date when the fish was caught
        - SaleDate (Instant): Date when the fish was sold
        - VesselName (String): Name of the fishing vessel
        - CustomerName (String): Name of the customer
        - CustomerType (String): Type of customer (e.g., Retail, Wholesale)
        - TransportMethod (String): Method of transport used for the sale

    Args:
        ticking: When true, one new transaction will tick in every second. When false, returns 1000 rows.

    Returns:
        A Deephaven Table suitable for pivot table demonstrations.
    """

    base_rows = 1000

    def generate(t: Table, base_rows: int = base_rows) -> Table:
        base_time = to_j_instant(STARTING_TIME)  # used in query strings

        # Reference data
        species_list = [
            "Atlantic Salmon",
            "Bluefin Tuna",
            "Haddock",
            "Cod",
            "Halibut",
            "Mackerel",
            "Scallops",
            "Lobster",
        ]

        species_to_type = {
            "Atlantic Salmon": "Pelagic",
            "Bluefin Tuna": "Pelagic",
            "Mackerel": "Pelagic",
            "Haddock": "Groundfish",
            "Cod": "Groundfish",
            "Halibut": "Groundfish",
            "Scallops": "Shellfish",
            "Lobster": "Shellfish",
        }

        product_forms = ["Whole", "Fillet", "Steaks", "Frozen"]

        fishing_grounds = [
            "North Atlantic",
            "Pacific",
            "Gulf of Mexico",
            "Bering Sea",
        ]

        species_to_grounds = {
            "Atlantic Salmon": ["North Atlantic"],
            "Bluefin Tuna": ["Pacific", "Gulf of Mexico", "North Atlantic"],
            "Haddock": ["North Atlantic"],
            "Cod": ["North Atlantic", "Bering Sea"],
            "Halibut": ["Pacific", "Bering Sea"],
            "Mackerel": ["North Atlantic", "Pacific"],
            "Scallops": ["North Atlantic"],
            "Lobster": ["North Atlantic"],
        }

        ports_by_ground = {
            "North Atlantic": [
                "Boston, MA",
                "Halifax, NS",
                "Reykjavik",
                "Bergen",
                "St. John's, NL",
            ],
            "Pacific": [
                "Seattle, WA",
                "Vancouver, BC",
                "Shimizu",
                "Prince Rupert, BC",
                "Hachinohe",
            ],
            "Gulf of Mexico": [
                "New Orleans, LA",
                "Tampa, FL",
                "Houston, TX",
                "Miami, FL",
            ],
            "Bering Sea": [
                "Dutch Harbor, AK",
            ],
        }

        # Map each port to its country
        port_to_country = {
            # North Atlantic
            "Boston, MA": "United States",
            "Halifax, NS": "Canada",
            "Reykjavik": "Iceland",
            "Bergen": "Norway",
            "St. John's, NL": "Canada",
            # Pacific
            "Seattle, WA": "United States",
            "Vancouver, BC": "Canada",
            "Shimizu": "Japan",
            "Prince Rupert, BC": "Canada",
            "Hachinohe": "Japan",
            # Gulf of Mexico
            "New Orleans, LA": "United States",
            "Tampa, FL": "United States",
            "Houston, TX": "United States",
            "Miami, FL": "United States",
            # Bering Sea
            "Dutch Harbor, AK": "United States",
        }

        vessels = [
            "Sea Breeze",
            "Northern Star",
            "Ocean Voyager",
            "Blue Horizon",
            "Arctic Dawn",
            "Pacific Spirit",
            "Atlantic Queen",
            "Golden Net",
            "Wave Runner",
            "Silver Fin",
        ]

        customer_to_type = {
            "Ocean's Best Restaurant": "Restaurant",
            "Bluewater Bistro": "Restaurant",
            "Coastal Grill": "Restaurant",
            "Seafood City Market": "Retail",
            "FreshFish Direct": "Retail",
            "Market on 5th": "Retail",
            "Harbor Wholesale Co.": "Wholesale",
            "Mariner Foods": "Wholesale",
            "Global Seafood Traders": "Wholesale",
            "Sunrise Supermarket": "Retail",
            "Gourmet Fish Shop": "Retail",
            "Fisherman's Wharf": "Retail",
            "Ocean's Catch": "Retail",
        }

        # Species price and weight profiles (low, high, mode) for triangular distribution
        price_profiles = {
            "Atlantic Salmon": (14.0, 20.0, 16.0),
            "Bluefin Tuna": (22.0, 40.0, 28.0),
            "Haddock": (6.0, 12.0, 9.0),
            "Cod": (7.0, 14.0, 10.0),
            "Halibut": (16.0, 30.0, 22.0),
            "Mackerel": (3.0, 6.0, 4.5),
            "Scallops": (20.0, 38.0, 28.0),
            "Lobster": (12.0, 25.0, 18.0),
        }
        weight_profiles = {
            "Atlantic Salmon": (20.0, 400.0, 120.0),
            "Bluefin Tuna": (50.0, 800.0, 200.0),
            "Haddock": (5.0, 150.0, 40.0),
            "Cod": (5.0, 200.0, 50.0),
            "Halibut": (10.0, 300.0, 80.0),
            "Mackerel": (10.0, 400.0, 100.0),
            "Scallops": (10.0, 250.0, 70.0),
            "Lobster": (5.0, 120.0, 40.0),
        }

        def choose_species(index: int) -> str:
            weights = [12, 6, 10, 10, 7, 11, 8, 6]  # some variety
            return Random(index).choices(species_list, weights=weights)[0]

        def species_type(species: str) -> str:
            return species_to_type.get(species, "Unknown")

        def choose_form(index: int, species: str) -> str:
            # Form preferences by species (e.g., Lobster more often Whole or Frozen)
            if species == "Lobster":
                weights = [7, 0, 0, 3]  # Whole, Fillet, Steaks, Frozen
            elif species == "Scallops":
                weights = [2, 0, 0, 6]
            elif species in ("Bluefin Tuna", "Halibut"):
                weights = [2, 4, 3, 1]
            else:
                weights = [3, 5, 2, 2]
            return Random(index + 1).choices(product_forms, weights=weights)[0]

        def choose_ground(index: int, species: str) -> str:
            valid_grounds = species_to_grounds.get(species, fishing_grounds)
            weights = [35, 30, 12, 15, 8]
            return Random(index + 2).choices(
                valid_grounds, weights=weights[: len(valid_grounds)]
            )[0]

        # Update choose_port to select by ground only
        def choose_port(ground: str, index: int) -> str:
            return Random(index + 4).choices(
                ports_by_ground.get(ground, ["Boston, MA"])
            )[0]

        def choose_country(port: str) -> str:
            # Select country based on port
            return port_to_country.get(port, "United States")

        def choose_vessel(index: int, ground: str) -> str:
            return Random(index + 5).choices(vessels)[0]

        def choose_customer(index: int) -> str:
            options = list(customer_to_type.keys())
            weights = [10, 9, 7, 8, 9, 7, 8, 6, 5, 3, 4, 5, 2]
            return Random(index + 6).choices(options, weights=weights)[0]

        def customer_type(name: str) -> str:
            return customer_to_type.get(name, "Retail")

        def choose_transport(
            index: int,
            product_form: str,
            landing_country: str,
            ground: str,
            species: str,
        ) -> str:
            # Air more likely for premium/fresh product or long-distance exports
            air_bias = 0
            if product_form in ("Fillet", "Steaks"):
                air_bias += 20
            if landing_country in ("Japan", "Iceland", "Norway"):
                air_bias += 20
            if species in ("Bluefin Tuna", "Scallops"):
                air_bias += 15
            air_weight = max(10, min(70, 20 + air_bias))
            truck_weight = 100 - air_weight
            return Random(index + 7).choices(
                ["Air Freight", "Refrigerated Truck"],
                weights=[air_weight, truck_weight],
            )[0]

        def gen_weight(species: str, product_form: str, index: int) -> float:
            low, high, mode = weight_profiles[species]
            w = Random(index + 8).triangular(low, high, mode)
            form_mult = {"Whole": 1.0, "Fillet": 0.6, "Steaks": 0.7, "Frozen": 0.8}.get(
                product_form, 1.0
            )
            return max(1.0, w * form_mult)

        def gen_price(species: str, product_form: str, index: int) -> float:
            low, high, mode = price_profiles[species]
            p = Random(index + 9).triangular(low, high, mode)
            form_mult = {"Whole": 1.0, "Fillet": 1.3, "Steaks": 1.2, "Frozen": 0.9}.get(
                product_form, 1.0
            )
            # Add small noise
            noise = Random(index + 10).gauss(0.0, 0.5)
            return max(1.0, p * form_mult + noise)

        def compute_handling_fee(
            revenue: float, transport_method: str, product_form: str, index: int
        ) -> float:
            base_pct = Random(index + 11).uniform(0.02, 0.06)
            if transport_method == "Air Freight":
                base_pct += 0.02
            if product_form == "Frozen":
                base_pct += 0.005
            return revenue * base_pct

        def gen_sale_delay(
            transport_method: str, product_form: str, weight: float, index: int
        ) -> int:
            if transport_method == "Air Freight":
                base = Random(index + 12).randint(1, 3)
            else:
                base = Random(index + 12).randint(2, 12)
            # Heavier shipments tend to take a bit longer
            heavy_adj = 0
            if weight > 300:
                heavy_adj = 2
            elif weight > 150:
                heavy_adj = 1
            return max(0, base + heavy_adj)

        return (
            t.update(
                [
                    # Dimensional attributes first
                    "ProductName = (String)choose_species(Index)",
                    "ProductType = (String)species_type(ProductName)",
                    "ProductForm = (String)choose_form(Index, ProductName)",
                    "FishingGround = (String)choose_ground(Index, ProductName)",
                    "LandingPort = (String)choose_port(FishingGround, Index)",
                    "LandingCountry = (String)choose_country(LandingPort)",
                    "VesselName = (String)choose_vessel(Index, FishingGround)",
                    "CustomerName = (String)choose_customer(Index)",
                    "CustomerType = (String)customer_type(CustomerName)",
                    # Measures
                    "WeightKg = Math.round((double)gen_weight(ProductName, ProductForm, Index) * 10.0 ) / 10.0",
                    "PricePerKg = Math.round((double)gen_price(ProductName, ProductForm, Index) * 100.0) / 100.0",
                    "Revenue = Math.round((PricePerKg * WeightKg) * 100.0) / 100.0",
                    # Logistics
                    "TransportMethod = (String)choose_transport(Index, ProductForm, LandingCountry, FishingGround, ProductName)",
                    "HandlingFee = Math.round((double)compute_handling_fee(Revenue, TransportMethod, ProductForm, Index) * 100.0) / 100.0",
                    # Dates
                    "SaleDate = base_time + (long)((Index + base_rows) * SECOND)",
                    "SaleDelayDays = (int)gen_sale_delay(TransportMethod, ProductForm, WeightKg, Index)",
                    "CatchDate = SaleDate - (long)(SaleDelayDays * DAY)",
                    # Identifier
                    "SaleID = (int)(Index + 1)",
                ]
            )
            .update_by(
                ops=[
                    delta(
                        cols="MarketPriceDiff = PricePerKg",
                        delta_control=DeltaControl.ZERO_DOMINATES,
                    )
                ],
                by="ProductName",
            )
            .drop_columns(
                [
                    "SaleDelayDays",
                    "Index",
                ]
            )
            .view(
                [
                    "SaleID",
                    "Revenue",
                    "WeightKg",
                    "PricePerKg",
                    "MarketPriceDiff",
                    "HandlingFee",
                    "ProductType",
                    "ProductName",
                    "ProductForm",
                    "FishingGround",
                    "LandingCountry",
                    "LandingPort",
                    "VesselName",
                    "CatchDate",
                    "SaleDate",
                    "CustomerType",
                    "CustomerName",
                    "TransportMethod",
                ]
            )
        )

    if ticking:
        return generate(
            merge(
                [
                    empty_table(base_rows).update("Index = ii"),
                    time_table("PT1S")
                    .update(f"Index = ii + {base_rows}")
                    .drop_columns("Timestamp"),
                ]
            )
        )
    else:
        return generate(empty_table(base_rows).update("Index = ii"))


def outages(ticking: bool = True) -> Table:
    """
    Returns a synthetic dataset of service outage locations.

    This dataset generates latitude and longitude coordinates using a mixture of distributions
    to simulate outage density patterns across a metropolitan region. The coordinates are sampled
    from three overlapping regions: two Gaussian distributions centered on urban cores with higher
    population density, and a uniform distribution covering the broader surrounding area.
    The mixture weights emphasize the urban centers while still providing coverage of suburban areas.

    Notes:
        - The default configuration simulates the Minneapolis-St. Paul metro area
        - Urban center 1 (Minneapolis): centered at (44.9778, -93.2650)
        - Urban center 2 (St. Paul): centered at (44.9537, -93.0900)
        - Broader metro area: bounding box
        - All coordinates are deterministically generated using the row index as a random seed

    Columns:
        - Timestamp (Instant): Timestamp of the outage event
        - Lat (Double): Latitude coordinate of the outage location
        - Lon (Double): Longitude coordinate of the outage location
        - Severity (Int): Severity level of the outage from 1 (least severe) to 4 (most severe)

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table containing outage location coordinates
    """
    base_rows = 100

    # Configuration for geographic distribution of outages
    # Default values simulate the Minneapolis-St. Paul metro area
    # Weights determine relative sampling frequency from each distribution
    config: dict[str, Any] = {
        "weights": [6, 3, 2],
        "distributions": [
            {
                # Urban center 1 (Minneapolis downtown)
                "distribution": "gauss",
                "lat_center": 44.9778,
                "lon_center": -93.2650,
                "lat_sd": 0.0316,
                "lon_sd": 0.0229,
            },
            {
                # Urban center 2 (St. Paul downtown)
                "distribution": "gauss",
                "lat_center": 44.9537,
                "lon_center": -93.0900,
                "lat_sd": 0.0108,
                "lon_sd": 0.0491,
            },
            {
                # Broader central metro bounding box
                "distribution": "uniform",
                "lat_north": 45.130,
                "lat_south": 44.790,
                "lon_west": -93.410,
                "lon_east": -92.880,
            },
        ],
    }

    def sample_distribution_index(index: int) -> int:
        """Select which distribution to sample from based on configured weights."""
        return Random(index).choices([0, 1, 2], config["weights"])[0]

    def generate_lat(dist_index: int, index: int) -> float:
        """Generate a latitude coordinate based on the selected distribution."""
        rand = Random(index * 2)  # Use different seed than lon for independence
        dist = config["distributions"][dist_index]
        if dist["distribution"] == "gauss":
            return round(rand.gauss(dist["lat_center"], dist["lat_sd"]), 4)
        else:
            return round(rand.uniform(dist["lat_south"], dist["lat_north"]), 4)

    def generate_lon(dist_index: int, index: int) -> float:
        """Generate a longitude coordinate based on the selected distribution."""
        rand = Random(index * 3)  # Use different seed than lat for independence
        dist = config["distributions"][dist_index]
        if dist["distribution"] == "gauss":
            return round(rand.gauss(dist["lon_center"], dist["lon_sd"]), 4)
        else:
            return round(rand.uniform(dist["lon_west"], dist["lon_east"]), 4)

    def generate_severity(index: int) -> int:
        """Generate a severity level between 1 and 4, where 4 is rarest but most severe."""
        rand = Random(index * 5)
        return rand.choices([1, 2, 3, 4], weights=[50, 30, 15, 5])[0]

    outage_table = empty_table(base_rows).update(["Index = ii"])

    if ticking:
        ticking_table = (
            time_table("PT1S")
            .update(f"Index = ii + {base_rows}")
            .drop_columns("Timestamp")
        )
        outage_table = merge([outage_table, ticking_table])

    base_time = to_j_instant(STARTING_TIME)

    return (
        outage_table.update(
            [
                "Timestamp = base_time + Index * SECOND",
                "DistIndex = sample_distribution_index(Index)",
                "Lat = generate_lat(DistIndex, Index)",
                "Lon = generate_lon(DistIndex, Index)",
                "Severity = generate_severity(Index)",
            ]
        )
        .view(["Timestamp", "Lat", "Lon", "Severity"])
        .sort_descending("Severity")
    )


def flights(ticking: bool = True, speed_multiplier: int = 1) -> Table:
    """
    Returns a synthetic dataset of in-progress flight positions across Canada.

    This dataset generates realistic flight path data for three routes between major Canadian cities.
    Each flight computes its position based on elapsed time and varying ground speed, following
    great-circle paths between origin and destination airports. Flights start at different times
    and complete their journeys based on realistic flight durations.

    Notes:
        - Routes: Toronto to Vancouver (~4h), Montreal to Calgary (~4h), Calgary to Toronto (~3.5h)
        - Speeds vary realistically between 800-950 km/h with deterministic randomness,
        although they do not account for landing/takeoff phases
        - Static data shows partial progress for each flight
        - Ticking stops automatically when all flights reach their destinations
        - Positions are computed using great-circle interpolation
        - Flights do not adjust for air traffic control maneuvers such as weather, holding patterns, waypoints, etc.

    Columns:
        - FlightId (String): Unique identifier for the flight (e.g., "AC101")
        - Lat (Double): Current latitude of the aircraft
        - Lon (Double): Current longitude of the aircraft
        - Speed (Double): Current ground speed in km/h
        - Origin (String): Origin airport code (YYZ, YUL, YYC)
        - Destination (String): Destination airport code (YVR, YYC, YYZ)

    Args:
        ticking:
            If true, the table will tick new positions every second until all flights arrive.
        speed_multiplier:
            A multiplier to increase flight speeds for faster simulation. Defaults to 1 (realistic speeds).

    Returns:
        A Deephaven Table containing flight position data
    """
    # Canadian airport coordinates
    airports = {
        "YYZ": (43.6777, -79.6248),  # Toronto
        "YVR": (49.1947, -123.1790),  # Vancouver
        "YUL": (45.4706, -73.7408),  # Montreal
        "YYC": (51.1215, -114.0076),  # Calgary
    }

    # Flight configurations: (flight_id, origin, destination, duration_seconds)
    # Durations based on realistic flight times, modified by speed_multiplier
    flight_configs = [
        (
            "SAL101",
            "YYZ",
            "YVR",
            (4 * 3600 + 30 * 60) / speed_multiplier,
        ),  # Toronto to Vancouver: 4.5 hours
        (
            "LCF202",
            "YUL",
            "YYC",
            (4 * 3600 + 15 * 60) / speed_multiplier,
        ),  # Montreal to Calgary: 4.25 hours
        (
            "SAL303",
            "YYC",
            "YYZ",
            (3 * 3600 + 45 * 60) / speed_multiplier,
        ),  # Calgary to Toronto: 3.75 hours
        (
            "LCF404",
            "YVR",
            "YUL",
            (5 * 3600) / speed_multiplier,
        ),  # Vancouver to Montreal: 5 hours
    ]

    # Base and variable speed parameters (km/h)
    base_speed = 850.0
    speed_variation = 75.0  # +/- variation

    def get_speed(flight_index: int, time_index: int, progress: float) -> float:
        """
        Generate a realistic varying ground speed.
        This doesn't actually affect position calculation, but on average the position will align.
        """
        if progress <= 0.0 or progress >= 1.0:
            return 0.0
        rand = Random(flight_index * 10000 + time_index)
        speed = (
            base_speed + rand.uniform(-speed_variation, speed_variation)
        ) * speed_multiplier
        return round(speed, 1)

    def interpolate_position(
        origin: tuple[float, float],
        destination: tuple[float, float],
        progress: float,
    ) -> tuple[float, float]:
        """
        Interpolate position along a great-circle path.
        Progress is 0.0 at origin, 1.0 at destination.
        Uses spherical linear interpolation for realistic flight paths.
        """
        if progress <= 0:
            return origin
        if progress >= 1:
            return destination

        # Convert degrees to radians
        lat1, lon1 = math.radians(origin[0]), math.radians(origin[1])
        lat2, lon2 = math.radians(destination[0]), math.radians(destination[1])

        # Great-circle angle distance
        d = math.acos(
            math.sin(lat1) * math.sin(lat2)
            + math.cos(lat1) * math.cos(lat2) * math.cos(lon2 - lon1)
        )

        if d == 0:
            return origin

        # Interpolation coefficients for spherical linear interpolation
        a = math.sin((1 - progress) * d) / math.sin(d)
        b = math.sin(progress * d) / math.sin(d)

        # Convert spherical to Cartesian coordinates
        x1 = math.cos(lat1) * math.cos(lon1)
        y1 = math.cos(lat1) * math.sin(lon1)
        z1 = math.sin(lat1)
        x2 = math.cos(lat2) * math.cos(lon2)
        y2 = math.cos(lat2) * math.sin(lon2)
        z2 = math.sin(lat2)

        # Interpolate in Cartesian space
        x = a * x1 + b * x2
        y = a * y1 + b * y2
        z = a * z1 + b * z2

        # Convert from Cartesian back to spherical coordinates in radians
        lat = math.atan2(z, math.sqrt(x * x + y * y))
        lon = math.atan2(y, x)

        # Convert back to degrees and round
        return round(math.degrees(lat), 4), round(math.degrees(lon), 4)

    def get_flight_position(
        flight_index: int, elapsed_seconds: int
    ) -> tuple[float, float, float]:
        """
        Calculate flight position at a given elapsed time.
        Returns None if flight hasn't departed yet or has arrived.
        """
        config = flight_configs[flight_index]
        flight_id, origin_code, dest_code, duration = config

        origin = airports[origin_code]
        destination = airports[dest_code]

        flight_time = max(elapsed_seconds, 0)
        progress = flight_time / duration
        speed = get_speed(flight_index, elapsed_seconds, progress)
        lat, lon = interpolate_position(origin, destination, progress)

        return lat, lon, speed

    # Calculate max duration to know when all flights complete
    max_duration = max(config[3] for i, config in enumerate(flight_configs))

    # For static data, show flights at ~25% progress of longest flight
    static_seconds = int(max_duration * 0.25)

    def compute_lat(flight_idx: int, elapsed: int) -> float:
        return get_flight_position(flight_idx, elapsed)[0]

    def compute_lon(flight_idx: int, elapsed: int) -> float:
        return get_flight_position(flight_idx, elapsed)[1]

    def compute_speed(flight_idx: int, elapsed: int) -> float:
        return get_flight_position(flight_idx, elapsed)[2]

    def is_flight_active(flight_idx: int, elapsed: int) -> bool:
        """Check if a flight is still in progress."""
        config = flight_configs[flight_idx]
        duration = config[3]
        return 0 <= elapsed <= duration

    def get_flight_id(flight_idx: int) -> str:
        return flight_configs[flight_idx][0]

    def get_origin_code(flight_idx: int) -> str:
        return flight_configs[flight_idx][1]

    def get_destination_code(flight_idx: int) -> str:
        return flight_configs[flight_idx][2]

    num_flights = len(flight_configs)

    tables = []

    base_time = to_j_instant(STARTING_TIME)

    for flight in range(num_flights):
        flight_table = empty_table(static_seconds).update("ElapsedSeconds = ii")
        if ticking:
            ticking_table = (
                time_table("PT1S")
                .drop_columns(["Timestamp"])
                .update("ElapsedSeconds = ii + static_seconds")
            )
            flight_table = merge([flight_table, ticking_table]).update(
                [
                    "FlightIdx = flight",
                    "Timestamp = base_time + ElapsedSeconds * SECOND",
                ]
            )
        tables.append(flight_table)

    return (
        merge(tables)
        .update(
            [
                "FlightId = get_flight_id(FlightIdx)",
                "Lat = compute_lat(FlightIdx, ElapsedSeconds)",
                "Lon = compute_lon(FlightIdx, ElapsedSeconds)",
                "Speed = compute_speed(FlightIdx, ElapsedSeconds)",
                "Origin = get_origin_code(FlightIdx)",
                "Destination = get_destination_code(FlightIdx)",
                "Active = is_flight_active(FlightIdx, ElapsedSeconds)",
            ]
        )
        .where("Active")
        .drop_columns(["FlightIdx", "Active"])
        .sort(["Timestamp", "FlightId"])
    )
