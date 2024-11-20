import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test('slow multi-panel shows 1 loader immediately and multiple after loading', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    'ui_slow_multi_panel',
    SELECTORS.REACT_PANEL_VISIBLE,
    false
  );
  const locator = page.locator(SELECTORS.REACT_PANEL);
  // 1 loader should show up
  await expect(locator.locator('.loading-spinner')).toHaveCount(1);
  // Then disappear and show 3 panels
  await expect(locator.locator('.loading-spinner')).toHaveCount(0);
  await expect(locator).toHaveCount(3);
  await expect(locator.getByText('Hello')).toHaveCount(1);
  await expect(locator.getByText('World')).toHaveCount(1);
  await expect(locator.getByText('Go BOOM!')).toHaveCount(1);
});

test('slow multi-panel shows loaders on element Reload', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_slow_multi_panel', SELECTORS.REACT_PANEL_VISIBLE);
  const locator = page.locator(SELECTORS.REACT_PANEL);
  await expect(locator).toHaveCount(3);
  await locator.getByText('Go BOOM!').click();
  await expect(locator.getByText('ValueError', { exact: true })).toHaveCount(3);
  await expect(locator.getByText('BOOM!')).toHaveCount(3);
  await locator.locator(':visible').getByText('Reload').first().click();
  // Loaders should show up
  await expect(locator.locator('.loading-spinner')).toHaveCount(3);
  // Then disappear and show components again
  await expect(locator.locator('.loading-spinner')).toHaveCount(0);
  await expect(locator.getByText('Hello')).toHaveCount(1);
  await expect(locator.getByText('World')).toHaveCount(1);
  await expect(locator.getByText('Go BOOM!')).toHaveCount(1);
});

test('slow multi-panel shows loaders on page reload', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_slow_multi_panel', SELECTORS.REACT_PANEL_VISIBLE);
  await page.reload();
  const locator = page.locator(SELECTORS.REACT_PANEL);
  // Loader should show up
  await expect(locator.locator('.loading-spinner')).toHaveCount(3);
  // Then disappear and show error again
  await expect(locator.locator('.loading-spinner')).toHaveCount(0);
  await expect(locator.getByText('Hello')).toHaveCount(1);
  await expect(locator.getByText('World')).toHaveCount(1);
  await expect(locator.getByText('Go BOOM!')).toHaveCount(1);
});
