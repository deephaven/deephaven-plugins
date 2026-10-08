import { render, screen, fireEvent, act } from '@testing-library/react';
import type { MouseEventParams } from 'lightweight-charts';
import { TradingViewLegend, type TvlLegendSource } from '../TradingViewLegend';
import {
  formatPoint,
  latestTime,
  selectVisibleEntries,
} from '../TradingViewLegendModel';
import type { TvlLegendEntry } from '../TradingViewOverlayTypes';
import type { TvlLegendOptions, TvlSeriesKind } from '../TradingViewTypes';

/** Minimal stand-in for an ISeriesApi: only what the legend touches. */
function makeSeries() {
  return {
    priceFormatter: () => ({ format: (v: number) => v.toFixed(2) }),
    priceToCoordinate: (v: number) => v,
  };
}

interface StubSeries {
  id: string;
  title: string;
  color?: string;
  kind?: TvlSeriesKind;
  visible?: boolean;
  /** Latest rendered point, for the idle readout. */
  last?: unknown;
  /** Points by time, for the crosshair readout. */
  at?: Record<number, unknown>;
  api: ReturnType<typeof makeSeries>;
}

function stub(
  id: string,
  title: string,
  overrides: Partial<Omit<StubSeries, 'api' | 'id' | 'title'>> = {}
): StubSeries {
  return { id, title, api: makeSeries(), ...overrides };
}

function entryOf(s: StubSeries): TvlLegendEntry {
  return {
    id: s.id,
    series: s.api as never,
    title: s.title,
    color: s.color,
    kind: s.kind ?? 'Line',
    visible: s.visible !== false,
  };
}

/** A source over a mutable series list, plus a record of toggles performed. */
function makeSource(series: StubSeries[]): {
  source: TvlLegendSource;
  toggles: Array<[string, boolean]>;
  emit: (params: MouseEventParams) => void;
  notifyUpdate: () => void;
} {
  const toggles: Array<[string, boolean]> = [];
  let handler: ((p: MouseEventParams) => void) | undefined;
  let updateHandler: (() => void) | undefined;
  return {
    toggles,
    emit: p => handler?.(p),
    notifyUpdate: () => updateHandler?.(),
    source: {
      getLegendEntries: () => series.map(entryOf),
      getSeriesIdForApi: api => series.find(s => s.api === api)?.id,
      getSeriesPointAt: (id, time) =>
        series.find(s => s.id === id)?.at?.[time as number],
      getLastSeriesPoint: id => series.find(s => s.id === id)?.last,
      formatTime: t => `T:${t}`,
      setSeriesVisible: (id, visible) => {
        toggles.push([id, visible]);
        const target = series.find(s => s.id === id);
        if (target) target.visible = visible;
      },
      subscribeCrosshairMove: h => {
        handler = h;
        return () => {
          handler = undefined;
        };
      },
      subscribeOverlayUpdate: h => {
        updateHandler = h;
        return () => {
          updateHandler = undefined;
        };
      },
    },
  };
}

function makeParams(
  entries: Array<[unknown, unknown]>,
  overrides: Record<string, unknown> = {}
): MouseEventParams {
  return {
    time: 1700000000,
    point: { x: 100, y: 100 },
    seriesData: new Map(entries),
    ...overrides,
  } as unknown as MouseEventParams;
}

function renderLegend(
  series: StubSeries[],
  options: TvlLegendOptions = {},
  onToggle?: (id: string, visible: boolean) => void
) {
  const { source, toggles, emit, notifyUpdate } = makeSource(series);
  const utils = render(
    <TradingViewLegend source={source} options={options} onToggle={onToggle} />
  );
  return { ...utils, toggles, emit, notifyUpdate };
}

function rowText(): string[] {
  return Array.from(document.querySelectorAll('.tvl-legend-row')).map(row =>
    `${row.querySelector('.tvl-legend-title')?.textContent ?? ''} ${
      row.querySelector('.tvl-legend-value')?.textContent ?? ''
    }`.trim()
  );
}

function seam(): string {
  return (
    document.querySelector('.tvl-legend')?.getAttribute('data-tvl-legend') ?? ''
  );
}

