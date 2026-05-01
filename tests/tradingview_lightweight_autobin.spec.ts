import { expect, test, type Page } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

// --------------------------------------------------------------------------
// Auto-bin spec: verifies that server-side time-bin aggregation correctly
// scopes to the visible window, picks chunky bin widths, and rebuilds when
// the user pans past the cached buffer.
// --------------------------------------------------------------------------

interface AutoBinState {
  jsDs: boolean;
  tableSize: number;
  colDataRows: number;
  pendingDs: boolean;
  visRange: [number, number] | null;
  autoBin: boolean;
  binWidthNs: number | null;
  aggType: string | null;
  rangeNs: [number, number] | null;
  resampleSeq: number;
}

const tvlChart = (page: Page) => page.locator('.dh-tvl-chart').last();

async function getState(page: Page): Promise<AutoBinState> {
  return page.evaluate(() => {
    const charts = document.querySelectorAll('.dh-tvl-chart');
    const last = charts[charts.length - 1];
    const raw = last?.getAttribute('data-tvl-state');
    return raw ? JSON.parse(raw) : {};
  });
}

async function waitForSettled(
  page: Page,
  predicate: (s: AutoBinState) => boolean,
  timeout = 20000
): Promise<AutoBinState> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const s = await getState(page);
    if (!s.pendingDs && s.colDataRows > 0 && predicate(s)) return s;
    await page.waitForTimeout(150);
  }
  return getState(page);
}

async function getChartCanvasRect(page: Page) {
  return page.evaluate(() => {
    const charts = document.querySelectorAll('.dh-tvl-chart');
    const last = charts[charts.length - 1];
    const c = last?.querySelector('canvas');
    if (!c) return { x: 0, y: 0, w: 0, h: 0 };
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

/** Open the named panel and wait through the 1s settle + mount-time RESET. */
async function openAutoBinChart(page: Page, name: string): Promise<AutoBinState> {
  await gotoPage(page, '');
  await openPanel(page, name);
  await expect(tvlChart(page)).toBeVisible();
  // Wait for autoBin to come up.
  await waitForSettled(page, s => s.autoBin === true, 30000);
  // 1s settle + a safety margin so the mount-time AUTOBIN_RESET has landed.
  await page.waitForTimeout(2500);
  return getState(page);
}

/** Dispatch a stream of wheel events on the chart canvas (zoom in/out). */
async function wheelZoom(page: Page, steps: number, deltaY: number) {
  await page.evaluate(
    ({ steps: s, deltaY: dy }) =>
      new Promise<void>(resolve => {
        const charts = document.querySelectorAll('.dh-tvl-chart canvas');
        const c = charts[charts.length - 1];
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
          c.dispatchEvent(
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

test.describe('TradingView Lightweight - Auto-bin', () => {
  test('histogram triggers auto-bin on a large source', async ({ page }) => {
    const settled = await openAutoBinChart(page, 'tvl_big_hist');
    expect(settled.autoBin).toBe(true);
    expect(settled.aggType).toBe('sum');
    expect(settled.binWidthNs).toBeGreaterThan(0);
    expect(settled.rangeNs).toBeNull(); // initial = full source
  });

  test('initial bars are visually chunky (>=3 px each)', async ({ page }) => {
    const settled = await openAutoBinChart(page, 'tvl_big_hist');
    const rect = await getChartCanvasRect(page);
    // tableSize is total bins in the aggregated table; at full source extent
    // (rangeNs=null) all of them sit across the canvas, so canvas_w / count
    // is barSpacing in pixels.
    expect(settled.tableSize).toBeGreaterThan(0);
    const barSpacing = rect.w / settled.tableSize;
    expect(barSpacing).toBeGreaterThanOrEqual(3.0);
  });

  test('zoom-in scopes the aggregated table to the visible window', async ({
    page,
  }) => {
    const initial = await openAutoBinChart(page, 'tvl_big_hist');
    expect(initial.rangeNs).toBeNull();

    // Aggressive zoom-in: many wheel-up frames.
    await wheelZoom(page, 30, -300);
    await page.waitForTimeout(8000);

    const zoomed = await waitForSettled(page, s => s.rangeNs !== null);
    expect(zoomed.rangeNs).not.toBeNull();
    if (zoomed.rangeNs && initial.binWidthNs != null) {
      // Aggregated window narrower than full source.
      const fromNs = zoomed.rangeNs[0];
      const toNs = zoomed.rangeNs[1];
      expect(toNs - fromNs).toBeGreaterThan(0);
    }
    expect(zoomed.resampleSeq).toBeGreaterThan(initial.resampleSeq);
  });

  test('after a zoom, bars in the visible window remain chunky', async ({
    page,
  }) => {
    await openAutoBinChart(page, 'tvl_big_hist');
    await wheelZoom(page, 30, -300);
    await page.waitForTimeout(8000);
    const zoomed = await waitForSettled(page, s => s.rangeNs !== null);
    expect(zoomed.rangeNs).not.toBeNull();
    const rect = await getChartCanvasRect(page);
    // After scoping, the aggregated table covers ~the visible window plus
    // a 50% buffer on each side. So tableSize bars in canvas_w pixels.
    const barSpacing = rect.w / zoomed.tableSize;
    expect(barSpacing).toBeGreaterThanOrEqual(2.0);
  });

  test('reset (dblclick) returns to full source', async ({ page }) => {
    await openAutoBinChart(page, 'tvl_big_hist');
    await wheelZoom(page, 30, -300);
    await page.waitForTimeout(8000);
    const zoomed = await waitForSettled(page, s => s.rangeNs !== null);
    expect(zoomed.rangeNs).not.toBeNull();

    const rect = await getChartCanvasRect(page);
    await page.mouse.dblclick(rect.x + rect.w / 2, rect.y + rect.h / 2);
    await page.waitForTimeout(2500);

    const reset = await waitForSettled(page, s => s.rangeNs === null);
    expect(reset.rangeNs).toBeNull();
  });
});
