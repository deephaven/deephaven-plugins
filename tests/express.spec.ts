import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test('Express loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'express_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Plotly loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'plotly_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

// TODO: DH-20738 Enable histogram test, it seems to be flakey
// test('Histogram loads', async ({ page }) => {
//   await gotoPage(page, '');
//   await openPanel(page, 'express_hist_by', '.js-plotly-plot');
//   await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
// });

test('Indicator loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'express_indicator', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Indicator grid loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'express_indicator_by', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Ticking loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ticking_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Partitioned loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'partitioned_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Figure with title loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'title_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Figure with scatter loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'scatter_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Calendar line chart loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'line_calendar', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Chart image loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'line_plot_img', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

test('Bar chart on x loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'bar_x_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Bar chart on y loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'bar_y_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Timeline chart loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'timeline_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Marginal chart loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'marginal_scatter_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('OHLC chart loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ohlc_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Candlestick chart loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'candlestick_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Titles fig loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'titles_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Subplots fig loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'keep_subplot_titles_fig', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Choropleth loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'choropleth_fig', '.js-plotly-plot');
  // The choropleth trace renders an SVG <g class="choropleth"> per trace.
  await expect(
    page.locator('.iris-chart-panel').locator('g.choropleth').first()
  ).toBeVisible();
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

test('Choropleth ticking updates live', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'choropleth_ticking_fig', '.js-plotly-plot');

  const plot = page.locator('.iris-chart-panel').locator('.js-plotly-plot');
  await expect(plot).toBeVisible();
  await expect(
    page.locator('.iris-chart-panel').locator('g.choropleth').first()
  ).toBeVisible();

  // Snapshot the trace's z values, wait for a couple of ticks, and verify
  // they have changed — this proves the live table is driving the chart.
  const readZ = async () =>
    plot.evaluate((el: HTMLElement) => {
      const data = (el as unknown as { data?: Array<{ z?: number[] }> }).data;
      return data?.[0]?.z?.slice() ?? null;
    });

  const initialZ = await readZ();
  expect(initialZ).not.toBeNull();
  expect(initialZ?.length).toBe(5);

  await expect
    .poll(async () => readZ(), {
      message: 'z values should change as the table ticks',
      timeout: 5000,
    })
    .not.toEqual(initialZ);
});
