import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, waitForPlotlyData, SELECTORS } from './utils';

// Tests plotly components render as expected in deephaven.ui
test.describe('plotly works in deephaven.ui', () => {
  ['ui_basic_fig', 'ui_px_fig', 'ui_dx_fig'].forEach(name => {
    test(name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, name, SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

      // Wait for the plot data to render so the screenshot isn't of an empty plot
      await waitForPlotlyData(page);

      await expect(
        page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      ).toHaveScreenshot();
    });
  });
});
