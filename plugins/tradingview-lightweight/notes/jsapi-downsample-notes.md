# Deephaven JSAPI Downsample Algorithm

## Overview

The Deephaven downsample algorithm is a server-side operation designed for time-series "run chart" data. It reduces the number of rows sent to the client while preserving the visual fidelity of a line chart. The core technique is a **min/max bucketing** approach -- not LTTB (Largest Triangle Three Buckets) or any triangle-based method.

The fundamental idea is: divide the X-axis timeline into equal-width "bins" (one per pixel), and for each bin, retain only the rows that are visually significant: the first row, the last row, and the rows containing the minimum and maximum Y values for each Y column. This guarantees that spikes, dips, and the overall envelope of the data are faithfully represented, even after aggressive reduction.

## Parameters

The operation accepts the following inputs:

- **table**: The source table to downsample. It must be a QueryTable. The table is assumed to be sorted by the X column (each subsequent row has a later X value).
- **xCol**: The name of the X-axis column. This must be either an Instant (DateTime) column or a long column. Internally, Instant columns are reinterpreted as longs (nanoseconds since epoch).
- **yCols**: One or more Y-axis column names. These can be any numeric type (byte, short, int, long, float, double, char) or any Comparable object type. Boolean columns are explicitly not supported.
- **width** (pixel_count): An integer representing the width of the chart area in pixels. This determines how many bins the X range is divided into.
- **xRange** (zoom_range): An optional pair of long values (nanosecond timestamps) representing a visible "zoom" range on the X axis. If null, the algorithm auto-ranges based on the full extent of the data.

## Bin Size Rounding (Memoization Optimization)

Before any computation, the requested pixel count is rounded up to the nearest value in a predefined set of "bucket sizes." The default bucket sizes are 500, 1000, 2000, and 4000. If the requested pixel count exceeds all predefined sizes, the exact value is used.

This rounding serves an important purpose: memoization. When the same table is downsampled by multiple clients with slightly different chart widths (say 950 px and 1020 px), both will round up to 1000, and the server can reuse the same downsampled result. The memoization key includes the rounded bin count, the X column name, the Y column names, and the zoom range.

## Range Calculation (nanosPerPx)

The algorithm computes a value called "nanosPerPx" which represents how many nanoseconds of data each pixel (bin) covers.

**In auto-range mode** (no zoom range specified): The first and last X values in the source table are read. The difference between them is divided by the bin count, then multiplied by 1.1 (adding 10% headroom). This headroom means the initial binning slightly over-provisions, so that small additions or removals of data at the edges do not immediately require a complete re-bucketing.

Formula: nanosPerPx = 1.1 * (lastX - firstX) / binCount

**In zoom mode** (zoom range specified): The zoom range endpoints are used directly instead of reading from the table. The same formula applies, using the zoom range min and max.

## The Bucketing Algorithm

### Bin Assignment

Each row in the source table is assigned to a bin based on its X value. The bin key is computed as:

    bin = lowerBin(xValue, nanosPerPx)

The lowerBin function computes the lower bound of the bin containing the value. For integer/long types, this is equivalent to: interval * floor(value / interval), with correct handling of negative values (the floor is adjusted downward for negative remainders).

This means all X values within the same nanosPerPx-wide interval map to the same bin key.

### Bucket State

Each bin is represented by a "BucketState" object. A BucketState tracks:

1. **All row keys** that fall within this bin (the complete set of source table row keys assigned to this bucket).
2. **Per Y column**, the row key and value of the minimum value seen in this bucket.
3. **Per Y column**, the row key and value of the maximum value seen in this bucket.
4. **Per Y column**, which row keys contain null values (when null tracking is enabled).
5. **Validity flags** for each min and max, indicating whether the tracked extremes are known to be correct or may need a rescan.

The first and last row keys within each bucket are implicitly available from the ordered row set.

### Building the Output Row Set

For each non-empty bucket, the output row set is constructed by collecting:

