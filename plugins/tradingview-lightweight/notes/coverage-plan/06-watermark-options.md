# Implementation Plan: Watermark Options (Section 6)

**Coverage target:** Full `TextWatermarkOptions` and `ImageWatermarkOptions` from
TradingView Lightweight Charts v5.1.

**Status before this work:**
- Single-line text watermark only (flattened to `text`, `color`, `fontSize`,
  `horzAlign`, `vertAlign`, `visible`).
- `lineHeight`, `fontFamily`, `fontStyle` not exposed from Python.
- Multi-line text watermarks (`lines[]`) not exposed from Python.
- Image watermarks (`createImageWatermark`) not implemented at all.

---

## 1. Background and Architecture

The plugin is a **static configuration builder**: Python serialises options to
JSON at chart-creation time; the JS frontend applies them.  There is no live
Python handle on a running chart.

The JS renderer (`TradingViewChartRenderer.ts`) already strips the `watermark`
key out of `chartOptions` before calling `createChart()` and feeds it through
its own `applyWatermark()` method that calls `createTextWatermark(pane, opts)`.
The existing `LegacyWatermarkOptions` interface (`text`, `color`, `fontSize`,
`fontFamily`, `fontStyle`, `horzAlign`, `vertAlign`, `visible`) is the bridge
between the flat Python dict and the `lines[]` structure the TVL plugin expects.

The image watermark factory (`createImageWatermark(pane, imageUrl, opts)`) has
no counterpart anywhere in the codebase today.

---

## 2. Feature Gap Summary

| Gap | Python side | JS side |
|-----|-------------|---------|
| `lineHeight` per text line | Missing param | Already in `LegacyWatermarkOptions` declaration but never forwarded in `applyWatermark` |
| `fontFamily` per text line | Missing param | Already forwarded (`wm.fontFamily`) |
| `fontStyle` per text line | Missing param | Already forwarded (`wm.fontStyle`) |
| Multi-line text watermark | No API | Needs new branch in `applyWatermark` |
| Image watermark | No API | Needs new field, new private plugin ref, `createImageWatermark` call |

Note: `fontFamily` and `fontStyle` are already forwarded on the JS side but the
Python `chart()` function has no parameters for them, so users cannot set them.
`lineHeight` appears in `LegacyWatermarkOptions` in a comment but is never read
in `applyWatermark()`.

---

## 3. Pythonic API Design

### 3.1 Guiding Principles

1. **Backwards compatibility is non-negotiable.** All existing
   `watermark_text`, `watermark_color`, `watermark_visible`,
   `watermark_font_size`, `watermark_horz_align`, `watermark_vert_align`
   parameters must keep working identically.

2. **Additive, not replacement.** New parameters supplement the existing flat
   params; the flat params remain the shortcut for the common single-line case.

3. **Pythonic data structures.** Multi-line watermarks use a list of
   `WatermarkLine` dataclass instances (not raw dicts) so IDEs provide
   completion and type checking.

4. **Mutual exclusion with clear error message.** If the caller supplies both
   the legacy flat params and the new `watermark_lines` param, raise
   `ValueError` immediately.

5. **Image watermarks are orthogonal.** They have their own set of `watermark_image_*`
   params and can coexist with text watermarks (TVL supports both simultaneously
   on the same pane).

### 3.2 New Python Types — `options.py`

Add a `WatermarkLine` dataclass and a `WatermarkLineDict` TypedDict to
`src/deephaven/plot/tradingview_lightweight/options.py`:

```text
from dataclasses import dataclass, field
from typing import Optional, TypedDict


@dataclass
class WatermarkLine:
    """One line of a multi-line text watermark.

    All fields are optional; omitted fields inherit TVL defaults
    (fontSize=48, color='rgba(0,0,0,0.5)', lineHeight=1.2*fontSize).

    Args:
        text: The watermark text. Required (the line is skipped if empty).
        color: CSS color string. Defaults to a theme-derived semi-transparent color.
        font_size: Font size in pixels. Defaults to 48.
        line_height: Line height in pixels. Defaults to 1.2 * font_size.
        font_family: CSS font-family string. Defaults to the system font stack.
        font_style: CSS font-style string, e.g. 'italic'. Defaults to ''.
    """

    text: str
    color: Optional[str] = None
    font_size: Optional[int] = None
    line_height: Optional[float] = None
    font_family: Optional[str] = None
    font_style: Optional[str] = None

    def to_dict(self) -> dict:
        """Serialise to the JS LegacyWatermarkLineOptions shape."""
        from .options import _filter_none_watermark_line  # local import avoids circular

        return _filter_none_watermark_line(self)
```

Also add a helper function `_filter_none_watermark_line` in `options.py` (or in
the calling code in `chart.py`) that converts a `WatermarkLine` to a clean dict:

```text
def _watermark_line_to_dict(line: "WatermarkLine") -> dict:
    d: dict = {"text": line.text}
    if line.color is not None:
        d["color"] = line.color
    if line.font_size is not None:
        d["fontSize"] = line.font_size
    if line.line_height is not None:
        d["lineHeight"] = line.line_height
    if line.font_family is not None:
        d["fontFamily"] = line.font_family
    if line.font_style is not None:
        d["fontStyle"] = line.font_style
    return d
```

