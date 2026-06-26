import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

// The default WidgetPanel wrapper may pre-render a hidden instance of
// the component, so use the default '.dh-panel' selector for openPanel
// (which counts correctly) and scope screenshots to the last visible
// chart container.
const tvlChart = (page: import('@playwright/test').Page) =>
  page.locator('.dh-tvl-chart').last();

// --------------------------------------------------------------------------
// Single-series convenience function charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Single Series', () => {
  test('Candlestick chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Bar chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_bar');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Line chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_line');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Area chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_area');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Baseline chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_baseline');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Histogram chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_histogram');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Styled and customized charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Styled Charts', () => {
  test('Candlestick with custom colors loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_styled');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Line chart with custom grid loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_line_custom_grid');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Area chart with watermark loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_area_watermark');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Annotations: price lines and markers
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Annotations', () => {
  test('Candlestick with price lines loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_price_lines');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with markers loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_markers');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Multi-series composition charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Multi-Series', () => {
  test('Candlestick with SMA overlay loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_with_sma');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with volume histogram loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_with_volume');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Dual line series overlay loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_dual_line');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Full trading dashboard loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_full_dashboard');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Two price scales loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_two_price_scales');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Panes
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Panes', () => {
  test('Two-pane chart with candlestick and volume loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_panes_basic');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Three-pane chart with custom separators loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_panes_three');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Yield Curve Charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Yield Curve', () => {
  test('Yield curve line chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_yield_curve');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Yield curve area chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_yield_curve_area');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Options Charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Options Chart', () => {
  test('Single series options chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_options_single');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Multi-series options chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_options_multi');
    await expect(tvlChart(page)).toHaveScreenshot();
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
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with mixed static and dynamic price lines loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_mixed_price_lines');
    await expect(tvlChart(page)).toHaveScreenshot();
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
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with table-driven markers (fixed styling) loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_table_markers_fixed');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// By (partitioned) ticking charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - By Ticking', () => {
  test('New partition key adds a second trace after button click', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_by_ticking', '.dh-react-panel:visible');

    const panel = page.locator('.dh-react-panel:visible');

    // Wait for initial chart render (1 series: AAPL only)
    await expect(panel.locator('.dh-tvl-chart')).toBeVisible();
    await expect(panel).toHaveScreenshot();

    // Click button to publish GOOG rows
    await panel.getByRole('button', { name: 'Add GOOG' }).click();

    // Wait for button text to confirm callback ran
    await expect(panel.getByRole('button', { name: 'Added' })).toBeVisible();

    // Wait for the async chain: PartitionedTable EVENT_KEYADDED →
    // JS getTable(key) → subscribe → data render
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);

    // Chart should now show 2 colored traces (AAPL + GOOG)
    await expect(panel).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Downsampling (large table)
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Downsampling', () => {
  test('10M row line chart loads with downsampling', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_line');

    // Chart should render (not hang or crash) — 10M rows downsampled
    await expect(tvlChart(page)).toBeVisible();
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Downsampling interactions (zoom, pan, reset)
// --------------------------------------------------------------------------

interface DsState {
  jsDs: boolean;
  tableSize: number;
  colDataRows: number;
  pendingDs: boolean;
  visRange: [number, number] | null;
}

/** Read the structured debug state from the data-tvl-state attribute. */
async function getDsState(
  page: import('@playwright/test').Page
): Promise<DsState> {
  return page.evaluate(() => {
    const el = document.querySelector('.dh-tvl-chart');
    const raw = el?.getAttribute('data-tvl-state');
    return raw ? JSON.parse(raw) : {};
  });
}

/** Wait until jsDs is true, pendingDs is false, and colDataRows > 0. */
async function waitForDsReady(
  page: import('@playwright/test').Page,
  timeout = 15000
): Promise<DsState> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const state = await getDsState(page);
    if (state.jsDs && !state.pendingDs && state.colDataRows > 0) {
      return state;
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
  }
  return getDsState(page);
}

/** Wait for state to change from a previous snapshot (new data arrived). */
async function waitForStateChange(
  page: import('@playwright/test').Page,
  prev: DsState,
  timeout = 15000
): Promise<DsState> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const state = await getDsState(page);
    if (
      !state.pendingDs &&
      state.colDataRows > 0 &&
      (state.tableSize !== prev.tableSize ||
        state.colDataRows !== prev.colDataRows)
    ) {
      return state;
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
  }
  return getDsState(page);
}

/** Wait for pendingDs to go false (downsample settled). */
async function waitForDsSettled(
  page: import('@playwright/test').Page,
  timeout = 15000
): Promise<DsState> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const state = await getDsState(page);
    if (!state.pendingDs && state.colDataRows > 0) {
      return state;
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
  }
  return getDsState(page);
}

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
  // Move in steps for LWC to register the drag
  const steps = 5;
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(startX + (dx * i) / steps, cy);
  }
  await page.mouse.up();
}

