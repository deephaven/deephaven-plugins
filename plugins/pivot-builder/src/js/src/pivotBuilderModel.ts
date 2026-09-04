import deepEqual from 'fast-deep-equal';
import {
  IrisGridModel,
  IrisGridUtils,
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
import {
  resolveEffectiveBuilderConfig,
  type EffectiveBuilderConfig,
} from './resolveEffectiveBuilderConfig';

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
 * Event dispatched on the proxy when `applyPivotBuilderConfig` is handed a
 * config that references columns which no longer exist on the source table
 * (schema drift, e.g. a persisted rollup grouped on a column the query later
 * dropped). Distinct from {@link PIVOT_BUILDER_ERROR}: this is not a build
 * failure — the offending references are sanitized out before reaching the
 * host/service, and the model still renders. This event only lets the sidebar
 * surface a non-fatal notice that the saved config was silently trimmed.
 *
 * Fires at most once per distinct bad config (deduped against
 * `lastStaleNotifiedConfig`), so re-applying the same unchanged stale intent
 * on every sidebar reconcile does not re-toast. See also the
 * {@link PivotBuilderProxyModel.staleColumnReport} getter, which the
 * middleware reads synchronously to catch the hydration-time firing that
 * happens before any listener can be attached.
 */
export const PIVOT_BUILDER_STALE_COLUMNS =
  '@deephaven/js-plugin-pivot-builder/PIVOT_BUILDER_STALE_COLUMNS';

/**
 * `detail` payload of a {@link PIVOT_BUILDER_STALE_COLUMNS} event, and the
 * shape returned by {@link findStaleColumnRefs}. Each array holds the
 * (de-duplicated) column names referenced by that section of the config that
 * are missing from the live source schema. Empty arrays (never
 * `null`/`undefined`) mean nothing was stale in that section.
 */
export interface PivotBuilderStaleColumnsDetail {
  /** Missing columns referenced by `config.rollup` (grouping + aggregations). */
  rollupColumns: string[];
  /** Missing columns referenced by `config.totals.operationMap`. */
  totalsColumns: string[];
  /** Missing columns referenced by `config.pivot` (row/column keys + aggs). */
  pivotColumns: string[];
}

/**
 * Report of stale (missing-from-schema) column references found across a
 * `PivotBuilderConfig`. Structurally identical to
 * {@link PivotBuilderStaleColumnsDetail}; kept as a distinct name so the
 * "computed report" and "event payload" roles read clearly at call sites.
 */
export type StaleColumnReport = PivotBuilderStaleColumnsDetail;

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
 * Collapse a `PivotConfig.aggregations` into the order-insensitive
 * `Record<operation, columns[]>` payload accepted by
 * `coreplus.pivot.PivotService#createPivotTable`, sanitized against the
 * current source schema but WITHOUT any Count-fallback synthesis (that is
 * layered on by {@link buildPivotAggregationsMap}). Splitting these two steps
 * lets a caller see whether sanitization alone left an empty map — the signal
 * the total key-loss rule in {@link buildSanitizedPivotRequest} needs — rather
 * than having the fallback silently paper over it.
 *
 * Every column reference is validated against `columns`: references to
 * columns that no longer exist (schema drift) or whose type is invalid for
 * the operation (e.g. a persisted `Sum` over a string column — only
 * reachable via hydration of a config baked against a different schema, since
 * the sidebar editor filters these live with the same
 * `AggregationUtils.isValidOperation` rule) are dropped. This mirrors
 * iris-grid, which silently discards now-invalid aggregations at hydration
 * rather than failing the whole model. Aggregations left with no valid columns
 * are dropped entirely.
 */
export function sanitizePivotAggregations(
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
  return sanitized;
}

/**
 * The full `Record<operation, columns[]>` payload for
 * `PivotService#createPivotTable`: {@link sanitizePivotAggregations} plus a
 * Count-fallback synthesis. When sanitization leaves the map empty, a `Count`
 * over a single source column (the first not used as a row/column key, falling
 * back to the first column overall) is synthesized so a pivot with keys but no
 * usable values still renders meaningful counts. The fallback is a BUILD-TIME
 * detail only — it is NOT folded back into the persisted `builderConfig`/intent.
 */
export function buildPivotAggregationsMap(
  config: PivotConfig,
  columns: readonly DhType.Column[]
): Record<string, string[]> {
  const sanitized = sanitizePivotAggregations(config, columns);

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
 * The sanitized inputs to `PivotService#createPivotTable`, derived from a
 * `PivotConfig` at the build boundary. `rowKeys`/`columnKeys` are filtered to
 * columns that still exist on the source schema; `aggregations` is the
 * final map (post Count-fallback synthesis) unless {@link isEmpty} is set.
 */
export interface SanitizedPivotRequest {
  rowKeys: string[];
  columnKeys: string[];
  aggregations: Record<string, string[]>;
  /**
   * True only in the degenerate "total key-loss" case: every `rowKey` and
   * `columnKey` was dropped as stale AND the sanitized aggregations map (before
   * any Count-fallback synthesis) was also empty. A "Count of everything, zero
   * grouping" pivot provides no value, so the caller should revert to the flat
   * source rather than build it. When either some key survives, or the
   * sanitized aggregations are non-empty (a meaningful flat summary row),
   * this is `false` and {@link aggregations} is a real map to build with.
   */
  isEmpty: boolean;
}

/**
 * Sanitize a `PivotConfig` into the inputs handed to
 * `PivotService#createPivotTable`, filtering `rowKeys`/`columnKeys` and
 * aggregation columns against the live schema. Splitting the sanitized
 * aggregations from the Count-fallback synthesis (see
 * {@link sanitizePivotAggregations} vs {@link buildPivotAggregationsMap}) lets
 * us detect the total key-loss case ({@link SanitizedPivotRequest.isEmpty})
 * WITHOUT the Count fallback silently papering over it. Never mutates
 * `config`; the raw config remains the persisted intent.
 */
export function buildSanitizedPivotRequest(
  config: PivotConfig,
  columns: readonly DhType.Column[]
): SanitizedPivotRequest {
  const present = new Set(columns.map(column => column.name));
  const rowKeys = config.rowKeys.filter(name => present.has(name));
  const columnKeys = config.columnKeys.filter(name => present.has(name));
  const sanitizedAggregations = sanitizePivotAggregations(config, columns);
  const noKeys = rowKeys.length === 0 && columnKeys.length === 0;
  if (noKeys && Object.keys(sanitizedAggregations).length === 0) {
    return { rowKeys, columnKeys, aggregations: {}, isEmpty: true };
  }
  // Build the final map (which synthesizes a Count fallback only when keys
  // survived but aggregations are empty) against the SANITIZED keys so the
  // fallback column is never chosen relative to a stale key.
  const aggregations = buildPivotAggregationsMap(
    { ...config, rowKeys, columnKeys },
    columns
  );
  return { rowKeys, columnKeys, aggregations, isEmpty: false };
}

/**
 * Find every column reference in a `PivotBuilderConfig` that no longer exists
 * on the live source schema, grouped by section (rollup / totals / pivot).
 *
 * Pure existence check against `columns`: a reference whose column was renamed
 * or dropped is "stale". (Type-drift — e.g. a `Sum` over a column that became a
 * string — is handled separately by the build-time sanitizers, which is why it
 * is intentionally NOT reported here; the notification is specifically about
 * columns that "no longer exist".) Rollup grouping + rollup aggregations, the
 * totals `operationMap` keys, and pivot row/column keys + aggregations are all
 * checked regardless of which branch is currently active, since rollup/totals
 * data is mirrored onto the config even while a pivot supersedes it.
 *
 * Returns empty arrays (never `null`) when nothing is stale, de-duplicating
 * names within each section.
 */
export function findStaleColumnRefs(
  config: PivotBuilderConfig,
  columns: readonly DhType.Column[]
): StaleColumnReport {
  const present = new Set(columns.map(column => column.name));
  const missing = (names: readonly string[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    names.forEach(name => {
      if (!present.has(name) && !seen.has(name)) {
        seen.add(name);
        out.push(name);
      }
    });
    return out;
  };

  const rollupNames: string[] = [];
  const rollup = config.rollup as {
    groupingColumns?: readonly unknown[];
    aggregations?: Record<string, readonly string[]>;
  } | null;
  if (rollup != null) {
    (rollup.groupingColumns ?? []).forEach(name =>
      rollupNames.push(String(name))
    );
    if (rollup.aggregations != null) {
      Object.values(rollup.aggregations).forEach(cols =>
        (cols ?? []).forEach(name => rollupNames.push(name))
      );
    }
  }

  const totalsNames: string[] = [];
  const totals = config.totals as {
    operationMap?: Record<string, readonly string[]>;
  } | null;
  if (totals?.operationMap != null) {
    Object.keys(totals.operationMap).forEach(name => totalsNames.push(name));
  }

  const pivotNames: string[] = [];
  const { pivot } = config;
  if (pivot != null) {
    (pivot.rowKeys ?? []).forEach(name => pivotNames.push(name));
    (pivot.columnKeys ?? []).forEach(name => pivotNames.push(name));
    toPivotAggregations(pivot.aggregations).forEach(({ columns: cols }) =>
      cols.forEach(name => pivotNames.push(name))
    );
  }

  return {
    rollupColumns: missing(rollupNames),
    totalsColumns: missing(totalsNames),
    pivotColumns: missing(pivotNames),
  };
}

/**
 * The subset of a `PivotBuilderConfig` that determines whether a stale-columns
 * notification should re-fire: the data-bearing sections only. The `ui` field
 * (card switch positions / card contents) is deliberately excluded — it has no
 * bearing on which columns are stale, so toggling a UI-only switch while a
 * stale reference persists must NOT be treated as a "different" config that
 * re-toasts. Used both for the dedupe comparison and the stored snapshot.
 */
function staleNotifyKey(
  config: PivotBuilderConfig
): Pick<PivotBuilderConfig, 'pivot' | 'rollup' | 'totals'> {
  return {
    pivot: config.pivot,
    rollup: config.rollup,
    totals: config.totals,
  };
}

/**
 * Sanitizes a `RollupConfig` for the host `rollupConfig` setter (forwards
 * straight to `table.rollup()`, unvalidated): drops missing `groupingColumns`,
 * and filters aggregations by existence + `AggregationUtils.isValidOperation`.
 * Returns `null` if grouping ends up empty — a flat source beats a groupless
 * rollup. Empty aggregations with surviving grouping is fine. Never mutates
 * `rollup`.
 *
 * On the modern (`config.ui`-bearing) path an all-stale grouping never reaches
 * this function as a rollup at all: `resolveEffectiveBuilderConfig` deactivates
 * the rollup card and derives a standalone totals row (the aggregation salvage)
 * instead. This function's `null` collapse matters for legacy no-ui configs.
 */
export function sanitizeRollupConfig(
  rollup: DhType.RollupConfig,
  columns: readonly DhType.Column[]
): DhType.RollupConfig | null {
  const columnTypes = new Map(
    columns.map(column => [column.name, column.type])
  );
  const raw = rollup as unknown as {
    groupingColumns?: readonly unknown[];
    aggregations?: Record<string, readonly string[]>;
  };
  const groupingColumns = (raw.groupingColumns ?? [])
    .map(name => String(name))
    .filter(name => columnTypes.has(name));
  if (groupingColumns.length === 0) {
    return null;
  }
  // Keep the field absent (not an empty object) when the raw rollup had no
  // aggregations, so the spread below matches the raw shape exactly.
  const aggregations =
    raw.aggregations != null
      ? sanitizeRollupAggregationsMap(raw.aggregations, columnTypes)
      : undefined;
  return {
    ...(rollup as object),
    groupingColumns,
    ...(aggregations != null ? { aggregations } : {}),
  } as unknown as DhType.RollupConfig;
}

/**
 * Filter a rollup `operation → columns[]` aggregations map against the live
 * schema: drop columns that no longer exist or whose type is invalid for the
 * operation, and drop an operation entirely once its column list is empty.
 * Used by {@link sanitizeRollupConfig}.
 */
function sanitizeRollupAggregationsMap(
  aggregations: Record<string, readonly string[]>,
  columnTypes: Map<string, string>
): Record<string, string[]> {
  const sanitized: Record<string, string[]> = {};
  Object.entries(aggregations).forEach(([operation, cols]) => {
    const validColumns = (cols ?? []).filter(name => {
      const type = columnTypes.get(name);
      if (type == null) return false;
      return AggregationUtils.isValidOperation(
        operation as AggregationOperation,
        type
      );
    });
    if (validColumns.length > 0) {
      sanitized[operation] = validColumns;
    }
  });
  return sanitized;
}

/**
 * Sanitize a `UITotalsTableConfig` for the host totals write (which forwards
 * to `table.getTotalsTable()` with no validation). Drops `operationMap`
 * entries whose column key no longer exists, and filters each column's
 * operation list by `AggregationUtils.isValidOperation` (dropping the column
 * entirely once its operation list is empty). An empty `operationMap` after
 * sanitization is an acceptable terminal state (no totals row —
 * `defaultOperation` is `Skip`), so this returns a config, never `null`. Never
 * mutates `totals`.
 */
export function sanitizeTotalsConfig(
  totals: UITotalsTableConfig,
  columns: readonly DhType.Column[]
): UITotalsTableConfig {
  const columnTypes = new Map(
    columns.map(column => [column.name, column.type])
  );
  const raw = totals as unknown as {
    operationMap?: Record<string, readonly string[]>;
  };
  const operationMap: Record<string, string[]> = {};
  Object.entries(raw.operationMap ?? {}).forEach(([column, ops]) => {
    const type = columnTypes.get(column);
    if (type == null) return;
    const validOps = (ops ?? []).filter(op =>
      AggregationUtils.isValidOperation(op as AggregationOperation, type)
    );
    if (validOps.length > 0) {
      operationMap[column] = validOps;
    }
  });
  return {
    ...(totals as object),
    operationMap,
  } as unknown as UITotalsTableConfig;
}

/**
 * User-configured pivot settings. The `aggregations` array is collapsed into
 * the `Record<operation, columns[]>` payload accepted by
 * `coreplus.pivot.PivotService#createPivotTable` at the build boundary
 * (`buildSanitizedPivotRequest`); we keep the ordered array form here so the UI
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
   * Snapshot of the stale-column report computed on the LAST
   * `applyPivotBuilderConfig` call (including hydration), independent of the
   * once-per-bad-config event dedupe. The middleware reads this synchronously
   * when the model first becomes available, because the
   * `PIVOT_BUILDER_STALE_COLUMNS` event fires during hydration — before any
   * listener can be attached — so the event alone would never surface the
   * originally-reported bug. Always the three-array shape, never `null`.
   */
  readonly staleColumnReport: StaleColumnReport;
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
   *
   * `options.pivotAvailable` tells the model whether the worker's PivotService
   * probe reported `ready` (the model can't probe PSP synchronously). It is
   * consulted only when `config.ui` is present (the modern re-derivation path)
   * and remembered across the internal revert calls that omit it.
   */
  applyPivotBuilderConfig: (
    config: PivotBuilderConfig,
    options?: { pivotAvailable?: boolean }
  ) => Promise<void>;
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
  model: IrisGridModel
): PivotBuilderProxyModel {
  // CorePlus is NOT required to install the proxy: rollup and aggregate
  // (totals) are generic iris-grid features that work on any worker (Legacy
  // included) since they operate on the source table. Only the actual pivot
  // path needs CorePlus, so that check is deferred into `applyPivotConfig`'s
  // pivot branch (the single place that builds `PivotService` /
  // `IrisGridPivotModel`). The Pivot card is independently gated on CorePlus
  // availability, so a pivot can't be requested on a worker without it.

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

  // Sanitize the config's row/column keys and aggregations against the live
  // schema at this single `createPivotTable` choke point — dropping columns
  // that no longer exist, dropping schema-invalid aggregations, synthesizing a
  // `Count` fallback for an otherwise-empty map, and flagging the degenerate
  // total-key-loss case. See `buildSanitizedPivotRequest`. Sanitization is a
  // build-time concern only; `current`/`lastIntent`/`storedRollup`/
  // `storedTotals` keep the raw config so the user can see and fix the stale
  // reference in the sidebar.
  const sanitizePivotBuild = (config: PivotConfig): SanitizedPivotRequest =>
    buildSanitizedPivotRequest(config, table.columns);

  // Snapshot of the last-computed stale-column report and the last config a
  // stale-columns notification was dispatched for. Both are per-proxy (fresh
  // per model build): a worker/query restart that re-hydrates the same
  // still-broken persisted config re-notifies once, a deliberate recurring nag
  // until the user fixes the reference. `lastStaleColumnReport` is updated on
  // EVERY apply (independent of the dispatch dedupe) so the middleware can read
  // it synchronously to catch the hydration-time firing (which happens before
  // any listener can be attached).
  let lastStaleNotifiedConfig: Pick<
    PivotBuilderConfig,
    'pivot' | 'rollup' | 'totals'
  > | null = null;
  let lastStaleColumnReport: StaleColumnReport = {
    rollupColumns: [],
    totalsColumns: [],
    pivotColumns: [],
  };

  // Last explicitly-passed PivotService availability. The model can't probe
  // PSP synchronously, so callers (the sidebar, and the hydration transform
  // after a successful probe) pass it in; internal revert calls
  // (`recoverFromPivotFailure`) omit it and reuse this remembered value. Only
  // consulted on the modern `config.ui`-driven re-derivation path — a stale
  // `false` never matters on the legacy path (which ignores it). Defaults to
  // `false`: a pivot can't be built before the probe confirms availability.
  let lastKnownPivotAvailable = false;

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
    const decision = chooseRecoveryTarget(failedBuilderConfig, {
      lastGoodBuilderConfig,
      isRecoveringPivot,
    });
    lastGoodBuilderConfig = decision.nextLastGoodBuilderConfig;
    isRecoveringPivot = decision.nextIsRecoveringPivot;
    log.debug('Reverting pivot builder to safe config', decision.target);
    // Internal revert call: preserve the stale-column snapshot (and any
    // dispatch) computed by the ORIGINAL failing apply. Re-running staleness
    // detection here would overwrite `lastStaleColumnReport` with the report of
    // the safe target (typically empty), clobbering what the middleware needs
    // to read. See `skipStaleSnapshotUpdate` in `applyPivotBuilderConfigInternal`.
    applyPivotBuilderConfigInternal(decision.target, {
      skipStaleSnapshotUpdate: true,
    }).catch(() => undefined);
    return decision.target;
  };

  // `PivotService.getInstance()` returns a NEW service wrapper on every call,
  // and every service multiplexes over the worker's single bidi message
  // stream. dh-core fans each response out to ALL services on the stream, so a
  // stale service left over from a previous config edit receives responses for
  // ids it never issued and logs "No handler for response: N" via
  // console.error — once per stale service, so the noise grows with every
  // edit. The service is documented as a per-worker singleton ("The initial
  // call for a given worker must be either a PivotTable or a PivotService"), so
  // cache one service for this model's lifetime and reuse it across edits to
  // keep a single consumer on the stream.
  let cachedPivotServicePromise: Promise<CorePlusDhType.coreplus.pivot.PivotService> | null =
    null;

  const getPivotService = (
    corePlusDh: typeof CorePlusDhType
  ): Promise<CorePlusDhType.coreplus.pivot.PivotService> => {
    if (cachedPivotServicePromise != null) {
      return cachedPivotServicePromise;
    }
    cachedPivotServicePromise =
      // @ts-expect-error getInstance will be updated to take no args in the API
      corePlusDh.coreplus.pivot.PivotService.getInstance();
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

    // Sanitize row/column keys + aggregations against the live schema before
    // building. `current` already holds the raw config (persistence intent);
    // only the build inputs are sanitized.
    const sanitized = sanitizePivotBuild(config);
    if (sanitized.isEmpty) {
      // Defense-in-depth: `applyPivotBuilderConfigInternal` now routes any
      // all-keys-stale pivot away from this setter before it's ever called
      // (see `pivotKeysAllStale`), so this should be unreachable in practice.
      // If it's ever hit anyway, render the flat source without touching
      // `lastIntent`/persistence, same as that caller's own handling.
      log.debug(
        'Pivot fully stale (no surviving keys or aggregations); rendering flat source, intent preserved',
        config
      );
      isRecoveringPivot = false;
      current = null;
      proxy.setNextModel(Promise.resolve(proxy.originalModel));
      return;
    }

    const promise = (async (): Promise<IrisGridModel> => {
      log.info('Creating pivot with config:', config);
      // Pivot creation is the only CorePlus-gated path. The Pivot card is
      // disabled unless CorePlus is available, so this should never run on a
      // non-CorePlus (e.g. Legacy) worker — but guard anyway so a stray pivot
      // request fails loudly instead of casting a non-CorePlus `dh` and
      // dereferencing `coreplus` undefined.
      if (!isCorePlusDh(dh)) {
        throw new Error(
          'PivotService not available: CorePlus is required to create a pivot'
        );
      }
      const corePlusDh = dh;
      const pivotService = await getPivotService(corePlusDh);
      if (token !== pivotToken) throw new SupersededError();
      let pivotTable: CorePlusDhType.coreplus.pivot.PivotTable;
      try {
        pivotTable = await pivotService.createPivotTable({
          source: table as unknown as CorePlusDhType.Table,
          rowKeys: sanitized.rowKeys,
          columnKeys: sanitized.columnKeys,
          aggregations: sanitized.aggregations,
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
  // Mirror of the rollup config actually written to the host, from WHICHEVER
  // channel produced it — a genuine `config.rollup`, or the fallback
  // reconstructed from a pivot whose column keys went all-stale (see
  // `effectiveRollup` below). Writes are diffed against this — NOT against
  // `lastIntent.rollup` — for the same reason `appliedInnerTotals` exists
  // instead of diffing against `lastIntent.totals`: a raw-config diff is
  // right for genuine rollup mode (where `config.rollup` itself changes on
  // every edit) but wrong for the fallback (derived from `config.pivot` +
  // `config.ui` while `config.rollup` stays `null` throughout), and a single
  // applied-value diff serves both correctly and avoids redundant host
  // writes when a raw edit doesn't change the sanitized result.
  let appliedRollup: DhType.RollupConfig | null = null;

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

  // Synchronous snapshot of the last-computed stale-column report. Mirrors the
  // `builderConfig` getter pattern. The middleware reads this once when the
  // model first becomes available, to catch hydration-time staleness that
  // fired the `PIVOT_BUILDER_STALE_COLUMNS` event before any listener existed.
  Object.defineProperty(proxy, 'staleColumnReport', {
    configurable: true,
    enumerable: false,
    get(): StaleColumnReport {
      return lastStaleColumnReport;
    },
  });

  /**
   * Shared body for `applyPivotBuilderConfig`. `options.skipStaleSnapshotUpdate`
   * distinguishes INTERNAL, revert-driven calls (`recoverFromPivotFailure`'s
   * re-apply of a safe config) from EXTERNAL calls (the public proxy property,
   * used by the sidebar and by `makePivotModelTransform`'s hydration). When set, the
   * `lastStaleColumnReport` snapshot is left untouched and no
   * `PIVOT_BUILDER_STALE_COLUMNS` is dispatched — so the report computed by the
   * ORIGINAL problematic apply survives long enough for the middleware to read
   * it (it reads synchronously on mount, after the internal revert microtask
   * has already run). External calls always update/dispatch as before, so a
   * user manually clearing a stale config via the sidebar still clears the
   * snapshot. The distinguishing signal is "internal revert call", NOT "the
   * resulting config is empty".
   */
  function applyPivotBuilderConfigInternal(
    config: PivotBuilderConfig,
    options: {
      skipStaleSnapshotUpdate?: boolean;
      pivotAvailable?: boolean;
    } = {}
  ): Promise<void> {
    // Remember the caller's PivotService availability so the internal revert
    // calls (which omit it) reuse the last external value. Never widened here
    // to a default — only overwritten when a caller actually passes one.
    if (options.pivotAvailable !== undefined) {
      lastKnownPivotAvailable = options.pivotAvailable;
    }
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

    // Detect stale (missing-from-schema) column references on EVERY apply,
    // BEFORE the no-op short-circuit below. This placement is required: the
    // no-op return fires whenever the sidebar re-applies an unchanged intent,
    // and we still must (a) keep `lastStaleColumnReport` current so the
    // middleware's synchronous hydration read sees it, and (b) not lose a
    // legitimate first notification for a config that happens to equal the
    // last intent. The `lastStaleNotifiedConfig` guard (separate from
    // `lastIntent`) is what prevents re-toasting the SAME bad config on every
    // reconcile, so the dispatch can safely run above the no-op path.
    // Internal revert calls skip this entirely so the snapshot/dispatch from
    // the ORIGINAL problematic apply survives (see the doc comment above).
    if (options.skipStaleSnapshotUpdate !== true) {
      const report = findStaleColumnRefs(config, table.columns);
      lastStaleColumnReport = report;
      const hasStale =
        report.rollupColumns.length +
          report.totalsColumns.length +
          report.pivotColumns.length >
        0;
      // Dedupe on the data-bearing sections only, NOT `ui`: a UI-only change
      // (e.g. flipping a card switch) while the same stale reference persists
      // must not be seen as a "different" config that re-notifies.
      const notifyKey = staleNotifyKey(config);
      if (hasStale && !deepEqual(notifyKey, lastStaleNotifiedConfig)) {
        lastStaleNotifiedConfig = notifyKey;
        const detail: PivotBuilderStaleColumnsDetail = {
          rollupColumns: report.rollupColumns,
          totalsColumns: report.totalsColumns,
          pivotColumns: report.pivotColumns,
        };
        log.debug('Stale columns in applied config; notifying', detail);
        proxy.dispatchEvent(
          new EventShimCustomEvent(PIVOT_BUILDER_STALE_COLUMNS, { detail })
        );
      }
    }

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

    // Decide what to APPLY. A modern config carries raw card state (`ui`); we
    // re-derive the effective pivot/rollup/totals from it against the CURRENT
    // live schema through the SAME `resolveEffectiveBuilderConfig` the sidebar
    // uses, so a reload picks the mode the live sidebar would (the persisted
    // `pivot`/`rollup`/`totals` were derived at edit time against a possibly
    // different schema and must not be trusted verbatim). A legacy config (no
    // `ui`, predating that field) has nothing to re-derive from, so its
    // persisted derived values are applied as-is (sanitized below, with the
    // stale-column salvage guards). The RAW `config` is still what gets stored,
    // diffed, and dispatched — only the values handed to the host writers come
    // from `effective`.
    //
    // `rollupAvailable` is the host proxy's own live flag (rollup and Select
    // Distinct are mutually exclusive); `pivotAvailable` is the remembered
    // caller-supplied probe result.
    const useUiDerivation = config.ui != null;
    const hostRollupAvailable =
      (proxy as unknown as { isRollupAvailable?: boolean })
        .isRollupAvailable === true;
    const effective: EffectiveBuilderConfig = useUiDerivation
      ? resolveEffectiveBuilderConfig(
          config.ui as PivotBuilderUiState,
          table.columns,
          {
            pivotAvailable: lastKnownPivotAvailable,
            rollupAvailable: hostRollupAvailable,
          }
        )
      : { pivot: config.pivot, rollup: config.rollup, totals: config.totals };

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
    // LEGACY-path guards: a persisted pivot whose keys went all-stale must not
    // fire a real keyless `createPivotTable` RPC — treat it like the Pivot
    // section being off and fall through to the rollup/totals path below.
    // Unreachable on the modern path (`resolveEffectiveBuilderConfig` gates
    // `pivotActive` on a live pivot column). Reuses
    // `buildSanitizedPivotRequest` so the "present columns" filter isn't
    // re-derived.
    const sanitizedPivotRequest =
      effective.pivot != null
        ? buildSanitizedPivotRequest(effective.pivot, table.columns)
        : null;
    const pivotKeysAllStale =
      sanitizedPivotRequest != null &&
      sanitizedPivotRequest.rowKeys.length === 0 &&
      sanitizedPivotRequest.columnKeys.length === 0;
    // A pivot whose COLUMN keys all went stale but whose ROW keys survive
    // collapses to "grouping only, no column pivot". Rather than firing a real
    // but degenerate 0-column-key `createPivotTable` RPC, fall through to the
    // rollup/totals path below and reconstruct a genuine rollup keyed on the
    // surviving row keys (see `fallbackRollupFromPivot`). Mirrors the
    // interactive sidebar's own fallback (`CreatePivotPage`: pivotActive false,
    // rollupActive true) so reload behaves the same as the live sidebar.
    const pivotColumnKeysAllStale =
      sanitizedPivotRequest != null &&
      sanitizedPivotRequest.columnKeys.length === 0 &&
      sanitizedPivotRequest.rowKeys.length > 0;
    if (
      effective.pivot != null &&
      !pivotKeysAllStale &&
      !pivotColumnKeysAllStale
    ) {
      // Pivot supersedes rollup/totals. The pivot itself is built off
      // the source table directly, so we don't apply rollup/totals to
      // the inner model — but we must clear the host's *internal*
      // `this.rollup` cache (only updated via the host setter) so a
      // later rollup-back transition can't be `deepEqual`-suppressed
      // against a stale cached value. `appliedRollup` tracks whichever
      // channel (genuine or fallback) last wrote it, so one check covers
      // both. The transient `setNextModel(originalModel)` queued by this
      // clear is immediately superseded — and safely cancelled — by the
      // pivot `setNextModel` below; `originalModel` is special-cased to
      // not close on cancel.
      if (appliedRollup != null) {
        log.debug('Clearing host rollup cache before pivot');
        rollupDesc?.set?.call(proxy, null);
        appliedRollup = null;
      }
      // Legacy applies `config.pivot` and diffs it against `lastIntent.pivot`
      // (both raw). The derivation path applies `effective.pivot` (derived from
      // `config.ui`), which is unrelated to the raw `lastIntent.pivot`, so pass
      // it unconditionally and let `applyPivotConfig`'s own
      // `deepEqual(current, config)` no-op handle idempotency against the last
      // APPLIED pivot. Either way capture the RAW `config` in
      // `pendingPivotBuilderConfig` for the failure-revert machinery.
      const pivotChanged =
        useUiDerivation || !deepEqual(effective.pivot, lastIntent.pivot);
      if (pivotChanged) {
        log.debug('Applying pivotConfig', effective.pivot);
        // Remember the full intent driving this build so a build failure
        // can identify what failed and revert to the last good config.
        pendingPivotBuilderConfig = config;
        proxyWithPivot.pivotConfig = effective.pivot;
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

    // Pivot inactive — clear it before reconciling rollup/totals. Check the
    // APPLIED pivot (`pivotConfig`, i.e. `current`), not the raw
    // `lastIntent.pivot`: under ui-derivation a pivot can be applied while the
    // raw persisted `pivot` field is null (e.g. hydrating a stale-derived
    // rollup whose ui implies a pivot), and a raw-intent check would skip this
    // clear — leaving `pivotConfig`/`isPivot` stuck on the old pivot (pivot
    // renderer/theme applied to a rollup model).
    if (proxyWithPivot.pivotConfig != null) {
      log.debug('Clearing pivotConfig (pivot inactive)');
      proxyWithPivot.pivotConfig = null;
    }

    // Sanitize before the host `rollupConfig` setter (which forwards
    // straight to `table.rollup()` with no validation): drop grouping
    // columns / aggregations that reference missing or type-invalid
    // columns. A rollup whose every grouping column was dropped falls back
    // to `null` (flat source) — a still-a-rollup-but-empty config would
    // build a broken/empty TreeTable. `storedRollup` keeps the RAW value.
    // On the modern path `effective.rollup` is already re-derived against the
    // live schema (and only ever non-null when a grouping column survives), so
    // sanitization there is harmless cleanup; on the legacy path it is what
    // trims the persisted derived rollup.
    const sanitizedRollup =
      effective.rollup != null
        ? sanitizeRollupConfig(effective.rollup, table.columns)
        : null;
    // A pivot whose column keys are ALL stale but whose row keys survive
    // collapses to "grouping only, no column pivot" — reconstruct a genuine
    // rollup keyed on the surviving row keys instead of asking the pivot
    // service for a degenerate 0-column-key pivot (see `pivotColumnKeysAllStale`
    // above). This is a LEGACY-path salvage: on the modern path
    // `resolveEffectiveBuilderConfig` already gates `pivotActive` on a live
    // pivot column, so `effective.pivot` never has all-stale column keys and
    // `pivotColumnKeysAllStale` is always false — the derivation produces the
    // rollup/totals directly instead. Self-contained from `sanitizedPivotRequest`
    // (guaranteed live row keys) + `config.ui` when present (but on the legacy
    // path `config.ui` is null, so the `?? true` defaults match
    // `getModelRollupConfig`'s OWN defaults). Passed through
    // `sanitizeRollupConfig` for the same empty-operation cleanup the genuine
    // rollup path gets.
    const rollupFromPivotCandidate =
      pivotColumnKeysAllStale && sanitizedPivotRequest != null
        ? IrisGridUtils.getModelRollupConfig(
            table.columns,
            {
              columns: sanitizedPivotRequest.rowKeys,
              // `?? true` matches `getModelRollupConfig`'s OWN defaults for a
              // missing config field, so an absent `config.ui` (very old
              // config) yields constituents + non-aggregated passthrough both
              // on, exactly as if these had been left undefined.
              showConstituents: config.ui?.includeConstituents ?? true,
              showNonAggregatedColumns:
                config.ui?.nonAggregatedInRollup ?? true,
              includeDescriptions: true,
            },
            config.ui?.aggregatesOn === true && config.ui?.aggregations != null
              ? config.ui.aggregations
              : { aggregations: [], showOnTop: false }
          )
        : null;
    // `getModelRollupConfig` only returns `null` when its `columns` param is
    // empty, which can't happen here (`pivotColumnKeysAllStale` guarantees
    // `sanitizedPivotRequest.rowKeys.length > 0`) — the null check is purely
    // to satisfy the type signature.
    const fallbackRollupFromPivot =
      rollupFromPivotCandidate != null
        ? sanitizeRollupConfig(rollupFromPivotCandidate, table.columns)
        : null;
    // Exactly one rollup channel is ever active at a time — the (re-derived or
    // legacy) rollup, or the fallback reconstructed from a legacy pivot whose
    // column keys went all-stale — so combine them into a single effective
    // value and write it through ONE call site, diffed against the single
    // `appliedRollup` tracking variable. A raw-config diff is right for genuine
    // rollup edits but wrong for the fallback (derived while `config.rollup`
    // stays `null`), and one applied-value diff serves both and avoids
    // redundant host writes when a raw edit doesn't change the sanitized result.
    const effectiveRollup = sanitizedRollup ?? fallbackRollupFromPivot;
    if (!deepEqual(effectiveRollup, appliedRollup)) {
      log.debug('Applying rollupConfig (sanitized)', effectiveRollup);
      rollupDesc?.set?.call(proxy, effectiveRollup);
      appliedRollup = effectiveRollup;
    }
    storedRollup = config.rollup;

    // Sanitize totals before the host write (which forwards to
    // `table.getTotalsTable()` with no validation): drop `operationMap`
    // entries that reference missing or type-invalid columns. Diff the
    // SANITIZED value against the base model's real totals (the queued write
    // if one is pending, otherwise the last applied value) — NOT the raw
    // value. A raw-vs-sanitized diff would be true on essentially every
    // reconcile while any stale entry persists (they're never structurally
    // equal), re-firing `writeTotalsToInner` / `table.getTotalsTable()` each
    // time — RPC churn/flicker. Diffing against `appliedInnerTotals` (also
    // sanitized) keeps it sanitized-vs-sanitized and stable. On the modern path
    // `effective.totals` is the re-derived standalone-aggregations row (the
    // salvage that used to live in a `fallbackTotals` branch now happens inside
    // `resolveEffectiveBuilderConfig`, which returns a totals config whenever
    // rollup/pivot are inactive but aggregations are live); on the legacy path
    // it is the persisted `config.totals`. `storedTotals` keeps the RAW value.
    const sanitizedTotals =
      effective.totals != null
        ? sanitizeTotalsConfig(effective.totals, table.columns)
        : null;
    const totalsToApply = sanitizedTotals;
    const effectiveInnerTotals =
      pendingTotals !== undefined ? pendingTotals : appliedInnerTotals;
    if (!deepEqual(totalsToApply, effectiveInnerTotals)) {
      log.debug('Applying totalsConfig (sanitized)', totalsToApply);
      if (proxyAsAny.modelPromise != null) {
        // Mid-swap — queue and flush on next COLUMNS_CHANGED/TABLE_CHANGED.
        pendingTotals = totalsToApply;
      } else {
        pendingTotals = undefined;
        writeTotalsToInner(totalsToApply);
      }
    }
    // Keep the RAW, actual totals UI state — the fallback is an internal
    // host-forwarding detail and must stay invisible to the sidebar's totals
    // card (which would otherwise show a phantom config the user never set).
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
  }

  Object.defineProperty(proxy, 'applyPivotBuilderConfig', {
    configurable: true,
    enumerable: false,
    // Public entry point: all external callers (sidebar, hydration transform)
    // go through here, so staleness detection runs and the
    // snapshot/notification behave exactly as before. Callers may pass
    // `{ pivotAvailable }` (remembered for the internal revert calls that omit
    // it). Only the internal revert call sites pass
    // `{ skipStaleSnapshotUpdate: true }`.
    value(
      config: PivotBuilderConfig,
      options: { pivotAvailable?: boolean } = {}
    ): Promise<void> {
      return applyPivotBuilderConfigInternal(config, options);
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
