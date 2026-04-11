# Utility Types

## DeepPartial\<T\>

Recursively makes all properties optional. Used throughout the API for partial configuration updates.

```ts
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer X)[]
    ? readonly DeepPartial<X>[]
    : DeepPartial<T[P]>;
};
```

## Coordinate

```ts
type Coordinate = Nominal<number, "Coordinate">;
```
Pixel coordinate. Nominal typing prevents mixing with other number types.

## Logical

```ts
type Logical = Nominal<number, "Logical">;
```
Index-based position in chart data. Can be fractional (e.g., 5.2 = 6th bar 20% visible).

## LineWidth

```ts
type LineWidth = 1 | 2 | 3 | 4;
```
Restricted to 4 widths for consistent rendering.

## PriceFormat

```ts
type PriceFormat = PriceFormatBuiltIn | PriceFormatCustom;
```

### PriceFormatBuiltIn
```ts
interface PriceFormatBuiltIn {
  type: 'price' | 'volume' | 'percent';
  precision: number;    // decimal places
  minMove: number;      // minimum price increment
}
```
Default: `{ type: 'price', precision: 2, minMove: 0.01 }`

### PriceFormatCustom
```ts
interface PriceFormatCustom {
  type: 'custom';
  formatter: (priceValue: BarPrice) => string;
  minMove?: number;
}
```

## Background

```ts
type Background = SolidColor | VerticalGradientColor;
```

### SolidColor
```ts
{ type: ColorType.Solid; color: string; }
```

### VerticalGradientColor
```ts
{ type: ColorType.VerticalGradient; topColor: string; bottomColor: string; }
```

## PriceScaleMargins

```ts
interface PriceScaleMargins {
  top: number;    // 0–1, percentage of pane height
  bottom: number; // 0–1, percentage of pane height
}
```

## SeriesOptionsMap

Maps series type strings to their full options types:
```ts
interface SeriesOptionsMap {
  Bar: BarSeriesOptions;
  Candlestick: CandlestickSeriesOptions;
  Area: AreaSeriesOptions;
  Baseline: BaselineSeriesOptions;
  Line: LineSeriesOptions;
  Histogram: HistogramSeriesOptions;
  Custom: CustomSeriesOptions;
}
```

## SeriesPartialOptionsMap

Same as `SeriesOptionsMap` but all properties are `DeepPartial`. Used for `applyOptions()` calls.

## HorzAlign / VertAlign

```ts
type HorzAlign = 'left' | 'center' | 'right';
type VertAlign = 'top' | 'center' | 'bottom';
```