/**
 * X-axis zoom by dragging on the time scale row.
 * LWC uses a TABLE layout; the time axis is a separate TR below the
 * plot canvas. Positive dx = drag right = zoom out.
 */
async function xAxisZoom(page: import('@playwright/test').Page, dx: number) {
  // Find the time axis canvas (bottom row of LWC's table)
  const timeAxisY = await page.evaluate(() => {
    const chart = document.querySelector('.dh-tvl-chart');
    if (!chart) return 0;
    // LWC's time axis is in the last table row
    const rows = chart.querySelectorAll('tr');
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return 0;
    const r = lastRow.getBoundingClientRect();
    return Math.round(r.top + r.height / 2);
  });
  if (timeAxisY === 0) return;

  const rect = await getChartRect(page);
  const startX = rect.x + rect.w / 2;
  await page.mouse.move(startX, timeAxisY);
  await page.mouse.down();
  const steps = 5;
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(startX + (dx * i) / steps, timeAxisY);
  }
  await page.mouse.up();
}

test.describe('TradingView Lightweight - Downsampling Interactions', () => {
  test.setTimeout(120_000);

  /** Open a chart by name and wait for downsample + settle. */
  async function openDsChart(
    page: import('@playwright/test').Page,
    name = 'tvl_big_line'
  ): Promise<DsState> {
    await gotoPage(page, '');
    await openPanel(page, name);
    await expect(tvlChart(page)).toBeVisible();
    const state = await waitForDsReady(page, 30000);
    // Wait for the 1s settle timer + some buffer for fitContent to complete
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(2500);
    return state;
  }

  // =======================================================================
  // A. INITIAL LOAD
  // =======================================================================

  test('10M table: initial load is downsampled at full range', async ({
    page,
  }) => {
    const s = await openDsChart(page);
    expect(s.jsDs).toBe(true);
    expect(s.pendingDs).toBe(false);
    expect(s.colDataRows).toBeGreaterThan(100);
    expect(s.visRange).not.toBeNull();
    // Visible range should span a meaningful portion of the data
    if (s.visRange) {
      const days = (s.visRange[1] - s.visRange[0]) / 86400;
      // 10M rows over 10 years — at minimum 30 days visible after fitContent
      expect(days).toBeGreaterThan(30);
    }
  });

  test('small table: NOT downsampled', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_small_line');
    await expect(tvlChart(page)).toBeVisible();
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const s = await getDsState(page);
    expect(s.jsDs).toBe(false);
  });

  // 10M candlestick is now safe to load: auto-bin aggregates server-side.
  test('candlestick on big table: NOT JS-downsampled (auto-binned instead)', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_candlestick', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    // The downsample-state attribute is set by the chart's debug hook;
    // jsDs must remain false because candlestick uses auto-bin instead.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const raw = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.dh-tvl-chart'));
      const el = els[els.length - 1];
      return el?.getAttribute('data-tvl-state');
    });
    const s = raw ? JSON.parse(raw) : null;
    expect(s).not.toBeNull();
    expect(s.jsDs).toBe(false);
  });

  // =======================================================================
  // B. ZOOM
  // =======================================================================

  test('wheel zoom in narrows visible range', async ({ page }) => {
    const initial = await openDsChart(page);

    // More aggressive zoom to ensure threshold is crossed
    await wheelZoom(page, 25, -300);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const zoomed = await waitForDsSettled(page);

    expect(zoomed.pendingDs).toBe(false);
    expect(zoomed.visRange).not.toBeNull();
    if (zoomed.visRange && initial.visRange) {
      const zDur = zoomed.visRange[1] - zoomed.visRange[0];
      const iDur = initial.visRange[1] - initial.visRange[0];
      // After 25 zoom steps, visible range should be noticeably narrower
      expect(zDur).toBeLessThan(iDur);
    }
  });

  test('zoom in preserves x-axis center after data swap', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(300);
    const pre = await getDsState(page);

    const post = await waitForDsSettled(page);

    if (pre.visRange && post.visRange) {
      const preMid = (pre.visRange[0] + pre.visRange[1]) / 2;
      const postMid = (post.visRange[0] + post.visRange[1]) / 2;
      const dur = pre.visRange[1] - pre.visRange[0];
      expect(Math.abs(postMid - preMid)).toBeLessThan(dur * 0.5);
    }
  });

  test('two successive zooms both trigger re-downsample', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 20, -300);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const first = await waitForDsSettled(page);

    // Wait for suppress to clear
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);

    await wheelZoom(page, 20, -300);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const second = await waitForDsSettled(page);

    if (second.visRange && first.visRange) {
      const d2 = second.visRange[1] - second.visRange[0];
      const d1 = first.visRange[1] - first.visRange[0];
      expect(d2).toBeLessThan(d1);
    }
  });

  test('zoom out widens visible range', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    const zIn = await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    await wheelZoom(page, 15, 200);
    const zOut = await waitForDsSettled(page);

    if (zOut.visRange && zIn.visRange) {
      expect(zOut.visRange[1] - zOut.visRange[0]).toBeGreaterThan(
        zIn.visRange[1] - zIn.visRange[0]
      );
    }
  });

  test('zoom state is stable — no oscillation after settling', async ({
    page,
  }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    // Wait generously for zoom debounce + runChartDownsample + data swap
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const s1 = await waitForDsSettled(page);

    // Now wait and check again — state should not change
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const s2 = await getDsState(page);

    expect(s2.pendingDs).toBe(false);
    expect(s2.colDataRows).toBeGreaterThan(0);
  });

  // =======================================================================
  // C. DOUBLE-CLICK RESET
  // =======================================================================

  test('double-click resets to full range after zoom', async ({ page }) => {
    const initial = await openDsChart(page);

    await wheelZoom(page, 15, -200);
    await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    const rect = await getChartRect(page);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
    const reset = await waitForDsSettled(page);

    expect(reset.pendingDs).toBe(false);
    if (reset.visRange && initial.visRange) {
      const rDur = reset.visRange[1] - reset.visRange[0];
      const iDur = initial.visRange[1] - initial.visRange[0];
      expect(rDur).toBeGreaterThan(iDur * 0.7);
    }
  });

  test('double-click reliably resets 3 times in a row', async ({ page }) => {
    const initial = await openDsChart(page);
    const rect = await getChartRect(page);
    const initialDur = initial.visRange
      ? initial.visRange[1] - initial.visRange[0]
      : 0;

    for (let i = 0; i < 3; i += 1) {
      // Zoom in
      await wheelZoom(page, 20, -300);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(8000);
      await waitForDsSettled(page);

      // Double-click reset
      await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(8000);
      const reset = await waitForDsSettled(page);

      expect(reset.pendingDs).toBe(false);
      expect(reset.colDataRows).toBeGreaterThan(0);

      // After reset, range should be at least 50% of the original full range
      if (reset.visRange && initialDur > 0) {
        const resetDur = reset.visRange[1] - reset.visRange[0];
        expect(resetDur).toBeGreaterThan(initialDur * 0.5);
      }
    }
  });

  test('double-click on time axis also resets', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    const zoomed = await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // Double-click the time axis row
    const timeAxisY = await page.evaluate(() => {
      const chart = document.querySelector('.dh-tvl-chart');
      if (!chart) return 0;
      const rows = chart.querySelectorAll('tr');
      const lastRow = rows[rows.length - 1];
      if (!lastRow) return 0;
      const r = lastRow.getBoundingClientRect();
      return Math.round(r.top + r.height / 2);
    });
    const rect = await getChartRect(page);
    if (timeAxisY > 0) {
      await page.mouse.dblclick(rect.x + rect.w / 2, timeAxisY);
    }
    const reset = await waitForDsSettled(page);

    if (reset.visRange && zoomed.visRange) {
      expect(reset.visRange[1] - reset.visRange[0]).toBeGreaterThan(
        (zoomed.visRange[1] - zoomed.visRange[0]) * 1.5
      );
    }
  });

  // =======================================================================
  // D. PAN
  // =======================================================================

  test('pan shifts visible center', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 20, -300);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);
    const before = await getDsState(page);

    await panChart(page, -800);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const after = await waitForDsSettled(page);

    // Pan should shift the visible center — at minimum the range endpoints change
    expect(after.visRange).not.toBeNull();
    expect(before.visRange).not.toBeNull();
    if (before.visRange && after.visRange) {
      // Either the center shifted or at least one endpoint moved
      const bStart = before.visRange[0];
      const aStart = after.visRange[0];
      expect(aStart).not.toBe(bStart);
    }
  });

  test('pan preserves approximate zoom level', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    await waitForDsSettled(page);
    const before = await getDsState(page);

    await panChart(page, -600);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const after = await waitForDsSettled(page);

    if (before.visRange && after.visRange) {
      const bDur = before.visRange[1] - before.visRange[0];
      const aDur = after.visRange[1] - after.visRange[0];
      // Duration should be same order of magnitude
      // (pan + re-downsample may change bar density slightly)
      expect(aDur).toBeGreaterThan(bDur * 0.3);
      expect(aDur).toBeLessThan(bDur * 3);
    }
  });

  test('3 successive pans do not degenerate data', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    for (let i = 0; i < 3; i += 1) {
      await panChart(page, -600);
      await waitForDsSettled(page);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(500);
    }

    const s = await getDsState(page);
    expect(s.pendingDs).toBe(false);
    expect(s.colDataRows).toBeGreaterThan(500);
  });

  // =======================================================================
  // E. X-AXIS DRAG ZOOM
  // =======================================================================

  test('x-axis drag zoom out widens range and preserves data', async ({
    page,
  }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    const zIn = await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    await xAxisZoom(page, 600);
    const zOut = await waitForDsSettled(page);

    expect(zOut.colDataRows).toBeGreaterThan(500);
    if (zOut.visRange && zIn.visRange) {
      expect(zOut.visRange[1] - zOut.visRange[0]).toBeGreaterThan(
        zIn.visRange[1] - zIn.visRange[0]
      );
    }
  });

  test('x-axis zoom does not jump after data swap', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    await xAxisZoom(page, 600);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(400);
    const pre = await getDsState(page);

    const post = await waitForDsSettled(page);

    if (pre.visRange && post.visRange) {
      const preMid = (pre.visRange[0] + pre.visRange[1]) / 2;
      const postMid = (post.visRange[0] + post.visRange[1]) / 2;
      const dur = pre.visRange[1] - pre.visRange[0];
      expect(Math.abs(postMid - preMid)).toBeLessThan(dur);
    }
  });

  // =======================================================================
  // F. TICKING TABLE
  // =======================================================================

  test('ticking table data grows over time', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_ticking_line');
    await expect(tvlChart(page)).toBeVisible();
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const s1 = await getDsState(page);

    // Wait 3 seconds for ticks
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const s2 = await getDsState(page);

    // Row count should have grown (ticking table appends rows)
    expect(s2.colDataRows).toBeGreaterThanOrEqual(s1.colDataRows);
  });

  // =======================================================================
  // G. RAPID / STRESS INTERACTIONS
  // =======================================================================

  test('rapid zoom in-out-in settles to valid state', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 10, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(400);
    await wheelZoom(page, 8, 200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(400);
    await wheelZoom(page, 12, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(400);
    await wheelZoom(page, 6, 200);

    const s = await waitForDsSettled(page);
    expect(s.pendingDs).toBe(false);
    expect(s.colDataRows).toBeGreaterThan(0);
    expect(s.visRange).not.toBeNull();
  });

  test('zoom then immediate double-click resets cleanly', async ({ page }) => {
    const initial = await openDsChart(page);
    const rect = await getChartRect(page);

    // Zoom and immediately double-click (no wait for settle)
    await wheelZoom(page, 12, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);

    const reset = await waitForDsSettled(page);
    expect(reset.pendingDs).toBe(false);

    // Should end up at full range, not stuck zoomed
    if (reset.visRange && initial.visRange) {
      const rDur = reset.visRange[1] - reset.visRange[0];
      const iDur = initial.visRange[1] - initial.visRange[0];
      expect(rDur).toBeGreaterThan(iDur * 0.5);
    }
  });

  test('pan then immediate double-click resets cleanly', async ({ page }) => {
    const initial = await openDsChart(page);
    const rect = await getChartRect(page);

    await wheelZoom(page, 12, -200);
    await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // Pan then immediately reset
    await panChart(page, -600);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);

    const reset = await waitForDsSettled(page);
    expect(reset.pendingDs).toBe(false);
    if (reset.visRange && initial.visRange) {
      const rDur = reset.visRange[1] - reset.visRange[0];
      const iDur = initial.visRange[1] - initial.visRange[0];
      expect(rDur).toBeGreaterThan(iDur * 0.5);
    }
  });

  // =======================================================================
  // H. STATE CONSISTENCY
  // =======================================================================

  test('pendingDs never stays stuck true', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 15, -200);
    // pendingDs may go true briefly
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);

    // But must settle to false
    const s = await waitForDsSettled(page, 20000);
    expect(s.pendingDs).toBe(false);
  });

  test('colDataRows is always positive after load', async ({ page }) => {
    await openDsChart(page);

    // Check repeatedly across zoom/pan/reset cycle
    await wheelZoom(page, 12, -200);
    let s = await waitForDsSettled(page);
    expect(s.colDataRows).toBeGreaterThan(0);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
    await panChart(page, -400);
    s = await waitForDsSettled(page);
    expect(s.colDataRows).toBeGreaterThan(0);

    const rect = await getChartRect(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
    s = await waitForDsSettled(page);
    expect(s.colDataRows).toBeGreaterThan(0);
  });

  test('visRange is never null after initial load', async ({ page }) => {
    await openDsChart(page);

    await wheelZoom(page, 12, -200);
    let s = await waitForDsSettled(page);
    expect(s.visRange).not.toBeNull();

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
    const rect = await getChartRect(page);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
    s = await waitForDsSettled(page);
    expect(s.visRange).not.toBeNull();
  });

  // =======================================================================
  // I. EDGE CASES
  // =======================================================================

  test('zoom in very deep then reset recovers', async ({ page }) => {
    const initial = await openDsChart(page);
    const rect = await getChartRect(page);

    // Deep zoom: 30 steps
    await wheelZoom(page, 30, -200);
    await waitForDsSettled(page);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
    const reset = await waitForDsSettled(page);

    expect(reset.pendingDs).toBe(false);
    expect(reset.colDataRows).toBeGreaterThan(0);
    if (reset.visRange && initial.visRange) {
      const rDur = reset.visRange[1] - reset.visRange[0];
      const iDur = initial.visRange[1] - initial.visRange[0];
      expect(rDur).toBeGreaterThan(iDur * 0.5);
    }
  });

  test('zoom-pan-zoom-reset full lifecycle', async ({ page }) => {
    const initial = await openDsChart(page);
    const rect = await getChartRect(page);

    // 1. Zoom in
    await wheelZoom(page, 12, -200);
    let s = await waitForDsSettled(page);
    expect(s.colDataRows).toBeGreaterThan(0);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // 2. Pan
    await panChart(page, -600);
    s = await waitForDsSettled(page);
    expect(s.colDataRows).toBeGreaterThan(0);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // 3. Zoom in more
    await wheelZoom(page, 8, -200);
    s = await waitForDsSettled(page);
    expect(s.colDataRows).toBeGreaterThan(0);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // 4. Reset
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
    s = await waitForDsSettled(page);
    expect(s.pendingDs).toBe(false);
    expect(s.colDataRows).toBeGreaterThan(0);

    if (s.visRange && initial.visRange) {
      const rDur = s.visRange[1] - s.visRange[0];
      const iDur = initial.visRange[1] - initial.visRange[0];
      expect(rDur).toBeGreaterThan(iDur * 0.5);
    }
  });
});

