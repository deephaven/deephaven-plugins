import { defaultTheme, Provider } from '@adobe/react-spectrum';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IrisGridModel, AggregationSettings } from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { CreatePivotPage } from './CreatePivotPage';
import {
  PivotServiceContext,
  type PivotServiceStatus,
} from './PivotServiceContext';
import type {
  PivotBuilderConfig,
  PivotBuilderUiState,
} from './pivotBuilderModel';
import { EMPTY_AGGREGATION_SETTINGS } from './seedPivotBuilderUiState';

// `isPivotBuilderIrisGridModel` narrows on this well-known symbol. `Symbol.for`
// returns the same registered symbol the model module installs, so a plain
// mock object tagged with it passes the type guard without building a real
// proxy via `augmentPivotBuilderModel`.
const PIVOT_BUILDER_TAG = Symbol.for(
  '@deephaven/js-plugin-pivot-builder/PivotBuilderProxy'
);

const STRING = 'java.lang.String';
const DOUBLE = 'double';

// The Spectrum Picker inside the Aggregate values rows observes its size on
// mount; jsdom has no ResizeObserver and the shared Jest setup doesn't mock it.
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe(): void {
      // no-op
    }

    unobserve(): void {
      // no-op
    }

    disconnect(): void {
      // no-op
    }
  };
});

function col(name: string, type: string): DhType.Column {
  return { name, type } as unknown as DhType.Column;
}

function agg(
  operation: string,
  selected: string[],
  invert = false
): AggregationSettings['aggregations'][number] {
  return {
    operation:
      operation as AggregationSettings['aggregations'][number]['operation'],
    selected,
    invert,
  };
}

function aggSettings(
  aggregations: AggregationSettings['aggregations']
): AggregationSettings {
  return { aggregations, showOnTop: false };
}

/**
 * Build a `PivotBuilderUiState` seed for the three cards. `globalOn` defaults
 * to `false` so each test can drive exactly one reconcile by flipping the
 * "Enable" switch on: the mount reconcile is skipped by design
 * (`hasReconciledRef`), and toggling Enable is the single state change that
 * fires the effect with the seeded (possibly stale) card contents.
 */
function makeUi(
  overrides: Partial<PivotBuilderUiState> = {}
): PivotBuilderUiState {
  return {
    globalOn: false,
    rollupRowsOn: true,
    rollupRows: [],
    includeConstituents: true,
    nonAggregatedInRollup: true,
    aggregatesOn: true,
    aggregations: EMPTY_AGGREGATION_SETTINGS,
    pivotColumnsOn: true,
    pivotColumns: [],
    filterableOn: true,
    filterableColumns: [],
    ...overrides,
  };
}

interface MockModelResult {
  model: IrisGridModel;
  applySpy: jest.Mock;
}

/**
 * Minimal fake of the `PivotBuilderProxyModel` that `CreatePivotPage` drives.
 * Only the surfaces the component actually reads are implemented; the reconcile
 * effect's decision (which of pivot/rollup/totals to build) is observed purely
 * through the spied `applyPivotBuilderConfig`.
 */
function makeModel(
  columns: DhType.Column[],
  ui: PivotBuilderUiState,
  { isRollupAvailable = true }: { isRollupAvailable?: boolean } = {}
): MockModelResult {
  const applySpy = jest.fn(() => Promise.resolve());
  const builderConfig: PivotBuilderConfig = {
    pivot: null,
    rollup: null,
    totals: null,
    ui,
  };
  const model = {
    [PIVOT_BUILDER_TAG]: true,
    isRollupAvailable,
    sourceTable: { columns },
    columns,
    rollupConfig: null,
    totalsConfig: null,
    builderConfig,
    applyPivotBuilderConfig: applySpy,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
  return { model: model as unknown as IrisGridModel, applySpy };
}

const viewState = { hiddenColumns: [] } as never;

function pageElement(
  model: IrisGridModel,
  status: PivotServiceStatus
): JSX.Element {
  return (
    <Provider theme={defaultTheme}>
      <PivotServiceContext.Provider value={{ status }}>
        <CreatePivotPage
          model={model}
          viewState={viewState}
          onBack={() => undefined}
        />
      </PivotServiceContext.Provider>
    </Provider>
  );
}

function renderPage(
  model: IrisGridModel,
  status: PivotServiceStatus
): (nextStatus: PivotServiceStatus) => void {
  const { rerender } = render(pageElement(model, status));
  return (nextStatus: PivotServiceStatus) =>
    rerender(pageElement(model, nextStatus));
}

/**
 * Flip the master "Enable" switch on, driving exactly one reconcile, and
 * resolve with the config `applyPivotBuilderConfig` was last called with.
 */
async function reconcileOnce(applySpy: jest.Mock): Promise<PivotBuilderConfig> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('switch', { name: 'Enable' }));
  await waitFor(() => expect(applySpy).toHaveBeenCalled());
  return applySpy.mock.calls[applySpy.mock.calls.length - 1][0];
}