Export `WatermarkLine` from the package `__init__.py` so users can import it
without knowing internal module structure:

```text
# in src/deephaven/plot/tradingview_lightweight/__init__.py
from .options import WatermarkLine
```

### 3.3 New Parameters for `chart()` — `chart.py`

Add these parameters to the `chart()` signature, in the existing `# Watermark`
block:

```text
# Watermark — single-line shortcut (backwards-compatible)
watermark_text: Optional[str] = (None,)
watermark_color: Optional[str] = (None,)
watermark_visible: Optional[bool] = (None,)
watermark_font_size: Optional[int] = (None,)
watermark_font_family: Optional[str] = (None,)  # NEW
watermark_font_style: Optional[str] = (None,)  # NEW
watermark_line_height: Optional[float] = (None,)  # NEW
watermark_horz_align: Optional[str] = (None,)
watermark_vert_align: Optional[str] = (None,)
# Watermark — multi-line (mutually exclusive with the single-line shortcut)
watermark_lines: Optional[list["WatermarkLine"]] = (None,)  # NEW
# Watermark — image (independent; can coexist with text watermark)
watermark_image_url: Optional[str] = (None,)  # NEW
watermark_image_max_width: Optional[int] = (None,)  # NEW
watermark_image_max_height: Optional[int] = (None,)  # NEW
watermark_image_padding: Optional[int] = (None,)  # NEW
watermark_image_alpha: Optional[float] = (None,)  # NEW
watermark_image_visible: Optional[bool] = (None,)  # NEW
```

### 3.4 Serialisation Logic in `chart()` — `chart.py`

Replace the existing watermark block (lines 476–490 of `chart.py`) with:

```text
# --- Watermark ---

# Validate mutual exclusion
if watermark_lines is not None and watermark_text is not None:
    raise ValueError(
        "Provide either 'watermark_text' (single-line shortcut) or "
        "'watermark_lines' (multi-line), not both."
    )

if watermark_lines is not None:
    # Multi-line path: serialise each WatermarkLine to a dict
    lines_payload = [_watermark_line_to_dict(ln) for ln in watermark_lines]
    wm: dict = {
        "lines": lines_payload,
    }
    if watermark_visible is not None:
        wm["visible"] = watermark_visible
    elif lines_payload:
        wm["visible"] = True
    if watermark_horz_align is not None:
        wm["horzAlign"] = watermark_horz_align
    if watermark_vert_align is not None:
        wm["vertAlign"] = watermark_vert_align
    chart_options["watermark"] = wm

elif watermark_text is not None or watermark_visible is not None:
    # Legacy single-line path (fully backwards-compatible)
    wm = _filter_none(
        {
            "text": watermark_text,
            "color": watermark_color,
            "visible": watermark_visible
            if watermark_visible is not None
            else (True if watermark_text else None),
            "fontSize": watermark_font_size,
            "fontFamily": watermark_font_family,  # NEW
            "fontStyle": watermark_font_style,  # NEW
            "lineHeight": watermark_line_height,  # NEW
            "horzAlign": watermark_horz_align,
            "vertAlign": watermark_vert_align,
        }
    )
    if wm:
        chart_options["watermark"] = wm

# Image watermark (orthogonal to text watermark)
img_wm = _filter_none(
    {
        "url": watermark_image_url,
        "maxWidth": watermark_image_max_width,
        "maxHeight": watermark_image_max_height,
        "padding": watermark_image_padding,
        "alpha": watermark_image_alpha,
        "visible": watermark_image_visible
        if watermark_image_visible is not None
        else (True if watermark_image_url else None),
    }
)
if img_wm:
    chart_options["imageWatermark"] = img_wm
```

The serialised JSON wire format therefore looks like:

**Legacy single-line (unchanged):**
```json
{
  "watermark": {
    "text": "AAPL",
    "color": "rgba(0,0,0,0.2)",
    "visible": true,
    "fontSize": 48,
    "horzAlign": "center",
    "vertAlign": "center"
  }
}
```

**Multi-line text watermark (new):**
```json
{
  "watermark": {
    "visible": true,
    "horzAlign": "left",
    "vertAlign": "bottom",
    "lines": [
      { "text": "AAPL",    "fontSize": 72, "fontStyle": "italic" },
      { "text": "Apple Inc", "fontSize": 32, "color": "rgba(100,100,100,0.3)" }
    ]
  }
}
```

**Image watermark (new):**
```json
{
  "imageWatermark": {
    "url": "https://example.com/logo.png",
    "maxWidth": 200,
    "maxHeight": 100,
    "padding": 10,
    "alpha": 0.5,
    "visible": true
  }
}
```

Both can be present simultaneously.

---

## 4. JS Side Changes

### 4.1 `TradingViewChartRenderer.ts` — New Interfaces

Add an `ImageWatermarkConfig` interface alongside `LegacyWatermarkOptions`:

