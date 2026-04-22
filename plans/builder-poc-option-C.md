# Plan: Pivot in Grid-Toolbar — Option C (Expand Host Resolve Map + Bundle Pivot Source)

## TL;DR

Make the pivot plugin's source consumable as a normal npm dependency by adding a `tsc` transpile step that outputs individual ESM files. The grid-toolbar's Vite build imports from `@deephaven/js-plugin-pivot` via its ESM entry, bundles only the pivot-internal classes, and externalizes all shared `@deephaven/*` packages. Two packages (`@deephaven/grid`, `@deephaven/utils`) must be added to the host app's resolve map since they're already in the host bundle but not currently exposed to plugins.

## Background

### How Plugin Module Resolution Works

Plugins are CJS bundles loaded by `@paciolan/remote-module-loader`. The host evaluates the JS text with `new Function("require", "module", "exports", code)` and injects a `require` shim that resolves from a **static map** in `packages/app-utils/src/plugins/remote-component.config.ts`:

```ts
export const resolve = {
  react,
  'react-dom': ReactDOM,
  '@deephaven/chart': DeephavenChart,
  '@deephaven/components': DeephavenComponents,
  '@deephaven/iris-grid': DeephavenIrisGrid,
  // ... ~20 packages total
};
```

If a plugin calls `require('anything-not-in-map')`, it throws at runtime. There is no plugin-to-plugin dependency mechanism.

### The Problem

The grid-toolbar plugin needs `IrisGridPivotModel`, `isCorePlusDh`, and pivot hooks from `@deephaven/js-plugin-pivot`. That package is NOT in the host resolve map. Simply externalizing it causes a runtime `require` failure. Bundling it fails because the pivot plugin only produces a single CJS bundle (`dist/index.js`) — Rollup can't resolve CJS named exports from it.

### Why This Approach Works

