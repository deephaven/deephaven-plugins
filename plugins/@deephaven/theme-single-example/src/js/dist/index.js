"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const styleContent = `:root {
  --dh-color-bg-hsl: var(--dh-color-purple-100-hsl);
  --dh-color-fg-hsl: var(--dh-color-purple-800-hsl);
  --dh-color-random-area-plot-animation-fg-fill: hsla(
    var(--dh-color-red-700-hsl),
    0.08
  );
  --dh-color-random-area-plot-animation-fg-stroke: hsla(
    var(--dh-color-red-700-hsl),
    0.2
  );
  --dh-color-random-area-plot-animation-bg: var(--dh-color-gray-800);
  --dh-color-editor-bg: var(--dh-color-bg);
  --dh-color-grid-bg: var(--dh-color-bg);
  --dh-color-grid-header-bg: var(--dh-color-purple-200);
  --dh-svg-icon-select-indicator: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 320 512'%3E%3Cpath d='M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z'/%3E%3C/svg%3E");
  --dh-color-chart-bg: var(--dh-color-bg);
  --dh-color-chart-plot-bg: var(--dh-color-bg);
  --dh-color-chart-colorway: var(--dh-color-visual-purple)
    var(--dh-color-visual-green) var(--dh-color-visual-yellow)
    var(--dh-color-visual-purple) var(--dh-color-visual-orange);
}`;
const plugin = {
  name: "Delta Theme Plugin",
  type: "ThemePlugin",
  themes: {
    name: "Delta Purple",
    baseTheme: "dark",
    styleContent
  }
};
exports.default = plugin;
exports.plugin = plugin;