```typescript
/** Per-line options for multi-line text watermarks. */
interface WatermarkLineOptions {
  text: string;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  fontStyle?: string;
}

/**
 * Multi-line text watermark shape (new).
 * Sent when Python uses watermark_lines=[...].
 */
interface MultiLineWatermarkOptions {
  visible?: boolean;
  horzAlign?: string;
  vertAlign?: string;
  lines: WatermarkLineOptions[];
}

/**
 * Image watermark config as serialised by the Python API.
 */
interface ImageWatermarkConfig {
  url: string;
  maxWidth?: number;
  maxHeight?: number;
  padding?: number;
  alpha?: number;
  visible?: boolean;
}
```

Also extend `LegacyWatermarkOptions` to include the missing `lineHeight` field
(it was declared in a comment but not in the interface):

```typescript
interface LegacyWatermarkOptions {
  text?: string;
  color?: string;
  visible?: boolean;
  fontSize?: number;
  lineHeight?: number;  // was missing — add here
  fontFamily?: string;
  fontStyle?: string;
  horzAlign?: string;
  vertAlign?: string;
}
```

### 4.2 `TradingViewChartRenderer.ts` — New Private Field

Add an `imageWatermarkPlugin` private field alongside the existing
`watermarkPlugin`:

```typescript
private watermarkPlugin: ITextWatermarkPluginApi<Time> | null = null;
private imageWatermarkPlugin: IImageWatermarkPluginApi<Time> | null = null;
```

Import `createImageWatermark` and `IImageWatermarkPluginApi` from
`lightweight-charts` at the top of the file (check if the TVL v5.1 package
exports them; if not, dynamic import may be needed):

```typescript
import {
  createTextWatermark,
  createImageWatermark,
  ITextWatermarkPluginApi,
  IImageWatermarkPluginApi,
  ImageWatermarkOptions,
  TextWatermarkOptions,
  // ...existing imports
} from 'lightweight-charts';
```

### 4.3 `TradingViewChartRenderer.ts` — Update Constructor and `applyOptions`

In the constructor, extract `imageWatermark` alongside `watermark`:

```typescript
const {
  watermark: wmRaw,
  imageWatermark: imgWmRaw,
  ...rawOpts
} = options as Record<string, unknown>;
```

After chart creation, apply both:

```typescript
if (wmRaw != null) {
  this.applyWatermark(wmRaw as LegacyWatermarkOptions | MultiLineWatermarkOptions);
}
if (imgWmRaw != null) {
  this.applyImageWatermark(imgWmRaw as ImageWatermarkConfig);
}
```

Apply the same extraction pattern in `applyOptions()`.

### 4.4 `TradingViewChartRenderer.ts` — Update `applyWatermark`

The existing `applyWatermark` method handles only the legacy flat shape.
Update it to also handle the multi-line shape by detecting which variant was
received:

```typescript
private applyWatermark(
  wm: LegacyWatermarkOptions | MultiLineWatermarkOptions
): void {
  // --- Determine if this is a multi-line payload ---
  const isMultiLine = 'lines' in wm && Array.isArray(wm.lines);

  if (isMultiLine) {
    this.applyMultiLineWatermark(wm as MultiLineWatermarkOptions);
  } else {
    this.applyLegacyWatermark(wm as LegacyWatermarkOptions);
  }
}

/** New method: handles watermark_lines=[...] payloads. */
private applyMultiLineWatermark(wm: MultiLineWatermarkOptions): void {
  if (wm.visible === false || !wm.lines || wm.lines.length === 0) {
    if (this.watermarkPlugin) {
      this.watermarkPlugin.detach();
      this.watermarkPlugin = null;
    }
    return;
  }

  const wmOptions: DeepPartial<TextWatermarkOptions> = {
    visible: wm.visible ?? true,
    horzAlign: (wm.horzAlign as TextWatermarkOptions['horzAlign']) ?? 'center',
    vertAlign: (wm.vertAlign as TextWatermarkOptions['vertAlign']) ?? 'center',
    lines: wm.lines.map(ln => ({
      text: ln.text,
      color: ln.color ?? deriveWatermarkColor(this.textColor),
      fontSize: ln.fontSize,       // undefined → TVL default (48)
      lineHeight: ln.lineHeight,   // undefined → TVL default (1.2 * fontSize)
      fontFamily: ln.fontFamily,
      fontStyle: ln.fontStyle,
    })),
  };

  if (this.watermarkPlugin) {
    this.watermarkPlugin.applyOptions(wmOptions);
  } else {
    this.watermarkPlugin = createTextWatermark(this.chart.panes()[0], wmOptions);
  }
}

/** Existing logic, extracted into its own method; now also forwards lineHeight. */
private applyLegacyWatermark(wm: LegacyWatermarkOptions): void {
  if (wm.visible === false || !wm.text) {
    if (this.watermarkPlugin) {
      this.watermarkPlugin.detach();
      this.watermarkPlugin = null;
    }
    return;
  }

  const wmOptions: DeepPartial<TextWatermarkOptions> = {
    visible: wm.visible ?? true,
    horzAlign: (wm.horzAlign as TextWatermarkOptions['horzAlign']) ?? 'center',
    vertAlign: (wm.vertAlign as TextWatermarkOptions['vertAlign']) ?? 'center',
    lines: [
      {
        text: wm.text,
        color: wm.color ?? deriveWatermarkColor(this.textColor),
        fontSize: wm.fontSize ?? DEFAULT_WATERMARK_FONT_SIZE,
        lineHeight: wm.lineHeight,  // NEW — was missing
        fontFamily: wm.fontFamily,
        fontStyle: wm.fontStyle,
      },
    ],
  };

  if (this.watermarkPlugin) {
    this.watermarkPlugin.applyOptions(wmOptions);
  } else {
    this.watermarkPlugin = createTextWatermark(this.chart.panes()[0], wmOptions);
  }
}
```

