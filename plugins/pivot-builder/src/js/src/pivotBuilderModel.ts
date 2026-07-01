import deepEqual from 'fast-deep-equal';
import {
  IrisGridModel,
  AggregationOperation,
  AggregationUtils,
  type AggregationSettings,
  type UITotalsTableConfig,
} from '@deephaven/iris-grid';
import { IrisGridPivotModel, isCorePlusDh } from '@deephaven/js-plugin-pivot';
import Log from '@deephaven/log';
import { EventShimCustomEvent } from '@deephaven/utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';

const log = Log.module('@deephaven/js-plugin-pivot-builder/pivotBuilderModel');

const NUMERIC_TYPES = new Set<string>([
  'int',
  'long',
  'short',
  'byte',
  'double',
  'float',
  'java.lang.Integer',
  'java.lang.Long',
  'java.lang.Short',
  'java.lang.Byte',
  'java.lang.Double',
  'java.lang.Float',
  'java.math.BigDecimal',
  'java.math.BigInteger',
]);

/** Sentinel installed on the proxy so `isPivotBuilderIrisGridModel` works. */
const PIVOT_BUILDER_TAG = Symbol.for(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderProxy'
);

/**
 * Event dispatched on the proxy whenever `applyPivotBuilderConfig` runs.
 * The `detail` is the new `PivotBuilderConfig`. Used by the panel
 * middleware to persist the latest intent via `usePersistentState`.
 */
export const PIVOT_BUILDER_CONFIG_CHANGED =
  '@deephaven/js-plugin-pivot-builder/PIVOT_BUILDER_CONFIG_CHANGED';

/**
 * Event dispatched on the proxy when a pivot build fails recoverably and the
 * model reverts to a safe config. Distinct from the host
 * `IrisGridModel.EVENT.REQUEST_FAILED` ON PURPOSE: that host event drives
 * iris-grid's `rollback()` / fatal-`onError` path, which can't rebuild a
 * pivot. This pivot-builder-specific event lets the sidebar surface a
 * non-fatal, domain-specific notice instead, while the model has already
 * contained the failure (resolved to the flat source) and re-applied a safe
 * config. The host never sees a rejected model promise for these failures.
 */
export const PIVOT_BUILDER_ERROR =
  '@deephaven/js-plugin-pivot-builder/PIVOT_BUILDER_ERROR';

/**
 * `detail` payload of a {@link PIVOT_BUILDER_ERROR} event.
 */
export interface PivotBuilderErrorDetail {
  /** The error the pivot service (or build) rejected with. */
  error: unknown;
  /** The builder config whose build failed, if known. */
  failedConfig: PivotBuilderConfig | null;
  /** The safe config the model reverted to (last good, or empty). */
  revertedTo: PivotBuilderConfig;
}

/**
 * A single aggregation entry: an operation applied to one or more columns.
 * The array of these on `PivotConfig` is ORDER-SENSITIVE — reordering entries
 * is a meaningful config change (unlike the order-insensitive
 * `Record<operation, columns[]>` the pivot service ultimately receives).
 */
export interface PivotAggregation {
  operation: string;
  columns: string[];
}

/**
 * Normalize a `PivotConfig.aggregations` value into the ordered array form.
 * Tolerates the legacy `Record<operation, columns[]>` shape that may still
 * live in persisted layout state from before the array shape existed.
 */
export function toPivotAggregations(
  aggregations: PivotAggregation[] | Record<string, string[]>
): PivotAggregation[] {
  if (Array.isArray(aggregations)) {
    return aggregations;
  }
  return Object.entries(aggregations).map(([operation, columns]) => ({
    operation,
    columns: [...columns],
  }));
}

/**
 * Collapse a `PivotConfig` into the order-insensitive
 * `Record<operation, columns[]>` payload accepted by
 * `coreplus.pivot.PivotService#createPivotTable`, sanitizing it against the
 * current source schema.
 *
 * Every column reference is validated against `columns`: references to
 * columns that no longer exist (schema drift) or whose type is invalid for
 * the operation (e.g. a persisted `Sum` over a string column — only
 * reachable via hydration of a config baked against a different schema, since
 * the sidebar editor filters these live with the same
 * `AggregationUtils.isValidOperation` rule) are dropped. This mirrors
 * iris-grid, which silently discards now-invalid aggregations at hydration
 * rather than failing the whole model.
 *
 * Aggregations left with no valid columns are dropped. If the result is
 * empty, a `Count` over a single source column (the first not used as a
 * row/column key, falling back to the first column overall) is synthesized so
 * a pivot with keys but no usable values still renders meaningful counts. The
 * fallback is a BUILD-TIME detail only — it is NOT folded back into the
 * persisted `builderConfig`/intent.
 */
