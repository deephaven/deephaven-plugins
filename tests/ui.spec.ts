import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('UI loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_component', '.dh-react-panel');
  await expect(page.locator('.dh-react-panel')).toHaveScreenshot();
});
