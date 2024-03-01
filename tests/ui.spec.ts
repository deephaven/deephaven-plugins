import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('UI loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_component', '.ui-portal-panel');
  await expect(page.locator('.ui-portal-panel')).toHaveScreenshot();
});
