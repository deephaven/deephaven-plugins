# Enumerations

## ColorType
| Member | Value | Description |
|--------|-------|-------------|
| `Solid` | `"solid"` | Solid color |
| `VerticalGradient` | `"gradient"` | Vertical gradient color |

## CrosshairMode
| Member | Value | Description |
|--------|-------|-------------|
| `Normal` | `0` | Crosshair moves freely |
| `Magnet` | `1` | Snaps to close price (single-value or OHLC close) |
| `Hidden` | `2` | Crosshair disabled |
| `MagnetOHLC` | `3` | Snaps to nearest O/H/L/C price |

## LastPriceAnimationMode
| Member | Value | Description |
|--------|-------|-------------|
| `Disabled` | `0` | Animation always disabled |
| `Continuous` | `1` | Animation always enabled |
| `OnDataUpdate` | `2` | Animation active after new data |

## LineStyle
| Member | Value | Description |
|--------|-------|-------------|
| `Solid` | `0` | Solid line |
| `Dotted` | `1` | Dotted line |
| `Dashed` | `2` | Dashed line |
| `LargeDashed` | `3` | Dashed with bigger dashes |
| `SparseDotted` | `4` | Dotted with more spacing |

## LineType
| Member | Value | Description |
|--------|-------|-------------|
| `Simple` | `0` | Straight line segments |
| `WithSteps` | `1` | Stepped line |
| `Curved` | `2` | Curved (spline) line |

## MarkerSign
| Member | Value | Description |
|--------|-------|-------------|
| `Negative` | `-1` | Negative change |
| `Neutral` | `0` | No change |
| `Positive` | `1` | Positive change |

## MismatchDirection
| Member | Value | Description |
|--------|-------|-------------|
| `NearestLeft` | `-1` | Search nearest left item |
| `None` | `0` | Do not search |
| `NearestRight` | `1` | Search nearest right item |

## PriceLineSource
| Member | Value | Description |
|--------|-------|-------------|
| `LastBar` | `0` | Use last bar data |
| `LastVisible` | `1` | Use last visible data in viewport |

## PriceScaleMode
| Member | Value | Description |
|--------|-------|-------------|
| `Normal` | `0` | Linear price range |
| `Logarithmic` | `1` | Logarithmic price range |
| `Percentage` | `2` | Percentage relative to first visible value (= 0%) |
| `IndexedTo100` | `3` | Like percentage but first value = 100 |

## TickMarkType
| Member | Value | Description |
|--------|-------|-------------|
| `Year` | `0` | First tick in a year |
| `Month` | `1` | First tick in a month |
| `DayOfMonth` | `2` | A day of the month |
| `Time` | `3` | Time without seconds |
| `TimeWithSeconds` | `4` | Time with seconds |

## TrackingModeExitMode
| Member | Value | Description |
|--------|-------|-------------|
| `OnTouchEnd` | `0` | Deactivate on touch end |
| `OnNextTap` | `1` | Deactivate on next tap |
