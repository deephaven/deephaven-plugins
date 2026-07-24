/* eslint-disable max-classes-per-file -- test mocks intentionally define multiple small fakes */
import { IrisGridModel, type AggregationSettings } from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  augmentPivotBuilderModel,
  isPivotBuilderIrisGridModel,
  PIVOT_BUILDER_STALE_COLUMNS,
  type PivotBuilderConfig,
  type PivotBuilderProxyModel,
  type PivotBuilderUiState,
  type PivotConfig,
} from './pivotBuilderModel';
import { EMPTY_AGGREGATION_SETTINGS } from './seedPivotBuilderUiState';
import { makePivotModelTransform } from './makePivotModelTransform';

const STRING = 'java.lang.String';
const DOUBLE = 'double';
const INT = 'int';

function col(name: string, type: string): DhType.Column {
  return { name, type } as unknown as DhType.Column;
}

function makeRollup(
  groupingColumns: string[],
  aggregations?: Record<string, string[]>
): DhType.RollupConfig {
  return { groupingColumns, aggregations } as unknown as DhType.RollupConfig;
}

function makeTotals(
  operationMap: Record<string, string[]>
): DhType.TotalsTableConfig {
  return {
    operationMap,
    operationOrder: [],
    showOnTop: false,
    defaultOperation: 'Skip',
  } as unknown as DhType.TotalsTableConfig;
}

function makePivot(partial: Partial<PivotConfig>): PivotConfig {
  return { rowKeys: [], columnKeys: [], aggregations: [], ...partial };
}

/**
 * Build a `PivotBuilderUiState` carrying the given `aggregations` (the raw
 * "Aggregate values" card state). Under ui-driven derivation the model
 * re-derives pivot/rollup/totals from THIS state against the live schema, so
 * tests set `rollupRows`/`pivotColumns` (via `overrides`) consistent with the
 * scenario's raw derived config — mirroring how the real sidebar always writes
 * `ui` and the derived values from the same state.
 */
function makeUi(
  aggregations: AggregationSettings,
  overrides: Partial<PivotBuilderUiState> = {}
): PivotBuilderUiState {
  return {
    globalOn: true,
    rollupRowsOn: true,
    rollupRows: [],
    includeConstituents: true,
    nonAggregatedInRollup: true,
    aggregatesOn: true,
    aggregations,
    pivotColumnsOn: true,
    pivotColumns: [],
    filterableOn: true,
    filterableColumns: [],
    ...overrides,
  };
}

/** A single real aggregation (`operation` over `columns`), `invert` false. */
function makeAggregationSettings(
  operation: string,
  columns: string[]
): AggregationSettings {
  return {
    aggregations: [
      {
        operation:
          operation as AggregationSettings['aggregations'][number]['operation'],
        selected: columns,
        invert: false,
      },
    ],
    showOnTop: false,
  };
}

type Listener = (e: Event) => void;

/** Fake for the host proxy's stable, pre-pivot `originalModel`. */
class FakeOriginalModel {
  table: { columns: DhType.Column[] };

  totalsWrites: unknown[] = [];

  private totalsValue: unknown = null;

  constructor(columns: DhType.Column[]) {
    this.table = { columns };
  }

  get totalsConfig(): unknown {
    return this.totalsValue;
  }

  set totalsConfig(v: unknown) {
    this.totalsValue = v;
    this.totalsWrites.push(v);
  }
}

/**
 * Minimal fake of the host `IrisGridProxyModel` that `augmentPivotBuilderModel`
 * augments. Notably, `rollupConfig` is a PROTOTYPE getter/setter (the "real"
 * host setter the sidebar forwards sanitized configs to) so
 * `Object.getPrototypeOf(proxy)`'s `rollupConfig` descriptor is captured
 * correctly; `augmentPivotBuilderModel` then shadows it with an instance
 * store-only property.
 */
class FakeHostModel {
  originalModel: FakeOriginalModel;

  hostRollupWrites: unknown[] = [];

  // The host proxy exposes `isRollupAvailable`; the model reads it to gate the
  // ui-driven rollup/pivot derivation. Rollup is available on the fake unless a
  // test overrides it.
  isRollupAvailable = true;

  modelPromise: Promise<unknown> | null = null;

  private resolveSwap: ((value?: unknown) => void) | null = null;

  private listeners = new Map<string, Set<Listener>>();

  constructor(originalModel: FakeOriginalModel) {
    this.originalModel = originalModel;
  }

  get columns(): DhType.Column[] {
    return this.originalModel.table.columns;
  }

  // The host's REAL rollupConfig setter (prototype). Records the value the
  // sidebar forwarded and, for a non-null rollup, simulates the host's async
  // inner-model swap by parking a `modelPromise`.
  // eslint-disable-next-line class-methods-use-this
  get rollupConfig(): unknown {
    return null;
  }

  set rollupConfig(v: unknown) {
    this.hostRollupWrites.push(v);
    if (v != null) {
      this.modelPromise = new Promise(resolve => {
        this.resolveSwap = resolve;
      });
    }
  }

  /** Resolve a simulated in-flight rollup swap. */
  settleSwap(): void {
    this.modelPromise = null;
    this.resolveSwap?.();
    this.resolveSwap = null;
  }

  setNextModel(promise: Promise<unknown>): void {
    this.modelPromise = promise;
    promise.then(
      () => {
        if (this.modelPromise === promise) this.modelPromise = null;
      },
      () => {
        if (this.modelPromise === promise) this.modelPromise = null;
      }
    );
  }

  addEventListener(type: string, fn: Listener): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(fn);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, fn: Listener): void {
    this.listeners.get(type)?.delete(fn);
  }

  dispatchEvent(e: Event): boolean {
    const set = this.listeners.get(e.type);
    if (set != null) {
      [...set].forEach(fn => fn(e));
    }
    return true;
  }
}