### 4.5 `TradingViewChartRenderer.ts` — New `applyImageWatermark` Method

```typescript
private applyImageWatermark(cfg: ImageWatermarkConfig): void {
  if (cfg.visible === false || !cfg.url) {
    if (this.imageWatermarkPlugin) {
      this.imageWatermarkPlugin.detach();
      this.imageWatermarkPlugin = null;
    }
    return;
  }

  const imgOptions: DeepPartial<ImageWatermarkOptions> = {};
  if (cfg.maxWidth !== undefined)  imgOptions.maxWidth  = cfg.maxWidth;
  if (cfg.maxHeight !== undefined) imgOptions.maxHeight = cfg.maxHeight;
  if (cfg.padding   !== undefined) imgOptions.padding   = cfg.padding;
  if (cfg.alpha     !== undefined) imgOptions.alpha     = cfg.alpha;

  if (this.imageWatermarkPlugin) {
    // There is no way to change the imageUrl after creation in TVL v5.1.
    // Detach and recreate if url differs.
    this.imageWatermarkPlugin.detach();
    this.imageWatermarkPlugin = null;
  }
  this.imageWatermarkPlugin = createImageWatermark(
    this.chart.panes()[0],
    cfg.url,
    imgOptions
  );
}
```

### 4.6 `TradingViewChartRenderer.ts` — Update `dispose`

```typescript
dispose(): void {
  // ... existing cleanup ...
  if (this.watermarkPlugin) {
    this.watermarkPlugin.detach();
    this.watermarkPlugin = null;
  }
  if (this.imageWatermarkPlugin) {       // NEW
    this.imageWatermarkPlugin.detach();  // NEW
    this.imageWatermarkPlugin = null;    // NEW
  }
  this.chart.remove();
}
```

### 4.7 `__mocks__/lightweight-charts.js` — Add `createImageWatermark`

```javascript
const mockImageWatermarkPlugin = {
  applyOptions: jest.fn(),
  detach: jest.fn(),
};

const createImageWatermark = jest.fn(() => mockImageWatermarkPlugin);

module.exports = {
  // ...existing exports...
  createImageWatermark,
  __mockImageWatermarkPlugin: mockImageWatermarkPlugin,
};
```

---

## 5. Convenience Function Updates

The existing `candlestick()` and `line()` convenience functions expose only
`watermark_text` in their signatures. They should receive the full new set for
parity. However, since all convenience functions ultimately call `chart()`, the
simplest approach is to add `**kwargs` forwarding of watermark params to the
convenience functions so users are not blocked from using new features without
calling `chart()` directly.

Preferred approach: explicitly add all new watermark params to the signatures of
`candlestick()`, `line()`, `area()`, `bar()`, `baseline()`, and
`histogram()` (and the internal `_make_chart_kwargs` helper if one is
extracted), so the params appear in IDE completion:

```text
watermark_lines: Optional[list["WatermarkLine"]] = (None,)
watermark_font_family: Optional[str] = (None,)
watermark_font_style: Optional[str] = (None,)
watermark_line_height: Optional[float] = (None,)
watermark_image_url: Optional[str] = (None,)
watermark_image_max_width: Optional[int] = (None,)
watermark_image_max_height: Optional[int] = (None,)
watermark_image_padding: Optional[int] = (None,)
watermark_image_alpha: Optional[float] = (None,)
watermark_image_visible: Optional[bool] = (None,)
```

All of these should be forwarded through to the `chart()` call inside each
convenience function.

---

## 6. Backwards Compatibility Matrix

| Caller pattern | After this change |
|---|---|
| `chart(s, watermark_text="AAPL")` | Unchanged — still creates single-line watermark, `visible=True` auto-set |
| `chart(s, watermark_text="AAPL", watermark_color="rgba(0,0,0,0.2)")` | Unchanged |
| `chart(s, watermark_text="AAPL", watermark_font_size=64)` | Unchanged |
| `chart(s, watermark_text="AAPL", watermark_visible=False)` | Unchanged |
| `chart(s, watermark_visible=False)` | Unchanged |
| `chart(s)` — no watermark | Unchanged — `"watermark"` key absent from chartOptions |
| `chart(s, watermark_text="X", watermark_lines=[...])` | Raises `ValueError` with clear message |

---

## 7. Python Test Coverage (`test_chart.py`)

All new tests go into `TestChartFunction` (or a new `TestWatermarkOptions`
nested class). The test file already mocks `deephaven` imports and uses
`MagicMock` tables.

### 7.1 New single-line params (backwards-compat + new fields)

