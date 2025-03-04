from __future__ import annotations

import pandas as pd
import numpy as np
from plotly import express as px
import math
import random
import jpy
from typing import Any, cast

from deephaven.pandas import to_table
from deephaven.replay import TableReplayer
from deephaven.table import Table
from deephaven import empty_table, time_table, merge
from deephaven.time import (
    to_j_instant,
    to_pd_timestamp,
)
from deephaven.updateby import rolling_sum_tick, ema_tick, cum_max

SECOND = 1_000_000_000  #: One second in nanoseconds.
MINUTE = 60 * SECOND  #: One minute in nanoseconds.
STARTING_TIME = "2018-06-01T08:00:00 ET"  # day deephaven.io was registered


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

    Args:
        ticking:
            If true, the table will tick new data every second.

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
        random.seed(index)
        return round(random.gauss(mean, std), 1)

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

    Notes:
        Contains the following columns:
        - Job: a string column denoting the name of the job, ranging from Job1 to Job5
        - StartTime: a Java Instant column containing the start time of the job
        - EndTime: a Java Instant column containing the end time of the job
        - Resource: a string column indicating the name of the person that the job is assigned to

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table

    Examples:
        ```
        from deephaven.plot import express as dx
        jobs = dx.data.jobs()
        ```
    """

    def generate_resource(index: int) -> str:
        random.seed(index)
        return random.choice(["Mike", "Matti", "Steve", "John", "Jane"])

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

    Notes:
        Contains the following columns:
        - Stage: a string column containing the stage of a customers interest:
                 VisitedWebsite, Downloaded, PotentialCustomer, RequestedPrice, and InvoiceSent
        - Count: an integer column counting the number of customers to fall into each category

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table

    Examples:
        ```
        from deephaven.plot import express as dx
        marketing = dx.data.marketing()
        ```
    """
    _ColsToRowsTransform = jpy.get_type(
        "io.deephaven.engine.table.impl.util.ColumnsToRowsTransform"
    )

    def weighted_selection(prob: float, index: int) -> bool:
        random.seed(index)
        return random.uniform(0, 1) < prob

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
    hours_of_data: int = 1,
    starting_time: str = STARTING_TIME,
) -> Table:
    """Returns a Deephaven table containing a generated example data set.

    Data is 1 hour of randomly generated (but deterministic) fictional
    stock market data, and starts with the first 5 minutes of data
    already initialized so your example plots won't start empty.

    Notes:
        Contains the following columns:
        - Timestamp: a time column starting from the date deephaven.io was registered
        - Sym: a string representing a fictional stock symbol
        - Exchange: a string representing a fictional stock exchange
        - Size: the number of shares in the trade
        - Price: the transaction price of the trade
        - Dollars: the dollar value of the trade (price * size)
        - Side: buy or sell side of the trade
        - SPet500: A comparison to a fictional index
        - Index: an incrementing row index
        - Random: A random gaussian value using row index as seed

    Args:
        ticking:
            If true, the table will tick using a replayer, if
            false the whole table will be returned as a static table.
        hours_of_data:
            The number of hours of data to return
        starting_time:
            The starting time of the data, defaults to "2018-06-01T08:00:00 ET"

    Returns:
        A Deephaven Table

    Examples:
        ```
        import deephaven.plot.express as dx
        stocks = dx.data.stocks()
        ```
    """

    base_time = to_j_instant(starting_time)

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
                "Timestamp = base_time + (long)(ii * SECOND / ticks_per_second)",
                # must be first as it sets python seed
                "RandomDouble = (double)random_gauss(i)",  # nicer looking starting seed
                "Sym = random_list_sym(i)",
                "Exchange = random_list_exchange(i)",
                "Side = RandomDouble >= 0 ? `buy` : `sell`",
                "Size = random_trade_size(RandomDouble)",
                "SymIndex = (int)sym_dict[Sym]",
                "Index = i",
            ]
        )
        # generate data for price column
        .update_by(
            ops=[
                rolling_sum_tick(
                    cols=["RollingSum = RandomDouble"], rev_ticks=2000, fwd_ticks=0
                )
            ],
            by=["Sym"],
        )
        .update_by(ops=[ema_tick(decay_ticks=2, cols=["Ema = RollingSum"])], by=["Sym"])
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
            ops=[ema_tick(decay_ticks=5, cols=["EmaIndividual = RollingSumIndividual"])]
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
        result_replayer = TableReplayer(start_time, end_time)
        replayer_table = result_replayer.add_table(static_table, "Timestamp")
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
        random.seed(index)
        return random.choices(sex_list, weights=sex_probs)[0]

    def generate_smoker(index: int) -> str:
        random.seed(index + 1)
        return random.choices(smoker_list, weights=smoker_probs)[0]

    def generate_day(index: int) -> str:
        random.seed(index + 2)
        return random.choices(day_list, weights=day_probs)[0]

    def generate_time(index: int) -> str:
        random.seed(index + 3)
        return random.choices(time_list, weights=time_probs)[0]

    def generate_size(index: int) -> int:
        random.seed(index + 4)
        return random.choices(size_list, weights=size_probs)[0]

    def generate_total_bill(smoker: str, size: int, index: int) -> float:
        random.seed(index + 5)
        return round(
            3.68
            + 3.08 * (smoker == "Yes")
            + 5.81 * size
            + (random.gauss(3.41, 0.99) ** 2 - 12.63),
            2,
        )

    def generate_tip(total_bill: float, index: int) -> float:
        random.seed(index + 6)
        return max(1, round(0.92 + 0.11 * total_bill + random.gauss(0.0, 1.02), 2))

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

    Notes:
        Contains the following columns:
        - District: a string containing the name of the district that the votes were cast in
        - Coderre: the number of votes that the candidate Coderre received in the district
        - Bergeron: the number of votes that the candidate Bergeron received in the district
        - Joly: the number of votes that the candidate Joly received in the district
        - Total: the total number of votes cast in the district
        - Winner: a string containing the name of the winning candidate for that district
        - Result: a string indicating whether the victory was by majority or plurality
        - DistrictID: a numerical ID for the district

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table

    Examples:
        ```
        from deephaven.plot import express as dx
        election = dx.data.election()
        ```
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
        return election_df.loc[index, column]

    def get_long_val(column: str, index: int) -> int:
        return election_df.loc[index, column]

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

    Notes:
        Contains the following columns:
        - Direction: a string indicating the direction of the wind gust
        - Strength: a string indicating the strength of the wind gust, from 0-1 to 6+
        - Frequency: the frequency of each gust strength in each direction

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table

    Examples:
        ```
        from deephaven.plot import express as dx
        wind = dx.data.wind()
        ```
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
        return wind_df.loc[index, column]

    def get_float_val(column: str, index: int) -> float:
        return wind_df.loc[index, column]

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

    Notes:
        Contains the following columns:
        - Country: a string containing the name of the country
        - Continent: a string containing the name of the continent that the country belongs to
        - Year: the year that the measurement was taken
        - Month: the month (1 - 12) that the measurement was taken
        - LifeExp: average life expectancy
        - Pop: population total
        - GdpPerCap: per-capita GDP

    Args:
        ticking:
            If true, the table will tick new data every second.

    Returns:
        A Deephaven Table

    References:
        - https://www.gapminder.org/data/

    Examples:
        ```
        from deephaven.plot import express as dx
        gapminder = dx.data.gapminder()
        ```
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
        return gapminder_interp.loc[index, "LifeExp"]

    def get_population(index: int) -> int:
        return gapminder_interp.loc[index, "Pop"]

    def get_gdp_per_cap(index: int) -> float:
        return gapminder_interp.loc[index, "GdpPerCap"]

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
