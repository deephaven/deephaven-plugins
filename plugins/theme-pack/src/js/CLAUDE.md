# Theme Creation Guide

This document captures the approach for creating new Deephaven themes using color.js to generate complete color palettes from base brand colors.

## Overview

Deephaven themes require complete color scales matching the Adobe Spectrum-based design system:

- **Gray scale**: 11 shades (50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900)
- **Chromatic colors**: 14 shades each (100-1400) for: red, orange, yellow, chartreuse, celery, green, seafoam, cyan, blue, indigo, purple, fuchsia, magenta

Dark themes, override the dark template. Light themes override the light template. Based on primary background and foreground colors.

## CRITICAL: No Hex Colors Outside Palette Definitions

**NEVER use hex color codes outside of the palette variable definitions.** This is a strict rule with no exceptions.

- Hex colors (`#xxxxxx`) are ONLY allowed when defining `--dh-color-gray-*` and `--dh-color-{color}-*` palette variables
- ALL semantic overrides, editor tokens, component overrides, etc. MUST use `var(--dh-color-*)` references
- If a desired color doesn't exist in the palette, use the nearest palette color
- When in doubt, choose the closest palette color rather than introducing a hex value

**Correct:**

```css
--dh-color-editor-comment: var(--dh-color-gray-700);
--dh-color-editor-keyword: var(--dh-color-green-800);
```

**WRONG - Never do this:**

```css
--dh-color-editor-comment: #586e75; /* NO! Use palette reference */
--dh-color-editor-keyword: #859900; /* NO! Use palette reference */
```

If asked to override colors, do not guess at variable names, look them up in the Deephaven design system or existing themes.

https://github.com/deephaven/web-client-ui/blob/main/packages/components/src/theme/theme-dark/

(or theme-light for light themes)

Contains:

themeDarkPalette.css,
themeDarkSemantic.css,
themeDarkSemanticChart.css,
themeDarkSemanticEditor.css,
themeDarkSemanticGrid.css,
themeDarkComponents.css,

They can be used as references for semantic and component overrides. Do not add overides unless requested. For example if the user or theme instructs errors to be pink, then add the negative color overrides. Otherwise leave them out.

When adding semantic colors, always add both the standard and "visual-" variants. The visual variants are used for charts and data visualizations, while the standard variants are used for UI elements like buttons, alerts, etc.

Ex.

```
--dh-color-accent: var(--dh-color-accent-600);

...

--dh-color-visual-positive: var(--dh-color-green-1200);
--dh-color-visual-negative: var(--dh-color-red-800);

--dh-color-negative: var(--dh-color-red-600);
--dh-color-negative-bg: var(--dh-color-negative);
--dh-color-negative-hover-bg: var(--dh-color-red-500);
--dh-color-negative-down-bg: var(--dh-color-red-400);
--dh-color-negative-key-focus-bg: var(--dh-color-red-500);
--dh-color-negative-contrast: var(--dh-color-contrast-light);

...

--dh-color-grid-header-bg: var(--dh-color-gray-100);

```

If specifying semantic negative, positve, notice or info colors, also specify the "visual-" variants as well as the -bg, -hover-bg, -down-bg, -key-focus-bg etc variants.

## Process

### 1. Gather Base Colors

Start with a color scheme's base colors either provide by the user or extracted from a broader theme. Example:

```
Background: #282A36
Foreground: #F8F8F2
Red: #FF5555
Orange: #FFB86C
Yellow: #F1FA8C
Green: #50FA7B
Purple: #BD93F9
Cyan: #8BE9FD
Pink: #FF79C6
```

If supplied with a VS Code theme file, extract the primary background and foreground colors, as well as any token colors used for syntax highlighting like red, orange, yellow, green, blue, purple, cyan, pink, etc. Determine which colors are most representative of the brand or theme, for accent, positive and negative colors.

Accent should be determined off of button.background, if the scale differs, adjust --dh-color-accent, -hover, -bg and semantic so that they align correctly. For the background, use both the editor.background and sideBar.background, with editor.background being exactly gray-100, but sideBar should also appear in as part of the gray scale range.

```
{
	"$schema": "vscode://schemas/color-theme",
	"type": "dark",
  "colors": {
    		"editor.background": "#282a36",
        "sideBar.background": "#3b3d4b",
         ...
  },
  ...
}
```

If instructed fetch the colors, and context for their use from a design system or guidlines.

