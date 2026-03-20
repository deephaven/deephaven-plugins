import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, clickGridRow } from './utils';

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
    't_single_agg',
    't_bottom_agg',
    't_top_agg',
    't_databar_basic',
    't_databar_multi_cols',
    't_databar_full_options',
    't_databar_conditional',
    't_databar_priority',
    't_databar_mixed',
    't_databar_gradient',
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

test('UI table on_selection_change', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 't_selection', REACT_PANEL_VISIBLE);

  const locator = page.locator(`${REACT_PANEL_VISIBLE} .iris-grid`);

  await clickGridRow(locator, 3);
  await expect(page.getByText('Selection: CAT/NYPE')).toBeVisible();

  await clickGridRow(locator, 0, { modifiers: ['ControlOrMeta'] });
  await expect(page.getByText('Selection: BIRD/TPET, CAT/NYPE')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByText('Selection: None')).toBeVisible();
});
