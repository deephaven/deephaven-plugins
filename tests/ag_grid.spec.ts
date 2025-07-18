import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('Express loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_random');
  await expect(page.locator('.ag-root')).toHaveScreenshot();
});