1. The **first row key** in the bucket (by position in the source table's row set).
2. The **last row key** in the bucket.
3. For each Y column, the **row key of the maximum value** (unless the entire column is null in this bucket).
4. For each Y column, the **row key of the minimum value** (unless the entire column is null in this bucket).

Since these row keys come from the original source table, the output is a **subset of the original table's rows**. The output table shares the same column sources as the input -- it is literally the same table with a filtered row set. The schema is identical to the input table.

Because multiple Y columns may have their min/max at different rows, and the first/last rows are always included, a single bucket contributes at most 2 + 2*N rows to the output (where N is the number of Y columns), but often fewer because some of these row keys may coincide (e.g., the max of column A might be at the same row as the first row of the bucket).

### Handling Multiple Y Columns

Each Y column is tracked independently by its own ValueTracker instance. The ValueTracker is type-specialized (there are separate implementations for double, float, long, int, short, byte, char, and Comparable objects).

Each ValueTracker maintains, for every bucket:
- The current min value and the row key where it was found.
- The current max value and the row key where it was found.
- A validity flag for each of min and max.

When the output row set is built, the min-index and max-index of every Y column are unioned together along with the first and last row keys. This means if you have 3 Y columns, a single bucket could contribute up to 8 rows (first, last, min1, max1, min2, max2, min3, max3), though in practice many of these overlap.

## Handling the Zoom Range

When a zoom range is provided, the algorithm operates in "ZOOM" mode rather than "AUTO" mode. Two special buckets are created:

- **Head bucket**: Collects all rows whose bin falls entirely before the zoom range start. This is a single catch-all bucket for everything to the left of the visible range.
- **Tail bucket**: Collects all rows whose bin falls after the zoom range end. This is a single catch-all bucket for everything to the right of the visible range.

All rows within the zoom range are bucketed normally (one bucket per pixel-width interval). The head and tail buckets each contribute their own first, last, min, and max rows to the output, providing context points outside the visible area without the full resolution that the zoomed region gets.

The head and tail buckets differ from normal buckets in one important way: they do not track null values (the "trackNulls" flag is false). This is a performance optimization since these buckets can be very large and null tracking is less important for the low-resolution context data outside the zoom window.

## Null and NaN Handling

### Null Values

When a Y value is null (matching the Deephaven null sentinel for that type, e.g., NULL_DOUBLE, NULL_LONG, etc., or Java null for object types):

- The value is **not** considered for min or max. It is simply skipped.
- If null tracking is enabled (which it is for all normal buckets within the zoom or auto range), the row key is added to a per-column null tracking set.
- If all values in a bucket for a given column are null, that column's min and max indices are set to NULL_LONG, and no min/max row keys are contributed to the output row set for that column. The first and last row keys of the bucket are still included.

### Null Boundary Tracking

When null tracking is enabled, the output row set also includes **boundary rows around null gaps**. Specifically, for each contiguous range of non-null positions within a bucket, the algorithm includes the rows immediately before and after any null gap. This ensures that line charts correctly break their lines at null values rather than drawing misleading connecting lines across gaps.

### NaN Values

For floating-point types (float, double), NaN is treated as a regular value by the standard comparison operators. Since NaN comparisons in Java return false for all ordering comparisons, NaN values will generally not become the min or max unless they are the first value seen. The algorithm does not have explicit NaN handling beyond what the type's comparison semantics provide.

## Incremental Updates

The downsample operation is fully incremental -- it listens for upstream table changes and updates the downsampled output without reprocessing the entire table. The update cycle handles four types of changes:

### Added Rows

New rows are assigned to their bins and their values are checked against the current min/max for each Y column in that bin. If a new bin is needed, it is created. This is an O(n) operation in the number of added rows.

### Removed Rows

Removed rows are located in their bins. If a removed row was the current min or max for any Y column, that column's validity flag is set to false, triggering a later rescan of that bucket. The row is removed from the bucket's row set.

### Modified Rows

For each modified row, the algorithm checks if the X value changed (which would move the row to a different bucket). If so, the row is removed from the old bucket and added to the new one. If the X value did not change, the new Y values are compared against the current min/max. If the modified row was previously the min or max and the new value is less extreme, the validity flag is set to false for a later rescan.

### Row Shifts

When the underlying table's row keys shift (a common operation in Deephaven's incremental engine), the algorithm updates the stored min and max row key indices using binary search through the shift data to apply the correct delta.

### Rescans

After processing all additions, removals, modifications, and shifts, the algorithm performs a rescan pass. Any bucket whose min or max validity flag is false for any Y column is rescanned: all values in that bucket are re-examined to find the true current min and max. Before rescanning, the min and max are reset to null, and then every value is appended as if starting fresh. Empty buckets are removed entirely and their slot positions are recycled.

### Notification

After all updates are processed, the algorithm computes the new output row set from all bucket states, compares it to the previous output row set, and sends an incremental update notification downstream (with appropriate added, removed, and modified row sets).

## Output Table Characteristics

- The output table is a **sub-table** of the input. It shares the same column sources and column definitions. It is not a new table with different columns -- it is literally the same data, just with a reduced row set.
- The output rows are a subset of the input rows, so they preserve all original column values exactly. There is no interpolation or averaging.
- The rows in the output are ordered the same way as in the input table (since the output row set is a subset of the input's row set).
- The output table is live/refreshing if the input table is, and will update incrementally as the source changes.
- The maximum number of output rows is approximately: numberOfBins * (2 + 2 * numberOfYColumns), though in practice it is significantly less due to row key overlap between first/last and min/max positions.

## Width (Pixel Count) to Points Mapping

The pixel count does not directly determine the number of output rows. Instead:

1. The pixel count is rounded up to the nearest predefined bucket size (500, 1000, 2000, or 4000).
2. This rounded value becomes the number of bins the X range is divided into.
3. Each bin contributes a variable number of rows (between 2 and 2 + 2*N where N is the number of Y columns).
4. So for a 1000-pixel chart with 2 Y columns, the theoretical maximum is 1000 * 6 = 6000 rows, but typically much less.

## Client-Side Decision Logic

The web client includes logic to decide whether downsampling is worthwhile:

- If the table has fewer rows than 2 * (1 + numberOfYColumns) * pixelCount * 2 (a "MIN_DOWNSAMPLE_FACTOR" of 2), the client skips downsampling and subscribes directly, since the reduction would not be significant enough to justify the overhead.
- If the table exceeds 30,000 rows (MAX_SERIES_SIZE) and downsampling is not explicitly disabled, the client will not load the data at all without downsampling.
- An absolute maximum of 200,000 rows (MAX_SUBSCRIPTION_SIZE) is enforced even with downsampling disabled.

## Summary of the Algorithm

The Deephaven downsample is a practical, server-side min/max bucketing scheme optimized for time-series line charts. It divides the time range into equal-width bins (one per pixel), tracks the first row, last row, minimum value row, and maximum value row for each Y column within each bin, and returns those rows as a subset of the original table. It handles nulls by preserving gap boundaries, supports zoom ranges with coarse head/tail context buckets, and updates incrementally as the source table ticks. The result is that a chart rendered from the downsampled table will show the same peaks, valleys, and overall shape as the original data, while transmitting far fewer rows to the client.
