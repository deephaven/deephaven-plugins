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
 * Walk an options object and resolve every string value whose key matches a
 * color-like name in place. Handles arrays, nested objects, and the
 * `colorway: string[]` palette shape. Mutates the input.
 *
 * This lets users pass DH theme names anywhere lightweight-charts accepts a
 * color (series colors, layout/grid/crosshair, watermark, price lines, etc.)
 * without us having to enumerate the dozens of color keys in the LWC option
 * tree.
 */
export function resolveColorsDeep<T>(obj: T): T {
  if (obj == null || typeof obj !== 'object') return obj;
  walk(obj as Record<string, unknown>);
  return obj;
}

function walk(node: unknown): void {
  if (node == null || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      const v = node[i];
      if (typeof v === 'string') {
        // Bare string arrays (e.g. a colorway palette) — assume they're colors.
        // No-op for non-color strings since resolveColor passes them through.
        node[i] = resolveColor(v);
      } else {
        walk(v);
      }
    }
    return;
  }

  const record = node as Record<string, unknown>;
  Object.entries(record).forEach(([key, val]) => {
    if (typeof val === 'string' && COLOR_KEY_RE.test(key)) {
      record[key] = resolveColor(val);
    } else if (val != null && typeof val === 'object') {
      walk(val);
    }
  });
}
