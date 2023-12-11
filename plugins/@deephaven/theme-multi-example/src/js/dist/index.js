"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const acmeLight = ":root {\n  /* Semantic */\n  --dh-color-bg-hsl: var(--dh-color-white-hsl);\n  --dh-color-fg-hsl: var(--dh-color-black-hsl);\n  --dh-color-content-bg: var(--dh-color-gray-900);\n  --dh-color-text: var(--dh-color-fg);\n  /* Actions */\n  --dh-color-action-hsl: var(--dh-color-bg-hsl);\n  --dh-color-action-contrast-hsl: var(--dh-color-contrast-dark-hsl);\n  /* Editor */\n  /* Grid */\n  --dh-color-grid-bg: var(--dh-color-bg);\n  /* Components */\n  --dh-color-loading-spinner-secondary: hsl(var(--dh-color-gray-500-hsl));\n}";
const acmeOrange = ":root {\n  --dh-color-bg: var(--dh-color-orange-100);\n  --dh-color-fg: var(--dh-color-orange-800);\n  --dh-color-editor-bg: var(--dh-color-bg);\n  --dh-color-grid-bg: var(--dh-color-bg);\n  --dh-color-form-control-error: hsl(40, 100%, 50%);\n  --dh-color-form-control-error-shadow: hsl(40, 100%, 35%);\n  --dh-color-selector-fg: hsla(var(--dh-color-orange-800-hsl), 0.4);\n  --dh-color-selector-hover-fg: hsl(var(--dh-color-orange-800-hsl));\n  --dh-color-selector-disabled-fg: hsla(var(--dh-color-orange-800-hsl), 0.26);\n}";
const plugin = {
  name: "Acme Theme Plugin",
  type: "ThemePlugin",
  themes: [
    // {
    //   name: 'Acme Dark',
    //   baseTheme: 'dark',
    //   styleContent: acmeDark,
    // },
    {
      name: "Acme Light",
      baseTheme: "dark",
      styleContent: acmeLight
    },
    {
      name: "Acme Orange",
      baseTheme: "dark",
      styleContent: acmeOrange
    }
  ]
};
exports.default = plugin;
exports.plugin = plugin;