For colors that are missing (e.g., chartreuse, celery, magenta, fuchsia, indigo, blue, seafoam), select appropriate base colors that have the desired hue and saturation. These colors exist between the provided colors in the color wheel.

For example fussia can be chosen as a midpoint between pink and magenta. Pink can be chosen as a midpoint between red and magenta.

Orange can be chosen as a midpoint between red and yellow. Fill out this missing colors before proceeding.

No two colors should be too close in hue, and cannot be the same.

### 2. Create Ephemeral Generator Script

Install colorjs.io temporarily and create a script to generate scales:

```bash
npm install colorjs.io
```

Create `tools/generate-palette.mjs`:

```javascript
import Color from 'colorjs.io';

// Gray scale steps (for dark theme: 50=darkest, 900=lightest)
const GRAY_STEPS = [50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// Chromatic steps (100=darkest, 1400=lightest)
const COLOR_STEPS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
];

/**
 * Generate gray scale with multiple anchor points.
 * VS Code themes typically provide several background shades that should
 * appear at specific gray scale steps.
 *
 * Common VS Code background colors and their typical gray scale mappings:
 *   - editor.background → gray-100 (primary background)
 *   - sideBar.background → gray-75 or gray-200 (depending on if lighter/darker)
 *   - activityBar.background → gray-50 or gray-75 (usually darkest)
 *   - editorGroupHeader.tabsBackground → gray-75 or gray-200
 *   - input.background → gray-200 or gray-300
 *   - foreground/editor.foreground → gray-900
 *
 * @param {Object} anchors - Object mapping gray step numbers to hex colors
 *   Example: { 50: '#1a1c27', 100: '#282a36', 200: '#343d46', 900: '#f8f8f2' }
 *   At minimum, provide: 100 (background) and 900 (foreground)
 */
function generateGrayScale(anchors) {
  // Validate required anchors
  if (!anchors[100] || !anchors[900]) {
    throw new Error(
      'Gray scale requires at least anchors at 100 (background) and 900 (foreground)'
    );
  }

  const scale = {};
  const sortedSteps = GRAY_STEPS.slice().sort((a, b) => a - b);

  // Convert all anchors to OKLCH
  const anchorColors = {};
  for (const [step, hex] of Object.entries(anchors)) {
    const color = new Color(hex);
    color.to('oklch');
    anchorColors[parseInt(step)] = color;
  }

  // For steps without explicit anchors, interpolate between nearest anchors
  const anchorSteps = Object.keys(anchorColors)
    .map(Number)
    .sort((a, b) => a - b);

  for (const step of sortedSteps) {
    if (anchorColors[step]) {
      // Use exact anchor color
      scale[step] = anchorColors[step].to('srgb').toString({ format: 'hex' });
    } else {
      // Find surrounding anchors and interpolate
      let lowerAnchor = anchorSteps[0];
      let upperAnchor = anchorSteps[anchorSteps.length - 1];

      for (const anchor of anchorSteps) {
        if (anchor < step) lowerAnchor = anchor;
        if (
          anchor > step &&
          upperAnchor === anchorSteps[anchorSteps.length - 1]
        ) {
          upperAnchor = anchor;
          break;
        }
      }

      // Handle edge cases (step below lowest or above highest anchor)
      if (step < anchorSteps[0]) {
        // Extrapolate darker than lowest anchor
        const baseColor = anchorColors[anchorSteps[0]];
        const darkenAmount = ((anchorSteps[0] - step) / 100) * 0.04;
        const color = new Color(baseColor);
        color.oklch.l = Math.max(0.02, color.oklch.l - darkenAmount);
        if (!color.inGamut('srgb')) color.toGamut('srgb');
        scale[step] = color.to('srgb').toString({ format: 'hex' });
      } else if (step > anchorSteps[anchorSteps.length - 1]) {
        // Extrapolate lighter than highest anchor
        const baseColor = anchorColors[anchorSteps[anchorSteps.length - 1]];
        const lightenAmount =
          ((step - anchorSteps[anchorSteps.length - 1]) / 100) * 0.04;
        const color = new Color(baseColor);
        color.oklch.l = Math.min(0.98, color.oklch.l + lightenAmount);
        if (!color.inGamut('srgb')) color.toGamut('srgb');
        scale[step] = color.to('srgb').toString({ format: 'hex' });
      } else {
        // Interpolate between anchors
        const t = (step - lowerAnchor) / (upperAnchor - lowerAnchor);
        const color = anchorColors[lowerAnchor].range(
          anchorColors[upperAnchor],
          { space: 'oklch' }
        )(t);
        scale[step] = color.to('srgb').toString({ format: 'hex' });
      }
    }
  }
  return scale;
}

/**
 * Generate chromatic color scale with exact anchor point.
 * The base color appears EXACTLY at the specified anchorStep.
 *
 * Recommended anchor steps by color (dark theme):
 *   - yellow/chartreuse/celery: 1000 (these are naturally light)
 *   - red: 600
 *   - most colors: 900
 *
 * For light themes, shift anchors:
 *   - yellow: 500
 *   - red: 800
 *   - most colors: 900
 */
function generateColorScale(baseHex, anchorStep = 800) {
  const base = new Color(baseHex);
  base.to('oklch');
  const baseLightness = base.oklch.l;
  const baseChroma = base.oklch.c;
  const baseHue = base.oklch.h;

  // Define lightness targets for all steps
  const defaultLightness = {
    100: 0.15,
    200: 0.2,
    300: 0.25,
    400: 0.32,
    500: 0.4,
    600: 0.48,
    700: 0.56,
    800: 0.64,
    900: 0.72,
    1000: 0.78,
    1100: 0.84,
    1200: 0.89,
    1300: 0.93,
    1400: 0.96,
  };

  // Calculate offset to place base color exactly at anchorStep
  const targetLightnessAtAnchor = defaultLightness[anchorStep];
  const lightnessOffset = baseLightness - targetLightnessAtAnchor;

  // Chroma multipliers - full chroma near anchor, reduced at extremes
  const chromaMultipliers = {
    100: 0.5,
    200: 0.6,
    300: 0.7,
    400: 0.8,
    500: 0.9,
    600: 0.95,
    700: 1.0,
    800: 1.0,
    900: 1.0,
    1000: 0.95,
    1100: 0.85,
    1200: 0.7,
    1300: 0.5,
    1400: 0.3,
  };

  const scale = {};
  for (const step of COLOR_STEPS) {
    if (step === anchorStep) {
      // Use exact base color
      scale[step] = base.to('srgb').toString({ format: 'hex' });
    } else {
      // Adjust lightness relative to anchor, clamping to valid range
      let adjustedLightness = defaultLightness[step] + lightnessOffset;
      adjustedLightness = Math.max(0.05, Math.min(0.98, adjustedLightness));

      const color = new Color('oklch', [
        adjustedLightness,
        baseChroma * chromaMultipliers[step],
        baseHue,
      ]);
      if (!color.inGamut('srgb')) color.toGamut('srgb');
      scale[step] = color.to('srgb').toString({ format: 'hex' });
    }
  }
  return scale;
}

// Example usage for dark theme with multiple gray anchors:
// Extract background colors from VS Code theme:
//   editor.background: #282a36 → gray-100
//   sideBar.background: #21222c → gray-75
//   activityBar.background: #1a1c27 → gray-50
//   input.background: #343d46 → gray-200
//   foreground: #f8f8f2 → gray-900
const grays = generateGrayScale({
  50: '#1a1c27', // activityBar.background (darkest)
  75: '#21222c', // sideBar.background
  100: '#282a36', // editor.background (primary)
  200: '#343d46', // input.background
  900: '#f8f8f2', // foreground (lightest)
});

// Simple usage with just background and foreground:
const graysSimple = generateGrayScale({
  100: '#282a36', // editor.background
  900: '#f8f8f2', // foreground
});

// Chromatic scales
const reds = generateColorScale('#FF5555', 600); // red anchored at 600
const yellows = generateColorScale('#F1FA8C', 500); // yellow anchored at 500
const purples = generateColorScale('#BD93F9', 800); // purple anchored at 800
```