function makeProxy(columns: DhType.Column[]): {
  proxy: PivotBuilderProxyModel;
  host: FakeHostModel;
  original: FakeOriginalModel;
} {
  const original = new FakeOriginalModel(columns);
  const host = new FakeHostModel(original);
  // The fake `dh` has no `coreplus` key, so `isCorePlusDh` always fails and a
  // real pivot build never reaches this getter — routing is asserted via
  // `proxy.pivotConfig` instead (set synchronously before that gate runs).
  const proxy = augmentPivotBuilderModel(
    {} as never,
    host as unknown as IrisGridModel,
    () => Promise.reject(new Error('no psp'))
  );
  return { proxy, host, original };
}

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('applyPivotBuilderConfig — rollup sanitization', () => {
  it('sanitizes to flat (no host write) when every grouping column is stale, keeps raw stored', async () => {
    const { proxy, host } = makeProxy([col('A', DOUBLE)]);
    const raw = makeRollup(['B']);
    const config: PivotBuilderConfig = {
      pivot: null,
      rollup: raw,
      totals: null,
    };

    await proxy.applyPivotBuilderConfig(config);

    // The sanitized value (null/flat) is never written to the host: on a
    // fresh proxy the tracked "last applied rollup" already starts `null`,
    // and the real `IrisGridProxyModel#rollupConfig` setter is itself
    // idempotent on an unchanged value (`deepEqual(rollupConfig, this.rollup)`
    // short-circuits), so skipping the redundant call is behaviorally
    // identical to calling it — just without the wasted round-trip.
    expect(host.hostRollupWrites).toEqual([]);
    // Stored/persisted intent keeps the RAW stale rollup.
    expect(proxy.rollupConfig).toBe(raw);
    expect(proxy.builderConfig.rollup).toBe(raw);
  });

  it('salvages a genuine user aggregation as a totals row when every grouping column is stale', async () => {
    const { proxy, host, original } = makeProxy([col('price', DOUBLE)]);
    // The Rollup rows card is on with a now-stale `gone` grouping, and the user
    // configured a genuine Count over the still-present `price`. Under ui-driven
    // derivation the model re-derives from `ui` against the live schema: the
    // rollup card has no live column so `rollupActive` is false, but the
    // aggregation card is live, so the derivation falls through to a standalone
    // totals row (via the REAL `getModelTotalsConfig`) — the aggregation is NOT
    // dropped. The raw stale rollup stays in `builderConfig`/`rollupConfig`.
    const raw = makeRollup(['gone'], { Count: ['price'] });
    const config: PivotBuilderConfig = {
      pivot: null,
      rollup: raw,
      totals: null,
      ui: makeUi(makeAggregationSettings('Count', ['price']), {
        rollupRows: ['gone'],
      }),
    };

    // Writing `null` (flat) to the host does NOT park a swap, so this resolves
    // synchronously without `settleSwap`.
    await proxy.applyPivotBuilderConfig(config);

    // Rollup collapses to null (flat) — grouping fully dropped. No host
    // write occurs: a fresh proxy's tracked rollup already starts `null`.
    expect(host.hostRollupWrites).toEqual([]);
    // The genuine Count aggregation is salvaged onto the totals channel
    // (produced by the real `getModelTotalsConfig` conversion of
    // `ui.aggregations`, not a hand-built totals object).
    expect(original.totalsWrites).toHaveLength(1);
    expect(
      (original.totalsWrites[0] as { operationMap: unknown }).operationMap
    ).toEqual({ price: ['Count'] });
    // Persisted rollup intent keeps the RAW stale rollup...
    expect(proxy.rollupConfig).toBe(raw);
    // ...and the totals UI state stays null — the fallback is invisible to the
    // sidebar's totals card (no phantom config).
    expect(proxy.totalsConfig).toBeNull();
  });

  it('salvages only the schema-valid aggregations from ui.aggregations (real conversion, not a prebuilt totals object)', async () => {
    const { proxy, host, original } = makeProxy([col('price', DOUBLE)]);
    // The user configured two aggregations, but one references a dropped column,
    // and the rollup card's grouping is fully stale. Under ui-driven derivation
    // the rollup card is inactive (no live grouping) so the derivation falls to
    // a standalone totals row, running the REAL `getModelTotalsConfig` over
    // `ui.aggregations` — which filters each aggregation against the live
    // schema. Only the surviving Count over `price` is salvaged.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone'], { Count: ['price'] }),
      totals: null,
      ui: makeUi(
        {
          aggregations: [
            {
              operation:
                'Count' as AggregationSettings['aggregations'][number]['operation'],
              selected: ['price'],
              invert: false,
            },
            {
              operation:
                'Sum' as AggregationSettings['aggregations'][number]['operation'],
              selected: ['dropped'],
              invert: false,
            },
          ],
          showOnTop: false,
        },
        { rollupRows: ['gone'] }
      ),
    });

    // No host write: a fresh proxy's tracked rollup already starts `null`.
    expect(host.hostRollupWrites).toEqual([]);
    expect(original.totalsWrites).toHaveLength(1);
    expect(
      (original.totalsWrites[0] as { operationMap: unknown }).operationMap
    ).toEqual({ price: ['Count'] });
  });

  it('does NOT salvage a synthesized First passthrough as a phantom totals row', async () => {
    const { proxy, host, original } = makeProxy([col('price', DOUBLE)]);
    // Repro of the phantom-`First` bug. The rollup card's grouping is fully
    // stale, and the persisted `rollup.aggregations` carries ONLY a synthesized
    // `First` passthrough. The user configured NO real aggregation, so
    // `ui.aggregations` is empty. Under ui-driven derivation the mode is chosen
    // from `ui`, never from `rollup.aggregations`: rollup card inactive, aggs
    // card empty, so the derivation yields a null totals config — NOTHING is
    // salvaged, no phantom `First` totals row.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone'], { First: ['price'] }),
      totals: null,
      ui: makeUi(EMPTY_AGGREGATION_SETTINGS, { rollupRows: ['gone'] }),
    });

    // No host write: a fresh proxy's tracked rollup already starts `null`.
    expect(host.hostRollupWrites).toEqual([]);
    expect(original.totalsWrites).toHaveLength(0);
    expect(proxy.totalsConfig).toBeNull();
  });

  it('does NOT salvage totals when a fully-stale rollup has no aggregations (legacy no-ui path)', async () => {
    const { proxy, host, original } = makeProxy([col('A', DOUBLE)]);
    // Grouping fully stale, no aggregations, and `ui` omitted entirely — the
    // very-old-config case (predating the `ui` field). With no `ui` the LEGACY
    // path runs: the persisted derived rollup is sanitized (collapses to flat),
    // and there is no derivation source to salvage from, so nothing is salvaged.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['B']),
      totals: null,
    });

    // No host write: a fresh proxy's tracked rollup already starts `null`.
    expect(host.hostRollupWrites).toEqual([]);
    expect(original.totalsWrites).toHaveLength(0);
    expect(proxy.totalsConfig).toBeNull();
  });

  it('does NOT salvage totals when the Aggregate values card is toggled off', async () => {
    const { proxy, host, original } = makeProxy([col('price', DOUBLE)]);
    // Rollup grouping fully stale, and `ui.aggregations` still carries a genuine
    // Count over the still-present `price` — but the "Aggregate values" card is
    // toggled OFF (`aggregatesOn: false`). The derivation gates `aggsActive` on
    // that switch, so `effectiveAggregationSettings` is empty: rollup card
    // inactive + aggs card off → a null totals config. Nothing is salvaged (no
    // phantom totals row the healthy card-off config would never show).
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone'], { Count: ['price'] }),
      totals: null,
      ui: makeUi(makeAggregationSettings('Count', ['price']), {
        rollupRows: ['gone'],
        aggregatesOn: false,
      }),
    });

    // No host write: a fresh proxy's tracked rollup already starts `null`.
    expect(host.hostRollupWrites).toEqual([]);
    expect(original.totalsWrites).toHaveLength(0);
    expect(proxy.totalsConfig).toBeNull();
  });

  it('filters missing + type-invalid aggregation columns before the host write', async () => {
    const { proxy, host } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    const raw = makeRollup(['region', 'gone'], {
      Sum: ['price', 'region', 'gone'], // region=string (Sum invalid), gone missing
      Count: ['region', 'gone'], // Count valid on any type; gone missing
    });
    const config: PivotBuilderConfig = {
      pivot: null,
      rollup: raw,
      totals: null,
    };

    const p = proxy.applyPivotBuilderConfig(config);
    // A surviving rollup parks an in-flight swap in the fake; end it so settle
    // resolves.
    host.settleSwap();
    await p;

    expect(host.hostRollupWrites).toHaveLength(1);
    expect(host.hostRollupWrites[0]).toEqual({
      groupingColumns: ['region'],
      aggregations: { Sum: ['price'], Count: ['region'] },
    });
    // Raw preserved.
    expect(proxy.rollupConfig).toBe(raw);
  });
});

