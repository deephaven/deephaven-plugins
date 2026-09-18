import { expect, test, type Page } from '@playwright/test';
import { openPanel, gotoPage, waitForTvlSettled } from './utils';

/**
 * End-to-end coverage for the in-chart legend. The fixtures in
 * tests/app.d/tvl_legend.py are opened from the Panels menu; we read the
 * `data-tvl-legend` DOM seam (the same seam the unit tests use) and click
 * rows to toggle series.
 *
 * These assert what jsdom cannot: that the legend is populated by a real
 * lightweight-charts render before any cursor interaction, and that a click
 * actually hides the series on the canvas.
 */

const CHART = '.dh-tvl-chart';
const LEGEND = '.tvl-legend';
const ROW = '.tvl-legend-row';

// Never tear the page down while a chart's Barrage snapshot is still
// propagating — the server logs "Stream was terminated by error" and that
// noise lands in other sessions' console history.
test.afterEach(async ({ page }) => {
  await waitForTvlSettled(page);
});

async function openChart(page: Page, field: string): Promise<void> {
  await gotoPage(page, '');
  await openPanel(page, field);
  await page.waitForSelector(CHART, { state: 'visible' });
  await waitForTvlSettled(page);
}

/** The legend's rendered text, via the seam. */
function seam(page: Page): Promise<string> {
  return page.evaluate(
    sel => document.querySelector(sel)?.getAttribute('data-tvl-legend') ?? '',
    LEGEND
  );
}

/** Move the cursor a fraction across the chart at a given height fraction. */
async function hover(page: Page, xFrac: number, yFrac = 0.45): Promise<void> {
  const box = await page.locator(CHART).boundingBox();
  if (box == null) throw new Error('chart has no bounding box');
  await page.mouse.move(
    Math.round(box.x + box.width * xFrac),
    Math.round(box.y + box.height * yFrac)
  );
}

test('legend is populated before any cursor interaction', async ({ page }) => {
  await openChart(page, 'tvl_legend_chart');

  // Unlike the tooltip, the legend is visible and filled on first paint —
  // it falls back to each series' last value with no crosshair.
  await expect(page.locator(LEGEND)).toBeVisible();
  await expect(page.locator(ROW)).toHaveCount(2);

  await expect.poll(() => seam(page)).toMatch(/Price \d+\.\d{2}/);
  const text = await seam(page);
  expect(text).toContain('Price');
  expect(text).toContain('EMA');
});

test('legend values follow the crosshair and return to last values', async ({
  page,
}) => {
  await openChart(page, 'tvl_legend_chart');

  const atRest = await seam(page);

  await hover(page, 0.3);
  await expect.poll(() => seam(page)).not.toBe(atRest);
  const hovered = await seam(page);
  // Still both series, just different numbers.
  expect(hovered).toContain('Price');
  expect(hovered).toContain('EMA');

  // Moving off the chart restores the idle (last-value) reading rather than
  // blanking or hiding the legend.
  await page.mouse.move(5, 5);
  await expect(page.locator(LEGEND)).toBeVisible();
  await expect.poll(() => seam(page)).toContain('Price');
});

test('clicking a legend row hides and restores its series', async ({
  page,
}) => {
  await openChart(page, 'tvl_legend_chart');

  const row = page.locator(ROW).first();
  await expect(row).toHaveAttribute('aria-pressed', 'true');

  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'false');
  await expect(row).toHaveClass(/tvl-legend-row-hidden/);
  // The row stays in the legend so the series can be brought back.
  await expect(page.locator(ROW)).toHaveCount(2);
  await expect.poll(() => seam(page)).toContain('(hidden)');

  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await expect(row).not.toHaveClass(/tvl-legend-row-hidden/);
  await expect.poll(() => seam(page)).not.toContain('(hidden)');
});

test('legend rows are keyboard operable', async ({ page }) => {
  await openChart(page, 'tvl_legend_chart');

  const row = page.locator(ROW).first();
  await row.focus();
  await page.keyboard.press('Enter');

  await expect(row).toHaveAttribute('aria-pressed', 'false');
});

test('candlestick legend row shows all four OHLC values', async ({ page }) => {
  await openChart(page, 'tvl_legend_ohlc_chart');

  // Candlestick plus a VWAP line: the OHLC row expands, the line row does not.
  await expect(page.locator(ROW)).toHaveCount(2);
  await expect
    .poll(() => seam(page))
    .toMatch(
      /ES futures O \d+\.\d{2} {2}H \d+\.\d{2} {2}L \d+\.\d{2} {2}C \d+\.\d{2}/
    );
  expect(await seam(page)).toMatch(/VWAP \d+\.\d{2}/);
});

test('a hidden series renders a dimmed row, not a missing one', async ({
  page,
}) => {
  await openChart(page, 'tvl_legend_hidden_start_chart');

  // `visible=False` from Python is an initial toggle state, so the row must
  // still be there and must report itself as hidden.
  const rows = page.locator(ROW);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toHaveClass(/tvl-legend-row-hidden/);
  await expect(rows.nth(1)).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => seam(page)).toContain('(hidden)');

  // And one click brings it back, rather than needing two.
  await rows.nth(1).click();
  await expect(rows.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => seam(page)).not.toContain('(hidden)');
});

test('capped legend shows an overflow count and promotes on hover', async ({
  page,
}) => {
  await openChart(page, 'tvl_legend_capped_chart');

  // Eight series, max_rows=3.
  await expect(page.locator(ROW)).toHaveCount(3);
  await expect(page.locator('.tvl-legend-overflow')).toHaveText('+5 more');

  const rowsAtRest = await page
    .locator(ROW)
    .evaluateAll(els =>
      els.map(el => el.querySelector('.tvl-legend-title')?.textContent ?? '')
    );
  expect(rowsAtRest).toEqual(['S0', 'S1', 'S2']);

  // The series are stacked by a constant offset, so hovering near the top of
  // the plot focuses one of the high-numbered series that sit past the cap.
  await hover(page, 0.5, 0.1);

  await expect
    .poll(async () =>
      page
        .locator(ROW)
        .evaluateAll(els =>
          els.map(
            el => el.querySelector('.tvl-legend-title')?.textContent ?? ''
          )
        )
    )
    .not.toEqual(rowsAtRest);

  // Promotion replaces a row rather than adding one, so the height is fixed.
  await expect(page.locator(ROW)).toHaveCount(3);
  await expect(page.locator('.tvl-legend-overflow')).toHaveText('+5 more');
});
