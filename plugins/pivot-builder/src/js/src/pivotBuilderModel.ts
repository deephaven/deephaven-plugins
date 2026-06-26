import deepEqual from 'fast-deep-equal';
import {
  IrisGridModel,
  AggregationOperation,
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
 * An `IrisGridProxyModel` (the host's own proxy) augmented with a
 * `pivotConfig` accessor that swaps its inner model between the flat
 * `IrisGridTableModel` and an `IrisGridPivotModel`.
 */
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

  // The pivot service hangs the worker on an aggregation that targets no
  // columns the same way it rejects an empty aggregations map — e.g. a
  // degenerate `{ Count: [] }` (Count over zero columns). Such an entry can
  // arrive from a stale persisted `builderConfig` baked by an earlier build
  // and is re-applied on every reload, so we sanitize it here at the single
  // `createPivotTable` choke point rather than trust the incoming map.
  //
  // We first drop every aggregation whose column list is empty. If the user
  // has pivot columns selected but no (valid) aggregations — i.e. the
  // Aggregate values card is off or empty — a column-less pivot would render
  // only key columns with no values, which is rarely what's wanted. So when
  // the sanitized map is empty we synthesize a `Count` over a single source
  // column (the first column not already used as a row/column key, falling
  // back to the first column overall). This produces a meaningful count
  // pivot. The fallback is a BUILD-TIME detail only: it is NOT folded into
  // the persisted `builderConfig`/intent and never surfaces in the Aggregate
  // values card — the persisted config keeps the user's actual (empty)
  // aggregations.
  const withFallbackAggregations = (
    config: PivotConfig
  ): Record<string, string[]> => {
    // Collapse the ordered array into the order-insensitive
    // `operation → columns` map the pivot service expects, merging columns
    // for any operation that appears in more than one entry.
    const sanitized: Record<string, string[]> = {};
    toPivotAggregations(config.aggregations).forEach(
      ({ operation, columns }) => {
        if (columns.length === 0) return;
        sanitized[operation] = [...(sanitized[operation] ?? []), ...columns];
      }
    );

    if (Object.keys(sanitized).length > 0) {
      return sanitized;
    }

    const usedKeys = new Set([...config.rowKeys, ...config.columnKeys]);
    const fallbackColumn =
      table.columns.find(column => !usedKeys.has(column.name)) ??
      table.columns[0];

    if (fallbackColumn == null) {
      return sanitized;
    }

    return { [AggregationOperation.COUNT]: [fallbackColumn.name] };
  };

  let current: PivotConfig | null = null;
  // Monotonic token for in-flight pivot creations. Every `pivotConfig` write
  // increments it; async build steps abort early when their captured token
  // is stale. The host already cancels superseded model promises, but
  // bailing out before contacting the pivot service avoids wasted RPCs and
  // makes `pivotConfig` writes safe under rapid succession (e.g. drag flows
  // that flip config several times before the first build resolves).
  let pivotToken = 0;

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
      const pivotTable = await pivotService.createPivotTable({
        source: table as unknown as CorePlusDhType.Table,
        rowKeys: config.rowKeys,
        columnKeys: config.columnKeys,
        aggregations: withFallbackAggregations(config),
      });
      if (token !== pivotToken) {
        // Build resolved after a newer request superseded it. Close the
        // orphan table directly — the host's cancel handler won't run on a
        // promise that throws.
        pivotTable.close?.();
        throw new SupersededError();
      }
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
      log.error('createPivotTable failed for config', config, e);
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