```text
def test_watermark_single_line_new_fields(self):
    """fontFamily, fontStyle, lineHeight are forwarded in single-line mode."""
    s = line_series(self.table)
    c = chart(
        s,
        watermark_text="AAPL",
        watermark_font_family="monospace",
        watermark_font_style="italic",
        watermark_line_height=80.0,
    )
    wm = c.chart_options["watermark"]
    self.assertEqual(wm["text"], "AAPL")
    self.assertEqual(wm["fontFamily"], "monospace")
    self.assertEqual(wm["fontStyle"], "italic")
    self.assertEqual(wm["lineHeight"], 80.0)
    self.assertNotIn("lines", wm)  # still legacy shape


def test_watermark_single_line_omitted_new_fields(self):
    """Omitted new fields do not appear in the serialised dict."""
    s = line_series(self.table)
    c = chart(s, watermark_text="AAPL")
    wm = c.chart_options["watermark"]
    self.assertNotIn("fontFamily", wm)
    self.assertNotIn("fontStyle", wm)
    self.assertNotIn("lineHeight", wm)
```

### 7.2 Multi-line watermark

```text
def test_watermark_multi_line_basic(self):
    """watermark_lines produces a lines[] array in the watermark dict."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    s = line_series(self.table)
    c = chart(
        s,
        watermark_lines=[
            WatermarkLine(text="AAPL", font_size=72, font_style="italic"),
            WatermarkLine(
                text="Apple Inc", font_size=32, color="rgba(100,100,100,0.3)"
            ),
        ],
        watermark_horz_align="left",
        watermark_vert_align="bottom",
    )
    wm = c.chart_options["watermark"]
    self.assertTrue(wm["visible"])
    self.assertEqual(wm["horzAlign"], "left")
    self.assertEqual(wm["vertAlign"], "bottom")
    self.assertEqual(len(wm["lines"]), 2)

    line0 = wm["lines"][0]
    self.assertEqual(line0["text"], "AAPL")
    self.assertEqual(line0["fontSize"], 72)
    self.assertEqual(line0["fontStyle"], "italic")
    self.assertNotIn("color", line0)  # not specified → omitted
    self.assertNotIn("lineHeight", line0)

    line1 = wm["lines"][1]
    self.assertEqual(line1["text"], "Apple Inc")
    self.assertEqual(line1["fontSize"], 32)
    self.assertEqual(line1["color"], "rgba(100,100,100,0.3)")


def test_watermark_multi_line_no_text_key(self):
    """Multi-line path must NOT produce a top-level 'text' key."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    s = line_series(self.table)
    c = chart(s, watermark_lines=[WatermarkLine(text="AAPL")])
    wm = c.chart_options["watermark"]
    self.assertNotIn("text", wm)
    self.assertIn("lines", wm)


def test_watermark_multi_line_visible_false(self):
    """watermark_visible=False is respected with watermark_lines."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    s = line_series(self.table)
    c = chart(
        s,
        watermark_lines=[WatermarkLine(text="AAPL")],
        watermark_visible=False,
    )
    wm = c.chart_options["watermark"]
    self.assertFalse(wm["visible"])


def test_watermark_multi_line_auto_visible(self):
    """watermark_lines without watermark_visible auto-sets visible=True."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    s = line_series(self.table)
    c = chart(s, watermark_lines=[WatermarkLine(text="AAPL")])
    self.assertTrue(c.chart_options["watermark"]["visible"])


def test_watermark_line_height_in_line(self):
    """lineHeight on a WatermarkLine is serialised correctly."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    s = line_series(self.table)
    c = chart(
        s,
        watermark_lines=[WatermarkLine(text="X", line_height=90.0)],
    )
    line0 = c.chart_options["watermark"]["lines"][0]
    self.assertEqual(line0["lineHeight"], 90.0)


def test_watermark_mutual_exclusion_raises(self):
    """Providing both watermark_text and watermark_lines must raise ValueError."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    s = line_series(self.table)
    with self.assertRaises(ValueError) as ctx:
        chart(
            s,
            watermark_text="AAPL",
            watermark_lines=[WatermarkLine(text="AAPL")],
        )
    self.assertIn("watermark_text", str(ctx.exception))
    self.assertIn("watermark_lines", str(ctx.exception))
```

### 7.3 Image watermark

