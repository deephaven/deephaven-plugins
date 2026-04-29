import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test.describe('Homescreen', () => {
  test('homescreen dashboard list visible', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_home_screen',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    // Get the outer panel (first match) for screenshots
    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // The nested dashboard should contain the dashboard list for the home screen
    await expect(outerPanel.getByText('Simple dashboards')).toBeVisible();
  });
});
