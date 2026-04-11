# ISeriesApi

The series API for interacting with individual chart series. Returned by `chart.addSeries()`.

## Properties

| Property | Return Type | Description |
|----------|------------|-------------|
| `data()` | `readonly TData[]` | All bar data for the series |
| `options()` | `Readonly<TOptions>` | Currently applied options with defaults |
| `seriesType()` | `TSeriesType` | Current series type string |
| `seriesOrder()` | `number` | Zero-based render order index |
| `priceFormatter()` | `IPriceFormatter` | Current price formatter |

## Data Methods

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `setData()` | `data: TData[]` | `void` | Replace ALL series data (must be time-ordered) |
| `update()` | `bar: TData, historicalUpdate?: boolean` | `void` | Append or update latest data point |
| `pop()` | `count: number` | `TData[]` | Remove N items from end |
| `dataByIndex()` | `logicalIndex, mismatchDirection?` | `TData` | Get data at logical index |
| `subscribeDataChanged()` | `handler: DataChangedHandler` | `void` | Listen for data changes |
| `unsubscribeDataChanged()` | `handler` | `void` | Remove data change listener |

## Coordinate Conversion

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `priceToCoordinate()` | `price: number` | `Coordinate` | Price → pixel Y coordinate |
| `coordinateToPrice()` | `coordinate: number` | `BarPrice` | Pixel Y → price value |
| `barsInLogicalRange()` | `range, mismatchDirection?` | `BarsInfo` | Bars info within logical range |

## Price Lines

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createPriceLine()` | `options: CreatePriceLineOptions` | `IPriceLine` | Create a new price line |
| `removePriceLine()` | `line: IPriceLine` | `void` | Delete a price line |
| `priceLines()` | — | `IPriceLine[]` | All attached price lines |

## Configuration

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `applyOptions()` | `options: TPartialOptions` | `void` | Update series options (partial) |
| `priceScale()` | — | `IPriceScaleApi` | Access the series' price scale |
| `lastValueData()` | `globalLast: boolean` | `LastValueDataResult` | Get last value data |

## Primitives & Panes

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `attachPrimitive()` | `primitive: ISeriesPrimitive` | `void` | Attach drawing primitive |
| `detachPrimitive()` | `primitive: ISeriesPrimitive` | `void` | Detach drawing primitive |
| `moveToPane()` | `paneIndex: number` | `void` | Move series to another pane |
| `setSeriesOrder()` | `order: number` | `void` | Set render order within pane |
| `getPane()` | — | `IPaneApi` | Get pane where series lives |

## Usage Notes

- `setData()` replaces all data; `update()` is incremental (append or update last point)
- `update()` with a time equal to the last bar updates that bar; a later time appends
- `historicalUpdate` flag on `update()` allows inserting data before the last bar
- `pop()` returns the removed items
- Price lines persist until explicitly removed with `removePriceLine()`
