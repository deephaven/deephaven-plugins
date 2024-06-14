import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

const selector = {
  REACT_PANEL_VISIBLE: '.dh-react-panel:visible',
  REACT_PANEL_OVERLAY: '.dh-react-panel-overlay',
};

test('UI loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_component', selector.REACT_PANEL_VISIBLE);
  await expect(page.locator(selector.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

test('boom component shows an error in a panel', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_boom', selector.REACT_PANEL_VISIBLE);
  await expect(page.locator(selector.REACT_PANEL_VISIBLE)).toBeVisible();
  await expect(
    page
      .locator(selector.REACT_PANEL_VISIBLE)
      .getByText('Exception', { exact: true })
  ).toBeVisible();
  await expect(
    page
      .locator(selector.REACT_PANEL_VISIBLE)
      .getByText('BOOM! Traceback (most recent call last)')
  ).toBeVisible();
  await expect(page.locator(selector.REACT_PANEL_OVERLAY)).not.toBeVisible();
});

test('boom counter component shows error overlay after clicking the button twice', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_boom_counter', selector.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(selector.REACT_PANEL_VISIBLE);

  let btn = await panelLocator.getByRole('button', { name: 'Count is 0' });
  await expect(btn).toBeVisible();
  btn.click();

  btn = await panelLocator.getByRole('button', { name: 'Count is 1' });
  await expect(btn).toBeVisible();
  btn.click();

  const overlayLocator = page.locator(selector.REACT_PANEL_OVERLAY);

  await expect(
    overlayLocator.getByText('ValueError', { exact: true })
  ).toBeVisible();
  await expect(
    overlayLocator.getByText('BOOM! Traceback (most recent call last)')
  ).toBeVisible();
});

test('UI all components render', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_render_all', selector.REACT_PANEL_VISIBLE);
  await expect(page.locator(selector.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});
