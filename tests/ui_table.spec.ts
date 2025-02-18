import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

const REACT_PANEL_VISIBLE = '.dh-react-panel:visible';

test.describe('UI table', () => {
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

test('UI table responds to prop changes', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'toggle_table', REACT_PANEL_VISIBLE);

  const locator = page.locator(REACT_PANEL_VISIBLE);

  await expect(locator).toHaveScreenshot();

  await locator.getByRole('button', { name: 'formatting' }).click();
  await expect(locator).toHaveScreenshot();
  await locator.getByRole('button', { name: 'databars' }).click();
  await expect(locator).toHaveScreenshot();
  await locator.getByRole('button', { name: 'case' }).click();
  await expect(locator).toHaveScreenshot();
});