describe('applyPivotBuilderConfig — pivot key-loss salvage', () => {
  it('salvages a genuine user aggregation as a totals row when every pivot key is stale', async () => {
    const { proxy, host, original } = makeProxy([col('price', DOUBLE)]);
    // The Pivot columns card and Rollup rows card both reference now-stale
    // columns, and a genuine Count over the still-present `price` is configured.
    // Under ui-driven derivation, neither the pivot card nor the rollup card has
    // a live column, so both are inactive; the aggs card is live, so the
    // derivation falls to a standalone totals row (real `getModelTotalsConfig`)
    // — instead of firing a keyless `createPivotTable` RPC.
    const raw = makePivot({
      rowKeys: ['goneRow'],
      columnKeys: ['goneCol'],
      aggregations: [{ operation: 'Count', columns: ['price'] }],
    });
    const config: PivotBuilderConfig = {
      pivot: raw,
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Count', ['price']), {
        rollupRows: ['goneRow'],
        pivotColumns: ['goneCol'],
      }),
    };

    await proxy.applyPivotBuilderConfig(config, { pivotAvailable: true });

    // The rendered pivot reverts to flat (no active pivot) — proves the
    // config was routed away from the real pivot build, not just that no RPC
    // happened to fire.
    expect(proxy.pivotConfig).toBeNull();
    // No rollup write on the pivot path.
    expect(host.hostRollupWrites).toEqual([]);
    // The genuine Count aggregation is salvaged onto the totals channel.
    expect(original.totalsWrites).toHaveLength(1);
    expect(
      (original.totalsWrites[0] as { operationMap: unknown }).operationMap
    ).toEqual({ price: ['Count'] });
    // Persisted pivot intent keeps the RAW stale keys (so the sidebar can show
    // and let the user fix them)...
    expect(proxy.builderConfig.pivot).toBe(raw);
    // ...and the totals UI state stays null — the fallback is invisible to the
    // sidebar's totals card.
    expect(proxy.totalsConfig).toBeNull();
  });

  it('does NOT salvage totals when the Aggregate values card is toggled off', async () => {
    const { proxy, original } = makeProxy([col('price', DOUBLE)]);
    // All pivot keys stale and `ui.aggregations` carries a genuine Count, but
    // the "Aggregate values" card is toggled OFF (`aggregatesOn: false`). The
    // derivation gates `aggsActive` on that switch, so with pivot + rollup cards
    // inactive too, the derived totals config is null. Nothing is salvaged.
    await proxy.applyPivotBuilderConfig({
      pivot: makePivot({
        rowKeys: ['goneRow'],
        columnKeys: ['goneCol'],
        aggregations: [{ operation: 'Count', columns: ['price'] }],
      }),
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Count', ['price']), {
        rollupRows: ['goneRow'],
        pivotColumns: ['goneCol'],
        aggregatesOn: false,
      }),
    });

    expect(proxy.pivotConfig).toBeNull();
    expect(original.totalsWrites).toHaveLength(0);
    expect(proxy.totalsConfig).toBeNull();
  });

  it('does NOT salvage totals when a fully-stale pivot has no ui aggregations (legacy no-ui path)', async () => {
    const { proxy, original } = makeProxy([col('A', DOUBLE)]);
    // All pivot keys stale and `ui` omitted entirely — the very-old-config
    // case (predating the `ui` field). With no `ui` the LEGACY path runs: the
    // persisted pivot is routed away from the build (all keys stale) with no
    // derivation source to salvage from, so nothing is salvaged.
    await proxy.applyPivotBuilderConfig({
      pivot: makePivot({
        rowKeys: ['goneRow'],
        columnKeys: ['goneCol'],
        aggregations: [{ operation: 'Sum', columns: ['goneAgg'] }],
      }),
      rollup: null,
      totals: null,
    });

    expect(proxy.pivotConfig).toBeNull();
    expect(original.totalsWrites).toHaveLength(0);
    expect(proxy.totalsConfig).toBeNull();
  });

  it('builds a normal pivot when at least one column key survives (partial column staleness, no fallback)', async () => {
    const { proxy, original } = makeProxy([
      col('region', STRING),
      col('category', STRING),
      col('price', DOUBLE),
    ]);
    // The row key AND at least one pivot column survive; only `goneCol` is
    // stale. Under ui-driven derivation the Pivot columns card has a live column
    // so `pivotActive` is true and the derivation builds a pivot — routed to the
    // pivot-build path, NOT the rollup/totals fallback.
    const raw = makePivot({
      rowKeys: ['region'],
      columnKeys: ['category', 'goneCol'],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    await proxy.applyPivotBuilderConfig(
      {
        pivot: raw,
        rollup: null,
        totals: null,
        ui: makeUi(makeAggregationSettings('Sum', ['price']), {
          rollupRows: ['region'],
          pivotColumns: ['category', 'goneCol'],
        }),
      },
      { pivotAvailable: true }
    );

    // Routed to the pivot-build path: the pivot is the active rendered config (a
    // fallback would have left this null). The derived pivot is a fresh object
    // (not the raw persisted one), but structurally the ui-derived pivot with
    // its surviving + stale keys. The build itself fails on the non-CorePlus
    // fake `dh`, but the routing decision is what we assert.
    expect(proxy.pivotConfig).toEqual({
      rowKeys: ['region'],
      columnKeys: ['category', 'goneCol'],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    // Nothing salvaged onto the totals channel.
    expect(original.totalsWrites).toHaveLength(0);
    // The raw pivot intent (with its surviving + stale keys) is preserved.
    expect(proxy.builderConfig.pivot).toBe(raw);
  });
});

describe('applyPivotBuilderConfig — pivot column-loss rollup fallback', () => {
  it('reconstructs a genuine rollup keyed on surviving row keys, folding in the aggregation, when all column keys are stale', async () => {
    const { proxy, host, original } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    // Rollup rows card has a surviving `region`; the Pivot columns card's only
    // column `goneCol` is stale. Under ui-driven derivation the pivot card is
    // inactive (no live column) but the rollup + aggs cards are active, so the
    // derivation yields a genuine rollup keyed on `region` (via the real
    // `getModelRollupConfig`) with the Sum-over-price folded in — instead of a
    // degenerate 0-column-key pivot RPC.
    const raw = makePivot({
      rowKeys: ['region'],
      columnKeys: ['goneCol'],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    const config: PivotBuilderConfig = {
      pivot: raw,
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['price']), {
        rollupRows: ['region'],
        pivotColumns: ['goneCol'],
      }),
    };

    // The reconstructed rollup is non-null, so the fake host parks an in-flight
    // swap; end it so `settle` resolves.
    const p = proxy.applyPivotBuilderConfig(config);
    host.settleSwap();
    await p;

    // No real pivot was built — routed away from the pivot service.
    expect(proxy.pivotConfig).toBeNull();
    // The host's REAL rollup setter received the reconstructed rollup: grouped
    // on the surviving row key with the genuine Sum folded in.
    expect(host.hostRollupWrites).toHaveLength(1);
    expect(host.hostRollupWrites[0]).toEqual({
      groupingColumns: ['region'],
      includeConstituents: true,
      includeDescriptions: true,
      aggregations: { Sum: ['price'] },
    });
    // No standalone totals row (aggregation lives in the rollup, not totals).
    expect(original.totalsWrites).toHaveLength(0);
    // Persisted pivot intent keeps the RAW stale keys so the sidebar can show
    // and let the user fix them...
    expect(proxy.builderConfig.pivot).toBe(raw);
    // ...and `rollupConfig` stays the RAW `config.rollup` (null) — the
    // reconstructed fallback is an internal host-forwarding detail, invisible
    // to the sidebar (which seeds its cards from `config.ui`).
    expect(proxy.rollupConfig).toBeNull();
  });

  it('reconstructs a grouping-only rollup (non-aggregated passthrough only) when the Aggregate values card is off', async () => {
    const { proxy, host } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    // Pivot column stale, rollup row survives, but the "Aggregate values" card
    // is toggled OFF (`aggregatesOn: false`). The derivation yields a rollup on
    // `region` with no real aggregation folded in; only `getModelRollupConfig`'s
    // own non-aggregated passthrough (First over the un-grouped `price`)
    // appears, matching a healthy grouping-only rollup.
    const config: PivotBuilderConfig = {
      pivot: makePivot({
        rowKeys: ['region'],
        columnKeys: ['goneCol'],
        aggregations: [{ operation: 'Sum', columns: ['price'] }],
      }),
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['price']), {
        rollupRows: ['region'],
        pivotColumns: ['goneCol'],
        aggregatesOn: false,
      }),
    };

    const p = proxy.applyPivotBuilderConfig(config);
    host.settleSwap();
    await p;

    expect(proxy.pivotConfig).toBeNull();
    expect(host.hostRollupWrites).toHaveLength(1);
    // No Sum folded in (card off); only the non-aggregated passthrough of
    // `price` (`nonAggregatedInRollup` defaults on in `makeUi`).
    expect(host.hostRollupWrites[0]).toEqual({
      groupingColumns: ['region'],
      includeConstituents: true,
      includeDescriptions: true,
      aggregations: { First: ['price'] },
    });
  });

  it('reconstructs a rollup with getModelRollupConfig defaults when ui is entirely absent (very old config)', async () => {
    const { proxy, host } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    // `config.ui` omitted entirely (predating the `ui` field). No aggregation
    // salvage source, so the fallback rollup uses `getModelRollupConfig`'s own
    // defaults: constituents on, non-aggregated passthrough on (First price).
    const p = proxy.applyPivotBuilderConfig({
      pivot: makePivot({
        rowKeys: ['region'],
        columnKeys: ['goneCol'],
        aggregations: [{ operation: 'Sum', columns: ['price'] }],
      }),
      rollup: null,
      totals: null,
    });
    host.settleSwap();
    await p;

    expect(proxy.pivotConfig).toBeNull();
    expect(host.hostRollupWrites).toHaveLength(1);
    expect(host.hostRollupWrites[0]).toEqual({
      groupingColumns: ['region'],
      includeConstituents: true,
      includeDescriptions: true,
      aggregations: { First: ['price'] },
    });
  });

  it('re-applies the fallback rollup to the host when only the aggregation changes (dedicated tracking, not config.rollup diff)', async () => {
    const { proxy, host } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    // Establish the fallback with a Sum.
    const p1 = proxy.applyPivotBuilderConfig({
      pivot: makePivot({
        rowKeys: ['region'],
        columnKeys: ['goneCol'],
        aggregations: [{ operation: 'Sum', columns: ['price'] }],
      }),
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['price']), {
        rollupRows: ['region'],
        pivotColumns: ['goneCol'],
      }),
    });
    host.settleSwap();
    await p1;

    expect(host.hostRollupWrites).toHaveLength(1);
    expect(host.hostRollupWrites[0]).toEqual({
      groupingColumns: ['region'],
      includeConstituents: true,
      includeDescriptions: true,
      aggregations: { Sum: ['price'] },
    });

    // Now change ONLY the aggregation (Sum → Avg); columns/rowKeys/aggregatesOn
    // are otherwise identical and `config.rollup` stays null throughout. Because
    // the fallback is diffed against its OWN tracking variable (not the
    // `deepEqual(config.rollup, lastIntent.rollup)` check, which would be
    // `deepEqual(null, null) === true` and suppress this), the host receives the
    // updated rollup.
    const p2 = proxy.applyPivotBuilderConfig({
      pivot: makePivot({
        rowKeys: ['region'],
        columnKeys: ['goneCol'],
        aggregations: [{ operation: 'Avg', columns: ['price'] }],
      }),
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Avg', ['price']), {
        rollupRows: ['region'],
        pivotColumns: ['goneCol'],
      }),
    });
    host.settleSwap();
    await p2;

    expect(host.hostRollupWrites).toHaveLength(2);
    expect(host.hostRollupWrites[1]).toEqual({
      groupingColumns: ['region'],
      includeConstituents: true,
      includeDescriptions: true,
      aggregations: { Avg: ['price'] },
    });
  });

  it('does NOT re-write the fallback rollup to the host when the exact same config is re-applied (idempotent)', async () => {
    const { proxy, host } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    const ui = makeUi(makeAggregationSettings('Sum', ['price']), {
      rollupRows: ['region'],
      pivotColumns: ['goneCol'],
    });
    const config: PivotBuilderConfig = {
      pivot: makePivot({
        rowKeys: ['region'],
        columnKeys: ['goneCol'],
        aggregations: [{ operation: 'Sum', columns: ['price'] }],
      }),
      rollup: null,
      totals: null,
      ui,
    };

    const p1 = proxy.applyPivotBuilderConfig(config);
    host.settleSwap();
    await p1;
    expect(host.hostRollupWrites).toHaveLength(1);

    // Re-apply with an irrelevant `ui` field changed (not the identical config
    // object) so this proceeds past the top-level `deepEqual(config,
    // lastIntent)` no-op and actually exercises the `appliedRollup`
    // diff — the reconstructed rollup itself is unchanged, so no redundant
    // host write should occur.
    await proxy.applyPivotBuilderConfig({
      ...config,
      ui: { ...ui, filterableOn: !ui.filterableOn },
    });
    expect(host.hostRollupWrites).toHaveLength(1);
  });
});

