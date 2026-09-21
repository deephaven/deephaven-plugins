import {
  colorValueStyle,
  resolveCssVariablesInRecord,
} from '@deephaven/components';

// Matches a key ending in "color" or "Color", optionally with a numeric
// suffix (baseline's gradient stops are topFillColor1, topFillColor2,
// bottomFillColor1, bottomFillColor2 — without the \d* they'd be skipped
// and DH theme names like "positive" would reach the canvas unresolved).
const COLOR_KEY_RE = /[Cc]olor\d*$|^color$|^colorway$/;

/**
 * Resolve a single user-supplied color string into a value that
 * lightweight-charts can paint into a canvas.
 *
 * Accepts:
 *   - DH theme color names (e.g. "seafoam-500", "accent-300", "positive")
 *   - var(--dh-color-...) expressions
 *   - any standard CSS color (hex, named, rgb/rgba)
 *
 * DH color names are first converted to `var(--dh-color-<name>)`, then all
 * `var(...)` expressions are resolved against the document's computed style
 * (the same mechanism plugins/ui/UITable uses for `background_color="accent-300"`).
 * Non-DH inputs pass through unchanged so the canvas APIs paint them directly.
 *
 * Returns the input unchanged when there is nothing to resolve, including
 * "transparent" and empty strings.
 */
export function resolveColor(value: string | undefined): string | undefined {
  if (value == null || value === '') return value;
  const cssVar = colorValueStyle(value) ?? value;
  // Fast path: no CSS variable to resolve. Avoids the getComputedStyle work
  // and a jsdom-incompatible `CSS.supports` call on every hex/rgba string.
  if (!cssVar.includes('var(')) return cssVar;
  const resolved = resolveCssVariablesInRecord({ v: cssVar });
  return resolved.v;
}

/**
 * Resolve every string value whose key matches a color-like name, returning a
 * copy. Handles arrays, nested objects, and the `colorway: string[]` palette
 * shape.
 *
 * This lets users pass DH theme names anywhere lightweight-charts accepts a
 * color (series colors, layout/grid/crosshair, watermark, price lines, etc.)
 * without us having to enumerate the dozens of color keys in the LWC option
 * tree.
 *
 * Returns a copy rather than mutating: the caller's object is the model's
 * source of truth, and overwriting a theme token with the concrete color it
 * resolved to leaves nothing to re-resolve on a theme change.
 */
export function resolveColorsDeep<T>(obj: T): T {
  if (obj == null || typeof obj !== 'object') return obj;
  return walk(obj) as T;
}

function walk(node: unknown): unknown {
  if (node == null || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    return node.map(v =>
      // Bare string arrays (e.g. a colorway palette) — assume they're colors.
      // No-op for non-color strings since resolveColor passes them through.
      typeof v === 'string' ? resolveColor(v) : walk(v)
    );
  }

  const out: Record<string, unknown> = {};
  Object.entries(node as Record<string, unknown>).forEach(([key, val]) => {
    if (typeof val === 'string' && COLOR_KEY_RE.test(key)) {
      out[key] = resolveColor(val);
    } else if (val != null && typeof val === 'object') {
      out[key] = walk(val);
    } else {
      out[key] = val;
    }
  });
  return out;
}
