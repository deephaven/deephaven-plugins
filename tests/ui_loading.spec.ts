import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test('slow multi-panel shows 1 loader immediately and multiple after loading', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    'ui_slow_multi_panel',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
    false
  );
  const widgetLocator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT);
  // 1 loader should show up
  await expect(widgetLocator.locator('.loading-spinner')).toHaveCount(1);
  // Then disappear and show 3 panels
  await expect(widgetLocator.locator('.loading-spinner')).toHaveCount(0);
  const panelLocator = page.locator(SELECTORS.REACT_PANEL);
  await expect(panelLocator).toHaveCount(3);
  await expect(panelLocator.getByText('Hello')).toHaveCount(1);
  await expect(panelLocator.getByText('World')).toHaveCount(1);
  await expect(panelLocator.getByText('Go BOOM!')).toHaveCount(1);
});

test('slow multi-panel shows loaders on element Reload', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    'ui_slow_multi_panel',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );
  const panelLocator = page.locator(SELECTORS.REACT_PANEL);
  await expect(panelLocator).toHaveCount(3);
  await panelLocator.getByText('Go BOOM!').click();
  await expect(
    panelLocator.getByText('ValueError', { exact: true })
  ).toHaveCount(3);
  await expect(panelLocator.getByText('BOOM!')).toHaveCount(3);
  await panelLocator.locator(':visible').getByText('Reload').first().click();

  const widgetLocator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT);
  // Loader should show up
  await expect(widgetLocator.locator('.loading-spinner')).toHaveCount(1);
  // Then disappear and show components again
  await expect(widgetLocator.locator('.loading-spinner')).toHaveCount(0);

  await expect(panelLocator).toHaveCount(3);
  await expect(panelLocator.getByText('Hello')).toHaveCount(1);
  await expect(panelLocator.getByText('World')).toHaveCount(1);
  await expect(panelLocator.getByText('Go BOOM!')).toHaveCount(1);
});

test('slow multi-panel shows loaders on page reload', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    'ui_slow_multi_panel',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );
  await page.reload();
  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT);
  // Loader should show up
  await expect(locator.locator('.loading-spinner')).toHaveCount(1);
  // Then disappear and show error again
  await expect(locator.locator('.loading-spinner')).toHaveCount(0);
  await expect(locator.getByText('Hello')).toHaveCount(1);
  await expect(locator.getByText('World')).toHaveCount(1);
  await expect(locator.getByText('Go BOOM!')).toHaveCount(1);
});