describe('applyPivotBuilderConfig — ui-driven re-derivation', () => {
  // The live repro: a config persisted with a stale-DERIVED rollup (grouping
  // [A,B], Sum over nothing + a synthesized First(F) passthrough) whose raw
  // `ui` cards, re-derived against the schema that came back, actually describe
  // a PIVOT. The persisted derived rollup must NOT be trusted verbatim.
  const repro = (): {
    columns: DhType.Column[];
    config: PivotBuilderConfig;
  } => ({
    // Schema when reloaded: A + C came back, B/D/E still gone, F present.
    columns: [col('A', STRING), col('C', INT), col('F', STRING)],
    config: {
      // Stale-derived rollup persisted at edit time (C,D,E were missing then).
      rollup: makeRollup(['A', 'B'], { Sum: [], First: ['F'] }),
      pivot: null,
      totals: null,
      // Raw cards the user actually left: rollup rows [A,B], pivot columns
      // [C,D], Sum over [C,D,E].
      ui: makeUi(makeAggregationSettings('Sum', ['C', 'D', 'E']), {
        rollupRows: ['A', 'B'],
        pivotColumns: ['C', 'D'],
      }),
    },
  });

  it('re-derives a PIVOT from ui + live schema (pivotAvailable) instead of applying the stale persisted rollup', async () => {
    const { columns, config } = repro();
    const { proxy, host } = makeProxy(columns);

    await proxy.applyPivotBuilderConfig(config, { pivotAvailable: true });

    // A pivot is applied (rowKeys from the live rollup card, columnKeys from the
    // live pivot card, aggregations straight off the aggs card — the RAW ui
    // lists; stale columns are trimmed only at the build choke point).
    expect(proxy.pivotConfig).toEqual({
      rowKeys: ['A', 'B'],
      columnKeys: ['C', 'D'],
      aggregations: [{ operation: 'Sum', columns: ['C', 'D', 'E'] }],
    });
    // The stale persisted rollup is NOT written to the host.
    expect(host.hostRollupWrites).toEqual([]);
    // The RAW incoming config is preserved as the intent (never auto-rewritten
    // with the derived pivot).
    expect(proxy.builderConfig).toBe(config);
  });

  it('re-derives a ROLLUP from ui + live schema when PSP is unavailable (pivotAvailable false)', async () => {
    const { columns, config } = repro();
    const { proxy, host } = makeProxy(columns);

    // Same repro config, but PSP is unavailable: the pivot card is gated off, so
    // the derivation falls to a rollup keyed on the live rollup rows with the
    // live aggregation folded in.
    const p = proxy.applyPivotBuilderConfig(config, { pivotAvailable: false });
    host.settleSwap();
    await p;

    // No pivot built.
    expect(proxy.pivotConfig).toBeNull();
    // A genuine rollup is written to the host: grouped on the surviving row key
    // (B dropped by sanitize) with Sum(C) folded in — NOT the stale persisted
    // First-only rollup.
    expect(host.hostRollupWrites).toHaveLength(1);
    const write = host.hostRollupWrites[0] as {
      groupingColumns: string[];
      aggregations: Record<string, string[]>;
    };
    expect(write.groupingColumns).toEqual(['A']);
    expect(write.aggregations.Sum).toEqual(['C']);
    // RAW intent preserved.
    expect(proxy.builderConfig).toBe(config);
  });

  it('applies the stale-derived rollup verbatim on the LEGACY (no-ui) path', async () => {
    // The same stale-derived rollup WITHOUT `ui` (a config predating the field)
    // takes the legacy path: no re-derivation, so the persisted derived rollup
    // is applied as-is (sanitized) — grouping collapses to the surviving `A`
    // with only the synthesized First(F) passthrough. This is exactly the
    // pre-refactor behavior the ui path now corrects, kept for old configs.
    const columns = [col('A', STRING), col('C', INT), col('F', STRING)];
    const { proxy, host } = makeProxy(columns);
    const config: PivotBuilderConfig = {
      rollup: makeRollup(['A', 'B'], { Sum: [], First: ['F'] }),
      pivot: null,
      totals: null,
    };

    const p = proxy.applyPivotBuilderConfig(config);
    host.settleSwap();
    await p;

    expect(proxy.pivotConfig).toBeNull();
    expect(host.hostRollupWrites).toHaveLength(1);
    expect(host.hostRollupWrites[0]).toEqual({
      groupingColumns: ['A'],
      aggregations: { First: ['F'] },
    });
  });

  it('re-derives the same value the sidebar persisted when every referenced column is live', async () => {
    // Consistency check: when nothing is stale the model's re-derivation
    // reproduces exactly the derived pivot the sidebar persisted.
    const columns = [col('A', STRING), col('C', INT), col('F', STRING)];
    const { proxy } = makeProxy(columns);
    const derivedPivot = makePivot({
      rowKeys: ['A'],
      columnKeys: ['C'],
      aggregations: [{ operation: 'Sum', columns: ['C'] }],
    });
    const config: PivotBuilderConfig = {
      pivot: derivedPivot,
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['C']), {
        rollupRows: ['A'],
        pivotColumns: ['C'],
      }),
    };

    await proxy.applyPivotBuilderConfig(config, { pivotAvailable: true });

    expect(proxy.pivotConfig).toEqual(derivedPivot);
    expect(proxy.builderConfig).toBe(config);
  });

  it('clears an applied ui-derived pivot when a later apply derives a rollup (raw pivot was null both times)', async () => {
    // Regression: the "pivot inactive" clear used to check the RAW
    // `lastIntent.pivot`, which stays null throughout this scenario — the
    // pivot was derived from `ui` while the raw `pivot` field was null (the
    // hydration repro). The clear must key off the APPLIED pivot, or
    // `pivotConfig`/`isPivot` stay stuck on the old pivot while the grid
    // swaps to a rollup.
    const { columns, config } = repro();
    const { proxy, host } = makeProxy(columns);

    await proxy.applyPivotBuilderConfig(config, { pivotAvailable: true });
    expect(proxy.pivotConfig).not.toBeNull();

    // Same cards, Pivot columns card toggled OFF → derivation picks rollup.
    const p = proxy.applyPivotBuilderConfig(
      {
        ...config,
        ui: { ...(config.ui as PivotBuilderUiState), pivotColumnsOn: false },
      },
      { pivotAvailable: true }
    );
    host.settleSwap();
    await p;

    // The applied pivot is cleared and the derived rollup takes over.
    expect(proxy.pivotConfig).toBeNull();
    expect(host.hostRollupWrites).toHaveLength(1);
    expect(
      (host.hostRollupWrites[0] as { groupingColumns: string[] })
        .groupingColumns
    ).toEqual(['A']);
  });
});

