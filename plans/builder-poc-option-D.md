# Plan: Pivot in Grid-Toolbar — Option D (Plugin-to-Plugin Dependency Infrastructure)

## TL;DR

Extend the plugin loader in web-client-ui so that loaded plugins can register their exports in the module resolve map, making them available to subsequently loaded plugins via standard `require()`. This eliminates the need to bundle pivot source into the grid-toolbar — the grid-toolbar simply externalizes `@deephaven/js-plugin-pivot` and it resolves at runtime from the already-loaded pivot plugin module.

This approach is Option C + a plugin registry mechanism. It includes Option C's resolve map expansion (`@deephaven/grid`, `@deephaven/utils`) since the pivot plugin itself externalizes those.

## Background

### Current Architecture

```
manifest.json
  → loadModulePlugins() loads all plugins in parallel via Promise.allSettled()
    → Each plugin: XHR fetch JS text → new Function("require","module","exports", text)
      → require = createRequires(resolve)  ← static, immutable map
        → require("@deephaven/chart") → ✓ returns pre-imported module
        → require("@deephaven/js-plugin-pivot") → ✗ throws Error
```

The resolve map is created once from `remote-component.config.ts` and never modified. Plugins load in parallel, so even if one plugin's exports were added to the map, the order isn't guaranteed.

### What Changes

1. The resolve map becomes **mutable** — loaded plugins can register their exports
2. Plugins load **sequentially** (or in dependency-declared order) instead of in parallel
3. Each loaded plugin's exports get added to the resolve map under its package name
4. The manifest optionally declares plugin dependencies to enforce load order

## Changes Required

### 1. web-client-ui: Make resolve map mutable and expose it

**File**: `packages/app-utils/src/plugins/remote-component.config.ts`

Add `@deephaven/grid` and `@deephaven/utils` (same as Option C):

```ts
import * as DeephavenGrid from '@deephaven/grid';
import * as DeephavenUtils from '@deephaven/utils';

export const resolve: Record<string, unknown> = {
  // ... existing entries ...
  '@deephaven/grid': DeephavenGrid,
  '@deephaven/utils': DeephavenUtils,
};
```

Note: the type changes from an implicit readonly object to `Record<string, unknown>` so plugins can be added.

### 2. web-client-ui: Make loadRemoteModule use a shared mutable resolve

**File**: `packages/app-utils/src/plugins/loadRemoteModule.ts`

Currently:
```ts
import createLoadRemoteModule, { createRequires } from '@paciolan/remote-module-loader';
import { resolve } from './remote-component.config';

const requires = createRequires(resolve);
export const loadRemoteModule = createLoadRemoteModule({ requires });
```

The `createRequires` function closes over the resolve object at creation time. Since we're mutating the same object (adding properties), this should work — the closure holds a reference to the object, not a snapshot. Verify this by checking `createRequires` implementation:

```js
// From @paciolan/remote-module-loader
var createRequires = function (dependencies) {
  return function (name) {
    if (!(name in dependencies)) {
      throw new Error("Could not require '" + name + "'");
    }
    return dependencies[name];
  };
};
```

Yes — it uses `name in dependencies` on the live object. Adding properties to `resolve` after `createRequires` is called will be visible to subsequent `require()` calls. **No change needed to loadRemoteModule.ts** as long as we mutate the same `resolve` object.

### 3. web-client-ui: Register plugin exports after loading

**File**: `packages/app-utils/src/plugins/PluginUtils.tsx`

Change `loadModulePlugins` to:

1. Load plugins **sequentially** instead of in parallel
2. After each successful load, register the plugin's full module exports in the resolve map

