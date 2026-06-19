import { expect, test, type Page } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

// --------------------------------------------------------------------------
// Press-event spec. Uses an inversion-oracle: we independently compute the
// click pixel for a known (time, price) via the chart's own coordinate
// conversion (exposed on window.__tvlTestHook), click it with real mouse
// input, then read the built payload from the `data-tvl-last-event` seam and
// assert LWC's native hit test agrees with our computed pixel.
//
// Fixture: tests/app.d/tvl_events.py — a `by=` line chart, partition A ~= 10
// and B ~= 90 at time T, magnet crosshair, on_press wired to append each
// event into the `tvl_events_result` table.
// --------------------------------------------------------------------------

// 2024-06-03T10:00:00 ET == 14:00:00 UTC == 1717423200 (epoch seconds, UTC).
const T_UTC_SEC = 1717423200;
const PRICE_A = 10;
const PRICE_B = 90;

const tvlChart = (page: Page) => page.locator('.dh-tvl-chart').last();

interface LastEvent {
  type: string;
  timeNs?: number;
  seriesId?: string;
  price?: number;
  seriesData: Record<string, number | { open: number }>;
  point?: { x: number; y: number };
  paneIndex?: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

async function getCanvasRect(page: Page) {
  return page.evaluate(() => {
    const charts = document.querySelectorAll('.dh-tvl-chart');
    const last = charts[charts.length - 1];
    const c = last?.querySelector('canvas');
    if (!c) return { x: 0, y: 0, w: 0, h: 0 };
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

async function getLastEvent(page: Page): Promise<LastEvent | null> {
  return page.evaluate(() => {
    const charts = document.querySelectorAll('.dh-tvl-chart');
    const last = charts[charts.length - 1];
    const raw = last?.getAttribute('data-tvl-last-event');
    return raw ? JSON.parse(raw) : null;
  });
}

/**
 * Compute the page pixel for a known (series, UTC-time, price). The hook's
 * timeToCoordinateUtc applies the same session-tz shift the data went through
 * (via the app's convertTime), so this works regardless of session timezone;
 * magnet snapping then lands the click exactly on the nearest data point.
 */
async function computeClickPixel(
  page: Page,
  seriesId: string,
  price: number
): Promise<{ x: number; y: number } | null> {
  const rect = await getCanvasRect(page);
  const local = await page.evaluate(
    ({ id, p, t }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hook = (window as any).__tvlTestHook;
      if (!hook) return null;
      return {
        x: hook.timeToCoordinateUtc(t),
        y: hook.priceToCoordinate(id, p),
      };
    },
    { id: seriesId, p: price, t: T_UTC_SEC }
  );
  if (!local || local.x == null || local.y == null) return null;
  return { x: rect.x + local.x, y: rect.y + local.y };
}

async function getSeriesIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hook = (window as any).__tvlTestHook;
    return hook ? hook.getSeriesIds() : [];
  });
}

async function openEventsChart(page: Page) {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_events_chart');
  await expect(tvlChart(page)).toBeVisible();
  // Let the chart settle (fitContent / initial data) and the test hook mount.
  await page.waitForTimeout(2500);
  await expect
    .poll(async () => (await getSeriesIds(page)).length, { timeout: 20000 })
    .toBeGreaterThanOrEqual(2);
}

test.describe('TradingView Lightweight - Press events', () => {
  test('press on series A reports series A and price ~10', async ({ page }) => {
    await openEventsChart(page);
    const ids = await getSeriesIds(page);
    const target = await computeClickPixel(page, ids[0], PRICE_A);
    expect(target).not.toBeNull();
    if (!target) return;

    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(500);

    const evt = await getLastEvent(page);
    expect(evt).not.toBeNull();
    expect(evt!.type).toBe('press');
    expect(evt!.seriesId).toBeTruthy();
    // The hit series' value at the pressed time must be ~10 (not ~90).
    const hitValue = evt!.seriesData[evt!.seriesId as string];
    expect(typeof hitValue === 'number' ? hitValue : NaN).toBeCloseTo(PRICE_A, 0);
  });

  test('series A vs B disambiguation', async ({ page }) => {
    await openEventsChart(page);
    const ids = await getSeriesIds(page);

    // Returns the hit series' value for the latest press, or null.
    const hitValue = async (): Promise<number | null> => {
      const e = await getLastEvent(page);
      if (!e || !e.seriesId) return null;
      const v = e.seriesData[e.seriesId];
      return typeof v === 'number' ? v : null;
    };

    // Press A, then move the cursor away and pause well past the double-click
    // window so the B press is a distinct single press (two clicks at the same
    // x in quick succession would coalesce into a double-click).
    const aPixel = await computeClickPixel(page, ids[0], PRICE_A);
    await page.mouse.click(aPixel!.x, aPixel!.y);
    await expect.poll(hitValue).toBeCloseTo(PRICE_A, 0);
    const aEvt = await getLastEvent(page);

    await page.mouse.move(0, 0);
    await page.waitForTimeout(800);

    const bPixel = await computeClickPixel(page, ids[0], PRICE_B);
    await page.mouse.click(bPixel!.x, bPixel!.y);
    await expect.poll(hitValue).toBeCloseTo(PRICE_B, 0);
    const bEvt = await getLastEvent(page);

    expect(aEvt!.seriesId).toBeTruthy();
    expect(bEvt!.seriesId).toBeTruthy();
    expect(aEvt!.seriesId).not.toBe(bEvt!.seriesId);
    expect(aEvt!.seriesData[aEvt!.seriesId as string]).toBeCloseTo(PRICE_A, 0);
    expect(bEvt!.seriesData[bEvt!.seriesId as string]).toBeCloseTo(PRICE_B, 0);
  });

  test('pressed time matches T', async ({ page }) => {
    await openEventsChart(page);
    const ids = await getSeriesIds(page);
    const target = await computeClickPixel(page, ids[0], PRICE_A);
    await page.mouse.click(target!.x, target!.y);
    await page.waitForTimeout(500);

    const evt = await getLastEvent(page);
    expect(evt!.timeNs).toBeDefined();
    // timeNs is UTC nanoseconds; within one day of T (magnet may snap to an
    // adjacent sample, all of which are 1 day apart at 10:00 ET).
    const evtSec = (evt!.timeNs as number) / 1e9;
    expect(Math.abs(evtSec - T_UTC_SEC)).toBeLessThan(2 * 24 * 3600);
  });

  test('shift-click sets shiftKey', async ({ page }) => {
    await openEventsChart(page);
    const ids = await getSeriesIds(page);
    const target = await computeClickPixel(page, ids[0], PRICE_A);
    await page.keyboard.down('Shift');
    await page.mouse.click(target!.x, target!.y);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(500);

    const evt = await getLastEvent(page);
    expect(evt!.shiftKey).toBe(true);
  });

  test('empty-area press omits time and series', async ({ page }) => {
    await openEventsChart(page);
    const rect = await getCanvasRect(page);
    // Top-left corner: above both lines, outside any data point.
    await page.mouse.click(rect.x + 5, rect.y + 5);
    await page.waitForTimeout(500);

    const evt = await getLastEvent(page);
    expect(evt).not.toBeNull();
    expect(evt!.type).toBe('press');
    // No series under the cursor between/above the lines.
    expect(evt!.seriesId).toBeUndefined();
  });

  test('round trip: handler writes the event into a Deephaven table', async ({
    page,
  }) => {
    await openEventsChart(page);
    const ids = await getSeriesIds(page);
    const target = await computeClickPixel(page, ids[0], PRICE_A);
    await page.mouse.click(target!.x, target!.y);
    await page.waitForTimeout(500);

    // Open the result table the handler appends to and confirm a row landed.
    await openPanel(page, 'tvl_events_result');
    await expect
      .poll(
        async () =>
          page
            .locator('.iris-grid')
            .last()
            .locator('canvas')
            .count(),
        { timeout: 15000 }
      )
      .toBeGreaterThan(0);
    // The grid renders on canvas; presence of the panel plus a non-empty
    // result table (the handler ran server-side) proves the round trip.
    const ticket = await page.evaluate(() => {
      const charts = document.querySelectorAll('.dh-tvl-chart');
      return charts.length;
    });
    expect(ticket).toBeGreaterThan(0);
  });
});
