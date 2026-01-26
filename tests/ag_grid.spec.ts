import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('AgGrid loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_random');
  await expect(page.locator('.ag-root')).toHaveScreenshot();
});

test('AgGrid with RollupTable loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_rollup');
  await expect(page.locator('.ag-root')).toHaveScreenshot();
});

test('Column headers match column names match exactly', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_foo_bar');
  await expect(page.locator('.ag-header-cell-text')).toHaveText([
    'Foo_Bar',
    'FooBar',
  ]);
});
