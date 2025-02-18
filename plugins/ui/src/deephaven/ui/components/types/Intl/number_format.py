from typing import Literal, Union
import sys

if sys.version_info < (3, 11):
    from typing_extensions import TypedDict, NotRequired
else:
    from typing import TypedDict, NotRequired


NumberSystems = Literal[
    "adlm",
    "ahom",
    "arab",
    "arabext",
    "armn",
    "armnlow",
    "bali",
    "beng",
    "bhks",
    "brah",
    "cakm",
    "cham",
    "cyrl",
    "deva",
    "ethi",
    "finance",
    "fullwide",
    "geor",
    "gong",
    "gonm",
    "grek",
    "greklow",
    "gujr",
    "guru",
    "hanidays",
    "hanidec",
    "hans",
    "hansfin",
    "hant",
    "hantfin",
    "hebr",
    "hmng",
    "hmnp",
    "java",
    "jpan",
    "jpanfin",
    "jpanyear",
    "kali",
    "khmr",
    "knda",
    "lana",
    "lanatham",
    "laoo",
    "latn",
    "lepc",
    "limb",
    "mathbold",
    "mathdbl",
    "mathmono",
    "mathsanb",
    "mathsans",
    "mlym",
    "modi",
    "mong",
    "mroo",
    "mtei",
    "mymr",
    "mymrshan",
    "mymrtlng",
    "native",
    "newa",
    "nkoo",
    "olck",
    "orya",
    "osma",
    "rohg",
    "roman",
    "romanlow",
    "saur",
    "shrd",
    "sind",
    "sinh",
    "sora",
    "sund",
    "takr",
    "talu",
    "taml",
    "tamldec",
    "telu",
    "thai",
    "tirh",
    "tibt",
    "traditio",
    "vaii",
    "wara",
    "wcho",
]

CurrencyCodes = Literal[
    "AED",
    "AFN",
    "ALL",
    "AMD",
    "ANG",
    "AOA",
    "ARS",
    "AUD",
    "AWG",
    "AZN",
    "BAM",
    "BBD",
    "BDT",
    "BGN",
    "BHD",
    "BIF",
    "BMD",
    "BND",
    "BOB",
    "BRL",
    "BSD",
    "BTN",
    "BWP",
    "BYN",
    "BZD",
    "CAD",
    "CDF",
    "CHF",
    "CLP",
    "CNY",
    "COP",
    "CRC",
    "CUC",
    "CUP",
    "CVE",
    "CZK",
    "DJF",
    "DKK",
    "DOP",
    "DZD",
    "EGP",
    "ERN",
    "ETB",
    "EUR",
    "FJD",
    "FKP",
    "FOK",
    "GBP",
    "GEL",
    "GGP",
    "GHS",
    "GIP",
    "GMD",
    "GNF",
    "GTQ",
    "GYD",
    "HKD",
    "HNL",
    "HRK",
    "HTG",
    "HUF",
    "IDR",
    "ILS",
    "IMP",
    "INR",
    "IQD",
    "IRR",
    "ISK",
    "JEP",
    "JMD",
    "JOD",
    "JPY",
    "KES",
    "KGS",
    "KHR",
    "KID",
    "KMF",
    "KRW",
    "KWD",
    "KYD",
    "KZT",
    "LAK",
    "LBP",
    "LKR",
    "LRD",
    "LSL",
    "LYD",
    "MAD",
    "MDL",
    "MGA",
    "MKD",
    "MMK",
    "MNT",
    "MOP",
    "MRU",
    "MUR",
    "MVR",
    "MWK",
    "MXN",
    "MYR",
    "MZN",
    "NAD",
    "NGN",
    "NIO",
    "NOK",
    "NPR",
    "NZD",
    "OMR",
    "PAB",
    "PEN",
    "PGK",
    "PHP",
    "PKR",
    "PLN",
    "PYG",
    "QAR",
    "RON",
    "RSD",
    "RUB",
    "RWF",
    "SAR",
    "SBD",
    "SCR",
    "SDG",
    "SEK",
    "SGD",
    "SHP",
    "SLL",
    "SOS",
    "SRD",
    "SSP",
    "STN",
    "SYP",
    "SZL",
    "THB",
    "TJS",
    "TMT",
    "TND",
    "TOP",
    "TRY",
    "TTD",
    "TVD",
    "TWD",
    "TZS",
    "UAH",
    "UGX",
    "USD",
    "UYU",
    "UZS",
    "VES",
    "VND",
    "VUV",
    "WST",
    "XAF",
    "XCD",
    "XOF",
    "XPF",
    "YER",
    "ZAR",
    "ZMW",
    "ZWL",
]