```text
def test_watermark_image_basic(self):
    """Image watermark params produce an 'imageWatermark' key."""
    s = line_series(self.table)
    c = chart(
        s,
        watermark_image_url="https://example.com/logo.png",
        watermark_image_max_width=200,
        watermark_image_max_height=100,
        watermark_image_padding=10,
        watermark_image_alpha=0.5,
    )
    img = c.chart_options["imageWatermark"]
    self.assertEqual(img["url"], "https://example.com/logo.png")
    self.assertEqual(img["maxWidth"], 200)
    self.assertEqual(img["maxHeight"], 100)
    self.assertEqual(img["padding"], 10)
    self.assertEqual(img["alpha"], 0.5)
    self.assertTrue(img["visible"])  # auto-set when url is provided


def test_watermark_image_no_url_no_key(self):
    """No imageWatermark key when url is not given."""
    s = line_series(self.table)
    c = chart(s, watermark_image_max_width=200)
    self.assertNotIn("imageWatermark", c.chart_options)


def test_watermark_image_visible_false(self):
    s = line_series(self.table)
    c = chart(
        s,
        watermark_image_url="https://example.com/logo.png",
        watermark_image_visible=False,
    )
    self.assertFalse(c.chart_options["imageWatermark"]["visible"])


def test_watermark_image_url_only(self):
    """Minimal image watermark with only url."""
    s = line_series(self.table)
    c = chart(s, watermark_image_url="https://example.com/logo.png")
    img = c.chart_options["imageWatermark"]
    self.assertEqual(img["url"], "https://example.com/logo.png")
    self.assertNotIn("maxWidth", img)
    self.assertNotIn("maxHeight", img)
    self.assertNotIn("padding", img)
    self.assertNotIn("alpha", img)


def test_watermark_image_and_text_coexist(self):
    """Text and image watermarks can be set simultaneously."""
    s = line_series(self.table)
    c = chart(
        s,
        watermark_text="AAPL",
        watermark_image_url="https://example.com/logo.png",
    )
    self.assertIn("watermark", c.chart_options)
    self.assertIn("imageWatermark", c.chart_options)


def test_watermark_image_and_multiline_coexist(self):
    """Multi-line text and image watermarks can be set simultaneously."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    s = line_series(self.table)
    c = chart(
        s,
        watermark_lines=[WatermarkLine(text="AAPL")],
        watermark_image_url="https://example.com/logo.png",
    )
    self.assertIn("watermark", c.chart_options)
    self.assertIn("imageWatermark", c.chart_options)
```

### 7.4 Backwards-compatibility regression guard

```text
def test_watermark_options_backward_compat(self):
    """Existing tests still pass: single-line params produce unchanged shape."""
    s = line_series(self.table)
    c = chart(
        s,
        watermark_text="AAPL",
        watermark_color="rgba(0,0,0,0.2)",
        watermark_visible=True,
        watermark_font_size=48,
        watermark_horz_align="center",
        watermark_vert_align="center",
    )
    wm = c.chart_options["watermark"]
    self.assertEqual(wm["text"], "AAPL")
    self.assertEqual(wm["color"], "rgba(0,0,0,0.2)")
    self.assertTrue(wm["visible"])
    self.assertEqual(wm["fontSize"], 48)
    self.assertEqual(wm["horzAlign"], "center")
    self.assertEqual(wm["vertAlign"], "center")
    self.assertNotIn("lines", wm)  # still legacy flat shape
    self.assertNotIn("imageWatermark", c.chart_options)
```

---

## 8. JS Test Coverage (`TradingViewChartRenderer.test.ts`)

Add to the existing `describe('watermark', ...)` block.

### 8.1 Multi-line text watermark

```typescript
it('should create a text watermark from multi-line lines[] payload', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    watermark: {
      visible: true,
      horzAlign: 'left',
      vertAlign: 'bottom',
      lines: [
        { text: 'AAPL', fontSize: 72, fontStyle: 'italic' },
        { text: 'Apple Inc', fontSize: 32, color: 'rgba(100,100,100,0.3)' },
      ],
    },
  } as never);

  expect(createTextWatermark).toHaveBeenCalledTimes(1);
  const [, opts] = (createTextWatermark as jest.Mock).mock.calls[0];
  expect(opts.horzAlign).toBe('left');
  expect(opts.vertAlign).toBe('bottom');
  expect(opts.lines).toHaveLength(2);
  expect(opts.lines[0]).toMatchObject({ text: 'AAPL', fontSize: 72, fontStyle: 'italic' });
  expect(opts.lines[1]).toMatchObject({ text: 'Apple Inc', fontSize: 32 });
});

it('should derive color for multi-line lines that omit color', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    layout: { textColor: '#FF0000' },
    watermark: {
      lines: [{ text: 'AAPL' }],
    },
  } as never);

  const [, opts] = (createTextWatermark as jest.Mock).mock.calls[0];
  // Color should be derived from #FF0000 at 0.2 alpha
  expect(opts.lines[0].color).toContain('255, 0, 0');
});

it('should not create watermark for empty multi-line lines array', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    watermark: { lines: [] },
  } as never);
  expect(createTextWatermark).not.toHaveBeenCalled();
});

it('should not create watermark when multi-line visible=false', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    watermark: { visible: false, lines: [{ text: 'AAPL' }] },
  } as never);
  expect(createTextWatermark).not.toHaveBeenCalled();
});

it('should forward lineHeight from legacy flat watermark', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    watermark: { text: 'AAPL', lineHeight: 90 },
  } as never);

  const [, opts] = (createTextWatermark as jest.Mock).mock.calls[0];
  expect(opts.lines[0].lineHeight).toBe(90);
});
```

### 8.2 Image watermark

