import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

const REACT_PANEL_VISIBLE = '.dh-react-panel:visible';

// Tests flex components render as expected
test.describe('UI flex components', () => {
  [
    't_alignment',
    't_background_color',
    't_color',
    't_color_column_source',
    't_priority',
    't_value_format',
    't_display_names',
  ].forEach(name => {
    test(name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, name, REACT_PANEL_VISIBLE);

      await expect(page.locator(REACT_PANEL_VISIBLE)).toHaveScreenshot();
    });
  });
});
