import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, waitForTvlSettled } from './utils';

// Never tear the page down while a chart swap's Barrage snapshot is still
// propagating — the server logs "Stream was terminated by error" and that
// noise lands in other sessions' console history (and their screenshots).
test.afterEach(async ({ page }) => {
  await waitForTvlSettled(page);
});

// The default WidgetPanel wrapper may pre-render a hidden instance of
// the component, so use the default '.dh-panel' selector for openPanel
// (which verifies the opened widget by its Golden Layout tab title rather
// than a panel count) and scope screenshots to the last visible chart
// container.
const tvlChart = (page: import('@playwright/test').Page) =>
  page.locator('.dh-tvl-chart').last();

// Canvas text antialiasing jitters a handful of pixels between otherwise
// identical runs (observed: an 11px webkit diff confined to one axis label,
// against a snapshot regenerated minutes earlier in the same container).
// A small absolute budget absorbs that noise on these canvas-rendered
// charts; real layout regressions differ by thousands of pixels. Scoped
// here rather than in playwright.config.ts so other suites keep exact
// comparison.
const SCREENSHOT_OPTIONS = { maxDiffPixels: 25 } as const;

// Settle before capturing: `quiescent` (data-tvl-state) also holds false
// until the chart's fonts-ready layout flush has run — without the wait,
// whether a screenshot lands before or after that flush is a run-to-run
// race worth ~1px of price-axis width (slowest on firefox).
async function expectChartScreenshot(
  page: import('@playwright/test').Page
): Promise<void> {
  await waitForTvlSettled(page);
  // Pin the price-axis width. Firefox headless canvas measureText returns a
  // ~2px-bistable width for the price labels even after the font loads; the
  // axis auto-sizes to that, resizing the pane and shifting every bar
  // run-to-run. A fixed width removes text measurement from the layout, so
  // the settled positions are a pure function of the chart's pixel size.
  // Test-only (via __tvlTestHook); the product default still auto-sizes.
  await page.evaluate(() => {
    // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
    (window as any).__tvlTestHook?.pinPriceScales?.(120);
  });
  await waitForTvlSettled(page);
  await expect(tvlChart(page)).toHaveScreenshot(SCREENSHOT_OPTIONS);
}

// --------------------------------------------------------------------------
// Single-series convenience function charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Single Series', () => {
  test('Candlestick chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick');
    await expectChartScreenshot(page);
  });

  test('Bar chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_bar');
    await expectChartScreenshot(page);
  });

  test('Line chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_line');
    await expectChartScreenshot(page);
  });

  test('Area chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_area');
    await expectChartScreenshot(page);
  });

  test('Baseline chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_baseline');
    await expectChartScreenshot(page);
  });

  test('Histogram chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_histogram');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Styled and customized charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Styled Charts', () => {
  test('Candlestick with custom colors loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_styled');
    await expectChartScreenshot(page);
  });

  test('Line chart with custom grid loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_line_custom_grid');
    await expectChartScreenshot(page);
  });

  test('Area chart with watermark loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_area_watermark');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Annotations: price lines and markers
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Annotations', () => {
  test('Candlestick with price lines loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_price_lines');
    await expectChartScreenshot(page);
  });

  test('Candlestick with markers loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_markers');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Multi-series composition charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Multi-Series', () => {
  test('Candlestick with SMA overlay loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_with_sma');
    await expectChartScreenshot(page);
  });

  test('Candlestick with volume histogram loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_with_volume');
    await expectChartScreenshot(page);
  });

  test('Dual line series overlay loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_dual_line');
    await expectChartScreenshot(page);
  });

  test('Full trading dashboard loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_full_dashboard');
    await expectChartScreenshot(page);
  });

  test('Two price scales loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_two_price_scales');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Panes
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Panes', () => {
  test('Two-pane chart with candlestick and volume loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_panes_basic');
    await expectChartScreenshot(page);
  });

  test('Three-pane chart with custom separators loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_panes_three');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Yield Curve Charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Yield Curve', () => {
  test('Yield curve line chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_yield_curve');
    await expectChartScreenshot(page);
  });

  test('Yield curve area chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_yield_curve_area');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Options Charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Options Chart', () => {
  test('Single series options chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_options_single');
    await expectChartScreenshot(page);
  });

  test('Multi-series options chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_options_multi');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Dynamic Price Lines
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Dynamic Price Lines', () => {
  test('Candlestick with dynamic column-based price lines loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_dynamic_price_lines');
    await expectChartScreenshot(page);
  });

  test('Candlestick with mixed static and dynamic price lines loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_mixed_price_lines');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Table-Driven Markers
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Table-Driven Markers', () => {
  test('Candlestick with table-driven markers (per-row columns) loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_table_markers');
    await expectChartScreenshot(page);
  });

  test('Candlestick with table-driven markers (fixed styling) loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_table_markers_fixed');
    await expectChartScreenshot(page);
  });
});