export function buildPivotAggregationsMap(
  config: PivotConfig,
  columns: readonly DhType.Column[]
): Record<string, string[]> {
  // Column name → type, used to validate each aggregation's columns against
  // the current source schema.
  const columnTypes = new Map(
    columns.map(column => [column.name, column.type])
  );
  const sanitized: Record<string, string[]> = {};
  toPivotAggregations(config.aggregations).forEach(
    ({ operation, columns: cols }) => {
      const validColumns = cols.filter(name => {
        const type = columnTypes.get(name);
        if (type == null) {
          log.debug2(
            'Dropping aggregation column missing from source table',
            operation,
            name
          );
          return false;
        }
        if (
          !AggregationUtils.isValidOperation(
            operation as AggregationOperation,
            type
          )
        ) {
          log.debug2(
            'Dropping aggregation column invalid for operation',
            operation,
            name,
            type
          );
          return false;
        }
        return true;
      });
      if (validColumns.length === 0) return;
      sanitized[operation] = [...(sanitized[operation] ?? []), ...validColumns];
    }
  );

  if (Object.keys(sanitized).length > 0) {
    return sanitized;
  }

  const usedKeys = new Set([...config.rowKeys, ...config.columnKeys]);
  const fallbackColumn =
    columns.find(column => !usedKeys.has(column.name)) ?? columns[0];

  if (fallbackColumn == null) {
    return sanitized;
  }

  return { [AggregationOperation.COUNT]: [fallbackColumn.name] };
}

/**
 * User-configured pivot settings. The `aggregations` array is collapsed into
 * the `Record<operation, columns[]>` payload accepted by
 * `coreplus.pivot.PivotService#createPivotTable` at the build boundary
 * (`withFallbackAggregations`); we keep the ordered array form here so the UI
 * and intent diffing can detect operation reordering.
 */
export interface PivotConfig {
  rowKeys: string[];
  columnKeys: string[];
  /** Ordered, e.g. `[{ operation: 'Sum', columns: ['price', 'qty'] }]`. */
  aggregations: PivotAggregation[];
}

/**
 * Pure UI state of the four config cards. Persisted alongside the derived
 * model config so the sidebar restores switch positions AND card contents
 * exactly on reopen/reload. The derived `pivot`/`rollup`/`totals` collapse
 * "card off" and "card on but empty" into the same value, so they cannot
 * recover the switch positions (or the contents of a card that was toggled
 * off) on their own. Optional/absent for configs persisted before this
 * field existed — the sidebar falls back to deriving seed state from the
 * model config in that case.
 */
export interface PivotBuilderUiState {
  /**
   * Master switch above the cards. When false, every section is gated
   * off (rollup/pivot/aggregations are not applied) while the cards
   * themselves stay editable and per-card switches retain their saved
   * positions. Flipping back to true restores the user's per-card
   * choices unchanged.
   */
  globalOn: boolean;
  rollupRowsOn: boolean;
  rollupRows: string[];
  includeConstituents: boolean;
  nonAggregatedInRollup: boolean;
  aggregatesOn: boolean;
  aggregations: AggregationSettings;
  pivotColumnsOn: boolean;
  pivotColumns: string[];
  filterableOn: boolean;
  filterableColumns: string[];
}

/**
 * High-level pivot-builder intent. The proxy diffs against its last
 * applied intent internally; callers can pass the same value across
 * unrelated re-renders without causing redundant writes.
 */
export interface PivotBuilderConfig {
  pivot: PivotConfig | null;
  rollup: DhType.RollupConfig | null;
  totals: UITotalsTableConfig | null;
  /**
   * Pure UI/card state (switch positions + card contents). Decoupled from
   * the derived model config above so reopening the sidebar restores the
   * exact card state the user left, including toggled-off cards. Absent on
   * configs persisted before this field existed.
   */
  ui?: PivotBuilderUiState | null;
}

/**
 * Mutable recovery state consulted when a pivot build fails. See
 * {@link chooseRecoveryTarget}.
 */
export interface PivotRecoveryState {
  /** Last successfully-built pivot config, or `null` if none. */
  lastGoodBuilderConfig: PivotBuilderConfig | null;
  /** True while a recovery apply is already in flight. */
  isRecoveringPivot: boolean;
}

/**
 * Result of {@link chooseRecoveryTarget}: the safe config to revert to plus
 * the next recovery state.
 */
