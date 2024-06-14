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
  await expect(
    page.locator('.dh-react-panel').getByText('Exception', { exact: true })
  ).toBeVisible();
  await expect(
    page.locator('.dh-react-panel').getByText('BOOM!')
  ).toBeVisible();
  await expect(page.locator('.dh-react-panel-overlay')).not.toBeVisible();
});

test('boom counter component shows error overlay after clicking the button twice', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_boom_counter', '.dh-react-panel');

  const panelLocator = page.locator('.dh-react-panel');

  let btn = await panelLocator.getByRole('button', { name: 'Count is 0' });
  await expect(btn).toBeVisible();
  btn.click();

  btn = await panelLocator.getByRole('button', { name: 'Count is 1' });
  await expect(btn).toBeVisible();
  btn.click();

  const overlayLocator = page.locator('.dh-react-panel-overlay');

  await expect(
    overlayLocator.getByText('ValueError', { exact: true })
  ).toBeVisible();
  await expect(overlayLocator.getByText('BOOM! Value too big.')).toBeVisible();
});
