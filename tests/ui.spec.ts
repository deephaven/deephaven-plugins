import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('UI loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_component', '.dh-react-panel');
  await expect(page.locator('.dh-react-panel')).toHaveScreenshot();
});

test('boom component shows an error in a panel', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_boom', '.dh-react-panel');
  await expect(page.locator('.dh-react-panel')).toBeVisible();
  await expect(page.locator('.ui-error-view')).toHaveText('Boom!');
});
