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

When using the `by` parameter, the undqrlying table is partitioned by the specified columns(s). Each unique value (or combination) becomes a separate series in the plot, and each series maintains its own table subscription.

For a small number of unique groups, this is fine. But as a general rule of thumb, if a column has hundreds of unique values, the chart will create that many series and subscriptions, which can cause performance degradation.

If you run into this, try filtering the table to just the groups you care about before passing it to the plot. It’s also worth reconsidering whether `by` is the right tool, since a plot with hundreds of unique values will cycle through colors and symbols before repeating, making most groups hard to tell apart.
