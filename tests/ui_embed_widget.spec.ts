import { expect, test } from '@playwright/test';
import { gotoPage, SELECTORS, waitForLoad } from './utils';

test('UI single panel loads in embed widget', async ({ page }) => {
  await gotoPage(page, '/iframe/widget/?name=ui_component');
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toBeVisible();
  await waitForLoad(page);
  await expect(page).toHaveScreenshot();
});

test('UI multi panel loads in embed widget', async ({ page }) => {
  await gotoPage(page, '/iframe/widget/?name=ui_multi_panel');
  await expect(page.locator(SELECTORS.REACT_PANEL)).toHaveCount(2);
  // Wait for the titles because embed-widget has a slight delay in showing the headers
  await expect(page.getByText('foo')).toBeVisible();
  await expect(page.getByText('bar')).toBeVisible();
  await waitForLoad(page);
  await expect(page).toHaveScreenshot();
});

test('UI dashboard loads in embed widget', async ({ page }) => {
  await gotoPage(page, '/iframe/widget/?name=ui_dashboard');
  await expect(page.locator(SELECTORS.REACT_PANEL)).toHaveCount(4);
  await waitForLoad(page);
  // Adding an artificial timeout as the dashboard panel comes up without headers initially
  await page.waitForTimeout(1500);
  await expect(page).toHaveScreenshot();
});
