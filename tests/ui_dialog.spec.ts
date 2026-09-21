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

      // Screenshot the dialog element rather than the page. These three cover
      // (or nearly cover) the viewport, so a full-page shot pulled in IDE
      // chrome that varies run to run — console history picking up server log
      // lines, the heap-usage indicator drifting — which made the baselines
      // ping-pong and bake in below-threshold noise that --update-snapshots
      // then refused to refresh. The popover and tray above are already
      // scoped to the widget panel and are unaffected.
      //
      // A first-ever fixture render on a cold server under full-suite load
      // can exceed the default 15s expect timeout, so give the dialog the
      // same headroom the rest of the suite gives first renders.
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 30000 });
      await expect(dialog).toHaveScreenshot();
    });
  });
});