export interface PivotRecoveryDecision {
  /** The config to apply to recover from the failed build. */
  target: PivotBuilderConfig;
  /** `lastGoodBuilderConfig` to keep after this decision. */
  nextLastGoodBuilderConfig: PivotBuilderConfig | null;
  /** `isRecoveringPivot` to keep after this decision. */
  nextIsRecoveringPivot: boolean;
}

/** The empty builder config — flat source, cannot fail at the pivot service. */
const EMPTY_BUILDER_CONFIG: PivotBuilderConfig = {
  pivot: null,
  rollup: null,
  totals: null,
};

/**
 * Pure decision for recovering from a failed pivot build.
 *
 * Reverts to the last successfully-built pivot when there is a distinct one
 * and we are not already mid-recovery; otherwise drops to the empty config
 * (flat source), which cannot fail at the pivot service. Returning to the
 * empty config also clears `lastGoodBuilderConfig` so a now-known-bad target
 * is never re-selected on a later failure.
 *
 * @param failedBuilderConfig the config whose build failed, if known
 * @param state current recovery state
 * @returns the target to apply plus the next recovery state
 */
export function chooseRecoveryTarget(
  failedBuilderConfig: PivotBuilderConfig | null,
  state: PivotRecoveryState
): PivotRecoveryDecision {
  if (
    !state.isRecoveringPivot &&
    state.lastGoodBuilderConfig != null &&
    !deepEqual(state.lastGoodBuilderConfig, failedBuilderConfig)
  ) {
    return {
      target: state.lastGoodBuilderConfig,
      nextLastGoodBuilderConfig: state.lastGoodBuilderConfig,
      nextIsRecoveringPivot: true,
    };
  }
  return {
    target: { ...EMPTY_BUILDER_CONFIG },
    nextLastGoodBuilderConfig: null,
    nextIsRecoveringPivot: state.isRecoveringPivot,
  };
}

export interface PivotBuilderProxyModel extends IrisGridModel {
  pivotConfig: PivotConfig | null;
  /** The original (pre-pivot) source table. */
  readonly sourceTable: DhType.Table;
  /** Last applied builder config; mirrors `applyPivotBuilderConfig` input. */
  readonly builderConfig: PivotBuilderConfig;
  /**
   * Apply pivot/rollup/totals atomically.
   *
   * The proxy owns ordering (pivot supersedes rollup/totals; otherwise
   * rollup is cleared/applied before totals), diffs each field against
   * the last applied intent, and queues `totals` writes that land while
   * a model swap is in progress (the host proxy's `set totalsConfig`
   * silently drops mid-swap writes). Queued totals are flushed on the
   * next `COLUMNS_CHANGED` / `TABLE_CHANGED`.
   *
   * Dispatches `PIVOT_BUILDER_CONFIG_CHANGED` with the new config as
   * `detail` after each call so listeners (e.g. the panel middleware's
   * persistence layer) can react. Direct writes to
   * `proxy.rollupConfig` / `proxy.totalsConfig` are stored on the proxy
   * but NOT propagated to the inner model — the pivot-builder sidebar
   * replaces those host surfaces and owns inner-model swaps.
   *
   * Returns a promise that resolves once any inner-model swap triggered by
   * this call (the async pivot/rollup build routed through the host proxy's
   * `setNextModel`) has settled. Synchronous callers (the sidebar) can ignore
   * it; the reload transform awaits it so the host hydrates sort/filter
   * against the derived model rather than the still-flat source.
   */
  applyPivotBuilderConfig: (config: PivotBuilderConfig) => Promise<void>;
  [PIVOT_BUILDER_TAG]: true;
}

export function isNumericColumn(column: DhType.Column): boolean {
  return NUMERIC_TYPES.has(column.type);
}

export function isPivotBuilderIrisGridModel(
  model: unknown
): model is PivotBuilderProxyModel {
  return (
    typeof model === 'object' &&
    model !== null &&
    (model as { [PIVOT_BUILDER_TAG]?: true })[PIVOT_BUILDER_TAG] === true
  );
}

class SupersededError extends Error {
  constructor() {
    super('superseded');
    this.name = 'SupersededError';
  }
}

/**
 * Augment a host-built `IrisGridProxyModel` (the model the host's
 * `IrisGridPanel` / `GridWidgetPlugin` constructs from the source table)
 * **in place**, installing a `pivotConfig` accessor that — when set —
 * produces a pivot via `PivotService.createPivotTable` and hands it to the
 * proxy's `setNextModel`. The proxy fires the standard
 * `COLUMNS_CHANGED` / `UPDATED` events, so IrisGrid re-renders in place
 * exactly like rollups.
 *
 * This is wired as an `IrisGridModelTransform` (see the host
 * `transformModel` seam): the host owns model construction, error/loading
 * state, and `close()`; the pivot-builder only wraps the result. That lets
 * the pivot-builder middleware stay a *chained* layer (rendering the host
 * `Component`) instead of mounting its own `IrisGrid` / `IrisGridPanel`.
 *
 * Returns the same proxy instance it was given (mutated), narrowed to
 * `PivotBuilderProxyModel`.
 */