```typescript
it('should create an image watermark plugin when imageWatermark options are provided', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    imageWatermark: {
      url: 'https://example.com/logo.png',
      maxWidth: 200,
      maxHeight: 100,
      padding: 10,
      alpha: 0.5,
    },
  } as never);

  expect(createImageWatermark).toHaveBeenCalledTimes(1);
  expect(createImageWatermark).toHaveBeenCalledWith(
    mockPane,
    'https://example.com/logo.png',
    expect.objectContaining({ maxWidth: 200, maxHeight: 100, padding: 10, alpha: 0.5 })
  );
});

it('should not create image watermark when no imageWatermark provided', () => {
  createRenderer();
  expect(createImageWatermark).not.toHaveBeenCalled();
});

it('should not create image watermark when url is missing', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    imageWatermark: { maxWidth: 200 },
  } as never);
  expect(createImageWatermark).not.toHaveBeenCalled();
});

it('should not create image watermark when visible=false', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    imageWatermark: { url: 'https://example.com/logo.png', visible: false },
  } as never);
  expect(createImageWatermark).not.toHaveBeenCalled();
});

it('should detach image watermark on dispose', () => {
  const container = document.createElement('div');
  const renderer = new TradingViewChartRenderer(container, {
    imageWatermark: { url: 'https://example.com/logo.png' },
  } as never);
  renderer.dispose();
  expect(mockImageWatermarkPlugin.detach).toHaveBeenCalledTimes(1);
});

it('should recreate image watermark on url change via applyOptions', () => {
  const container = document.createElement('div');
  const renderer = new TradingViewChartRenderer(container, {
    imageWatermark: { url: 'https://example.com/logo1.png' },
  } as never);

  renderer.applyOptions({
    imageWatermark: { url: 'https://example.com/logo2.png' },
  } as never);

  // First plugin should have been detached; a new one created with new url
  expect(mockImageWatermarkPlugin.detach).toHaveBeenCalledTimes(1);
  expect(createImageWatermark).toHaveBeenCalledTimes(2);
  expect((createImageWatermark as jest.Mock).mock.calls[1][1]).toBe(
    'https://example.com/logo2.png'
  );
});

it('should not pass imageWatermark key to createChart', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    imageWatermark: { url: 'https://example.com/logo.png' },
  } as never);
  const createChartOptions = createChart.mock.calls[0][1];
  expect(createChartOptions).not.toHaveProperty('imageWatermark');
});

it('should create both text and image watermarks when both specified', () => {
  const container = document.createElement('div');
  new TradingViewChartRenderer(container, {
    watermark: { text: 'AAPL' },
    imageWatermark: { url: 'https://example.com/logo.png' },
  } as never);
  expect(createTextWatermark).toHaveBeenCalledTimes(1);
  expect(createImageWatermark).toHaveBeenCalledTimes(1);
});
```

---

## 9. `WatermarkLine` Dataclass — Additional Validation

Add validation in `WatermarkLine.__post_init__` (if using `@dataclass`) to
reject obviously wrong values early:

```text
from dataclasses import dataclass
import dataclasses


@dataclass
class WatermarkLine:
    text: str
    color: Optional[str] = None
    font_size: Optional[int] = None
    line_height: Optional[float] = None
    font_family: Optional[str] = None
    font_style: Optional[str] = None

    def __post_init__(self) -> None:
        if not isinstance(self.text, str):
            raise TypeError(f"WatermarkLine.text must be str, got {type(self.text)!r}")
        if self.font_size is not None and self.font_size <= 0:
            raise ValueError(
                f"WatermarkLine.font_size must be > 0, got {self.font_size}"
            )
        if self.line_height is not None and self.line_height <= 0:
            raise ValueError(
                f"WatermarkLine.line_height must be > 0, got {self.line_height}"
            )
        if self.font_size is not None and not isinstance(self.font_size, int):
            raise TypeError(
                f"WatermarkLine.font_size must be int, got {type(self.font_size)!r}"
            )
```

Add Python tests for these validations in a `TestWatermarkLine` class in a new
or existing test file (e.g., `test_options.py`):

```text
def test_watermark_line_empty_text_allowed(self):
    """Empty string text is allowed at the dataclass level (JS skips empty lines)."""
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    ln = WatermarkLine(text="")  # should not raise


def test_watermark_line_invalid_font_size(self):
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    with self.assertRaises(ValueError):
        WatermarkLine(text="X", font_size=-1)


def test_watermark_line_invalid_line_height(self):
    from deephaven.plot.tradingview_lightweight.options import WatermarkLine

    with self.assertRaises(ValueError):
        WatermarkLine(text="X", line_height=0.0)


def test_watermark_line_to_dict_omits_none(self):
    from deephaven.plot.tradingview_lightweight.options import (
        WatermarkLine,
        _watermark_line_to_dict,
    )

    ln = WatermarkLine(text="AAPL", font_size=48)
    d = _watermark_line_to_dict(ln)
    self.assertEqual(d, {"text": "AAPL", "fontSize": 48})
    self.assertNotIn("color", d)
    self.assertNotIn("lineHeight", d)
    self.assertNotIn("fontFamily", d)
    self.assertNotIn("fontStyle", d)
```

---

## 10. Public API Exports and `__init__.py`

Update `src/deephaven/plot/tradingview_lightweight/__init__.py` to export the
new type:

```text
from .options import WatermarkLine
```

Check that `WatermarkLine` is listed in `__all__` if that list exists.

---

## 11. Implementation Order (for the implementing agent)

1. **`options.py`** — Add `WatermarkLine` dataclass and `_watermark_line_to_dict`
   helper. No dependencies on other changes.

2. **`chart.py`** — Import `WatermarkLine` and `_watermark_line_to_dict` from
   `options`. Update `chart()` signature and watermark serialisation block.
   Update all convenience functions to forward new params.

