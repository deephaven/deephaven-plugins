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
  pythonDs: boolean;
  fullRange: [number, number] | null;
  tableSize: number;
  colDataRows: number;
  pendingDs: boolean;
  viewport: [number, number] | null;
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

/** Wait until pendingDs is false and colDataRows > 0. */
async function waitForDsReady(page: import('@playwright/test').Page, timeout = 15000): Promise<DsState> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const state = await getDsState(page);
    if (state.pythonDs && !state.pendingDs && state.colDataRows > 0) {
      return state;
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(200);
  }
  // Return whatever we have — test assertions will catch issues
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
        state.colDataRows !== prev.colDataRows ||
        JSON.stringify(state.viewport) !== JSON.stringify(prev.viewport))
    ) {
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
  // Longer timeout for downsample round-trips
  test.setTimeout(120_000);

  /** Open the big chart and wait for initial load + settle. */
  async function openBigChart(page: import('@playwright/test').Page): Promise<DsState> {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_line');
    await expect(tvlChart(page)).toBeVisible();
    const state = await waitForDsReady(page);
    // Wait for the 1s settle timer to fire so the handler is active
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1500);
    return state;
  }

  test('initial load shows full range downsampled', async ({ page }) => {
    const state = await openBigChart(page);
    expect(state.pythonDs).toBe(true);
    // Background only: ~1000 bins → ~2000-3000 rows (min/max per bin)
    expect(state.tableSize).toBeGreaterThan(1000);
    expect(state.tableSize).toBeLessThan(5000);
    expect(state.colDataRows).toBeGreaterThan(1000);
    expect(state.pendingDs).toBe(false);
    // Viewport should cover the full table
    expect(state.viewport).not.toBeNull();
    if (state.viewport) {
      expect(state.viewport[0]).toBe(0);
      expect(state.viewport[1]).toBe(state.tableSize - 1);
    }
    // Full range metadata should span ~10 years
    expect(state.fullRange).not.toBeNull();
    if (state.fullRange) {
      const fullDays = (state.fullRange[1] - state.fullRange[0]) / 86400;
      expect(fullDays).toBeGreaterThan(3000);
    }
  });

  test('zoom in re-downsamples at higher resolution', async ({ page }) => {
    const initial = await openBigChart(page);

    // Zoom in
    await wheelZoom(page, 15, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const zoomed = await getDsState(page);

    expect(zoomed.pendingDs).toBe(false);
    // Hybrid merge: background + foreground = ~6000+ rows
    expect(zoomed.tableSize).toBeGreaterThan(initial.tableSize);
    expect(zoomed.colDataRows).toBeGreaterThan(3000);
    // Visible range should be narrower than the full source range
    if (zoomed.visRange && zoomed.fullRange) {
      const zoomDur = zoomed.visRange[1] - zoomed.visRange[0];
      const fullDur = zoomed.fullRange[1] - zoomed.fullRange[0];
      expect(zoomDur).toBeLessThan(fullDur * 0.5);
    }
  });

  test('zoom in does not wiggle', async ({ page }) => {
    await openBigChart(page);

    // Zoom in
    await wheelZoom(page, 15, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const s1 = await getDsState(page);

    // Wait and check again — should be identical (no oscillation)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const s2 = await getDsState(page);

    expect(s1.tableSize).toBe(s2.tableSize);
    expect(s1.colDataRows).toBe(s2.colDataRows);
    expect(s1.pendingDs).toBe(false);
    expect(s2.pendingDs).toBe(false);
  });

  test('zoom out re-downsamples at lower resolution', async ({ page }) => {
    const initial = await openBigChart(page);

    // Zoom in first
    await wheelZoom(page, 15, -200);
    const zoomedIn = await waitForStateChange(page, initial);
    // Wait for suppress to clear before next interaction
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // Now zoom out
    await wheelZoom(page, 15, 200);
    const zoomedOut = await waitForStateChange(page, zoomedIn);

    expect(zoomedOut.pendingDs).toBe(false);
    // Visible range should be wider
    if (zoomedOut.visRange && zoomedIn.visRange) {
      const outDur = zoomedOut.visRange[1] - zoomedOut.visRange[0];
      const inDur = zoomedIn.visRange[1] - zoomedIn.visRange[0];
      expect(outDur).toBeGreaterThan(inDur);
    }
  });

  test('zoom in then zoom out round-trip', async ({ page }) => {
    const initial = await openBigChart(page);

    // Deep zoom in
    await wheelZoom(page, 20, -200);
    await waitForStateChange(page, initial);

    // Zoom back out to near-original range
    await wheelZoom(page, 25, 200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const restored = await getDsState(page);

    expect(restored.pendingDs).toBe(false);
    // Visible range should be wider than the deep-zoomed state
    if (restored.visRange) {
      const restoredDays = (restored.visRange[1] - restored.visRange[0]) / 86400;
      expect(restoredDays).toBeGreaterThan(10);
    }
  });

  test('pan re-downsamples with shifted foreground', async ({ page }) => {
    const initial = await openBigChart(page);

    // Zoom in first
    await wheelZoom(page, 15, -200);
    const zoomed = await waitForStateChange(page, initial);

    // Pan left (drag right-to-left, showing later dates)
    await panChart(page, -800);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const panned = await getDsState(page);

    // Hybrid: pan triggers ZOOM with shifted foreground
    expect(panned.colDataRows).toBeGreaterThan(1000);
    expect(panned.pendingDs).toBe(false);
    // Data should still cover full range (background always present)
    expect(panned.tableSize).toBeGreaterThan(1000);
  });

  test('repeated pan does not collapse to single point', async ({ page }) => {
    const initial = await openBigChart(page);

    // Deep zoom in
    await wheelZoom(page, 20, -200);
    const zoomed = await waitForStateChange(page, initial);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // Record the zoomed-in state before panning
    const beforePan = await getDsState(page);
    const beforeMid = beforePan.visRange
      ? (beforePan.visRange[0] + beforePan.visRange[1]) / 2
      : 0;

    // Pan left many times — each pan from deep zoom triggers a ZOOM
    // (re-downsample) since the viewport covers the full table.
    for (let i = 0; i < 5; i += 1) {
      await panChart(page, -800);
      // Wait for the ZOOM round-trip + suppress to clear
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(4000);
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);
    const state = await getDsState(page);

    // Must not degenerate — should still have substantial data
    expect(state.colDataRows).toBeGreaterThan(1000);
    expect(state.pendingDs).toBe(false);
    // visRange must not have collapsed to near-zero
    if (state.visRange) {
      const durationDays = (state.visRange[1] - state.visRange[0]) / 86400;
      // After deep zoom, visible range is small (~0.06 days).
      // Just verify it hasn't collapsed to essentially zero.
      expect(durationDays).toBeGreaterThan(0.01);

      // Verify the center has shifted (proving pan actually moved)
      const afterMid = (state.visRange[0] + state.visRange[1]) / 2;
      if (beforeMid > 0) {
        expect(afterMid).not.toBeCloseTo(beforeMid, -1);
      }
    }
  });

  test('x-axis drag zoom out re-downsamples and fills data', async ({ page }) => {
    const initial = await openBigChart(page);

    // Zoom in first
    await wheelZoom(page, 15, -200);
    const zoomed = await waitForStateChange(page, initial);
    expect(zoomed.tableSize).toBeGreaterThan(initial.tableSize);

    // X-axis drag right = zoom out
    await xAxisZoom(page, 600);
    const xZoomed = await waitForStateChange(page, zoomed);

    expect(xZoomed.pendingDs).toBe(false);
    expect(xZoomed.colDataRows).toBeGreaterThan(1000);
    // Visible range should be wider than zoomed-in state
    if (xZoomed.visRange && zoomed.visRange) {
      const xDur = xZoomed.visRange[1] - xZoomed.visRange[0];
      const zDur = zoomed.visRange[1] - zoomed.visRange[0];
      expect(xDur).toBeGreaterThan(zDur);
    }
  });

  test('double-click resets to full range', async ({ page }) => {
    const initial = await openBigChart(page);

    // Zoom in
    await wheelZoom(page, 15, -200);
    const zoomed = await waitForStateChange(page, initial);
    expect(zoomed.tableSize).toBeGreaterThan(initial.tableSize);

    // Double-click on chart
    const rect = await getChartRect(page);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const reset = await getDsState(page);

    // Should be back to approximately the initial state (background only)
    expect(reset.pendingDs).toBe(false);
    // Table should be background size (smaller than zoomed hybrid)
    expect(reset.tableSize).toBeLessThan(zoomed.tableSize);
    expect(reset.colDataRows).toBeGreaterThan(500);
  });

  // -----------------------------------------------------------------------
  // Adversarial tests: try to break things
  // -----------------------------------------------------------------------

  test('x-axis zoom out preserves visible range after data arrives', async ({ page }) => {
    // Bug scenario: x-axis drag zoom out, release mouse, data arrives
    // and the visible range jumps to something completely different.
    const initial = await openBigChart(page);

    // Zoom in
    await wheelZoom(page, 15, -200);
    const zoomed = await waitForStateChange(page, initial);

    // X-axis drag zoom out
    await xAxisZoom(page, 600);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000);

    // Capture the visible range RIGHT NOW (what the user sees)
    const stateBeforeResponse = await getDsState(page);
    const visBefore = stateBeforeResponse.visRange;

    // Wait for the ZOOM response to arrive and data to settle
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const stateAfter = await getDsState(page);
    const visAfter = stateAfter.visRange;

    // The visible range after data arrives should be CLOSE to what it
    // was before (not jump to a completely different range).
    if (visBefore && visAfter) {
      const beforeDur = visBefore[1] - visBefore[0];
      const afterDur = visAfter[1] - visAfter[0];
      const beforeMid = (visBefore[0] + visBefore[1]) / 2;
      const afterMid = (visAfter[0] + visAfter[1]) / 2;

      // Duration should not change by more than 3x
      expect(afterDur).toBeGreaterThan(beforeDur / 3);
      expect(afterDur).toBeLessThan(beforeDur * 3);

      // Center should not shift by more than the duration
      expect(Math.abs(afterMid - beforeMid)).toBeLessThan(
        Math.max(beforeDur, afterDur)
      );
    }
    expect(stateAfter.colDataRows).toBeGreaterThan(1000);
  });

  test.skip('rapid zoom in-out-in does not leave chart broken', async ({ page }) => {
    await openBigChart(page);

    // Rapid alternating zoom: in, out, in, out
    await wheelZoom(page, 10, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
    await wheelZoom(page, 8, 200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
    await wheelZoom(page, 12, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);
    await wheelZoom(page, 6, 200);

    // Wait for everything to settle
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const state = await getDsState(page);

    expect(state.pendingDs).toBe(false);
    expect(state.colDataRows).toBeGreaterThan(1000);
    expect(state.tableSize).toBeGreaterThan(0);
    if (state.visRange) {
      const dur = state.visRange[1] - state.visRange[0];
      expect(dur).toBeGreaterThan(86400); // > 1 day
    }
  });

  test.skip('deep zoom then x-axis zoom out covers the visible area', async ({ page }) => {
    // Reproduce: zoom in very deeply, then x-axis zoom out — data
    // should fill the widened visible area, not leave empty gaps.
    await openBigChart(page);

    // Ultra deep zoom
    await wheelZoom(page, 30, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const deep = await getDsState(page);

    // X-axis zoom out significantly
    await xAxisZoom(page, 800);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(8000);
    const afterXZoom = await getDsState(page);

    // Must have been re-downsampled
    expect(afterXZoom.tableSize).not.toBe(deep.tableSize);
    expect(afterXZoom.colDataRows).toBeGreaterThan(1000);
    // Visible range wider than deep zoom
    if (afterXZoom.visRange && deep.visRange) {
      const afterDur = afterXZoom.visRange[1] - afterXZoom.visRange[0];
      const deepDur = deep.visRange[1] - deep.visRange[0];
      expect(afterDur).toBeGreaterThan(deepDur * 2);
    }
  });

  test.skip('zoom in then pan to edge of table does not crash', async ({ page }) => {
    await openBigChart(page);

    // Zoom in to ~2 months
    await wheelZoom(page, 12, -200);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);

    // Pan aggressively right — each pan may trigger ZOOM from deep zoom
    for (let i = 0; i < 8; i += 1) {
      await panChart(page, -800);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(3000);
    }

    // Pan back left
    for (let i = 0; i < 8; i += 1) {
      await panChart(page, 800);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(3000);
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const state = await getDsState(page);

    expect(state.pendingDs).toBe(false);
    expect(state.colDataRows).toBeGreaterThan(500);
    if (state.visRange) {
      const dur = (state.visRange[1] - state.visRange[0]) / 86400;
      expect(dur).toBeGreaterThan(1);
    }
  });

  test.skip('x-axis zoom in then x-axis zoom out round-trip', async ({ page }) => {
    const initial = await openBigChart(page);

    // X-axis drag LEFT = zoom in
    await xAxisZoom(page, -400);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const zoomedIn = await getDsState(page);

    // X-axis drag RIGHT = zoom out
    await xAxisZoom(page, 600);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(5000);
    const zoomedOut = await getDsState(page);

    expect(zoomedOut.pendingDs).toBe(false);
    expect(zoomedOut.colDataRows).toBeGreaterThan(1000);
    if (zoomedOut.visRange && zoomedIn.visRange) {
      const outDur = zoomedOut.visRange[1] - zoomedOut.visRange[0];
      const inDur = zoomedIn.visRange[1] - zoomedIn.visRange[0];
      expect(outDur).toBeGreaterThan(inDur);
    }
  });
});