```ts
import { resolve } from './remote-component.config';

export async function loadModulePlugins(
  modulePluginsUrl: string
): Promise<PluginModuleMap> {
  log.debug('Loading plugins...');
  try {
    const manifest = await loadJson(`${modulePluginsUrl}/manifest.json`);

    if (!Array.isArray(manifest.plugins)) {
      throw new Error('Plugin manifest JSON does not contain plugins array');
    }

    log.debug('Plugin manifest loaded:', manifest);

    const pluginMap: PluginModuleMap = new Map();

    // Load plugins sequentially so each plugin's exports are available
    // to subsequently loaded plugins via require()
    for (let i = 0; i < manifest.plugins.length; i += 1) {
      const { name, main, version } = manifest.plugins[i];
      const pluginMainUrl = `${modulePluginsUrl}/${name}/${main}`;
      try {
        const myModule = await loadModulePlugin(pluginMainUrl);

        // Register the full module exports in the resolve map so
        // subsequent plugins can require() this plugin by name
        resolve[name] = myModule;
        log.debug(`Registered plugin '${name}' in module resolve map`);

        const moduleValue = getPluginModuleValue(myModule);
        if (moduleValue == null) {
          log.error(`Plugin '${name}' is missing an exported value.`);
        } else if (isMultiPlugin(moduleValue)) {
          log.debug(
            `MultiPlugin '${name}' contains ${moduleValue.plugins.length} plugins`
          );
          moduleValue.plugins.forEach(innerPlugin => {
            registerPlugin(pluginMap, innerPlugin.name, innerPlugin, version);
          });
        } else {
          registerPlugin(pluginMap, name, moduleValue, version);
        }
      } catch (e) {
        log.error(`Unable to load plugin '${name}'`, e);
      }
    }

    log.info('Plugins loaded:', pluginMap);
    return pluginMap;
  } catch (e) {
    log.error('Unable to load plugins:', e);
    return new Map();
  }
}
```

Key differences from current code:
- `for` loop with `await` instead of `Promise.allSettled()` — sequential loading
- `resolve[name] = myModule` — registers the raw module exports (not the PluginModule wrapper) so `require('@deephaven/js-plugin-pivot')` returns the same thing as `import * from '@deephaven/js-plugin-pivot'`

### 4. Manifest plugin ordering (optional but recommended)

Plugins load in manifest order. The manifest.json on the dev server is auto-generated by the plugin dev server. Ensure `@deephaven/js-plugin-pivot` appears before `@deephaven/js-plugin-grid-toolbar`.

For a more robust solution, add a `dependencies` field to manifest entries:

```json
{
  "plugins": [
    { "name": "@deephaven/js-plugin-pivot", "main": "index.js", "version": "0.4.0" },
    {
      "name": "@deephaven/js-plugin-grid-toolbar",
      "main": "index.js",
      "version": "0.1.0",
      "dependencies": ["@deephaven/js-plugin-pivot"]
    }
  ]
}
```

Then topologically sort the plugins before loading. This is optional for the POC — simple ordering in manifest.json is sufficient.

### 5. Pivot plugin: Export needed items

**File**: `plugins/pivot/src/js/src/index.ts`

Add exports (same as Option C):

```ts
export { default as IrisGridPivotModel } from './IrisGridPivotModel';
export { isCorePlusDh } from './PivotUtils';
export { usePivotMouseHandlers } from './hooks/usePivotMouseHandlers';
export { usePivotRenderer } from './hooks/usePivotRenderer';
export { usePivotTheme } from './hooks/usePivotTheme';
```

No need for ESM transpile step — the existing CJS bundle is fine since it will be loaded by the host and registered in the resolve map. Other plugins `require()` it at runtime.

### 6. Grid-toolbar: Standard externalization

**File**: `plugins/grid-toolbar/src/js/vite.config.ts`