export function augmentPivotBuilderModel(
  dh: typeof DhType | typeof CorePlusDhType,
  model: IrisGridModel,
  getPspWidget: () => Promise<DhType.Widget>
): PivotBuilderProxyModel {
  // CorePlus is NOT required to install the proxy: rollup and aggregate
  // (totals) are generic iris-grid features that work on any worker (Legacy
  // included) since they operate on the source table. Only the actual pivot
  // path needs CorePlus, so that check is deferred into `applyPivotConfig`'s
  // pivot branch (the single place that builds `PivotService` /
  // `IrisGridPivotModel`). The Pivot card is independently gated on the PSP
  // availability probe, so a pivot can't be requested on a worker without it.

  const proxy = model as IrisGridModel & {
    setNextModel: (promise: Promise<IrisGridModel>) => void;
    // IrisGridProxyModel exposes `originalModel` (own prop reachable via
    // the model's Proxy get-trap); the pivot is always built off the
    // original (pre-pivot) source table.
    originalModel: IrisGridModel;
  };

  // The original (pre-pivot) source table, taken from the host proxy's
  // original flat model so the pivot is always built off the source table
  // regardless of the proxy's current inner model.
  const { table } = proxy.originalModel as unknown as { table: DhType.Table };

  // Sanitize + collapse the config's aggregations into the pivot service's
  // `Record<operation, columns[]>` payload at this single `createPivotTable`
  // choke point — dropping schema-invalid columns and synthesizing a `Count`
  // fallback for an otherwise-empty map. See `buildPivotAggregationsMap`.
  const withFallbackAggregations = (
    config: PivotConfig
  ): Record<string, string[]> =>
    buildPivotAggregationsMap(config, table.columns);

  let current: PivotConfig | null = null;
  // Monotonic token for in-flight pivot creations. Every `pivotConfig` write
  // increments it; async build steps abort early when their captured token
  // is stale. The host already cancels superseded model promises, but
  // bailing out before contacting the pivot service avoids wasted RPCs and
  // makes `pivotConfig` writes safe under rapid succession (e.g. drag flows
  // that flip config several times before the first build resolves).
  let pivotToken = 0;

  // --- Layer 2: revert-to-last-good recovery for failed pivot builds ---
  //
  // A persisted/legacy pivot config can be rejected by the pivot service at
  // `createPivotTable` (e.g. an aggregation that's invalid for the current
  // schema and survived Layer 1's column sanitization). Rather than let that
  // rejection propagate out of `setNextModel` — which the host turns into a
  // `REQUEST_FAILED` event and a fatal panel error (its `rollback()` only
  // restores host state, which can't rebuild a pivot) — we catch the failure
  // INSIDE the build closure, resolve to the flat source model, and re-apply
  // the last successfully-built pivot (or, failing that, the empty config).
  // The host therefore never sees a rejected model promise for a recoverable
  // pivot failure, so iris-grid's `REQUEST_FAILED`/`rollback()` path is not
  // engaged and there's a single recovery authority (this model).
  //
  // Only a successfully-built PIVOT is recorded as the last-good target.
  // Rollup/totals views are deliberately NOT recorded: reverting to them
  // routes through the host rollup setter and could itself raise
  // `REQUEST_FAILED`, re-entangling the host recovery path. Reverting a
  // failed pivot therefore goes to the previous good pivot, else the empty
  // config (flat source) — which cannot fail at the pivot service.
  let lastGoodBuilderConfig: PivotBuilderConfig | null = null;
  // The builder config that triggered the in-flight pivot build, captured so
  // the failure handler knows which intent failed. A single slot is safe:
  // any newer apply bumps `pivotToken`, superseding the older build before it
  // can reach the (token-guarded) failure path.
  let pendingPivotBuilderConfig: PivotBuilderConfig | null = null;
  // Guards against an infinite revert loop: set while a recovery apply is in
  // flight so that if the recovery target ALSO fails we collapse straight to
  // the empty config instead of retrying it. Cleared whenever a build settles
  // onto a model (pivot success, or the flat-source swap from a null config).
  let isRecoveringPivot = false;

  const recoverFromPivotFailure = (
    failedBuilderConfig: PivotBuilderConfig | null
  ): PivotBuilderConfig => {
    const proxyWithApply = proxy as unknown as PivotBuilderProxyModel;
    const decision = chooseRecoveryTarget(failedBuilderConfig, {
      lastGoodBuilderConfig,
      isRecoveringPivot,
    });
    lastGoodBuilderConfig = decision.nextLastGoodBuilderConfig;
    isRecoveringPivot = decision.nextIsRecoveringPivot;
    log.debug('Reverting pivot builder to safe config', decision.target);
    proxyWithApply
      .applyPivotBuilderConfig(decision.target)
      .catch(() => undefined);
    return decision.target;
  };

  // `PivotService.getInstance` returns a NEW service wrapper on every call,
  // and every service created from the same psp widget multiplexes over that
  // widget's single bidi message stream. dh-core fans each response out to
  // ALL services on the stream, so a stale service left over from a previous
  // config edit receives responses for ids it never issued and logs
  // "No handler for response: N" via console.error — once per stale service,
  // so the noise grows with every edit. The service is documented as a
  // per-worker singleton ("The initial call for a given worker must be either
  // a PivotTable or a PivotService"), so cache one service per psp widget and
  // reuse it across edits to keep a single consumer on the stream. The cache
  // is keyed on widget identity: when the middleware re-resolves the psp
  // widget (closing the old one and its stream), the next build rebuilds the
  // service against the new widget.
  let cachedPspWidget: DhType.Widget | null = null;
  let cachedPivotServicePromise: Promise<CorePlusDhType.coreplus.pivot.PivotService> | null =
    null;

  const getPivotService = (
    corePlusDh: typeof CorePlusDhType,
    pspWidget: DhType.Widget
  ): Promise<CorePlusDhType.coreplus.pivot.PivotService> => {
    if (cachedPivotServicePromise != null && cachedPspWidget === pspWidget) {
      return cachedPivotServicePromise;
    }
    cachedPspWidget = pspWidget;
    cachedPivotServicePromise =
      corePlusDh.coreplus.pivot.PivotService.getInstance(pspWidget);
    return cachedPivotServicePromise;
  };

  const applyPivotConfig = (config: PivotConfig | null): void => {
    if (deepEqual(current, config)) return;
    current = config;
    pivotToken += 1;
    const token = pivotToken;

    if (config == null) {
      // Flat-source swap always succeeds — clear any in-flight recovery guard.
      isRecoveringPivot = false;
      proxy.setNextModel(Promise.resolve(proxy.originalModel));
      return;
    }

    const promise = (async (): Promise<IrisGridModel> => {
      log.info('Creating pivot with config:', config);
      // Pivot creation is the only CorePlus-gated path. The Pivot card is
      // disabled unless the PSP availability probe reports `ready`, so this
      // should never run on a non-CorePlus (e.g. Legacy) worker — but guard
      // anyway so a stray pivot request fails loudly instead of casting a
      // non-CorePlus `dh` and dereferencing `coreplus` undefined.
      if (!isCorePlusDh(dh)) {
        throw new Error(
          'PivotService not available: CorePlus is required to create a pivot'
        );
      }
      const corePlusDh = dh;
      const pspWidget = await getPspWidget();
      if (token !== pivotToken) throw new SupersededError();
      const pivotService = await getPivotService(corePlusDh, pspWidget);
      if (token !== pivotToken) throw new SupersededError();
      let pivotTable: CorePlusDhType.coreplus.pivot.PivotTable;
      try {
        pivotTable = await pivotService.createPivotTable({
          source: table as unknown as CorePlusDhType.Table,
          rowKeys: config.rowKeys,
          columnKeys: config.columnKeys,
          aggregations: withFallbackAggregations(config),
        });
      } catch (e) {
        // A newer apply superseded this build mid-request — treat as a cancel
        // (rethrow so the host swallows it) rather than a real failure.
        if (token !== pivotToken) throw new SupersededError();
        // Genuine, current-token failure: the pivot service rejected this
        // config (e.g. a hydrated aggregation invalid for the live schema).
        // Recover by resolving to the flat source model — so the host does
        // NOT see a rejected promise and its `REQUEST_FAILED`/`rollback()`
        // path stays out of it — then re-apply the last good config (or the
        // empty config) on a microtask, after this swap settles. The sidebar
        // is notified via `PIVOT_BUILDER_ERROR` (NOT the host's
        // `REQUEST_FAILED`) so it can surface a non-fatal, domain-specific
        // notice while the model handles the actual recovery.
        log.debug(
          'createPivotTable failed; reverting pivot builder',
          config,
          e
        );
        const failedBuilderConfig = pendingPivotBuilderConfig;
        Promise.resolve()
          .then(() => {
            // Skip if a newer apply already took over (it's authoritative).
            if (token !== pivotToken) return;
            const revertedTo = recoverFromPivotFailure(failedBuilderConfig);
            const detail: PivotBuilderErrorDetail = {
              error: e,
              failedConfig: failedBuilderConfig,
              revertedTo,
            };
            proxy.dispatchEvent(
              new EventShimCustomEvent(PIVOT_BUILDER_ERROR, { detail })
            );
          })
          .catch(() => undefined);
        return proxy.originalModel;
      }
      if (token !== pivotToken) {
        // Build resolved after a newer request superseded it. Close the
        // orphan table directly — the host's cancel handler won't run on a
        // promise that throws.
        pivotTable.close?.();
        throw new SupersededError();
      }
      // Build succeeded and is current: record this pivot as the last-good
      // revert target and clear any in-flight recovery guard.
      if (pendingPivotBuilderConfig != null) {
        lastGoodBuilderConfig = pendingPivotBuilderConfig;
      }
      isRecoveringPivot = false;
      // TODO: fix this
      // `IrisGridPivotModel` comes from the separately-versioned
      // `@deephaven/js-plugin-pivot`, whose bundled `IrisGridModel` predates the
      // `dispatchPending` member required by this plugin's `@deephaven/iris-grid`.
      // Cast across that version skew.
      return new IrisGridPivotModel(
        corePlusDh,
        pivotTable
      ) as unknown as IrisGridModel;
    })();
    promise.catch(e => {
      if (e instanceof SupersededError) {
        log.debug2('pivot build superseded', config);
        return;
      }
      // Recoverable `createPivotTable` failures are handled inside the
      // closure (resolve-to-flat-source + revert), so anything that still
      // rejects here is unrecoverable — e.g. a missing CorePlus runtime or a
      // pivot service that could not be acquired. Let it reach the host's
      // `REQUEST_FAILED` path (fatal panel error) deliberately.
      log.error('pivot build failed (unrecoverable)', config, e);
    });

    proxy.setNextModel(promise);
  };

  Object.defineProperty(proxy, PIVOT_BUILDER_TAG, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  Object.defineProperty(proxy, 'sourceTable', {
    value: table,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  Object.defineProperty(proxy, 'pivotConfig', {
    configurable: true,
    enumerable: true,
    get(): PivotConfig | null {
      return current;
    },
    set(config: PivotConfig | null): void {
      log.debug('set pivotConfig', config);
      applyPivotConfig(config);
    },
  });

  // The proxy owns `rollupConfig` / `totalsConfig` storage so dehydration
  // captures the pivot-builder's latest intent. Direct writes (from the
  // host's `IrisGridModelUpdater` at hydration time, or any other host
  // surface) are stored but NOT applied to the inner model — the
  // pivot-builder sidebar replaces those host surfaces and routes
  // inner-model swaps through `applyPivotBuilderConfig`.
  // `totalsConfig` writes from `applyPivotBuilderConfig` are queued when
  // a model swap is in progress, because the host proxy's `set
  // totalsConfig` silently drops mid-swap writes.
  const proto = Object.getPrototypeOf(proxy);
  const rollupDesc = Object.getOwnPropertyDescriptor(proto, 'rollupConfig');

  let storedRollup: DhType.RollupConfig | null = null;
  let storedTotals: UITotalsTableConfig | null = null;
  let lastIntent: PivotBuilderConfig = {
    pivot: null,
    rollup: null,
    totals: null,
  };
  let pendingTotals: UITotalsTableConfig | null | undefined;
  // Mirror of the totals config actually written to the source (base)
  // model. Inner totals writes are diffed against this — NOT against
  // `lastIntent.totals` — because the pivot and rollup branches force
  // `lastIntent.totals` to `null` when they supersede totals without ever
  // touching the base model. Diffing against `lastIntent.totals` would then
  // wrongly suppress the clearing write when returning to a plain-totals
  // view, leaving a stale Totals row on the restored base model.
  let appliedInnerTotals: UITotalsTableConfig | null = null;

  const proxyAsAny = proxy as unknown as { modelPromise: unknown };
  const originalWritable = proxy.originalModel as unknown as {
    totalsConfig: UITotalsTableConfig | null;
  };

  const writeTotalsToInner = (v: UITotalsTableConfig | null): void => {
    // Totals only ever apply to the source (base) model — rollup/pivot
    // models supersede them. Write to the stable `originalModel` rather than
    // the proxy's swap-sensitive current inner model so the clearing /
    // restoring write always lands on the base model regardless of which
    // model is currently displayed, and survives model swaps.
    originalWritable.totalsConfig = v;
    appliedInnerTotals = v;
  };

  const flushPendingTotals = (): void => {
    if (pendingTotals === undefined) return;
    if (proxyAsAny.modelPromise != null) return; // wait for next event
    const v = pendingTotals;
    pendingTotals = undefined;
    writeTotalsToInner(v);
  };

  // Same-columns swaps (e.g. rollup-A → rollup-B) only fire TABLE_CHANGED;
  // pivot transitions only fire COLUMNS_CHANGED. Listen to both.
  proxy.addEventListener(
    IrisGridModel.EVENT.COLUMNS_CHANGED,
    flushPendingTotals
  );
  proxy.addEventListener(IrisGridModel.EVENT.TABLE_CHANGED, flushPendingTotals);

  Object.defineProperty(proxy, 'rollupConfig', {
    configurable: true,
    enumerable: true,
    get(): DhType.RollupConfig | null {
      return storedRollup;
    },
    set(v: DhType.RollupConfig | null): void {
      // Store-only — host writes do not reach the inner model. The
      // pivot-builder sidebar drives inner-model swaps via
      // `applyPivotBuilderConfig`.
      if (deepEqual(v, storedRollup)) return;
      log.debug2('storing rollupConfig (no inner-model write)', v);
      storedRollup = v;
      // `IrisGridPanel`'s pre-`modelInitialized` `modelQueue` advances
      // on COLUMNS_CHANGED (the event the host's own rollup setter
      // emits after `setNextModel` resolves). Since we suppressed the
      // inner-model swap, emit it ourselves so the queue advances and
      // hydration completes for legacy rollup+aggregations layouts.
      proxy.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
          detail: proxy.columns,
        })
      );
    },
  });

  Object.defineProperty(proxy, 'totalsConfig', {
    configurable: true,
    enumerable: true,
    get(): UITotalsTableConfig | null {
      return storedTotals;
    },
    set(v: UITotalsTableConfig | null): void {
      log.debug2('storing totalsConfig (no inner-model write)', v);
      storedTotals = v;
    },
  });

  Object.defineProperty(proxy, 'builderConfig', {
    configurable: true,
    enumerable: true,
    get(): PivotBuilderConfig {
      return lastIntent;
    },
  });

  Object.defineProperty(proxy, 'applyPivotBuilderConfig', {
    configurable: true,
    enumerable: false,
    value(config: PivotBuilderConfig): Promise<void> {
      // The pivot/rollup swap is routed through the host proxy's async
      // `setNextModel`, so the inner model is not updated synchronously.
      // `settle` resolves once any in-flight swap has finished (its
      // `setModel` runs in the proxy's own `.then`, registered before this
      // await, so the inner model is already swapped when we resume). The
      // reload transform awaits this so the host hydrates sort/filter against
      // the derived model; sidebar callers can ignore it.
      const settle = (): Promise<void> => {
        const pending = proxyAsAny.modelPromise as PromiseLike<unknown> | null;
        return pending != null
          ? Promise.resolve(pending).then(
              () => undefined,
              () => undefined
            )
          : Promise.resolve();
      };
      // No-op when the config is unchanged. `CreatePivotPage` reconciles
      // on mount (and on every relevant state change), so reopening the
      // sidebar page re-applies the already-applied intent. Without this
      // guard we'd still dispatch `PIVOT_BUILDER_CONFIG_CHANGED`, which
      // calls `setPersistedConfig` upstream and re-renders the host
      // `IrisGrid` one frame after the sidebar's slide-in starts —
      // tearing down the in-flight push/pop animation (the page snaps in
      // instead of sliding, and the Stack's view hook flickers).
      if (deepEqual(config, lastIntent)) {
        log.debug2('applyPivotBuilderConfig no-op (unchanged)', config);
        return settle();
      }
      // Raise the IrisGrid loading scrim *only* when this apply queued an
      // async model swap (pivot/rollup change → `setNextModel`). Those swaps
      // resolve into a COLUMNS_CHANGED / UPDATED event that clears the scrim
      // automatically. A totals-only change (toggling the aggregate card)
      // writes synchronously to the base model and produces no such event on
      // the proxy, so raising the scrim there would leave it stuck forever —
      // we must not raise it. Call this right before returning, after all
      // mutations have had a chance to set `modelPromise`. `text` labels the
      // scrim for whichever operation queued the swap — the pivot branch and
      // the rollup branch pass different wording so the message is accurate
      // (e.g. on Legacy workers, where only rollup ever swaps the model).
      const raisePendingIfSwapping = (text: string): void => {
        if (proxyAsAny.modelPromise != null) {
          proxy.dispatchEvent(
            new EventShimCustomEvent(IrisGridModel.EVENT.PENDING, {
              detail: { text },
            })
          );
        }
      };
      const proxyWithPivot = proxy as unknown as {
        pivotConfig: PivotConfig | null;
      };
      if (config.pivot != null) {
        // Pivot supersedes rollup/totals. The pivot itself is built off
        // the source table directly, so we don't apply rollup/totals to
        // the inner model — but we must clear the host's *internal*
        // `this.rollup` cache (only updated via the host setter) so a
        // later rollup-back transition can't be `deepEqual`-suppressed
        // against a stale cached value. The transient
        // `setNextModel(originalModel)` queued by this clear is
        // immediately superseded — and safely cancelled — by the pivot
        // `setNextModel` below; `originalModel` is special-cased to not
        // close on cancel.
        if (lastIntent.rollup != null) {
          log.debug('Clearing host rollup cache before pivot');
          rollupDesc?.set?.call(proxy, null);
        }
        if (!deepEqual(config.pivot, lastIntent.pivot)) {
          log.debug('Applying pivotConfig', config.pivot);
          // Remember the full intent driving this build so a build failure
          // can identify what failed and revert to the last good config.
          pendingPivotBuilderConfig = config;
          proxyWithPivot.pivotConfig = config.pivot;
        }
        // Mirror intent into proxy storage so dehydration is correct.
        storedRollup = config.rollup;
        storedTotals = config.totals;
        lastIntent = config;
        raisePendingIfSwapping('Applying pivot...');
        proxy.dispatchEvent(
          new EventShimCustomEvent(PIVOT_BUILDER_CONFIG_CHANGED, {
            detail: config,
          })
        );
        return settle();
      }

      // Pivot inactive — clear it before reconciling rollup/totals.
      if (lastIntent.pivot != null) {
        log.debug('Clearing pivotConfig (pivot inactive)');
        proxyWithPivot.pivotConfig = null;
      }

      if (!deepEqual(config.rollup, lastIntent.rollup)) {
        log.debug('Applying rollupConfig', config.rollup);
        rollupDesc?.set?.call(proxy, config.rollup);
      }
      storedRollup = config.rollup;

      // Diff against the base model's real totals (the queued write if one
      // is pending, otherwise the last applied value) — not
      // `lastIntent.totals`, which is `null` after any pivot/rollup supersede
      // and would mask a needed clearing write.
      const effectiveInnerTotals =
        pendingTotals !== undefined ? pendingTotals : appliedInnerTotals;
      if (!deepEqual(config.totals, effectiveInnerTotals)) {
        log.debug('Applying totalsConfig', config.totals);
        if (proxyAsAny.modelPromise != null) {
          // Mid-swap — queue and flush on next COLUMNS_CHANGED/TABLE_CHANGED.
          pendingTotals = config.totals;
        } else {
          pendingTotals = undefined;
          writeTotalsToInner(config.totals);
        }
      }
      storedTotals = config.totals;

      lastIntent = config;
      // Only the rollup change queues a model swap here (a totals-only change
      // writes synchronously and leaves `modelPromise` null), so the scrim,
      // when raised, is always for rollup.
      raisePendingIfSwapping('Applying rollup...');
      proxy.dispatchEvent(
        new EventShimCustomEvent(PIVOT_BUILDER_CONFIG_CHANGED, {
          detail: config,
        })
      );
      return settle();
    },
  });

  return proxy as unknown as PivotBuilderProxyModel;
}

/**
 * Default config derived from the columns of the source
 * table. Picks the first non-numeric column as the row key, the second
 * non-numeric as the column key (if any), and aggregates all numeric
 * columns as `Sum`. Falls back to `Count` when no numeric columns exist.
 */
export function makeDefaultPivotConfig(
  columns: readonly DhType.Column[]
): PivotConfig {
  const numeric: string[] = [];
  const nonNumeric: string[] = [];
  columns.forEach(col => {
    if (NUMERIC_TYPES.has(col.type)) {
      numeric.push(col.name);
    } else {
      nonNumeric.push(col.name);
    }
  });
  let rowKeys: string[] = [];
  if (nonNumeric.length > 0) {
    rowKeys = nonNumeric.slice(0, 1);
  } else if (columns.length > 0) {
    rowKeys = [columns[0].name];
  }
  const columnKeys = nonNumeric.length > 1 ? nonNumeric.slice(1, 2) : [];
  const aggregations: PivotAggregation[] =
    numeric.length > 0
      ? [{ operation: 'Sum', columns: numeric }]
      : [{ operation: 'Count', columns: [] }];
  return { rowKeys, columnKeys, aggregations };
}