Units = Literal[
    "acre",
    "bit",
    "byte",
    "celsius",
    "centimeter",
    "day",
    "degree",
    "fahrenheit",
    "fluid-ounce",
    "foot",
    "gallon",
    "gigabit",
    "gigabyte",
    "gram",
    "hectare",
    "hour",
    "inch",
    "kilobit",
    "kilobyte",
    "kilogram",
    "kilometer",
    "liter",
    "megabit",
    "megabyte",
    "meter",
    "mile",
    "mile-scandinavian",
    "millimeter",
    "milliliter",
    "millisecond",
    "minute",
    "month",
    "ounce",
    "percent",
    "petabyte",
    "pound",
    "second",
    "stone",
    "terabit",
    "terabyte",
    "week",
    "yard",
    "year",
]


class Options(TypedDict):
    """
    Options for formatting the value of a NumberField.
    This also affects the characters allowed in the input.
    """

    # Locale Options
    locale_matcher: NotRequired[Literal["lookup", "best fit"]]
    """
    The locale matching algorithm to use.
    Possible values are "lookup" to use the runtime's locale matching algorithm, or "best fit" to use the CLDR locale matching algorithm.
    The default is "best fit".
    """

    numbering_matching: NotRequired[NumberSystems]
    """
    The numbering system to use.
    Possible values are the numbering systems specified in the Unicode CLDR, such as "arab" for Arabic-Indic digits or "latn" for Latin digits.
    For more information see the supported numbering systems in the getNumberingSystems page on MDN.

    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getNumberingSystems
    """

    # Style Options
    style: NotRequired[Literal["decimal", "percent", "currency", "unit"]]
    """
    The formatting style to use. 
    Possible values are "decimal" for plain number formatting, "percent" for percent formatting, "currency" for currency formatting, or "unit" for unit formatting.
    """

    currency: NotRequired[CurrencyCodes]
    """
    The currency to use in currency formatting. 
    Possible values are the ISO 4217 currency codes, such as "USD" for the US dollar, "EUR" for the euro, or "CNY" for the Chinese yuan. 
    The default is "USD".
    """

    currency_display: NotRequired[Literal["symbol", "narrowSymbol", "code", "name"]]
    """
    How to display the currency in currency formatting. 
    Possible values are "symbol" to use a localized currency symbol such as €, "narrowSymbol" to use a narrow form of the symbol such as ƒ, "code" to use the ISO currency code, or "name" to use a localized currency name such as "dollar".
    """

    currency_sign: NotRequired[Literal["standard", "accounting"]]
    """
    Determines how to display negative values in currency formatting.
    In many locales, the "accounting" format wraps negative numbers in parentheses instead of using a minus sign.
    Possible values are "standard" and "accounting". The default is "standard".
    """

    unit: NotRequired[Units]
    """
    The unit to use in unit formatting.
    Possible values are the units specified in the Unicode CLDR. Only a subset of units was selected from the full list such as "meter" for meters or "mile" for miles.
    Check https://tc39.es/ecma402/#table-sanctioned-single-unit-identifiers for the full list of supported units.
    """

    unit_display: NotRequired[Literal["long", "short", "narrow"]]
    """
    How to display the unit in unit formatting.
    Possible values are "long" to use a full unit name such as "16 meters", "short" to use an abbreviated unit name such as "16 m", or "narrow" to use a narrow form of the unit name such as "16m".
    Default is "short".
    """

    # Digit Options
    minimum_integer_digits: NotRequired[int]
    """
    The minimum number of integer digits to use. 
    Possible values are from 1 to 21. 
    The default is 1.
    """

    minimum_fraction_digits: NotRequired[int]
    """
    The minimum number of fraction digits to use. 
    Possible values are from 0 to 100; the default for plain number and percent formatting is 0; the default for currency formatting is 2 if not provided in the ISO 4217 currency code list.
    """

    maximum_fraction_digits: NotRequired[int]
    """
    The maximum number of fraction digits to use. 
    Possible values are from 0 to 100.
    Plain number formatting: The default is the larger of minimum_fraction_digits and 3.
    Percent formatting: The default is the larger of minimum_fraction_digits and 0.
    Currency formatting: The default is the larger of minimum_fraction_digits and the number of minor unit digits in the ISO 4217 list.
    """

    minimum_significant_digits: NotRequired[int]
    """
    The minimum number of significant digits to use.
    Possible values are from 1 to 21.
    Default is 1.
    """

    maximum_significant_digits: NotRequired[int]
    """
    The maximum number of significant digits to use.
    Possible values are from 1 to 21.
    Default is 21.
    """

    rounding_priority: NotRequired[Literal["auto", "morePrecision", "lessPrecision"]]
    """
    Specifies how rounding conflicts is resolved if both fraction_digits and significant_digits are provided.
    Possible values are "auto" to use the significant digits property, "morePrecision" to prioritize rounding to a more precise number, or "lessPrecision" to prioritize rounding to a less precise number.
    The default is "auto".
    """

    rounding_increment: NotRequired[
        Literal[1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 200, 2500, 5000]
    ]
    """
    The rounding increment to use.
    Possible values are 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, or 5000.
    Cannot be mixed with significant-digits rounding or any setting of rounding_priority other than auto.
    """

    rounding_mode: NotRequired[
        Literal[
            "ceil",
            "floor",
            "expand",
            "trunc",
            "halfCeil",
            "halfFloor",
            "halfExpand",
            "halfTrunc",
            "halfEven",
        ]
    ]
    """
    The rounding mode to use.
    Possible values are "ceil" to round towards positive infinity, "floor" to round towards negative infinity, "expand" to round away from zero, "trunc" to round towards zero, "halfCeil" to round towards the nearest neighbor or to positive infinity if equidistant, "halfFloor" to round towards the nearest neighbor or to negative infinity if equidistant, "halfExpand" to round towards the nearest neighbor or to infinity if equidistant, "halfTrunc" to round towards the nearest neighbor or to zero if equidistant, or "halfEven" to round towards the nearest neighbor or to the even neighbor if equidistant.
    The default is "halfExpand".
    """

    trailing_zero_display: NotRequired[Literal["auto", "stripIfInteger"]]
    """
    How to display trailing zeros in fraction digits.
    Possible values are "auto" to display trailing zeros according to minimum_fraction_digits and minimum_significant_digits, or "stripIfInteger" to remove trailing zeros in fraction digits if they are all zero.
    The default is "auto".
    """

    # Other Options
    notation: NotRequired[Literal["standard", "scientific", "engineering", "compact"]]
    """
    Possible values are "standard" for plain number formatting, "scientific" for order-of-magnitude for formatted number, "engineering" for the exponent of ten when divisible by three, or "compact" for string representing exponent; defaults to using the "short" form.
    Default is "standard".
    """

    compact_display: NotRequired[Literal["short", "long"]]
    """
    Possible values are "short" for compact notation, or "long" for full notation.
    Default is "short".
    """

    use_grouping: NotRequired[Literal["always", "auto", "min2", True, False]]
    """
    Whether to use grouping separators such as thousands separators.
    Possible values are "always" to always use grouping separators, "auto" to use grouping separators according to the locale and the number of digits, "min2" to use grouping separators if there are more than two digits, or true and false to use grouping separators according to the locale.
    Default is 'min2' if notation is 'compact', and 'auto' otherwise.
    """

    sign_display: NotRequired[
        Literal["auto", "never", "always", "exceptZero", "negative"]
    ]
    """
    Whether to display the sign of the number.
    Possible values are "auto" to display the sign for negative numbers only, "never" to never display the sign, "always" to always display the sign, "exceptZero" to display the sign for all numbers except zero, or "negative" to display the sign for negative numbers only.
    Default is "auto".
    """


class NumberFormatOptions(TypedDict):
    """
    Options for formatting the value of a NumberField.
    This also affects the characters allowed in the input.
    """

    numbering_system: NotRequired[str]

    compact_display: NotRequired[Literal["short", "long"]]

    notation: NotRequired[Literal["standard", "scientific", "engineering", "compact"]]

    sign_display: NotRequired[Literal["auto", "never", "always", "exceptZero"]]

    unit: NotRequired[str]

    unit_display: NotRequired[Literal["long", "short", "narrow"]]

    currency_sign: NotRequired[Literal["standard", "accounting"]]
