import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

// Tests dialog components render as expected
test.describe('UI dialog components', () => {
  ['my_popover', 'my_tray'].forEach(name => {
    test(name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, name, SELECTORS.REACT_PANEL_VISIBLE);

      await expect(
        page.locator(SELECTORS.REACT_PANEL_VISIBLE)
      ).toHaveScreenshot();
    });
  });

  ['my_modal', 'my_fullscreen', 'my_fullscreen_takeover'].forEach(name => {
    test(name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, name, SELECTORS.REACT_PANEL_VISIBLE);

      await expect(page).toHaveScreenshot();
    });
  });
});