describe('CreatePivotPage reconcile — hasLiveColumn gating', () => {
  it('1. downgrades an all-stale Pivot columns card to a genuine rollup (the fixed bug)', async () => {
    // Live table has `dept` (a surviving rollup row) but NEITHER of the two
    // pivot columns. Pre-fix, the raw `pivotColumns.length > 0` kept
    // `pivotActive` true and fired a degenerate 0-key pivot; now every pivot
    // column is stale so the card is inactive and reconcile falls through to a
    // real rollup.
    const { model, applySpy } = makeModel(
      [col('dept', STRING), col('price', DOUBLE)],
      makeUi({
        rollupRows: ['dept'],
        pivotColumns: ['goneA', 'goneB'],
      })
    );
    renderPage(model, 'ready');

    const cfg = await reconcileOnce(applySpy);

    // No pivot — the all-stale pivot card must NOT build a pivot...
    expect(cfg.pivot).toBeNull();
    // ...and reconcile falls through to a real rollup built off the source.
    expect(cfg.rollup).not.toBeNull();
    expect(
      (cfg.rollup as unknown as { groupingColumns: string[] }).groupingColumns
    ).toEqual(['dept']);
    expect(cfg.totals).toBeNull();
  });

  it('2. falls past rollup mode when all Rollup rows are stale and no Pivot columns configured', async () => {
    // Every rollup row is stale (schema drift) and the sole aggregation
    // references a dropped column too, so nothing survives: no pivot, no
    // rollup, and totals collapse to null (the stale, non-invert aggregation
    // is dropped).
    const { model, applySpy } = makeModel(
      [col('price', DOUBLE)],
      makeUi({
        rollupRows: ['goneRow1', 'goneRow2'],
        pivotColumns: [],
        aggregations: aggSettings([agg('Sum', ['goneAgg'])]),
      })
    );
    renderPage(model, 'ready');

    const cfg = await reconcileOnce(applySpy);

    expect(cfg.pivot).toBeNull();
    expect(cfg.rollup).toBeNull();
    // The only aggregation was all-stale + non-invert, so it is dropped and no
    // totals row survives.
    expect(cfg.totals).toBeNull();
  });

  it('3. still builds a pivot when the Pivot columns card is only partially stale', async () => {
    // 2 pivot columns, 1 live + 1 stale → `hasLiveColumn` is true, so
    // `pivotActive` stays true (regression guard: partial staleness must NOT
    // downgrade an otherwise-active card).
    const { model, applySpy } = makeModel(
      [col('region', STRING), col('price', DOUBLE)],
      makeUi({
        rollupRowsOn: false,
        rollupRows: [],
        pivotColumns: ['region', 'goneCol'],
        aggregations: aggSettings([agg('Sum', ['price'])]),
      })
    );
    renderPage(model, 'ready');

    const cfg = await reconcileOnce(applySpy);

    expect(cfg.pivot).not.toBeNull();
    // The raw (stale-inclusive) column keys are preserved on the built pivot.
    expect(cfg.pivot?.columnKeys).toEqual(['region', 'goneCol']);
    expect(cfg.rollup).toBeNull();
    expect(cfg.totals).toBeNull();
  });

  it('4. keeps an invert:true aggregation active even when its named columns are all stale', async () => {
    // `invert: true` means "aggregate everything except these named columns";
    // if the named columns no longer exist that is equivalent to "aggregate
    // everything", NOT "aggregate nothing" — so `aggsActive` must stay true and
    // the aggregation must survive into the built totals config.
    const { model, applySpy } = makeModel(
      [col('region', STRING), col('price', DOUBLE)],
      makeUi({
        rollupRowsOn: false,
        rollupRows: [],
        pivotColumns: [],
        aggregations: aggSettings([agg('Count', ['goneCol'], true)]),
      })
    );
    renderPage(model, 'ready');

    const cfg = await reconcileOnce(applySpy);

    expect(cfg.pivot).toBeNull();
    expect(cfg.rollup).toBeNull();
    // The inverted aggregation is NOT dropped — it produces a real totals row
    // over the surviving (live) columns.
    expect(cfg.totals).not.toBeNull();
    const operationMap = (
      cfg.totals as unknown as {
        operationMap: Record<string, string[]>;
      }
    ).operationMap;
    expect(Object.keys(operationMap).length).toBeGreaterThan(0);
  });

  it('5. builds a normal pivot with no staleness (regression guard)', async () => {
    // Every referenced column is live: the Pivot columns card is active, rollup
    // rows fold into the pivot row keys, and the aggregation is carried over —
    // behavior is unchanged from before the fix.
    const { model, applySpy } = makeModel(
      [col('region', STRING), col('dept', STRING), col('price', DOUBLE)],
      makeUi({
        rollupRows: ['dept'],
        pivotColumns: ['region'],
        aggregations: aggSettings([agg('Sum', ['price'])]),
      })
    );
    renderPage(model, 'ready');

    const cfg = await reconcileOnce(applySpy);

    expect(cfg.pivot).not.toBeNull();
    expect(cfg.pivot?.columnKeys).toEqual(['region']);
    // Rollup card active → its rows become the pivot's row keys.
    expect(cfg.pivot?.rowKeys).toEqual(['dept']);
    expect(cfg.pivot?.aggregations).toEqual([
      { operation: 'Sum', columns: ['price'] },
    ]);
    expect(cfg.rollup).toBeNull();
    expect(cfg.totals).toBeNull();
  });

  it('6. applies an edit made while the PSP probe was pending, once it resolves', async () => {
    // Regression: the loading wait used to run BEFORE the mount-skip marker,
    // so with a pivot-intent config the mount run returned at the wait (marker
    // unconsumed), an edit during 'loading' also returned, and the first
    // post-resolution run merely consumed the marker and returned — the edit
    // was silently lost until the NEXT change. The marker is now consumed on
    // the true mount run, so the post-resolution run applies the edit. The
    // edit here (Rollup rows card on) deliberately KEEPS the pivot intent, so
    // the wait guard stays true throughout 'loading'.
    const { model, applySpy } = makeModel(
      [col('region', STRING), col('dept', STRING), col('price', DOUBLE)],
      makeUi({
        globalOn: true,
        rollupRowsOn: false,
        rollupRows: ['dept'],
        pivotColumns: ['region'],
        aggregations: aggSettings([agg('Sum', ['price'])]),
      })
    );
    const setStatus = renderPage(model, 'loading');

    // Edit while the probe is pending: turn the Rollup rows card on. The
    // config could derive a pivot (live pivot column, global on), so the
    // reconcile must WAIT — nothing applied yet.
    const user = userEvent.setup();
    await user.click(screen.getByRole('switch', { name: 'Rollup rows' }));
    expect(applySpy).not.toHaveBeenCalled();

    // Probe resolves → the pending edit applies: a pivot whose row keys come
    // from the now-enabled Rollup rows card.
    setStatus('ready');
    await waitFor(() => expect(applySpy).toHaveBeenCalled());
    const cfg: PivotBuilderConfig =
      applySpy.mock.calls[applySpy.mock.calls.length - 1][0];
    expect(cfg.pivot).not.toBeNull();
    expect(cfg.pivot?.columnKeys).toEqual(['region']);
    expect(cfg.pivot?.rowKeys).toEqual(['dept']);
    expect(cfg.ui?.rollupRowsOn).toBe(true);
  });
});