Externalize `@deephaven/js-plugin-pivot` along with all other host-provided packages:

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
    '@deephaven/js-plugin-pivot',
    '@deephaven/jsapi-bootstrap',
    '@deephaven/jsapi-utils',
    '@deephaven/log',
    '@deephaven/plugin',
    '@deephaven/react-hooks',
    '@deephaven/utils',
  ],
},
```

`@deephaven/js-plugin-pivot` IS externalized — at runtime, `require('@deephaven/js-plugin-pivot')` resolves from the resolve map (populated by step 3 when the pivot plugin loaded first).

**File**: `plugins/grid-toolbar/src/js/package.json`

Add dependencies for type-checking:

```json
{
  "dependencies": {
    "@deephaven/js-plugin-pivot": "*",
    "@deephaven/iris-grid": "^0.106.0"
  },
  "devDependencies": {
    "@deephaven-enterprise/jsapi-coreplus-types": "^1.20240517.518"
  }
}
```

**File**: `plugins/grid-toolbar/src/js/src/usePivotToggle.ts` (new)

Standard imports — same code as before:

```ts
import { IrisGridPivotModel, isCorePlusDh } from '@deephaven/js-plugin-pivot';
```

At build time, Vite externalizes this. At runtime, `require()` resolves it from the resolve map.

**File**: `plugins/grid-toolbar/src/js/src/GridToolbarPanelMiddleware.tsx`

Same — standard imports from `@deephaven/js-plugin-pivot` and `@deephaven/iris-grid`.

### 7. Build and verify

1. Rebuild web-client-ui: `cd mainbranch && npm run build`
2. Restart enterprise app: re-run `npm run start-community`
3. Rebuild pivot plugin: `cd plugins/pivot/src/js && npm run build`
4. Build grid-toolbar: `cd plugins/grid-toolbar/src/js && npm run build`
5. Start plugin dev server: `npm start` (from deephaven-plugins root)
6. Open browser at localhost:3000
7. Verify pivot plugin loads first in console: `Registered plugin '@deephaven/js-plugin-pivot' in module resolve map`
8. Verify grid-toolbar loads and Chart + Pivot buttons work

## Comparison with Option C

| Aspect | Option C | Option D |
|--------|----------|----------|
| Pivot code duplication | Yes — bundled into grid-toolbar | No — loaded once, shared via resolve map |
| Grid-toolbar bundle size | Larger (~50-100KB from pivot internals) | Small — only grid-toolbar's own code |
| web-client-ui changes | 2-4 lines (resolve map) | ~30 lines (resolve map + sequential loading) |
| Plugin load time | Parallel (fast) | Sequential (slower, but plugins are small) |
| Plugin ordering | Doesn't matter | Matters — dependencies must load first |
| Reusability | One-off for this POC | General-purpose: any plugin can depend on any other |
| Future maintenance | Need to keep pivot code in sync across two bundles | Single source of truth for pivot code |

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Sequential loading slows startup | Low | Plugin bundles are small (<500KB each), network latency dominates |
| Plugin load order wrong in manifest | Medium | Verify manifest.json order; add topological sort for production |
| `resolve` mutation not visible to `createRequires` | Very Low | Verified: `createRequires` uses `name in dependencies` on live object |
| Pivot plugin CJS exports don't match import names | Medium | Test with `require('@deephaven/js-plugin-pivot').IrisGridPivotModel`; may need to verify CJS export shape |
| `memoize-one` / `lodash.throttle` not in resolve map | Medium | The pivot plugin bundles these (they're not in its externals list). So they're included in the pivot CJS bundle — no resolve map entry needed. But grid-toolbar also uses them transitively through bundled pivot code... wait, in Option D the pivot code is NOT bundled into grid-toolbar. The pivot CJS bundle already includes memoize-one and lodash.throttle (not externalized). So `require('memoize-one')` inside the pivot bundle resolves internally. No issue. |

## Tradeoffs

**Pros**:
- No code duplication — pivot loads once, shared by all plugins
- Clean dependency model — plugins declare and consume dependencies via standard `require()`
- General-purpose — any future plugin can depend on any other plugin
- Grid-toolbar bundle stays small
- No ESM transpile step needed for pivot

**Cons**:
- More web-client-ui changes than Option C
- Sequential plugin loading (minor perf impact)
- Plugin load order matters — must be managed
- Slightly more complex infrastructure to understand and maintain
