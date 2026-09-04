# Pivot availability: feature-detecting the new `PivotService.getInstance` API

Status: **findings / proposal — not yet implemented**
Owner context: pivot-builder plugin (`@deephaven/js-plugin-pivot-builder`)

## Background

The pivot-builder gates its **Pivot** card on CorePlus availability
(`isCorePlusDh(dh)` in [usePivotBuilderMiddlewareCore.tsx](../src/usePivotBuilderMiddlewareCore.tsx)).
Pivot creation goes through
`dh.coreplus.pivot.PivotService.getInstance(sourceTable)` →
`createPivotTable(...)` (see [pivotBuilderModel.ts](../src/pivotBuilderModel.ts),
`getPivotService` / `applyPivotConfig`).

The `getInstance` API changed in the iris repo:

- Commit `9aeb40d2a06` "Use the command resolver for create pivot"
- Commit `b140cc38b5c` "Bypass any.pack."
- File: `DhcInDhe/js-client/src/main/java/io/deephaven/web/coreplus/client/pivot/JsPivotService.java`
- New server-side piece: `DhcInDhe/pivot/module/.../PivotCommandResolver.java`

The new client derives the worker connection from **any** server object passed
to `getInstance` (e.g. the source table) and creates the service via the
server's pivot command resolver — no dedicated `PivotService` widget required.
The previous API could not create a service from an arbitrary source table.

## The problem

`isCorePlusDh(dh)` alone is too coarse. An **older CorePlus server** delivers an
older `PivotService` JS runtime whose `getInstance(table)` does **not** support
the command-resolver flow — so the Pivot card would appear enabled but pivot
creation would fail.

The runtime `dh.coreplus.pivot.*` API is delivered by the server, so behavior
depends on the connected server's version, not on the compile-time
`@deephaven-enterprise/jsapi-coreplus-types` the plugin builds against.

## Why structural feature-detection does not work

The JS `getInstance(object: ServerObject.Union)` signature is **identical**
old-vs-new; the change was internal behavior only. So:

- No new method / arg count / field to check.
- TS types are erased at runtime; the coreplus types are a module augmentation
  of `@deephaven/jsapi-types` (same `dh.Table`), so there is no distinct type.
- `CoreClient.getServerConfigValues()` exists, but the pivot change added **no
  dedicated capability flag** — a version-string comparison would be brittle.

## Compatibility model (new client runtime)

`createPivotTable` already degrades gracefully with the **new** client:

1. Tries the command-resolver path (no plugin widget needed).
2. On failure, falls back to the PivotService **plugin** path, locating a
   `PivotService` widget in the worker scope.

So with the new runtime API, pivots work against:

- new servers (command resolver), and
- old servers that publish a `PivotService` widget in scope (plugin fallback).

The only hard-broken case is an **old runtime API** (old server), where
`getInstance(table)` hits the "does not work yet"
`getObject("f/PivotServicePlugin")` path and rejects.

## Recommended: capability probe via `getInstance(sourceTable)`

Behavior differs exactly where it matters:

- **New client:** `getInstance(table)` for a non-`PivotService` object returns
  `instanceFor(connection, null)` — a cached wrapper, **no RPC** → resolves cheaply.
- **Old client:** the same call rejects (broken plugin-ticket fetch).

Proposed gate: Pivot card available iff
`isCorePlusDh(dh) && getInstance(sourceTable) resolves`, cached per worker.

Implementation sketch (in `usePivotBuilderMiddlewareCore`):

- When `corePlusAvailable`, set `pivotServiceStatus = 'loading'`.
- Call the model's `getPivotService()` once (it already wraps
  `getInstance(table)`); flip to `'ready'` on resolve, `'unavailable'` on reject.
- Add a short **timeout** so a slow old-server reject doesn't hang in `'loading'`.

Notes:

- The probe is idempotent and free — `getInstance` caches the service per
  connection, so the probe *is* the same call the first real pivot makes.
- It replaces the coarse `isCorePlusDh`-only gate with a true capability gate and
  is immune to the identical-signature problem.
- Requires exposing a small capability hook on the model (the middleware needs a
  source table / a `probePivotService()` the model can run).

## Safety net (keep regardless of the gate)

Keep the existing `PIVOT_BUILDER_ERROR` recovery (revert to flat source + toast).
It covers the residual "old server, no `PivotService` in scope" case where the
probe passes but the build's command+plugin fallback both fail — worst case is a
graceful revert, never a hard crash.

## Options, ranked

1. **Capability probe via `getInstance(table)`** — robust, signature-agnostic,
   cheap. Recommended.
2. Version gate via `getServerConfigValues()` — works but brittle (no dedicated
   flag; hardcodes a version).
3. Optimistic `isCorePlusDh` gate + rely on recovery — simplest, but the card
   looks enabled and users can try-and-fail on old servers. (Current behavior.)

## Relevant code

- Gate today: [usePivotBuilderMiddlewareCore.tsx](../src/usePivotBuilderMiddlewareCore.tsx) (`pivotServiceStatus`)
- Service acquisition + build: [pivotBuilderModel.ts](../src/pivotBuilderModel.ts) (`getPivotService`, `applyPivotConfig`)
- Status context consumed by the sidebar: [PivotServiceContext.ts](../src/PivotServiceContext.ts), [CreatePivotPage.tsx](../src/CreatePivotPage.tsx)