describe('selectVisibleEntries', () => {
  const entries = Array.from({ length: 10 }, (_, i) =>
    entryOf(stub(`s${i}`, `S${i}`))
  );

  it('returns everything under the cap', () => {
    expect(
      selectVisibleEntries(entries.slice(0, 3), 6, undefined, false)
    ).toHaveLength(3);
  });

  it('caps without a focus', () => {
    expect(
      selectVisibleEntries(entries, 3, undefined, false).map(e => e.id)
    ).toEqual(['s0', 's1', 's2']);
  });

  it('promotes the focused entry in place of the last row', () => {
    const shown = selectVisibleEntries(entries, 3, 's7', false);
    expect(shown.map(e => e.id)).toEqual(['s0', 's1', 's7']);
    expect(shown).toHaveLength(3);
  });

  it('returns everything when expanded', () => {
    expect(selectVisibleEntries(entries, 3, undefined, true)).toHaveLength(10);
  });
});

describe('formatPoint', () => {
  const entry = entryOf(stub('a', 'A'));

  it('formats a single value', () => {
    expect(formatPoint(entry, 5, true)).toBe('5.00');
  });

  it('expands OHLC', () => {
    expect(
      formatPoint(entry, { open: 1, high: 4, low: 0.5, close: 3 }, true)
    ).toBe('O 1.00  H 4.00  L 0.50  C 3.00');
  });

  it('collapses OHLC to the close when disabled', () => {
    expect(
      formatPoint(entry, { open: 1, high: 4, low: 0.5, close: 3 }, false)
    ).toBe('3.00');
  });
});

describe('latestTime', () => {
  it('picks the latest, skipping rows without a point', () => {
    expect(latestTime([])).toBeUndefined();
    expect(latestTime([undefined, 5, 9, 6])).toBe(9);
  });
});

