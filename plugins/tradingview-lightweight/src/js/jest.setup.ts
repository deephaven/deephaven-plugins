/**
 * jsdom doesn't implement the CSS.supports() global, but
 * @deephaven/components' resolveCssVariablesInRecord calls it to detect
 * whether a resolved value parses as a color. Stub it so color-resolution
 * code paths can be exercised under jsdom (we don't need the answer to be
 * correct in unit tests — the renderer just needs the call to succeed).
 */
if (typeof window !== 'undefined') {
  const css = (window as unknown as { CSS?: typeof CSS }).CSS;
  if (css == null || typeof css.supports !== 'function') {
    Object.defineProperty(window, 'CSS', {
      configurable: true,
      writable: true,
      value: { ...(css ?? {}), supports: () => true },
    });
  }
}