describe('applyPivotBuilderConfig — totals sanitization + write ordering', () => {
  it('writes the sanitized totals immediately and keeps raw stored', async () => {
    const { proxy, original } = makeProxy([col('price', DOUBLE)]);
    const raw = makeTotals({ price: ['Sum'], gone: ['Avg'] });
    const config: PivotBuilderConfig = {
      pivot: null,
      rollup: null,
      totals: raw as never,
    };

    await proxy.applyPivotBuilderConfig(config);

    expect(original.totalsWrites).toHaveLength(1);
    expect(
      (original.totalsWrites[0] as { operationMap: unknown }).operationMap
    ).toEqual({ price: ['Sum'] });
    // Stored/persisted intent keeps the RAW stale totals.
    expect(proxy.totalsConfig).toBe(raw);
  });

  it('does NOT re-write when a different raw config sanitizes to the same value (no RPC churn)', async () => {
    const { proxy, original } = makeProxy([col('price', DOUBLE)]);
    // Both raw configs differ only in stale entries; both sanitize to {price:[Sum]}.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: null,
      totals: makeTotals({ price: ['Sum'], gone: ['Avg'] }) as never,
    });
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: null,
      totals: makeTotals({ price: ['Sum'], other: ['Min'] }) as never,
    });

    // The second apply is NOT a no-op (raw differs), but the SANITIZED diff is
    // equal, so no second write fires. A raw-vs-applied diff would have written.
    expect(original.totalsWrites).toHaveLength(1);
  });

  it('queues the sanitized totals mid-swap and flushes it on COLUMNS_CHANGED', async () => {
    const { proxy, host, original } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    // Rollup change parks a modelPromise (in-flight swap); totals must queue.
    proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['region']),
      totals: makeTotals({ price: ['Sum'], gone: ['Avg'] }) as never,
    });

    // Mid-swap: nothing written to the inner model yet.
    expect(original.totalsWrites).toHaveLength(0);
    expect(host.modelPromise).not.toBeNull();

    // End the swap and fire the event the queued write waits on.
    host.settleSwap();
    host.dispatchEvent({ type: IrisGridModel.EVENT.COLUMNS_CHANGED } as Event);

    expect(original.totalsWrites).toHaveLength(1);
    expect(
      (original.totalsWrites[0] as { operationMap: unknown }).operationMap
    ).toEqual({ price: ['Sum'] });
  });
});

