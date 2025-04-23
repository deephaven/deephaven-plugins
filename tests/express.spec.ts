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

test('Histogram loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'express_hist_by', '.js-plotly-plot');
  await expect(page.locator('.iris-chart-panel')).toHaveScreenshot();
});

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