### 3. Run Generator

```bash
node tools/generate-palette.mjs > src/my-theme.css
```

### 4. Map Editor Token Colors

After generating the palette, map VS Code's syntax highlighting colors to Deephaven editor variables:

1. **Re-read the generated palette** to see exactly which hex values were assigned to each step
2. **Extract VS Code tokenColors** from the theme JSON (look for `tokenColors` array)
3. **Find closest palette matches** for each token color using the helper function in "Editor Token Color Mapping" section
4. **Add editor overrides** to your theme CSS using `var(--dh-color-visual-*)` or direct palette references

Key token mappings to check:

- Keywords (`keyword`, `storage.type`) → typically cyan or purple
- Strings (`string`) → typically yellow or green
- Numbers (`constant.numeric`) → typically purple or orange
- Comments (`comment`) → typically gray-600 or gray-700
- Functions (`support.function`, `entity.name.function`) → typically green or cyan
- Operators (`keyword.operator`) → typically red or purple

```
  /* Code rules */
  --dh-color-editor-comment: var(--dh-color-gray-700);
  --dh-color-editor-delimiter: var(--dh-color-gray-700);
  --dh-color-editor-identifier-js: var(--dh-color-visual-yellow);
  --dh-color-editor-identifier-namespace: var(--dh-color-visual-red);
  --dh-color-editor-identifier: var(--dh-color-gray-900);
  --dh-color-editor-keyword: var(--dh-color-visual-cyan);
  --dh-color-editor-number: var(--dh-color-visual-purple);
  --dh-color-editor-operator: var(--dh-color-visual-red);
  --dh-color-editor-predefined: var(--dh-color-visual-green);
  --dh-color-editor-storage: var(--dh-color-visual-red);
  --dh-color-editor-string-delim: var(--dh-color-gray-700);
  --dh-color-editor-string: var(--dh-color-visual-yellow);

  /* Brackets */
  --dh-color-editor-bracket-fg1: var(--dh-color-visual-yellow);
  --dh-color-editor-bracket-fg2: var(--dh-color-visual-purple);
  --dh-color-editor-bracket-fg3: var(--dh-color-visual-blue);
  --dh-color-editor-bracket-fg4: var(--dh-color-visual-yellow);
  --dh-color-editor-bracket-fg5: var(--dh-color-visual-purple);
  --dh-color-editor-bracket-fg6: var(--dh-color-visual-blue);
  --dh-color-editor-unexpected-bracket-fg: var(--dh-color-visual-negative);
```