describe('applyPivotBuilderConfig — stale-columns event dispatch', () => {
  it('dispatches exactly ONE event when rollup, totals, and pivot are all stale', async () => {
    const { proxy } = makeProxy([col('A', DOUBLE)]);
    const events: unknown[] = [];
    (proxy as unknown as FakeHostModel).addEventListener(
      PIVOT_BUILDER_STALE_COLUMNS,
      (e: Event) => events.push((e as CustomEvent).detail)
    );

    proxy.applyPivotBuilderConfig({
      rollup: makeRollup(['rGone']),
      totals: makeTotals({ tGone: ['Sum'] }) as never,
      // All keys + agg stale → the empty-shell path (no pivot service call).
      pivot: makePivot({
        rowKeys: ['pGone'],
        aggregations: [{ operation: 'Sum', columns: ['pAggGone'] }],
      }),
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      rollupColumns: ['rGone'],
      totalsColumns: ['tGone'],
      pivotColumns: ['pGone', 'pAggGone'],
    });

    await flushMicrotasks();
    // The fully-stale pivot renders the flat source WITHOUT re-applying an
    // empty config through `applyPivotBuilderConfig`, so no second event and no
    // second reconcile — still exactly 1.
    expect(events).toHaveLength(1);
    // The snapshot must still reflect the ORIGINAL stale config so the
    // middleware's synchronous hydration read can toast.
    expect(proxy.staleColumnReport).toEqual({
      rollupColumns: ['rGone'],
      totalsColumns: ['tGone'],
      pivotColumns: ['pGone', 'pAggGone'],
    });
    // Intent is preserved (Goal 2 / no auto-fixing persisted config): the raw
    // pivot stays in `builderConfig` so the sidebar can show the stale keys,
    // while only the RENDERED state reverts to flat (`pivotConfig` null →
    // `isPivot` false).
    expect(proxy.builderConfig.pivot).not.toBeNull();
    expect(proxy.builderConfig.pivot?.rowKeys).toEqual(['pGone']);
    expect(proxy.pivotConfig).toBeNull();
  });

  it('dedupes on {pivot,rollup,totals} only — a UI-only change does NOT re-toast', async () => {
    const { proxy } = makeProxy([col('A', DOUBLE)]);
    const events: unknown[] = [];
    (proxy as unknown as FakeHostModel).addEventListener(
      PIVOT_BUILDER_STALE_COLUMNS,
      (e: Event) => events.push((e as CustomEvent).detail)
    );

    // Same stale data-bearing config, different `ui` field each time. The
    // dedupe must ignore `ui` (pure card/switch state), so the second apply —
    // which flips a UI-only switch while the same stale reference persists —
    // does NOT produce a second toast. Both `ui` states are full/valid (the
    // model re-derives from them) but differ only in the benign `filterableOn`
    // switch, and both derive to flat (the sole rollup row is stale), so the
    // only thing that could re-fire is the stale-columns dedupe — which keys on
    // {pivot,rollup,totals} only.
    const uiA = makeUi(EMPTY_AGGREGATION_SETTINGS, { rollupRows: ['gone'] });
    const uiB = makeUi(EMPTY_AGGREGATION_SETTINGS, {
      rollupRows: ['gone'],
      filterableOn: false,
    });
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone']),
      totals: null,
      ui: uiA,
    });
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone']),
      totals: null,
      ui: uiB,
    });

    expect(events).toHaveLength(1);
  });

  it('does not re-fire for an identical re-apply, but re-fires for a different stale config', async () => {
    const { proxy } = makeProxy([col('A', DOUBLE)]);
    const events: unknown[] = [];
    (proxy as unknown as FakeHostModel).addEventListener(
      PIVOT_BUILDER_STALE_COLUMNS,
      (e: Event) => events.push((e as CustomEvent).detail)
    );

    const stale1: PivotBuilderConfig = {
      pivot: null,
      rollup: makeRollup(['gone1']),
      totals: null,
    };
    await proxy.applyPivotBuilderConfig(stale1);
    // Fresh, deep-equal object — should be deduped.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone1']),
      totals: null,
    });
    expect(events).toHaveLength(1);

    // A different stale config re-fires.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone2']),
      totals: null,
    });
    expect(events).toHaveLength(2);
  });
});

