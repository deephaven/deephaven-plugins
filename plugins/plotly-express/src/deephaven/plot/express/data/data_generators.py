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
from deephaven import time_table, merge
from deephaven.time import (
    to_j_instant,
    to_pd_timestamp,
)
from deephaven.updateby import cum_max

# Datasets that only need Deephaven live in the deephaven-sample-data package
# Unresolvable by pre-commit's pyright until deephaven-sample-data is published to PyPI
from deephaven.sample_data import (  # pyright: ignore[reportMissingImports]
    jobs,
    marketing,
    stocks,
    fish_market,
    outages,
    flights,
    OUTAGE_CENTER,
    FLIGHT_CENTER,
)


SECOND = 1_000_000_000  #: One second in nanoseconds.
MINUTE = 60 * SECOND  #: One minute in nanoseconds.
STARTING_TIME = "2018-06-01T08:00:00 ET"  # day deephaven.io was registered

# Constants for easy access in charts
OUTAGE_LAT = OUTAGE_CENTER["lat"]
OUTAGE_LON = OUTAGE_CENTER["lon"]
FLIGHT_LAT = FLIGHT_CENTER["lat"]
FLIGHT_LON = FLIGHT_CENTER["lon"]


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