3. **`__init__.py`** — Export `WatermarkLine`.

4. **`test_chart.py`** — Add all Python tests listed in §7.

5. **`__mocks__/lightweight-charts.js`** — Add `mockImageWatermarkPlugin` and
   `createImageWatermark`. Run existing JS tests to confirm no regressions.

6. **`TradingViewChartRenderer.ts`** — Add new interfaces, new private field,
   refactor `applyWatermark` into `applyLegacyWatermark` and
   `applyMultiLineWatermark`, add `applyImageWatermark`, update constructor,
   `applyOptions`, and `dispose`. Import `createImageWatermark` etc.

7. **`TradingViewChartRenderer.test.ts`** — Add JS tests listed in §8.

8. Run `python -m pytest test/` and `npx jest --verbose` and fix any failures.

9. Run `npx tsc --noEmit` in `src/js/` to verify TypeScript types are correct.

---

## 12. Edge Cases and Caveats

- **`lineHeight` omitted vs. `undefined`**: The JS side should pass `undefined`
  (not `null`) to the TVL `lines[]` entries when lineHeight is not set, so TVL
  applies its own default (1.2 × fontSize). Using `_filter_none` on the Python
  side and omitting the key from the dict ensures the JS receives no value for
  that key.

- **Image watermark URL immutability**: TVL's `createImageWatermark` takes the
  URL at construction and provides no `setUrl()` method. If `applyOptions` is
  called with a different `url`, the JS must detach the old plugin and create a
  new one (see §4.5).

- **Multi-pane charts**: Both `createTextWatermark` and `createImageWatermark`
  are attached to `this.chart.panes()[0]`. This is the same behaviour as the
  existing text watermark. For multi-pane charts, only pane 0 gets the
  watermark. A future enhancement could accept a `pane_index` param but that
  is out of scope for this work item.

- **`fontFamily` and `fontStyle` already wired in JS legacy path**: The existing
  `applyLegacyWatermark` already reads `wm.fontFamily` and `wm.fontStyle` and
  passes them through. The only Python-side change needed is adding the two
  parameters to `chart()`. The JS change is adding `lineHeight` to the line
  object (previously omitted from the read path).

- **`watermark_image_alpha` range**: TVL accepts 0–1. Consider adding a Python
  validation (`if watermark_image_alpha is not None and not 0.0 <= watermark_image_alpha <= 1.0: raise ValueError(...)`) in the `chart()` function. Alternatively, document
  the constraint in the docstring and let TVL silently clamp.

- **TypeScript import availability**: Verify that `createImageWatermark` and
  `IImageWatermarkPluginApi` are actually exported from the `lightweight-charts`
  package version pinned in `package.json`. If they are exported from a
  sub-path, adjust the import accordingly.

---

## 13. Quick-Reference: Complete Wire Format After Changes

```
chartOptions (sent to JS):
{
  "watermark": {                 // optional — text watermark
    // Legacy single-line shape (backwards-compat):
    "text": "AAPL",
    "color": "rgba(0,0,0,0.2)",
    "visible": true,
    "fontSize": 48,
    "fontFamily": "monospace",   // new
    "fontStyle": "italic",       // new
    "lineHeight": 60.0,          // new
    "horzAlign": "center",
    "vertAlign": "center"

    // OR multi-line shape (new):
    "visible": true,
    "horzAlign": "left",
    "vertAlign": "bottom",
    "lines": [
      {
        "text": "AAPL",
        "fontSize": 72,
        "fontStyle": "italic",
        "lineHeight": 86.4,
        "fontFamily": "Georgia",
        "color": "rgba(0,0,0,0.3)"
      },
      {
        "text": "Apple Inc",
        "fontSize": 32
      }
    ]
  },
  "imageWatermark": {            // optional — image watermark (new)
    "url": "https://example.com/logo.png",
    "maxWidth": 200,
    "maxHeight": 100,
    "padding": 10,
    "alpha": 0.5,
    "visible": true
  }
}
```

---

## 14. Coverage Delta After Implementation

| # | Property | Status Before | Status After |
|---|---|:---:|:---:|
| TextWatermarkOptions.visible | ✅ | ✅ |
| TextWatermarkOptions.horzAlign | ✅ | ✅ |
| TextWatermarkOptions.vertAlign | ✅ | ✅ |
| TextWatermarkOptions.lines (multi-line) | ⚠️ | ✅ |
| TextWatermarkLineOptions.text | ✅ | ✅ |
| TextWatermarkLineOptions.color | ✅ | ✅ |
| TextWatermarkLineOptions.fontSize | ✅ | ✅ |
| TextWatermarkLineOptions.lineHeight | ❌ | ✅ |
| TextWatermarkLineOptions.fontFamily | ❌ | ✅ |
| TextWatermarkLineOptions.fontStyle | ❌ | ✅ |
| ImageWatermarkOptions.maxWidth | ❌ | ✅ |
| ImageWatermarkOptions.maxHeight | ❌ | ✅ |
| ImageWatermarkOptions.padding | ❌ | ✅ |
| ImageWatermarkOptions.alpha | ❌ | ✅ |
