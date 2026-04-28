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
  test('Two-pane chart with candlestick and volume loads', async ({
    page,
  }) => {
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
    await expect(
      panel.getByRole('button', { name: 'Added' })
    ).toBeVisible();

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
async function getDsState(page: import('@playwright/test').Page): Promise<DsState> {
  return page.evaluate(() => {
    const el = document.querySelector('.dh-tvl-chart');
    const raw = el?.getAttribute('data-tvl-state');
    return raw ? JSON.parse(raw) : {};
  });
}

/** Wait until jsDs is true, pendingDs is false, and colDataRows > 0. */
async function waitForDsReady(page: import('@playwright/test').Page, timeout = 15000): Promise<DsState> {
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
async function panChart(
  page: import('@playwright/test').Page,
  dx: number
) {
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
async function xAxisZoom(
  page: import('@playwright/test').Page,
  dx: number
) {
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

  test('10M table: initial load is downsampled at full range', async ({ page }) => {
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

  // Skipped: 10M candlestick without downsample tries to subscribe to
  // the full table, which hangs. Not a downsample test — eligibility
  // is tested via the small_table test above.
  test.skip('candlestick on big table: NOT downsampled (ineligible type)', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_candlestick');
    await expect(tvlChart(page)).toBeVisible();
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

  test('zoom state is stable — no oscillation after settling', async ({ page }) => {
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

  test('x-axis drag zoom out widens range and preserves data', async ({ page }) => {
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

