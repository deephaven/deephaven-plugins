from __future__ import annotations

import math

# Use Random() class as seperate instances to avoid global state issues,
# as Deephaven may evaluate columns in parallel.
from random import Random

import jpy
from typing import Any

from deephaven.table import Table
from deephaven import empty_table, time_table, merge
from deephaven.time import to_j_instant
from deephaven.updateby import rolling_sum_tick, ema_tick, delta, DeltaControl


SECOND = 1_000_000_000  #: One second in nanoseconds.
MINUTE = 60 * SECOND  #: One minute in nanoseconds.
STARTING_TIME = "2018-06-01T08:00:00 ET"  # day deephaven.io was registered

# Constants for easy access in charts
OUTAGE_LAT = 44.97
OUTAGE_LON = -93.17
OUTAGE_CENTER = {"lat": OUTAGE_LAT, "lon": OUTAGE_LON}
FLIGHT_LAT = 50
FLIGHT_LON = -100
FLIGHT_CENTER = {"lat": FLIGHT_LAT, "lon": FLIGHT_LON}


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
                    # seeds must be offset per column, otherwise every column seeded with Index
                    # draws the same underlying value and the columns end up fully correlated
                    "Exchange = random_list_exchange(Index + 1000000)",
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
            flight_table = merge([flight_table, ticking_table])
        flight_table = flight_table.update(
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