See the "Editor Token Color Mapping" section below for the complete mapping table and helper code.

### 5. Add Theme to index.ts

Update `src/index.ts` to export multiple themes:

```typescript
import type { ThemePlugin } from '@deephaven/plugin';
import ftStyleContent from './theme.css?inline';
import myThemeStyleContent from './my-theme.css?inline';

const plugin: ThemePlugin = {
  name: 'theme-pack',
  type: 'ThemePlugin',
  themes: [
    {
      name: 'FT Theme',
      baseTheme: 'light',
      styleContent: ftStyleContent,
    },
    {
      name: 'My Theme',
      baseTheme: 'dark', // or 'light'
      styleContent: myThemeStyleContent,
    },
  ],
};

export default plugin;
```

### 6. Cleanup

Delete the generator script after use:

```bash
rm -rf tools/
```

### 7. Test

Run e2e tests to verify the theme renders correctly:

```bash
# From repo root
PLAYWRIGHT_HTML_OPEN=never npm run e2e:update-snapshots -- ./tests/theme.spec.ts
```

## CSS Structure

The generated CSS should include:

All overides are OPTIONAL, do not any more than requested or needed to match the brand.

```css
:root {
  /* Gray palette */
  --dh-color-gray-50: #...;
  /* ... through gray-900 */

  /* Chromatic palettes (red, orange, yellow, etc.) */
  --dh-color-red-100: #...;
  /* ... through red-1400 */
  /* Repeat for all 13 color families */

  /* Semantic - map accent to your brand color */
  --dh-color-accent-100: var(--dh-color-purple-100);
  /* ... through accent-1400 */
}
```

https://github.com/deephaven/web-client-ui/blob/main/packages/components/src/theme/theme-dark/

Contains:

themeDarkPalette.css,
themeDarkSemantic.css,
themeDarkSemanticChart.css,
themeDarkSemanticEditor.css,
themeDarkSemanticGrid.css,
themeDarkComponents.css,

They can be used as references for semantic and component overrides.

## Key Concepts

- **OKLCH color space**: Used for perceptually uniform lightness interpolation
- **Dark vs Light themes**:
  - Dark: gray-50 is darkest, gray-900 is lightest (foreground)
  - Light: gray-50 is lightest, gray-900 is darkest
- **Gray scale multi-anchor support**: VS Code themes provide multiple background shades. Map them to appropriate gray steps:
  - `editor.background` → gray-100 (required, primary background)
  - `sideBar.background` → gray-75 or gray-200 (depending on lighter/darker than editor)
  - `activityBar.background` → gray-50 or gray-75 (often darkest element)
  - `editorGroupHeader.tabsBackground` → gray-75 or gray-200
  - `input.background` / `dropdown.background` → gray-200 or gray-300
  - `foreground` / `editor.foreground` → gray-900 (required)
  - Steps without anchors are interpolated between nearest anchors
