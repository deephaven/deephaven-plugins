# Limitations

## Chrome WebGL Limit

Chrome has a limit of 8 WebGL contexts active at one time.
If more than 8 charts that use WebGL are created, the earliest charts appear as empty.
Options to work around this include:

1. Using Firefox, which has a higher limit.
2. Setting `render_mode = "svg"` when creating the chart where possible, such as in scatter charts.
   Some charts, such as 3D charts and maps, do not provide this option as they require WebGL.
3. Disabling WebGL in the Deephaven settings. Charts that require WebGl will still render in WebGL when available.
4. Setting Chrome to allow more WebGL contexts with the `--max-active-webgl-contexts` flag.
   For example, to set the limit to 64:

```bash
--max-active-webgl-contexts=64
```

See more on flags [here](https://www.chromium.org/developers/how-tos/run-chromium-with-flags/).

> [!WARNING]
> Disabling WebGL, either in the settings or per chart, can lead to performance issues when plotting large datasets.

## Plot By Performance

When using the `by` parameter, the underlying table is partitioned by the specified column(s). Each unique value (or combination) becomes a separate series in the plot, and each series maintains its own table subscription.

When dealing with a small number of unique groups, this approach works well. However, as a general rule, if a column contains hundreds of unique values, the chart will generate that many series and subscriptions, which can degrade performance.

If you run into this, try filtering the table to just the groups you care about before passing it to the plot. It’s also worth reconsidering whether `by` is the right tool, since a plot with hundreds of unique values will cycle through colors and symbols before repeating, making most groups hard to tell apart.

In Deephaven Enterprise, the server limits how many streams a connection can have open at once, with a default limit of 128. If the number of series exceeds this limit in a single session, such as with hundreds of unique groups in a plot using the `by` parameter, subsequent tables and plots will wait indefinitely for data, and console commands may stop responding. To increase this limit, do one of the following:

1. Set the `http2.maxConcurrentStreams` property on the server to change the default
2. Set the JVM arg on the worker, e.g., `-Dhttp2.maxConcurrentStreams=256`
