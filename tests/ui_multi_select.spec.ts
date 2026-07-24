import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test.describe('UI multi_select', () => {
  test('renders basic multi select', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ms_basic', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    await expect(panel).toHaveScreenshot();
  });

  test('renders controlled multi select with initial values', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ms_controlled',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    await expect(panel).toHaveScreenshot();
  });
});