- **Exact anchor points**:
  - Gray scale: All provided colors appear exactly at their specified steps
  - Chromatic: base color appears exactly at the specified anchor step
- **Anchor step recommendations (dark theme)**:
  - Yellow/chartreuse/celery: 500 (naturally light colors)
  - Red: 600
  - Most colors (purple, cyan, green, etc.): 700-900
- **Anchor step recommendations (light theme)**:
  - Yellow: 1000
  - Red: 800
  - Most colors: 900-1100
- **Chroma reduction**: Reduce saturation at extreme light/dark ends for natural appearance
- **sRGB gamut**: All colors must be in sRGB color space for browser compatibility

## Editor Token Color Mapping

After generating the palette, re-read the generated CSS to identify which palette colors best match VS Code's syntax highlighting tokens. This ensures the editor colors match the original theme's intent.

### VS Code Token Scopes to Deephaven Editor Variables

VS Code themes define syntax highlighting in `tokenColors` with scopes. Map these to Deephaven editor variables:

| VS Code Scope(s)                                          | Deephaven Variable                       | Default Palette                 |
| --------------------------------------------------------- | ---------------------------------------- | ------------------------------- |
| `comment`, `punctuation.definition.comment`               | `--dh-color-editor-comment`              | `var(--dh-color-gray-700)`      |
| `punctuation`, `meta.brace`                               | `--dh-color-editor-delimiter`            | `var(--dh-color-gray-700)`      |
| `variable.other.readwrite.js`, `variable.other.object.js` | `--dh-color-editor-identifier-js`        | `var(--dh-color-visual-yellow)` |
| `entity.name.type.namespace`, `entity.name.type.module`   | `--dh-color-editor-identifier-namespace` | `var(--dh-color-visual-red)`    |
| `variable`, `variable.other`                              | `--dh-color-editor-identifier`           | `var(--dh-color-gray-900)`      |
| `keyword`, `storage.type`, `keyword.control`              | `--dh-color-editor-keyword`              | `var(--dh-color-visual-cyan)`   |
| `constant.numeric`                                        | `--dh-color-editor-number`               | `var(--dh-color-visual-purple)` |
| `keyword.operator`                                        | `--dh-color-editor-operator`             | `var(--dh-color-visual-red)`    |
| `support.function`, `entity.name.function`                | `--dh-color-editor-predefined`           | `var(--dh-color-visual-green)`  |
| `storage`, `storage.modifier`                             | `--dh-color-editor-storage`              | `var(--dh-color-visual-red)`    |
| `punctuation.definition.string`                           | `--dh-color-editor-string-delim`         | `var(--dh-color-gray-700)`      |
| `string`, `string.quoted`                                 | `--dh-color-editor-string`               | `var(--dh-color-visual-yellow)` |

### Bracket Colors

Bracket pair colorization uses 6 rotating colors:

| Variable                                  | Default Palette                   |
| ----------------------------------------- | --------------------------------- |
| `--dh-color-editor-bracket-fg1`           | `var(--dh-color-visual-yellow)`   |
| `--dh-color-editor-bracket-fg2`           | `var(--dh-color-visual-purple)`   |
| `--dh-color-editor-bracket-fg3`           | `var(--dh-color-visual-blue)`     |
| `--dh-color-editor-bracket-fg4`           | `var(--dh-color-visual-yellow)`   |
| `--dh-color-editor-bracket-fg5`           | `var(--dh-color-visual-purple)`   |
| `--dh-color-editor-bracket-fg6`           | `var(--dh-color-visual-blue)`     |
| `--dh-color-editor-unexpected-bracket-fg` | `var(--dh-color-visual-negative)` |

### Process for Finding Best Palette Match

After palette generation, for each VS Code token color:

1. **Extract the hex color** from the VS Code theme's `tokenColors` for the relevant scope
2. **Compare to generated palette colors** to find the closest visual match
3. **Map to the visual-\* semantic color** that uses that palette range

Example: If the VS Code theme uses `#8BE9FD` for keywords and your generated cyan-800 is `#8be9fd`, use:

```css
--dh-color-editor-keyword: var(--dh-color-visual-cyan);
```

### Adding to Generator Script

Add this helper function to find the closest palette color:

