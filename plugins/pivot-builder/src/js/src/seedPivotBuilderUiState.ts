import type {
  AggregationSettings,
  UITotalsTableConfig,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  toPivotAggregations,
  type PivotAggregation,
  type PivotConfig,
  type PivotBuilderUiState,
} from './pivotBuilderModel';

export const EMPTY_AGGREGATION_SETTINGS: AggregationSettings = {
  aggregations: [],
  showOnTop: false,
};

/**
 * Convert an `operation → columns` map (as stored on `RollupConfig` and
 * `PivotConfig`) into the host's `AggregationSettings.aggregations`
 * array. The `invert` flag is not recoverable from a map and defaults
 * to `false`.
 */
export function aggregationsFromOpMap(
  map: Record<string, readonly string[]>
): AggregationSettings['aggregations'] {
  return Object.entries(map)
    .filter(([, cols]) => (cols?.length ?? 0) > 0)
    .map(([operation, cols]) => ({
      operation:
        operation as AggregationSettings['aggregations'][number]['operation'],
      selected: [...(cols ?? [])],
      invert: false,
    }));
}

/**
 * Reverse-engineer `AggregationSettings` from a `RollupConfig` or
 * `UITotalsTableConfig` so the sidebar's Aggregate values card hydrates
 * from the proxy's last-seen state. The `invert` flag is not
 * recoverable from either source and defaults to `false`.
 */
export function seedAggregationSettings(
  rollup: DhType.RollupConfig | null,
  totals: UITotalsTableConfig | null
): AggregationSettings {
  const rollupAggs = (
    rollup as { aggregations?: Record<string, readonly string[]> } | null
  )?.aggregations;
  if (rollupAggs) {
    return {
      aggregations: aggregationsFromOpMap(rollupAggs),
      showOnTop: false,
    };
  }
  if (totals?.operationMap) {
    const byOp = new Map<string, string[]>();
    Object.entries(totals.operationMap).forEach(([col, ops]) => {
      (ops ?? []).forEach(op => {
        const list = byOp.get(op) ?? [];
        list.push(col);
        byOp.set(op, list);
      });
    });
    const order = totals.operationOrder ?? [...byOp.keys()];
    const seen = new Set<string>();
    const aggregations = order
      .filter(op => {
        if (seen.has(op)) return false;
        seen.add(op);
        return byOp.has(op);
      })
      .map(op => ({
        operation:
          op as AggregationSettings['aggregations'][number]['operation'],
        selected: byOp.get(op) ?? [],
        invert: false,
      }));
    return { aggregations, showOnTop: totals.showOnTop ?? false };
  }
  return EMPTY_AGGREGATION_SETTINGS;
}

export function aggregationsToPivot(
  settings: AggregationSettings
): PivotAggregation[] {
  return settings.aggregations
    .filter(agg => agg.selected.length > 0)
    .map(agg => ({
      operation: String(agg.operation),
      columns: [...agg.selected],
    }));
}

/**
 * Convert a `PivotConfig`'s ordered aggregation array back into the host's
 * `AggregationSettings.aggregations`. Inverse of `aggregationsToPivot`; the
 * `invert` flag is not carried on `PivotConfig` and defaults to `false`.
 */
export function aggregationsFromPivot(
  aggregations: PivotAggregation[] | Record<string, string[]>
): AggregationSettings['aggregations'] {
  return toPivotAggregations(aggregations)
    .filter(agg => agg.columns.length > 0)
    .map(agg => ({
      operation:
        agg.operation as AggregationSettings['aggregations'][number]['operation'],
      selected: [...agg.columns],
      invert: false,
    }));
}

/**
 * Sources the Create Pivot page seeds from the proxy's last applied intent.
 * `ui` is the authoritative restore source when present (it carries switch
 * positions and the contents of toggled-off cards); `pivot`/`rollup`/`totals`
 * are the derived-model fallbacks used when opening a dashboard saved before
 * the pivot-builder persisted its UI state — i.e. legacy iris-grid panel
 * state where only `rollup`/`totals` survive.
 */
export interface PivotBuilderSeedIntent {
  uiIntent: PivotBuilderUiState | null;
  pivotIntent: PivotConfig | null;
  rollupIntent: DhType.RollupConfig | null;
  totalsIntent: UITotalsTableConfig | null;
}

/**
 * Build the initial `PivotBuilderUiState` for the Create Pivot page from the
 * proxy's last applied intent. Pure (no React, no model) so the legacy
 * hydration path — pulling rollup rows and aggregations out of a pre-plugin
 * iris-grid `rollupConfig` / `totalsConfig` — is unit-testable in isolation.
 *
 * Per-field priority: persisted `uiIntent` wins; otherwise fall back to the
 * derived `pivotIntent`, then the legacy `rollupIntent` / `totalsIntent`.
 * `showNonAggregatedColumns` is UI-only (not faithfully recoverable from a
 * `dh.RollupConfig`) so it defaults to `true`.
 */
export function seedPivotBuilderUiState({
  uiIntent,
  pivotIntent,
  rollupIntent,
  totalsIntent,
}: PivotBuilderSeedIntent): PivotBuilderUiState {
  const seedRollupRows = (): string[] => {
    if (uiIntent != null) return [...uiIntent.rollupRows];
    if (pivotIntent != null) return [...pivotIntent.rowKeys];
    return rollupIntent?.groupingColumns?.map((c: unknown) => String(c)) ?? [];
  };
  const seedAggregations = (): AggregationSettings => {
    if (uiIntent != null) return uiIntent.aggregations;
    if (pivotIntent != null) {
      return {
        aggregations: aggregationsFromPivot(pivotIntent.aggregations),
        showOnTop: false,
      };
    }
    return seedAggregationSettings(rollupIntent, totalsIntent);
  };
  const seedPivotColumns = (): string[] => {
    if (uiIntent != null) return [...uiIntent.pivotColumns];
    if (pivotIntent != null) return [...pivotIntent.columnKeys];
    return [];
  };
  return {
    globalOn: uiIntent?.globalOn ?? true,
    rollupRowsOn: uiIntent?.rollupRowsOn ?? true,
    rollupRows: seedRollupRows(),
    includeConstituents:
      uiIntent?.includeConstituents ??
      rollupIntent?.includeConstituents ??
      true,
    nonAggregatedInRollup: uiIntent?.nonAggregatedInRollup ?? true,
    aggregatesOn: uiIntent?.aggregatesOn ?? true,
    aggregations: seedAggregations(),
    pivotColumnsOn: uiIntent?.pivotColumnsOn ?? true,
    pivotColumns: seedPivotColumns(),
    filterableOn: uiIntent?.filterableOn ?? true,
    filterableColumns: uiIntent?.filterableColumns ?? [],
  };
}