describe('hydration-visibility: staleColumnReport with NO listeners attached', () => {
  it('exposes the stale report after the transform hydrates a stale persisted rollup', async () => {
    // This is the actual reported bug: the transform applies the persisted
    // config during hydration, before any listener can be attached. The
    // synchronous `staleColumnReport` snapshot is what surfaces it.
    const original = new FakeOriginalModel([col('A', DOUBLE)]);
    const host = new FakeHostModel(original);

    const persisted: PivotBuilderConfig = {
      pivot: null,
      rollup: makeRollup(['B']), // grouped on a column the query dropped
      totals: null,
    };

    const transform = makePivotModelTransform(
      {} as never,
      (() => Promise.reject(new Error('no psp'))) as never,
      () => persisted
    );

    const augmented = (await transform(
      host as unknown as IrisGridModel
    )) as unknown as PivotBuilderProxyModel;

    expect(isPivotBuilderIrisGridModel(augmented)).toBe(true);
    expect(augmented.staleColumnReport).toEqual({
      rollupColumns: ['B'],
      totalsColumns: [],
      pivotColumns: [],
    });
    // No host write (fresh proxy's tracked rollup already starts `null`);
    // persisted intent is kept raw regardless.
    expect(host.hostRollupWrites).toEqual([]);
    expect(augmented.builderConfig.rollup).toBe(persisted.rollup);
  });

  it('exposes the stale report after hydrating a FULLY-STALE persisted pivot (Bug 1)', async () => {
    // The pivot variant of the reported bug: every rowKey/columnKey AND every
    // aggregation column is stale, so there's nothing to salvage — the pivot
    // is routed away from the build path and rendered flat. The RENDERED
    // state reverts to flat (`pivotConfig` null), but the raw pivot intent is
    // preserved in `builderConfig` and the stale snapshot survives for the
    // middleware's synchronous hydration read, so a fully-stale saved pivot
    // both surfaces a toast AND keeps its stale keys visible for the user to
    // fix — instead of silently collapsing to a flat table with the persisted
    // config overwritten.
    const original = new FakeOriginalModel([col('A', DOUBLE)]);
    const host = new FakeHostModel(original);

    const persisted: PivotBuilderConfig = {
      pivot: makePivot({
        rowKeys: ['gone1'],
        columnKeys: ['gone2'],
        aggregations: [{ operation: 'Sum', columns: ['gone3'] }],
      }),
      rollup: null,
      totals: null,
    };

    const transform = makePivotModelTransform(
      {} as never,
      // `persisted.pivot != null`, so the transform probes the PSP widget
      // up-front; it must resolve. The build itself never reaches
      // `createPivotTable` — the fully-stale pivot short-circuits to the flat
      // source before any service call — so a dummy widget is enough.
      (() => Promise.resolve({} as never)) as never,
      () => persisted
    );

    const augmented = (await transform(
      host as unknown as IrisGridModel
    )) as unknown as PivotBuilderProxyModel;
    await flushMicrotasks();
    await flushMicrotasks();

    expect(isPivotBuilderIrisGridModel(augmented)).toBe(true);
    // The snapshot the middleware reads on mount must reflect the ORIGINAL
    // stale pivot, not an empty config.
    expect(augmented.staleColumnReport).toEqual({
      rollupColumns: [],
      totalsColumns: [],
      pivotColumns: ['gone1', 'gone2', 'gone3'],
    });
    // Intent preserved: the raw pivot stays in `builderConfig` so the sidebar
    // can show the stale keys, while only the RENDERED state reverts to flat.
    expect(augmented.builderConfig.pivot).toBe(persisted.pivot);
    expect(augmented.pivotConfig).toBeNull();
  });

  it('reports an empty snapshot when nothing is stale', async () => {
    const { proxy, host } = makeProxy([
      col('region', STRING),
      col('price', DOUBLE),
    ]);
    const p = proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['region'], { Sum: ['price'] }),
      totals: null,
    });
    host.settleSwap();
    await p;
    expect(proxy.staleColumnReport).toEqual({
      rollupColumns: [],
      totalsColumns: [],
      pivotColumns: [],
    });
  });
});