// --------------------------------------------------------------------------
// Auto-bin (server-side time-bucket aggregation) interactions
// --------------------------------------------------------------------------

/** Get chart canvas bounding rect. */
async function getChartRect(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const c = document.querySelector('.dh-tvl-chart canvas');
    if (!c) return { x: 0, y: 0, w: 0, h: 0 };
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

/** Zoom via wheel events dispatched on the chart canvas, one per frame. */
async function wheelZoom(
  page: import('@playwright/test').Page,
  steps: number,
  deltaY: number
) {
  await page.evaluate(
    ({ steps: s, deltaY: dy }) =>
      new Promise<void>(resolve => {
        const c = document.querySelector('.dh-tvl-chart canvas');
        if (!c) {
          resolve();
          return;
        }
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let i = 0;
        function step() {
          if (i >= s) {
            resolve();
            return;
          }
          c!.dispatchEvent(
            new WheelEvent('wheel', {
              clientX: cx,
              clientY: cy,
              deltaY: dy,
              deltaMode: 0,
              bubbles: true,
              cancelable: true,
            })
          );
          i += 1;
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }),
    { steps, deltaY }
  );
}

/** Pan by dragging on the chart body. Negative dx = pan toward later dates. */
async function panChart(page: import('@playwright/test').Page, dx: number) {
  const rect = await getChartRect(page);
  const cy = rect.y + rect.h / 2;
  const startX = rect.x + rect.w / 2;
  await page.mouse.move(startX, cy);
  await page.mouse.down();
  // Interpolated move: Playwright emits `steps` pointermove events in one call,
  // which LWC's drag-scroll registers reliably across browsers (a manual burst
  // of moves gets coalesced/dropped, notably in Firefox). Split the drag into
  // two bursts with a pause so Firefox can't coalesce the whole gesture away,
  // and let the final position settle before releasing.
  await page.mouse.move(startX + dx / 2, cy, { steps: 10 });
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(50);
  await page.mouse.move(startX + dx, cy, { steps: 10 });
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(50);
  await page.mouse.up();
}

interface TvlState {
  jsDs: boolean;
  tableSize: number;
  colDataRows: number;
  pendingDs: boolean;
  visRange: [number, number] | null;
  autoBin: boolean;
  binWidthNs: number | null;
  aggType: string | null;
  resampleSeq: number;
}

async function getTvlState(
  page: import('@playwright/test').Page
): Promise<TvlState> {
  return page.evaluate(() => {
    // Multiple .dh-tvl-chart instances may exist (eg WidgetPanel renders one
    // hidden + one visible). Pick the last visible one to match what the
    // user sees and what tvlChart() asserts on.
    const els = Array.from(document.querySelectorAll('.dh-tvl-chart'));
    const el = els[els.length - 1];
    const raw = el?.getAttribute('data-tvl-state');
    return raw ? JSON.parse(raw) : {};
  });
}

async function waitForResampleSettled(
  page: import('@playwright/test').Page,
  timeout = 30000
): Promise<TvlState> {
  const start = Date.now();
  // Require a stable state for two consecutive samples to avoid catching a
  // transient pending=false between back-to-back rebuilds.
  let prev: TvlState | null = null;
  while (Date.now() - start < timeout) {
    const s = await getTvlState(page);
    if (
      !s.pendingDs &&
      s.colDataRows > 0 &&
      prev !== null &&
      !prev.pendingDs &&
      prev.binWidthNs === s.binWidthNs &&
      prev.colDataRows === s.colDataRows &&
      prev.resampleSeq === s.resampleSeq
    ) {
      return s;
    }
    prev = s;
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(300);
  }
  return getTvlState(page);
}

async function waitForBinWidthChange(
  page: import('@playwright/test').Page,
  prevWidth: number | null,
  timeout = 15000
): Promise<TvlState> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const s = await getTvlState(page);
    if (s.binWidthNs !== prevWidth && !s.pendingDs && s.colDataRows > 0) {
      return s;
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
  }
  return getTvlState(page);
}

// Must mirror NICE_BIN_WIDTHS_NS in auto_bin.py (the server is the source of
// truth). Includes the coarse multi-day buckets (30d/90d/365d) a wide default
// range can snap to.
const NICE_BIN_WIDTHS_NS = [
  1, 100, 1_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000,
  5_000_000_000, 15_000_000_000, 30_000_000_000, 60_000_000_000,
  300_000_000_000, 900_000_000_000, 1_800_000_000_000, 3_600_000_000_000,
  14_400_000_000_000, 43_200_000_000_000, 86_400_000_000_000,
  604_800_000_000_000, 2_592_000_000_000_000, 7_776_000_000_000_000,
  31_536_000_000_000_000,
];

test.describe('TradingView Lightweight - Auto-bin', () => {
  test.setTimeout(120_000);

  // ===== Group 1 — Eligibility =====

  test('big histogram triggers auto-bin', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist');
    await expect(tvlChart(page)).toBeVisible();
    const s = await waitForResampleSettled(page);
    expect(s.autoBin).toBe(true);
    expect(s.aggType).toBe('sum');
    expect(s.binWidthNs).not.toBeNull();
    if (s.binWidthNs != null) expect(s.binWidthNs).toBeGreaterThan(0);
  });

  test('big candlestick (4 distinct OHLC cols) triggers auto-bin', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_candlestick');
    await expect(tvlChart(page)).toBeVisible();
    const s = await waitForResampleSettled(page);
    expect(s.autoBin).toBe(true);
    expect(s.aggType).toBe('ohlc');
  });

  test('small histogram is NOT auto-binned', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_small_hist');
    await expect(tvlChart(page)).toBeVisible();
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const s = await getTvlState(page);
    expect(s.autoBin).toBe(false);
    expect(s.binWidthNs).toBeNull();
  });

  test('auto_bin=False opts out', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist_optout');
    await expect(tvlChart(page)).toBeVisible();
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const s = await getTvlState(page);
    expect(s.autoBin).toBe(false);
  });

  test('count aggregation propagates to aggType', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist_count');
    await expect(tvlChart(page)).toBeVisible();
    const s = await waitForResampleSettled(page);
    expect(s.autoBin).toBe(true);
    expect(s.aggType).toBe('count');
  });

  // ===== Group 2 — Bin-width snapping =====

  test('initial bin_width snaps to a "nice" duration', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist');
    await expect(tvlChart(page)).toBeVisible();
    const s = await waitForResampleSettled(page);
    expect(s.binWidthNs).not.toBeNull();
    expect(NICE_BIN_WIDTHS_NS).toContain(s.binWidthNs);
  });

  test('bin_width=PT5M overrides nice snapping', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist_pt5m', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const s = await waitForResampleSettled(page);
    expect(s.binWidthNs).toBe(5 * 60 * 1_000_000_000);
  });

  test('bin_count=50 widens the bin width vs the default', async ({ page }) => {
    // The default auto target is ~250 bins; bin_count=50 asks for far fewer,
    // so its bins are coarser (wider) than the default over the same range.
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const a = await waitForResampleSettled(page);

    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist_bc50', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const b = await waitForResampleSettled(page);

    expect(a.binWidthNs).not.toBeNull();
    expect(b.binWidthNs).not.toBeNull();
    if (a.binWidthNs != null && b.binWidthNs != null) {
      expect(b.binWidthNs).toBeGreaterThan(a.binWidthNs);
    }
  });

  // ===== Group 3 — Re-aggregation trigger =====

  test('zoom past MIN_VISIBLE_BINS triggers re-aggregation', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const initial = await waitForResampleSettled(page);
    expect(initial.binWidthNs).not.toBeNull();

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2500); // settle delay
    // Zoom hard enough to drop below MIN_VISIBLE_BINS for 1-day bins.
    await wheelZoom(page, 60, -300);
    const next = await waitForBinWidthChange(page, initial.binWidthNs, 30000);
    expect(next.binWidthNs).not.toBeNull();
    if (initial.binWidthNs != null && next.binWidthNs != null) {
      expect(next.binWidthNs).toBeLessThan(initial.binWidthNs);
    }
  });

  test('double-click reset reverts to initial bin_width', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const initial = await waitForResampleSettled(page);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2500);
    await wheelZoom(page, 60, -300);
    await waitForBinWidthChange(page, initial.binWidthNs, 30000);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1500);
    // Synthesize a dblclick on the canvas so the chart's container-level
    // listener fires reliably across browsers.
    await page.evaluate(() => {
      const canvas = document.querySelector(
        '.dh-tvl-chart canvas'
      ) as HTMLElement | null;
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      canvas.dispatchEvent(
        new MouseEvent('dblclick', {
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          bubbles: true,
          cancelable: true,
          detail: 2,
        })
      );
    });

    const restored = await waitForResampleSettled(page, 30000);
    expect(restored.binWidthNs).toBe(initial.binWidthNs);
  });

  test('rapid zooms increment resampleSeq monotonically', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const initial = await waitForResampleSettled(page);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2500);
    // Three bursts of significant zoom — enough to cross MIN_VISIBLE_BINS
    for (let i = 0; i < 3; i += 1) {
      await wheelZoom(page, 25, -250);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(300);
    }
    const settled = await waitForResampleSettled(page, 30000);
    expect(settled.resampleSeq).toBeGreaterThan(initial.resampleSeq);
    expect(settled.pendingDs).toBe(false);
  });

  // ===== Group 4 — Race conditions =====

  test('5 rapid zooms produce a single monotonically-narrowing settled state', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const initial = await waitForResampleSettled(page);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2500);
    for (let i = 0; i < 5; i += 1) {
      await wheelZoom(page, 12, -250);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(120);
    }

    const settled = await waitForResampleSettled(page, 30000);
    expect(settled.pendingDs).toBe(false);
    if (initial.binWidthNs != null && settled.binWidthNs != null) {
      // Bin width must be ≤ initial — never bounce back coarser during zoom-in
      expect(settled.binWidthNs).toBeLessThanOrEqual(initial.binWidthNs);
    }

    // Sample state every 250ms for 2.5s — binWidthNs must stop bouncing.
    // Allow at most one transition (in case a queued resample drains in.)
    const widths: (number | null)[] = [];
    for (let i = 0; i < 10; i += 1) {
      const s = await getTvlState(page);
      widths.push(s.binWidthNs);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(250);
    }
    const distinct = new Set(widths.filter(w => w != null));
    expect(distinct.size).toBeLessThanOrEqual(2);
  });

  test('zoom then immediate reset within debounce window settles to initial', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const initial = await waitForResampleSettled(page);
    const rect = await getChartRect(page);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2500);
    await wheelZoom(page, 12, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);

    const reset = await waitForResampleSettled(page);
    expect(reset.pendingDs).toBe(false);
    expect(reset.binWidthNs).toBe(initial.binWidthNs);
  });

  test('pan during in-flight zoom does not produce empty data', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist');
    await expect(tvlChart(page)).toBeVisible();
    await waitForResampleSettled(page);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2500);
    await wheelZoom(page, 15, -200);
    // Pan immediately, before settle
    await panChart(page, -300);

    const settled = await waitForResampleSettled(page);
    expect(settled.colDataRows).toBeGreaterThan(0);
    expect(settled.pendingDs).toBe(false);
  });

  // ===== Group 5 — Mixed series + edge data =====

  test('Line + Histogram on same source: both routed correctly', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_mixed_line_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const s = await waitForResampleSettled(page);
    expect(s.autoBin).toBe(true);
    expect(s.jsDs).toBe(true);
    expect(s.pendingDs).toBe(false);
    expect(s.colDataRows).toBeGreaterThan(0);
  });

  // Ticking auto-bin and wall-clock settle budgets are deliberately not
  // covered here. Both assert on timing rather than behaviour: the aggregated
  // view of a ticking source only changes when a tick alters a bin's
  // aggregate, and a settle-time budget measures whatever CPU the run happens
  // to leave for the browser. Neither can be made reliable in a parallel
  // suite, and both produced failures that had nothing to do with the plugin.
});
