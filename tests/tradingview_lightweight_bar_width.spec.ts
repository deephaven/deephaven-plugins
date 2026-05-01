/**
 * Diagnostic spec: figure out what conditions produce visually fat
 * histogram bars vs 1-pixel slivers in LWC v5.
 *
 * Each test loads a different fixture, then reads the canvas pixel data
 * to measure the median rendered bar width (run-length of bright green
 * columns). The point is to test hypotheses, not just assert success.
 */
import { expect, test, type Page } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

interface BarStats {
  canvasW: number;
  canvasH: number;
  barCount: number;
  medianBarWidth: number;
  meanBarWidth: number;
  medianGap: number;
  visLogical: { from: number; to: number } | null;
  barSpacing: number;
  seriesDataLen: number;
}

async function measureHistogramBars(
  page: Page,
  panelTitle: string
): Promise<BarStats> {
  return page.evaluate(name => {
    const charts = document.querySelectorAll('.dh-tvl-chart');
    let chart: Element | null = null;
    for (const c of charts) {
      let p: Element | null = c;
      while (p && !p.classList?.contains('lm_item')) {
        p = p.parentElement;
      }
      const t = p?.querySelector('.lm_title')?.textContent;
      if (t && t.trim() === name) {
        chart = c;
        break;
      }
    }
    if (!chart) {
      throw new Error(`panel not found: ${name}`);
    }

    // Find the canvas with the most green pixels (= histogram pane).
    const canvases = chart.querySelectorAll('canvas');
    let target: HTMLCanvasElement | null = null;
    let maxGreen = 0;
    for (const c of canvases) {
      const cv = c as HTMLCanvasElement;
      if (cv.width <= 200 || cv.height < 30) continue;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;
      // Sample one row near the bottom 20%
      const y = Math.floor(cv.height * 0.8);
      let greenCount = 0;
      try {
        const img = ctx.getImageData(0, y, cv.width, 1);
        for (let x = 0; x < cv.width; x++) {
          if (img.data[x * 4 + 1] >= 150) greenCount++;
        }
      } catch {
        continue;
      }
      if (greenCount > maxGreen) {
        maxGreen = greenCount;
        target = cv;
      }
    }
    if (!target) {
      throw new Error(`no canvas with green pixels found (canvases: ${canvases.length})`);
    }

    const ctx = target.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('no ctx');
    }
    const w = target.width;
    const h = target.height;

    // Bars are vertical green strokes. Sample a y where most bars are likely
    // present (~20% from the bottom of the canvas).
    const y = Math.floor(h * 0.8);
    const img = ctx.getImageData(0, y, w, 1);

    // Bright = green channel >= 150 (the histogram color is [155,217,108]).
    const widths: number[] = [];
    const gaps: number[] = [];
    let runStart = -1;
    let lastEnd = -1;
    for (let x = 0; x <= w; x++) {
      const idx = x < w ? x * 4 : -1;
      const green = idx >= 0 ? img.data[idx + 1] : 0;
      const isBar = green >= 150;
      if (isBar && runStart < 0) {
        runStart = x;
        if (lastEnd >= 0) gaps.push(x - lastEnd);
      } else if (!isBar && runStart >= 0) {
        widths.push(x - runStart);
        lastEnd = x;
        runStart = -1;
      }
    }
    widths.sort((a, b) => a - b);
    gaps.sort((a, b) => a - b);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reg = (globalThis as any).__tvl_charts ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matched: any = null;
    for (const c of reg) {
      const t = c?.container?.parentElement;
      if (t?.querySelector?.('.lm_title')?.textContent?.trim() === name) {
        matched = c;
        break;
      }
    }
    let visLogical: { from: number; to: number } | null = null;
    let barSpacing = 0;
    let seriesDataLen = 0;
    try {
      const ts = matched?.renderer?.getChart()?.timeScale();
      visLogical = ts?.getVisibleLogicalRange() ?? null;
      barSpacing = ts?.options()?.barSpacing ?? 0;
      const sm = matched?.renderer?.seriesMap;
      if (sm) {
        for (const s of sm.values()) {
          const d = s.data();
          if (d.length > seriesDataLen) seriesDataLen = d.length;
        }
      }
    } catch {
      /* ignore */
    }

    return {
      canvasW: w,
      canvasH: h,
      barCount: widths.length,
      medianBarWidth: widths[Math.floor(widths.length / 2)] ?? 0,
      meanBarWidth:
        widths.length > 0
          ? widths.reduce((s, v) => s + v, 0) / widths.length
          : 0,
      medianGap: gaps[Math.floor(gaps.length / 2)] ?? 0,
      visLogical,
      barSpacing,
      seriesDataLen,
    };
  }, panelTitle);
}

