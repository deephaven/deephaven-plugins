import { IrisGridUtils, type UITotalsTableConfig } from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { PivotConfig, PivotBuilderUiState } from './pivotBuilderModel';
import {
  EMPTY_AGGREGATION_SETTINGS,
  aggregationsToPivot,
} from './seedPivotBuilderUiState';

/**
 * The derived model view (exactly one of `pivot`/`rollup`/`totals` non-null, or
 * all null for the flat source) produced from a `PivotBuilderUiState` against a
 * live schema. This is the single source of truth for "which mode do these
 * cards imply", shared by the sidebar's reconcile effect
 * (`CreatePivotPage`) and the model's hydration/apply
 * (`applyPivotBuilderConfigInternal`) so a reload derives the SAME mode the
 * live sidebar would.
 */
export interface EffectiveBuilderConfig {
  pivot: PivotConfig | null;
  rollup: DhType.RollupConfig | null;
  totals: UITotalsTableConfig | null;
}

/**
 * Feature availability the derivation gates on. `rollupAvailable` reflects
 * whether the host model can currently apply a rollup (rollup and Select
 * Distinct are mutually exclusive); `pivotAvailable` reflects whether the
 * worker's PivotService probe reported `ready`. Both gate their respective
 * cards off when false (a rollup/pivot write would otherwise silently no-op or
 * hang), falling back to a lower mode.
 */
export interface BuilderConfigAvailability {
  pivotAvailable: boolean;
  rollupAvailable: boolean;
}

/**
 * Derive the effective pivot/rollup/totals from the card UI state against the
 * CURRENT live columns, using the same mode-selection rules as the sidebar.
 *
 * A card counts as "active" only if at least one of its listed columns still
 * exists on the live table — a card whose entries are ALL stale (schema drift)
 * behaves as if it were never populated. That is what lets an all-stale Pivot
 * columns card fall through to a genuine rollup (rather than a degenerate
 * 0-column-key pivot), and an all-stale Rollup rows card fall through to a
 * standalone totals row.
 *
 * The three-way branch mirrors `CreatePivotPage`'s reconcile exactly:
 *   - Pivot active   → a `PivotConfig` (row keys from the rollup card when it
 *                      is also active, else empty; column keys + aggregations
 *                      from the cards). Stale column references are left in and
 *                      sanitized at the build choke point.
 *   - else Rollup    → `getModelRollupConfig` off the live columns.
 *   - else           → `getModelTotalsConfig` (a standalone aggregations row;
 *                      `null` when there are no active aggregations).
 */
export function resolveEffectiveBuilderConfig(
  ui: PivotBuilderUiState,
  columns: readonly DhType.Column[],
  availability: BuilderConfigAvailability
): EffectiveBuilderConfig {
  const { pivotAvailable, rollupAvailable } = availability;

  // Set of live column names (existence check). A Set — not a plain-object map
  // — so a column literally named `constructor`/`toString` can't resolve to an
  // inherited Object.prototype member.
  const present = new Set(columns.map(column => column.name));
  const hasLiveColumn = (names: readonly string[]): boolean =>
    names.some(name => present.has(name));

  // Global toggle gates all three sections: when off, everything is computed as
  // if every card were toggled off, clearing the modification from the model
  // without disturbing the per-card switch states or card contents.
  const rollupActive =
    ui.globalOn &&
    rollupAvailable &&
    ui.rollupRowsOn &&
    hasLiveColumn(ui.rollupRows);
  const aggsActive =
    ui.globalOn &&
    ui.aggregatesOn &&
    ui.aggregations.aggregations.some(
      a => a.invert || hasLiveColumn(a.selected)
    );

  const effectiveAggregationSettings = aggsActive
    ? ui.aggregations
    : EMPTY_AGGREGATION_SETTINGS;

  // Pivot is valid with empty rowKeys (PSP collapses to a single row). It is
  // NOT valid with an empty aggregations map, but that `Count` fallback is
  // synthesized quietly at the `createPivotTable` call so it never leaks into
  // the persisted intent. Also gate on PSP being available; otherwise
  // createPivotTable hangs and the proxy times out.
  const pivotActive =
    ui.globalOn &&
    pivotAvailable &&
    rollupAvailable &&
    ui.pivotColumnsOn &&
    hasLiveColumn(ui.pivotColumns);

  let pivot: PivotConfig | null = null;
  let rollup: DhType.RollupConfig | null = null;
  let totals: UITotalsTableConfig | null = null;

  if (pivotActive) {
    // Rollup rows become the pivot's row keys, but only when the rollup card is
    // active; disabling the rollup card while pivot is on collapses the pivot
    // to a single row.
    const rowKeys = rollupActive ? ui.rollupRows : [];
    pivot = {
      rowKeys,
      columnKeys: ui.pivotColumns,
      aggregations: aggregationsToPivot(effectiveAggregationSettings),
    };
  } else if (rollupActive) {
    // Rollup folds aggregations into its config; standalone totals row is
    // suppressed.
    rollup = IrisGridUtils.getModelRollupConfig(
      columns,
      {
        columns: ui.rollupRows,
        showConstituents: ui.includeConstituents,
        showNonAggregatedColumns: ui.nonAggregatedInRollup,
        includeDescriptions: true as const,
      },
      effectiveAggregationSettings
    );
  } else {
    // No pivot, no rollup — aggregations become a standalone totals row.
    totals = IrisGridUtils.getModelTotalsConfig(
      columns,
      undefined,
      effectiveAggregationSettings
    );
  }

  return { pivot, rollup, totals };
}

export default resolveEffectiveBuilderConfig;