describe('TradingViewLegend', () => {
  it('renders a row per series before any crosshair', () => {
    renderLegend([
      stub('a', 'Index', { last: { value: 104.281, time: 1 } }),
      stub('b', 'Reference', { last: { value: 98.1, time: 1 } }),
    ]);
    expect(rowText()).toEqual(['Index 104.28', 'Reference 98.10']);
  });

  it('shows last values and time with no crosshair', () => {
    renderLegend([stub('a', 'Index', { last: { value: 7, time: 42 } })]);
    expect(rowText()).toEqual(['Index 7.00']);
    expect(document.querySelector('.tvl-legend-time')?.textContent).toBe(
      'T:42'
    );
  });

  it('prefers the crosshair value over the last value', () => {
    const series = [
      stub('a', 'Index', {
        last: { value: 7, time: 42 },
        at: { 1700000000: { value: 3 } },
      }),
    ];
    const { emit } = renderLegend(series);
    act(() => {
      emit(makeParams([[series[0].api, { value: 3 }]]));
    });
    expect(rowText()).toEqual(['Index 3.00']);
  });

  it('leaves a row blank when the crosshair slice lacks that series', () => {
    const series = [
      stub('a', 'Index', {
        last: { value: 7, time: 42 },
        at: { 1700000000: { value: 3 } },
      }),
      stub('b', 'Sparse', { last: { value: 99, time: 50 } }),
    ];
    const { emit } = renderLegend(series);
    act(() => {
      // Only `a` has a point at the hovered time. `b`'s latest point is from
      // a later time and must not appear under this timestamp.
      emit(makeParams([[series[0].api, { value: 3 }]]));
    });
    expect(rowText()).toEqual(['Index 3.00', 'Sparse']);
    expect(document.querySelector('.tvl-legend-time')?.textContent).toBe(
      'T:1700000000'
    );
  });

  it('returns to latest values when the crosshair leaves the data', () => {
    const series = [
      stub('a', 'Index', {
        last: { value: 7, time: 42 },
        at: { 1700000000: { value: 3 } },
      }),
    ];
    const { emit } = renderLegend(series);
    act(() => {
      emit(makeParams([[series[0].api, { value: 3 }]]));
    });
    expect(rowText()).toEqual(['Index 3.00']);
    act(() => {
      // Off the data LWC reports no time and an empty slice.
      emit(makeParams([], { time: undefined }));
    });
    expect(rowText()).toEqual(['Index 7.00']);
  });

  it('ignores the crosshair when followCursor is false', () => {
    const series = [
      stub('a', 'Index', {
        last: { value: 7, time: 42 },
        at: { 1700000000: { value: 3 } },
      }),
    ];
    const { emit } = renderLegend(series, {
      followCursor: false,
    });
    act(() => {
      emit(makeParams([[series[0].api, { value: 3 }]]));
    });
    expect(rowText()).toEqual(['Index 7.00']);
  });

  it('keeps hovered values current when the series rebuild under the cursor', () => {
    const series = [
      stub('a', 'Index', {
        last: { value: 7, time: 42 },
        at: { 1700000000: { value: 3 } },
      }),
    ];
    const { emit, notifyUpdate } = renderLegend(series);
    act(() => {
      emit(makeParams([[series[0].api, { value: 3 }]]));
    });
    expect(rowText()).toEqual(['Index 3.00']);

    // configureSeries (a late `by=` key, a theme rebuild) replaces every
    // series API. The cursor has not moved, so LWC sends no new params: the
    // value must still resolve, by id and time, against the new series.
    series[0].api = makeSeries();
    series.push(stub('b', 'Late', { at: { 1700000000: { value: 9 } } }));
    act(() => notifyUpdate());

    expect(rowText()).toEqual(['Index 3.00', 'Late 9.00']);
    expect(document.querySelector('.tvl-legend-time')?.textContent).toBe(
      'T:1700000000'
    );
  });

  it('refreshes the hovered value when a tick rewrites that bar', () => {
    const series = [stub('a', 'Index', { at: { 1700000000: { value: 3 } } })];
    const { emit, notifyUpdate } = renderLegend(series);
    act(() => {
      emit(makeParams([[series[0].api, { value: 3 }]]));
    });
    expect(rowText()).toEqual(['Index 3.00']);

    // The live bar under the cursor updates in place.
    series[0].at = { 1700000000: { value: 3.5 } };
    act(() => notifyUpdate());
    expect(rowText()).toEqual(['Index 3.50']);
  });

  it('keeps the focused series promoted across a rebuild', () => {
    const series = Array.from({ length: 3 }, (_, i) =>
      stub(`s${i}`, `S${i}`, {
        last: { value: i, time: 1 },
        at: { 1700000000: { value: i } },
      })
    );
    const { emit, notifyUpdate } = renderLegend(series, { maxRows: 1 });
    expect(rowText()).toEqual(['S0 0.00']);

    act(() => {
      emit(makeParams([[series[2].api, { value: 2 }]]));
    });
    expect(rowText()).toEqual(['S2 2.00']);

    // Focus was resolved to an id when the crosshair arrived, so it survives
    // the APIs it was resolved from being replaced.
    for (let i = 0; i < series.length; i += 1) {
      series[i].api = makeSeries();
    }
    act(() => notifyUpdate());
    expect(rowText()).toEqual(['S2 2.00']);
  });

  it('dates the idle readout by the latest of the displayed rows', () => {
    const series = [
      stub('a', 'Index', { last: { value: 7, time: 42 } }),
      stub('b', 'Sparse', { last: { value: 99, time: 50 } }),
    ];
    const { notifyUpdate } = renderLegend(series);
    // The rows come from different times: the readout is current as of the
    // most recent of them, not the first row's.
    expect(document.querySelector('.tvl-legend-time')?.textContent).toBe(
      'T:50'
    );
    expect(seam()).toBe('Index 7.00 | Sparse 99.00 | T:50');

    series[0].last = { value: 8, time: 60 };
    act(() => notifyUpdate());
    expect(document.querySelector('.tvl-legend-time')?.textContent).toBe(
      'T:60'
    );
  });

  it('dates the detailed readout by its own series alone', () => {
    renderLegend(
      [
        stub('a', 'AEROSPACE', { last: { value: 104.28, time: 9 } }),
        stub('b', 'Other', { last: { value: 1, time: 30 } }),
      ],
      { variant: 'detailed' }
    );
    // Only one series is displayed, so a later time elsewhere does not count.
    expect(document.querySelector('.tvl-legend-time')?.textContent).toBe('T:9');
  });

  it('caps rows and offers an expand toggle', () => {
    const series = Array.from({ length: 10 }, (_, i) =>
      stub(`s${i}`, `S${i}`, { last: { value: i, time: 1 } })
    );
    renderLegend(series, { maxRows: 3 });

    expect(rowText()).toHaveLength(3);
    const overflow = screen.getByRole('button', { name: '+7 more' });
    expect(overflow).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(overflow);
    expect(rowText()).toHaveLength(10);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(rowText()).toHaveLength(3);
  });

  it('keeps a dimmed row for a hidden series', () => {
    renderLegend([
      stub('a', 'Index', { last: { value: 1, time: 1 } }),
      stub('b', 'Off', { visible: false, last: { value: 2, time: 1 } }),
    ]);
    const rows = document.querySelectorAll('.tvl-legend-row');
    expect(rows).toHaveLength(2);
    expect(rows[1].className).toContain('tvl-legend-row-hidden');
    expect(seam()).toContain('(hidden)');
  });

  it('toggles a series when its row is clicked, and notifies', () => {
    const notified: Array<[string, boolean]> = [];
    const { toggles } = renderLegend(
      [stub('a', 'Index', { last: { value: 1, time: 1 } })],
      {},
      (id, visible) => notified.push([id, visible])
    );

    const row = document.querySelector('.tvl-legend-row') as HTMLElement;
    expect(row.tagName).toBe('BUTTON');
    expect(row).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(row);
    expect(toggles).toEqual([['a', false]]);
    expect(notified).toEqual([['a', false]]);
    expect(document.querySelector('.tvl-legend-row')?.className).toContain(
      'tvl-legend-row-hidden'
    );
  });

  it('renders non-interactive rows as divs that do not toggle', () => {
    const { toggles } = renderLegend(
      [stub('a', 'Index', { last: { value: 1, time: 1 } })],
      { interactive: false }
    );
    const row = document.querySelector('.tvl-legend-row') as HTMLElement;
    expect(row.tagName).toBe('DIV');
    fireEvent.click(row);
    expect(toggles).toEqual([]);
  });

  it('expands OHLC rows and marks them', () => {
    renderLegend([
      stub('a', 'ES', {
        kind: 'Candlestick',
        last: { open: 1, high: 4, low: 0.5, close: 3 },
      }),
    ]);
    expect(rowText()).toEqual(['ES O 1.00  H 4.00  L 0.50  C 3.00']);
    expect(document.querySelector('.tvl-legend-row')?.className).toContain(
      'tvl-legend-row-ohlc'
    );
  });

  it('renders the detailed variant as a large single readout', () => {
    renderLegend(
      [
        stub('a', 'AEROSPACE', {
          color: '#f00',
          last: { value: 104.28, time: 9 },
        }),
      ],
      { variant: 'detailed' }
    );
    expect(document.querySelector('.tvl-legend-row')).toBeNull();
    expect(
      document.querySelector('.tvl-legend-detail-title')?.textContent
    ).toBe('AEROSPACE');
    expect(
      document.querySelector('.tvl-legend-detail-value')?.textContent
    ).toBe('104.28');
  });

  it('applies the horizontal class', () => {
    renderLegend([stub('a', 'A')], {
      orientation: 'horizontal',
    });
    expect(document.querySelector('.tvl-legend')?.className).toContain(
      'tvl-legend-horizontal'
    );
  });

  it('hides the time line when showTime is false', () => {
    renderLegend([stub('a', 'A', { last: { value: 1, time: 1 } })], {
      showTime: false,
    });
    expect(document.querySelector('.tvl-legend-time')).toBeNull();
  });

  it('re-reads entries when the renderer signals an update', () => {
    const series = [stub('a', 'Key A', { last: { value: 1, time: 1 } })];
    const { notifyUpdate } = renderLegend(series);
    expect(rowText()).toEqual(['Key A 1.00']);

    // A late `by=` partition key arriving after first paint.
    series.push(stub('b', 'Key B', { last: { value: 2, time: 1 } }));
    act(() => notifyUpdate());

    expect(rowText()).toEqual(['Key A 1.00', 'Key B 2.00']);
  });

  it('renders nothing when the chart has no series', () => {
    renderLegend([]);
    expect(document.querySelector('.tvl-legend')).toBeNull();
  });

  it('publishes rendered text to the data-tvl-legend seam', () => {
    renderLegend([
      stub('a', 'Index', { last: { value: 1, time: 5 } }),
      stub('b', 'Off', { visible: false, last: { value: 2, time: 5 } }),
    ]);
    expect(seam()).toBe('Index 1.00 | Off 2.00 (hidden) | T:5');
  });
});