async function waitForBars(
  page: Page,
  panelTitle: string,
  timeout = 30000
): Promise<BarStats> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const s = await measureHistogramBars(page, panelTitle);
      if (s.barCount > 0) return s;
    } catch {
      /* not ready */
    }
    await page.waitForTimeout(200);
  }
  return measureHistogramBars(page, panelTitle);
}

// Hypothesis 1: A solo histogram with low bin count will render fat bars.
// This is the CONTROL — establishes what "fat" looks like in our environment.
test('H1: solo histogram, ~10 bins on a wide chart renders fat bars', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_histogram');
  // tvl_histogram has 10 rows of static data
  const s = await waitForBars(page, 'tvl_histogram');
  console.log('H1 stats:', JSON.stringify(s));
  expect(s.barCount).toBeGreaterThan(0);
  // Hypothesis: bars >= 4 px wide.
  expect(s.medianBarWidth).toBeGreaterThanOrEqual(4);
});

// Hypothesis 2: A multi-series chart sharing one source table where the
// histogram and line are at the same timestamps still renders fat bars.
test('H2: candlestick + volume histogram (existing fixture) bar width', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_candlestick_with_volume');
  const s = await waitForBars(page, 'tvl_candlestick_with_volume');
  console.log('H2 stats:', JSON.stringify(s));
  // Just collect data — don't assert. The test always passes; we print.
});

// Hypothesis 3: tvl_big_hist (10M-row autobin path) renders fat bars.
test('H3: tvl_big_hist autobin path bar width', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_big_hist');
  await page.waitForTimeout(3000); // settle + mount-time RESET
  const s = await waitForBars(page, 'tvl_big_hist');
  console.log('H3 stats:', JSON.stringify(s));
});

// Hypothesis 4: tvl_mixed_line_hist (line+histogram on big_table, autobin)
// renders fat bars. Same shape as Sizzle Price+Volume but in a single pane.
test('H4: tvl_mixed_line_hist single-pane line+histogram bar width', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_mixed_line_hist');
  await page.waitForTimeout(3000);
  const s = await waitForBars(page, 'tvl_mixed_line_hist');
  console.log('H4 stats:', JSON.stringify(s));
});

// Hypothesis 5: tvl_panes_basic (candlestick + histogram in TWO panes,
// static data) renders fat bars.
test('H5: tvl_panes_basic two-pane chart, static data bar width', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_panes_basic');
  await page.waitForTimeout(3000);
  const s = await waitForBars(page, 'tvl_panes_basic');
  console.log('H5 stats:', JSON.stringify(s));
});

// Hypothesis 6: area + autobin volume histogram in TWO PANES on BIG data.
// This is the exact shape of the failing Sizzle Price+Volume panel.
test('H6: big area+histogram in 2 panes (Sizzle PV shape) bar width', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_big_area_volume_panes');
  await page.waitForTimeout(4000);
  const s = await waitForBars(page, 'tvl_big_area_volume_panes');
  console.log('H6 stats:', JSON.stringify(s));
});

// Hypothesis 7: area + histogram on a FILTERED table (where("Sym=AAPL")).
// Sizzle uses .where() to filter sym_data. This test isolates whether
// .where() vs static raw is what's causing the rendering issue.
test('H7: filtered table area+histogram bar width', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_diag_filtered_panes');
  await page.waitForTimeout(4000);
  const s = await waitForBars(page, 'tvl_diag_filtered_panes');
  console.log('H7 stats:', JSON.stringify(s));
});

// Hypothesis 8: Sizzle dashboard's Price+Volume panel rendered WITHIN
// the dashboard layout. This is the user's actual failing scenario.
test('H8: sizzle dashboard Price+Volume panel bar width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await gotoPage(page, '');
  const appPanels = page.getByRole('button', { name: 'Panels', exact: true });
  await appPanels.click();
  const search = page.getByRole('searchbox', {
    name: 'Find Table, Plot or Widget',
    exact: true,
  });
  await search.fill('sizzle');
  await page.getByRole('button', { name: 'sizzle', exact: true }).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(12000);
  // Take a screenshot for inspection
  await page.screenshot({
    path: '/home/sandbox/deephaven-plugins/plugins/tradingview-lightweight/notes/proof/H8_sizzle_dashboard.png',
    fullPage: false,
  });
  const s = await waitForBars(page, 'Price + Volume');
  console.log('H8 stats:', JSON.stringify(s));
});
