import { IrisGridModel } from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  augmentPivotBuilderModel,
  isPivotBuilderIrisGridModel,
  PIVOT_BUILDER_STALE_COLUMNS,
  type PivotBuilderConfig,
  type PivotBuilderProxyModel,
  type PivotConfig,
} from './pivotBuilderModel';
import { makePivotModelTransform } from './makePivotModelTransform';

const STRING = 'java.lang.String';
const DOUBLE = 'double';

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

type Listener = (e: Event) => void;

/** Fake for the host proxy's stable, pre-pivot `originalModel`. */
class FakeOriginalModel {
  table: { columns: DhType.Column[] };

  totalsWrites: unknown[] = [];

  private _totals: unknown = null;

  constructor(columns: DhType.Column[]) {
    this.table = { columns };
  }

  get totalsConfig(): unknown {
    return this._totals;
  }

  set totalsConfig(v: unknown) {
    this._totals = v;
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

  modelPromise: Promise<unknown> | null = null;

  private _resolveSwap: ((value?: unknown) => void) | null = null;

  private _listeners = new Map<string, Set<Listener>>();

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
        this._resolveSwap = resolve;
      });
    }
  }

  /** Resolve a simulated in-flight rollup swap. */
  settleSwap(): void {
    this.modelPromise = null;
    this._resolveSwap?.();
    this._resolveSwap = null;
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
    const set = this._listeners.get(type) ?? new Set();
    set.add(fn);
    this._listeners.set(type, set);
  }

  removeEventListener(type: string, fn: Listener): void {
    this._listeners.get(type)?.delete(fn);
  }

  dispatchEvent(e: Event): boolean {
    const set = this._listeners.get(e.type);
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
  const proxy = augmentPivotBuilderModel(
    {} as never,
    host as unknown as IrisGridModel,
    (() => Promise.reject(new Error('no psp'))) as never
  );
  return { proxy, host, original };
}

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('applyPivotBuilderConfig — rollup sanitization', () => {
  it('forwards null (flat) when every grouping column is stale, keeps raw stored', async () => {
    const { proxy, host } = makeProxy([col('A', DOUBLE)]);
    const raw = makeRollup(['B']);
    const config: PivotBuilderConfig = {
      pivot: null,
      rollup: raw,
      totals: null,
    };

    await proxy.applyPivotBuilderConfig(config);

    // Host received the sanitized value: grouping fully dropped → null (flat).
    expect(host.hostRollupWrites).toEqual([null]);
    // Stored/persisted intent keeps the RAW stale rollup.
    expect(proxy.rollupConfig).toBe(raw);
    expect(proxy.builderConfig.rollup).toBe(raw);
  });

  it('salvages a genuine user aggregation as a totals row when every grouping column is stale', async () => {
    const { proxy, host, original } = makeProxy([col('price', DOUBLE)]);
    // Grouping is fully stale (`gone`) but the user configured a genuine Count
    // over the still-present `price`. The salvage source is the CLEAN
    // `fallbackTotals` candidate (the `getModelTotalsConfig` output built from
    // the real Aggregate values), which carries ONLY genuine user
    // aggregations — NOT `rollup.aggregations`, which may also hold synthesized
    // `First` passthrough entries. The rollup collapses to flat, but the
    // surviving aggregation must NOT be dropped — it forwards via totals.
    const raw = makeRollup(['gone'], { Count: ['price'] });
    const config: PivotBuilderConfig = {
      pivot: null,
      rollup: raw,
      totals: null,
      fallbackTotals: makeTotals({ price: ['Count'] }) as never,
    };

    // Writing `null` (flat) to the host does NOT park a swap, so this resolves
    // synchronously without `settleSwap`.
    await proxy.applyPivotBuilderConfig(config);

    // Rollup still forwarded as null (flat) — grouping fully dropped.
    expect(host.hostRollupWrites).toEqual([null]);
    // The genuine Count aggregation is salvaged onto the totals channel.
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

  it('does NOT salvage a synthesized First passthrough as a phantom totals row', async () => {
    const { proxy, host, original } = makeProxy([col('price', DOUBLE)]);
    // Repro of the phantom-`First` bug. Grouping is fully stale, and
    // `rollup.aggregations` carries ONLY a `First` entry — exactly what
    // `getModelRollupConfig` synthesizes for the non-aggregated `price` column
    // when `nonAggregatedInRollup` is on (its default). The user configured NO
    // real aggregation, so the clean `fallbackTotals` candidate is null. Even
    // though the stale rollup's `aggregations` map is non-empty, NOTHING must
    // be salvaged: no phantom `First` totals row.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['gone'], { First: ['price'] }),
      totals: null,
      fallbackTotals: null,
    });

    expect(host.hostRollupWrites).toEqual([null]);
    expect(original.totalsWrites).toHaveLength(0);
    expect(proxy.totalsConfig).toBeNull();
  });

  it('does NOT salvage totals when a fully-stale rollup has no aggregations', async () => {
    const { proxy, host, original } = makeProxy([col('A', DOUBLE)]);
    // Grouping fully stale, no aggregations at all → nothing to salvage.
    await proxy.applyPivotBuilderConfig({
      pivot: null,
      rollup: makeRollup(['B']),
      totals: null,
    });

    expect(host.hostRollupWrites).toEqual([null]);
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
    // The empty-shell revert re-applies the empty config (not stale) — still 1.
    expect(events).toHaveLength(1);
    // ...and the fully-stale pivot's empty-shell revert (an INTERNAL call) must
    // NOT clobber the snapshot back to empty. Before the fix, the revert
    // microtask re-ran detection against the empty config and overwrote this
    // with all-empty arrays — so the middleware's synchronous hydration read
    // saw nothing and never toasted. It must still reflect the original config.
    expect(proxy.staleColumnReport).toEqual({
      rollupColumns: ['rGone'],
      totalsColumns: ['tGone'],
      pivotColumns: ['pGone', 'pAggGone'],
    });
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
    // does NOT produce a second toast.
    const uiA = { globalOn: true } as unknown as PivotBuilderConfig['ui'];
    const uiB = { globalOn: false } as unknown as PivotBuilderConfig['ui'];
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
    // Host received the sanitized (flat) config; persisted intent kept raw.
    expect(host.hostRollupWrites).toEqual([null]);
    expect(augmented.builderConfig.rollup).toBe(persisted.rollup);
  });

  it('exposes the stale report after hydrating a FULLY-STALE persisted pivot (Bug 1)', async () => {
    // The pivot variant of the reported bug: every rowKey/columnKey AND every
    // aggregation column is stale, so `buildSanitizedPivotRequest` returns
    // `isEmpty` and `applyPivotConfig` schedules an INTERNAL revert to the
    // empty builder config (flat table) on a microtask. That revert re-enters
    // `applyPivotBuilderConfig`; before the fix it re-ran staleness detection
    // against the empty config and clobbered `staleColumnReport` back to empty
    // BEFORE the middleware's synchronous hydration read — so a fully-stale
    // saved pivot collapsed to a flat table with NO toast. The revert now skips
    // the snapshot update, so the report from the original apply survives.
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
    // Let the internal empty-shell revert microtask run.
    await flushMicrotasks();
    await flushMicrotasks();

    expect(isPivotBuilderIrisGridModel(augmented)).toBe(true);
    // The snapshot the middleware reads on mount must reflect the ORIGINAL
    // stale pivot, not the empty config the model reverted to.
    expect(augmented.staleColumnReport).toEqual({
      rollupColumns: [],
      totalsColumns: [],
      pivotColumns: ['gone1', 'gone2', 'gone3'],
    });
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