describe('makePivotModelTransform — ui-driven probe trigger', () => {
  it('probes PSP and threads pivotAvailable when the persisted ui derives a pivot', async () => {
    // Modern config: the persisted DERIVED value is a stale-derived rollup,
    // but the ui derives a PIVOT against the current schema (live pivot column
    // `C`). The transform must ask the derivation — not `persisted.pivot`
    // (null here) — probe the PSP widget, and pass `pivotAvailable: true` so
    // the model's own derivation picks the pivot.
    const original = new FakeOriginalModel([
      col('A', STRING),
      col('C', INT),
      col('F', STRING),
    ]);
    const host = new FakeHostModel(original);
    const getPsp = jest.fn(() => Promise.resolve({} as never));

    const persisted: PivotBuilderConfig = {
      pivot: null,
      rollup: makeRollup(['A'], { First: ['F'] }),
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['C']), {
        rollupRows: ['A', 'B'],
        pivotColumns: ['C', 'D'],
      }),
    };

    const transform = makePivotModelTransform(
      {} as never,
      getPsp as never,
      () => persisted
    );
    const augmented = (await transform(
      host as unknown as IrisGridModel
    )) as unknown as PivotBuilderProxyModel;
    await flushMicrotasks();

    // The probe fired even though `persisted.pivot` is null — the trigger is
    // the ui derivation.
    expect(getPsp).toHaveBeenCalled();
    // The model derived and routed a pivot (raw ui lists; sanitization happens
    // at the build choke point). Persisted raw intent is untouched.
    expect(augmented.pivotConfig).toEqual({
      rowKeys: ['A', 'B'],
      columnKeys: ['C', 'D'],
      aggregations: [{ operation: 'Sum', columns: ['C'] }],
    });
    expect(augmented.builderConfig.rollup).toBe(persisted.rollup);
    expect(augmented.builderConfig.pivot).toBeNull();
  });

  it('skips the probe when the persisted ui derives a rollup (no live pivot columns)', async () => {
    const original = new FakeOriginalModel([
      col('A', STRING),
      col('price', DOUBLE),
    ]);
    const host = new FakeHostModel(original);
    const getPsp = jest.fn(() => Promise.reject(new Error('no psp')));

    const persisted: PivotBuilderConfig = {
      pivot: null,
      rollup: makeRollup(['A'], { Sum: ['price'] }),
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['price']), {
        rollupRows: ['A'],
        pivotColumns: ['goneCol'],
      }),
    };

    const transform = makePivotModelTransform(
      {} as never,
      getPsp as never,
      () => persisted
    );
    const restored = transform(host as unknown as IrisGridModel);
    host.settleSwap();
    const augmented = (await restored) as unknown as PivotBuilderProxyModel;

    // All pivot columns are stale → derivation picks rollup → no PSP probe
    // (and its rejection therefore doesn't fail the model build).
    expect(getPsp).not.toHaveBeenCalled();
    expect(host.hostRollupWrites).toHaveLength(1);
    expect(
      (host.hostRollupWrites[0] as { groupingColumns: string[] })
        .groupingColumns
    ).toEqual(['A']);
    expect(augmented.pivotConfig).toBeNull();
  });

  it('skips the probe when the host reports rollup unavailable (pivot underivable)', async () => {
    // Regression: the probe trigger used an optimistic `rollupAvailable: true`,
    // fatally probing PSP for a pivot the model's own derivation (which reads
    // the host's LIVE flag) could never build. With rollup unavailable the
    // derivation falls to totals, so no probe — and its rejection must not
    // fail the model build.
    const original = new FakeOriginalModel([col('A', STRING), col('C', INT)]);
    const host = new FakeHostModel(original);
    host.isRollupAvailable = false;
    const getPsp = jest.fn(() => Promise.reject(new Error('no psp')));

    const persisted: PivotBuilderConfig = {
      pivot: null,
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['C']), {
        rollupRows: ['A'],
        pivotColumns: ['C'],
      }),
    };

    const transform = makePivotModelTransform(
      {} as never,
      getPsp as never,
      () => persisted
    );
    const augmented = (await transform(
      host as unknown as IrisGridModel
    )) as unknown as PivotBuilderProxyModel;

    expect(getPsp).not.toHaveBeenCalled();
    expect(augmented.pivotConfig).toBeNull();
    expect(host.hostRollupWrites).toHaveLength(0);
    // The live aggregation lands on the totals channel instead.
    expect(original.totalsWrites).toHaveLength(1);
    expect(
      (original.totalsWrites[0] as { operationMap: unknown }).operationMap
    ).toEqual({ C: ['Sum'] });
  });

  it('fails the model build when the ui derives a pivot but the PSP probe rejects', async () => {
    // Intentionally fatal: a query edited to remove the pivot service must
    // fail the build loudly rather than silently dropping to flat.
    const original = new FakeOriginalModel([col('A', STRING), col('C', INT)]);
    const host = new FakeHostModel(original);

    const persisted: PivotBuilderConfig = {
      pivot: null,
      rollup: null,
      totals: null,
      ui: makeUi(makeAggregationSettings('Sum', ['C']), {
        rollupRows: ['A'],
        pivotColumns: ['C'],
      }),
    };

    const transform = makePivotModelTransform(
      {} as never,
      (() => Promise.reject(new Error('no psp'))) as never,
      () => persisted
    );
    await expect(transform(host as unknown as IrisGridModel)).rejects.toThrow(
      'no psp'
    );
  });
});
