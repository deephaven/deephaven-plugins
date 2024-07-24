import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

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