```javascript
import Color from 'colorjs.io';

/**
 * Find the closest palette color to a target hex color.
 * Returns the palette variable name and the color distance.
 */
function findClosestPaletteColor(targetHex, palette) {
  const target = new Color(targetHex);
  let bestMatch = { name: null, distance: Infinity };

  for (const [colorName, shades] of Object.entries(palette)) {
    for (const [step, hex] of Object.entries(shades)) {
      const color = new Color(hex);
      const distance = target.deltaE(color, 'oklch');
      if (distance < bestMatch.distance) {
        bestMatch = {
          name: `--dh-color-${colorName}-${step}`,
          distance,
          hex,
        };
      }
    }
  }
  return bestMatch;
}

/**
 * Map VS Code token colors to Deephaven editor variables.
 * @param {Object} vsCodeTokenColors - Token colors from VS Code theme
 * @param {Object} palette - Generated palette { gray: {...}, red: {...}, ... }
 */
function generateEditorOverrides(vsCodeTokenColors, palette) {
  // Token scope to Deephaven variable mapping
  const scopeMap = {
    comment: 'editor-comment',
    punctuation: 'editor-delimiter',
    keyword: 'editor-keyword',
    'constant.numeric': 'editor-number',
    'keyword.operator': 'editor-operator',
    string: 'editor-string',
    'support.function': 'editor-predefined',
    storage: 'editor-storage',
    variable: 'editor-identifier',
  };

  const overrides = {};

  for (const token of vsCodeTokenColors) {
    const scopes = Array.isArray(token.scope) ? token.scope : [token.scope];
    const color = token.settings?.foreground;
    if (!color) continue;

    for (const scope of scopes) {
      for (const [scopeKey, dhVar] of Object.entries(scopeMap)) {
        if (scope?.startsWith(scopeKey)) {
          const match = findClosestPaletteColor(color, palette);
          if (match.distance < 5) {
            // Close enough match
            overrides[`--dh-color-${dhVar}`] = `var(${match.name})`;
          }
        }
      }
    }
  }

  return overrides;
}
```

### Visual Color Aliases

The `visual-*` semantic colors are the preferred way to reference palette colors for editor tokens.

**CRITICAL: Visual colors must map to their matching palette color family.** The visual alias only selects the brightness/step within a color scale - it does NOT remap to a different hue.

- `--dh-color-visual-red` → MUST use `var(--dh-color-red-*)` (e.g., red-600, red-800)
- `--dh-color-visual-yellow` → MUST use `var(--dh-color-yellow-*)` (e.g., yellow-1000, yellow-1100)
- `--dh-color-visual-orange` → MUST use `var(--dh-color-orange-*)` (e.g., orange-800, orange-900)

**WRONG - Never do this:**

```css
--dh-color-visual-yellow: var(--dh-color-orange-900); /* NO! Yellow must use yellow-* */
--dh-color-visual-red: var(--dh-color-magenta-700); /* NO! Red must use red-* */
```

**Correct:**

```css
--dh-color-visual-yellow: var(--dh-color-yellow-1000); /* Adjust step for brightness */
--dh-color-visual-red: var(--dh-color-red-700); /* Adjust step for brightness */
```

| Visual Alias                 | Must Use Palette Family | Typical Step (Dark Theme) |
| ---------------------------- | ----------------------- | ------------------------- |
| `--dh-color-visual-yellow`   | `yellow-*`              | 1000-1100                 |
| `--dh-color-visual-purple`   | `purple-*`              | 800-900                   |
| `--dh-color-visual-blue`     | `blue-*`                | 700-800                   |
| `--dh-color-visual-cyan`     | `cyan-*`                | 800-900                   |
| `--dh-color-visual-green`    | `green-*`               | 800-1000                  |
| `--dh-color-visual-red`      | `red-*`                 | 700-800                   |
| `--dh-color-visual-orange`   | `orange-*`              | 800-900                   |
| `--dh-color-visual-positive` | `green-*`               | 900-1000                  |
| `--dh-color-visual-negative` | `red-*`                 | 600-700                   |
| `--dh-color-visual-positive` | `var(--dh-color-green-1000)`  |

When a VS Code token color closely matches a palette color, prefer using the corresponding `visual-*` alias if one exists. This maintains consistency with the design system.

## Reference

- Deephaven dark palette: https://github.com/deephaven/web-client-ui/tree/main/packages/components/src/theme/theme-dark
- color.js documentation: https://colorjs.io/
