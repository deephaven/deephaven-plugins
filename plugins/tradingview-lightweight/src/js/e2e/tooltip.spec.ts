import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end coverage for the tracking tooltip. The `tooltip_chart` field from
 * e2e/app.d/tooltip_demo.py is opened from the Panels menu; we hover its canvas
 * and read the `data-tvl-tooltip` DOM seam (the same seam the unit tests use).
 */

const CHART = '.dh-tvl-chart';
const TOOLTIP = '.tvl-tooltip';
const FIELD = 'tooltip_chart'; // the Application-mode field name from app.d

async function waitForLoad(page: Page) {
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
}

/** Open an Application-mode field as a panel via the Panels menu. */
async function openPanel(page: Page, name: string) {
  const panels = page.getByRole('button', { name: 'Panels', exact: true });
  await expect(panels).toBeEnabled();
  const before = await page.locator('.dh-panel').count();
  await panels.click();
  const search = page.getByRole('searchbox', {
    name: 'Find Table, Plot or Widget',
    exact: true,
  });
  await search.fill(name);
  const target = page.getByRole('button', { name, exact: true });
  await expect(target).toBeEnabled();
  await target.click();
  await page.mouse.move(0, 0);
  await expect(page.locator('.dh-panel')).toHaveCount(before + 1);
  await waitForLoad(page);
}

/** Load the IDE and open the tooltip demo chart with data painted. */
async function openChart(page: Page) {
  await page.goto('/ide/');
  await expect(
    page.getByRole('progressbar', { name: 'Loading...', exact: true })
  ).toHaveCount(0);
  await waitForLoad(page);
  await openPanel(page, FIELD);
  await page.waitForSelector(CHART, { state: 'visible', timeout: 60 * 1000 });
  await page.waitForTimeout(3000); // let series data arrive + paint
}

/** Hover a fraction across the chart and read the tooltip seam after it settles. */
async function hoverAndRead(page: Page, frac: number) {
  const box = await page.locator(CHART).boundingBox();
  if (!box) throw new Error('chart has no bounding box');
  const x = Math.round(box.x + box.width * frac);
  const y = Math.round(box.y + box.height * 0.45);
  await page.mouse.move(x, y);
  await page.waitForTimeout(500); // let subscribeCrosshairMove fire + render
  return page.evaluate(sel => {
    const t = document.querySelector(sel) as HTMLElement | null;
    if (!t) return null;
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
  expect(reading!.display).toBe('block');
  // Title is one of our two series, tinted with the series color.
  expect(['Price', 'EMA']).toContain(reading!.title);
  expect(reading!.titleColor).toMatch(/rgb|#/);
  // Seam carries title | value | date; value reflects precision=2.
  expect(reading!.data).toMatch(/\d+\.\d{2}/);
  expect(reading!.data).toContain(reading!.title);
});

test('tooltip tracks across the chart and hides off-chart', async ({
  page,
}) => {
  await openChart(page);

  const titles = new Set<string>();
  for (const frac of [0.2, 0.4, 0.6, 0.8]) {
    const r = await hoverAndRead(page, frac);
    expect(r!.display, `visible at frac=${frac}`).toBe('block');
    expect(r!.data, `non-empty at frac=${frac}`).not.toBe('');
    titles.add(r!.title);
  }
  // Every focused title is a real series title.
  for (const t of titles) expect(['Price', 'EMA']).toContain(t);

  // Moving the cursor far off the chart hides the tooltip.
  await page.mouse.move(5, 5);
  await page.waitForTimeout(400);
  expect(
    await page
      .locator(TOOLTIP)
      .evaluate(el => (el as HTMLElement).style.display)
  ).toBe('none');
});
