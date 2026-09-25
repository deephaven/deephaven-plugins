import { expect, test, type Page } from '@playwright/test';
import { openPanel, gotoPage, waitForTvlSettled } from './utils';

/**
 * End-to-end coverage for the tracking tooltip. The `tvl_tooltip_chart` field
 * from tests/app.d/tvl_tooltip.py is opened from the Panels menu; we hover its
 * canvas and read the `data-tvl-tooltip` DOM seam (the same seam the unit
 * tests use).
 */

const CHART = '.dh-tvl-chart';
const TOOLTIP = '.tvl-tooltip';

// Never tear the page down while a chart's Barrage snapshot is still
// propagating — the server logs "Stream was terminated by error" and that
// noise lands in other sessions' console history.
test.afterEach(async ({ page }) => {
  await waitForTvlSettled(page);
});

async function openChart(page: Page): Promise<void> {
  await gotoPage(page, '');
  await openPanel(page, 'tvl_tooltip_chart');
  await page.waitForSelector(CHART, { state: 'visible' });
  await waitForTvlSettled(page);
}

/** Hover a fraction across the chart and read the tooltip seam once it settles. */
async function hoverAndRead(
  page: Page,
  frac: number
): Promise<{
  display: string;
  data: string;
  title: string;
  titleColor: string;
} | null> {
  const box = await page.locator(CHART).boundingBox();
  if (box == null) throw new Error('chart has no bounding box');
  const x = Math.round(box.x + box.width * frac);
  const y = Math.round(box.y + box.height * 0.45);
  await page.mouse.move(x, y);
  // The tooltip renders from subscribeCrosshairMove, so wait for the seam to
  // reflect this position rather than sampling mid-update.
  await expect
    .poll(() =>
      page.evaluate(
        sel =>
          (document.querySelector(sel) as HTMLElement | null)?.style.display,
        TOOLTIP
      )
    )
    .toBe('block');
  return page.evaluate(sel => {
    const t = document.querySelector(sel) as HTMLElement | null;
    if (t == null) return null;
    const title = t.querySelector('.tvl-tooltip-title') as HTMLElement | null;
    return {
      display: t.style.display,
      data: t.getAttribute('data-tvl-tooltip') ?? '',
      title: title?.textContent ?? '',
      titleColor: title?.style.color ?? '',
    };
  }, TOOLTIP);
}

test('tracking tooltip shows the focused series on hover', async ({ page }) => {
  await openChart(page);

  // The tooltip element exists but is hidden until the cursor is over the chart.
  await expect(page.locator(TOOLTIP)).toHaveCount(1);
  expect(
    await page
      .locator(TOOLTIP)
      .evaluate(el => (el as HTMLElement).style.display)
  ).toBe('none');

  const reading = await hoverAndRead(page, 0.5);
  expect(reading, 'tooltip element should be present').not.toBeNull();
  expect(reading?.display).toBe('block');
  // Title is one of our two series, tinted with the series color.
  expect(['Price', 'EMA']).toContain(reading?.title);
  expect(reading?.titleColor).toMatch(/rgb|#/);
  // Seam carries title | value | date; decimals come from the series'
  // price format.
  expect(reading?.data).toMatch(/\d+\.\d{2}/);
  expect(reading?.data).toContain(reading?.title);
});

test('tooltip tracks across the chart and hides off-chart', async ({
  page,
}) => {
  await openChart(page);

  const titles = new Set<string>();
  const fracs = [0.2, 0.4, 0.6, 0.8];
  // Sequential on purpose: each step moves the one shared cursor.
  for (let i = 0; i < fracs.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const r = await hoverAndRead(page, fracs[i]);
    expect(r?.data, `non-empty at frac=${fracs[i]}`).not.toBe('');
    titles.add(r?.title ?? '');
  }
  // Every focused title is a real series title.
  titles.forEach(t => expect(['Price', 'EMA']).toContain(t));

  // Moving the cursor far off the chart hides the tooltip.
  await page.mouse.move(5, 5);
  await expect
    .poll(() =>
      page.evaluate(
        sel =>
          (document.querySelector(sel) as HTMLElement | null)?.style.display,
        TOOLTIP
      )
    )
    .toBe('none');
});