1. The pivot plugin gets a `tsc` transpile step that outputs individual ESM `.js` files in `dist/`
2. The grid-toolbar's Vite build resolves `@deephaven/js-plugin-pivot` → `dist/index.js` (ESM) → follows individual file imports
3. Vite bundles only the pivot-internal classes (IrisGridPivotModel, renderers, mouse handlers, etc.) into the grid-toolbar output
4. All shared `@deephaven/*` imports within the pivot source (grid, iris-grid, utils, etc.) are externalized → resolved from the host at runtime
5. `@deephaven/grid` and `@deephaven/utils` are added to the host resolve map (they're already in the host bundle as transitive dependencies of `@deephaven/iris-grid`)

## Changes Required

### 1. web-client-ui: Expand the resolve map

**File**: `packages/app-utils/src/plugins/remote-component.config.ts`

Add two packages that are already in the host bundle but not exposed:

```ts
import * as DeephavenGrid from '@deephaven/grid';
import * as DeephavenUtils from '@deephaven/utils';

export const resolve = {
  // ... existing entries ...
  '@deephaven/grid': DeephavenGrid,
  '@deephaven/utils': DeephavenUtils,
};
```

Also add `memoize-one` and `lodash.throttle` if needed (IrisGridPivotModel imports them). These are already in the host bundle. Check if they need exposing.

**Rebuild**: Run `npm install && npm run build` in web-client-ui, then restart the enterprise app.

### 2. Pivot plugin: Add ESM transpile output

**File**: `plugins/pivot/src/js/package.json`

Add `tsc` transpile step and update exports:

```json
{
  "main": "dist/bundle/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/bundle/index.js",
      "default": "./dist/bundle/index.js"
    },
    "./*.js": "./dist/*.js",
    "./*": "./dist/*.js"
  },
  "types": "dist/index",
  "scripts": {
    "start": "vite build --watch",
    "build": "run-s build:*",
    "build:transpile": "tsc",
    "build:bundle": "vite build"
  },
  "files": ["dist"]
}
```

**File**: `plugins/pivot/src/js/tsconfig.json`

Already exists with `outDir: "dist/"`. Confirm it produces ESM (it extends `@deephaven/tsconfig` which sets `"module": "esnext"`).

**File**: `plugins/pivot/src/js/vite.config.js`

Update `outDir` to `dist/bundle`:

```js
build: {
  outDir: 'dist/bundle',
  // ... rest unchanged
}
```

**File**: `plugins/pivot/src/js/src/index.ts`

Add exports for the items the grid-toolbar needs:

```ts
export { default as IrisGridPivotModel } from './IrisGridPivotModel';
export { isCorePlusDh } from './PivotUtils';
export { usePivotMouseHandlers } from './hooks/usePivotMouseHandlers';
export { usePivotRenderer } from './hooks/usePivotRenderer';
export { usePivotTheme } from './hooks/usePivotTheme';
```

Add `npm-run-all` devDependency for `run-s` (or use `npm-run-all2`).

**Rebuild**: `cd plugins/pivot/src/js && npm run build`

Verify `dist/` contains individual `.js` files (ESM) and `dist/bundle/index.js` contains the CJS bundle.

### 3. Grid-toolbar: Import from pivot as dependency

**File**: `plugins/grid-toolbar/src/js/package.json`

Add dependencies:

```json
{
  "dependencies": {
    "@deephaven/js-plugin-pivot": "*",
    "@deephaven/iris-grid": "^0.106.0",
    "@deephaven-enterprise/jsapi-coreplus-types": "^1.20240517.518"
  }
}
```

Move `@deephaven-enterprise/jsapi-coreplus-types` to `devDependencies` (types only).

**File**: `plugins/grid-toolbar/src/js/vite.config.ts`

Externalize all host-provided packages but NOT `@deephaven/js-plugin-pivot`:

```ts
rollupOptions: {
  external: [
    'react',
    'react-dom',
    'redux',
    'react-redux',
    'memoize-one',
    'lodash.throttle',
    '@deephaven/chart',
    '@deephaven/components',
    '@deephaven/grid',
    '@deephaven/icons',
    '@deephaven/iris-grid',
    '@deephaven/jsapi-bootstrap',
    '@deephaven/jsapi-utils',
    '@deephaven/log',
    '@deephaven/plugin',
    '@deephaven/react-hooks',
    '@deephaven/utils',
  ],
},
```

`@deephaven/js-plugin-pivot` is NOT listed — Vite will follow its ESM entry and bundle the pivot-internal code.

**File**: `plugins/grid-toolbar/src/js/src/usePivotToggle.ts` (new)

```ts
import { IrisGridPivotModel, isCorePlusDh } from '@deephaven/js-plugin-pivot';
```

Standard package import — Vite resolves via ESM entry at build time, bundles IrisGridPivotModel source into grid-toolbar output.

**File**: `plugins/grid-toolbar/src/js/src/GridToolbarPanelMiddleware.tsx`

```ts
import { IrisGrid } from '@deephaven/iris-grid';
import {
  usePivotMouseHandlers,
  usePivotRenderer,
  usePivotTheme,
} from '@deephaven/js-plugin-pivot';
```

Same pattern — pivot hooks get bundled in, `@deephaven/iris-grid` is external.

### 4. Build and verify

1. Build pivot: `cd plugins/pivot/src/js && npm run build`
2. Build grid-toolbar: `cd plugins/grid-toolbar/src/js && npm run build`
3. Start plugin dev server: `npm start` (from deephaven-plugins root)
4. Restart enterprise app after web-client-ui rebuild
5. Open browser at localhost:3000, verify:
   - Chart button still works
   - Pivot button appears (only when CorePlus API is available)
   - Clicking Pivot creates a pivot and renders with IrisGrid

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `memoize-one` / `lodash.throttle` not in host resolve map | Medium | Add to resolve map, or have Vite bundle them (don't externalize) |
| `nanoid` / `lodash.clamp` not in host resolve map | Medium | Same — bundle them or add to resolve |
| Pivot source has compile errors in tsc without Vite | Low | tsconfig already exists and extends @deephaven/tsconfig |
| Bundle size increase | Low | Pivot internals add ~50-100KB to grid-toolbar bundle; acceptable for POC |

## Tradeoffs

**Pros**:
- Standard npm dependency — no fragile relative paths
- Clean build: Vite tree-shakes unused pivot exports
- Follows the same externalization pattern as the Chart button
- Minimal web-client-ui change (just 2-4 lines in resolve map)

**Cons**:
- Pivot source gets duplicated: bundled into both the pivot plugin's own CJS bundle AND the grid-toolbar's CJS bundle (runtime duplication if both loaded)
- Requires web-client-ui rebuild + enterprise app restart
- Adding packages to the resolve map is a semi-permanent API commitment
