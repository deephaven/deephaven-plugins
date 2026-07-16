import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

// Tests dialog components render as expected
test.describe('UI dialog components', () => {
  ['my_popover', 'my_tray'].forEach(name => {
    test(name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, name, SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

      await expect(
        page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      ).toHaveScreenshot();
    });
  });

  ['my_modal', 'my_fullscreen', 'my_fullscreen_takeover'].forEach(name => {
    test(name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, name, SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

      // The modal is small enough to leave the console panel's heap-usage
      // indicator visible behind it; its used-memory bar drifts run-to-run, so
      // mask it. The fullscreen / takeover variants cover the whole IDE, so
      // nothing dynamic shows and no mask is needed (empty array == no mask).
      const mask =
        name === 'my_modal' ? [page.locator(SELECTORS.HEAP_USAGE)] : [];
      await expect(page).toHaveScreenshot({ mask });
    });
  });
});
