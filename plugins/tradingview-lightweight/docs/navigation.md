# Pan and zoom

Every chart is interactive as soon as it renders, with nothing to configure. You can pan along the time axis, zoom in on a window, stretch a price axis, and snap back to the full view, with a mouse, a trackpad, or touch. To turn individual pan and zoom gestures off, see [scroll and zoom interactions](styling.md#control-scroll-and-zoom-interactions).

## Pan

- **Drag the plot area** left or right to move through time. On a trackpad, a two-finger horizontal swipe does the same; on a touch screen, drag with one finger.
- Panning stops at the first and last bar, so you can't scroll the data off the chart.
- A pan keeps the zoom level: the window is as wide when you let go as it was when you grabbed it.

## Zoom

- **Scroll the mouse wheel** over the plot area to zoom in or out around the cursor.
- **Drag the time axis**, the labels along the bottom, left or right to stretch or compress the time scale.
- **Pinch** on a touch screen.

Zooming into a large table asks the server for finer data. Line, Area, and Baseline series [downsample](downsampling.md) to the visible range at roughly one bucket per pixel column, and Candlestick, Bar, and Histogram series [re-bin](autobin.md) to a shorter bin width, so detail appears as you zoom in.

## Scale the price axis

- **Drag a price axis**, the labels along the left or right edge, up or down to stretch or compress it. This freezes that axis: it stops auto-fitting to the visible data until you [reset the view](#reset-the-view).
- A chart with [multiple panes](multi-pane.md) has a price axis per pane, and you drag each one on its own. All panes share one time axis, so panning and zooming move them together.

## Reset the view

Double-click anywhere on the chart to snap back to the full view: the time axis re-fits to all the data, and every price axis returns to auto-fit. Double-clicking a single axis resets the whole chart the same way.

A chart with an [`on_double_press`](events.md) handler still fires that handler, and still resets.

## Live data

Until the first time you pan or zoom, the chart re-fits on every update so all of its data stays in view. After that it holds the window you chose, and new bars arrive outside it.

If your window ends at the latest bar, the chart follows the live edge: each new bar slides the window along so the newest data stays in view. Pan away from the right edge to stop following, and back to it to start again.

For more control over how the time axis behaves as bars arrive, such as parking the latest bar at the right edge, see [pin the visible range edges](time-scale.md#pin-the-visible-range-edges).

## Numeric-axis charts

[Yield curve](yield-curve.md), [options chart](options-chart.md), and [custom numeric](custom-numeric.md) charts have a numeric horizontal axis instead of time. They pan, zoom, and reset with the same gestures along that axis.