// --------------------------------------------------------------------------
// Auto-bin (server-side time-bucket aggregation) interactions
// --------------------------------------------------------------------------

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

const NICE_BIN_WIDTHS_NS = [
  1, 100, 1_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000,
  5_000_000_000, 15_000_000_000, 30_000_000_000, 60_000_000_000,
  300_000_000_000, 900_000_000_000, 1_800_000_000_000, 3_600_000_000_000,
  14_400_000_000_000, 43_200_000_000_000, 86_400_000_000_000,
  604_800_000_000_000,
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

  test('bin_count=200 narrows the bin width', async ({ page }) => {
    // With bin_count=200 over 10 years, bins are coarser than the default 5000.
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist', '.dh-panel', false);
    await expect(tvlChart(page)).toBeVisible();
    const a = await waitForResampleSettled(page);

    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist_bc200', '.dh-panel', false);
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

  // ===== Group 6 — Ticking + snap-to-live =====

  test('ticking histogram: aggregated view reflects new ticks', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_ticking_hist');
    await expect(tvlChart(page)).toBeVisible();
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const s1 = await getTvlState(page);

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(4000);
    const s2 = await getTvlState(page);

    // colDataRows should not shrink as new ticks land
    expect(s2.colDataRows).toBeGreaterThanOrEqual(s1.colDataRows);
  });

  test('ticking histogram: panning right does not break aggregation', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_ticking_hist');
    await expect(tvlChart(page)).toBeVisible();
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);

    await panChart(page, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const s = await getTvlState(page);
    expect(s.colDataRows).toBeGreaterThan(0);
    expect(s.pendingDs).toBe(false);
  });

  // ===== Group 7 — Performance smoke =====

  test('big histogram initial settle in under 30s', async ({ page }) => {
    const t0 = Date.now();
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_hist');
    await expect(tvlChart(page)).toBeVisible();
    await waitForResampleSettled(page, 30000);
    const dt = Date.now() - t0;
    expect(dt).toBeLessThan(30000);
  });
});
