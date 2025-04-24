import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test('Chart image loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'line_plot_img', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});
