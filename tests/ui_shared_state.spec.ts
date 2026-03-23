import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test('shared state displays initial value', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_shared_state', SELECTORS.REACT_PANEL_VISIBLE);

  const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  await expect(panel.getByRole('button', { name: 'Count: 0' })).toBeVisible();
  await expect(panel.getByText('Mirror: 0')).toBeVisible();
});

test('shared state syncs when increment button is clicked', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_shared_state', SELECTORS.REACT_PANEL_VISIBLE);

  const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  // Click increment
  await panel.getByRole('button', { name: 'Count: 0' }).click();

  // Both should show updated count
  await expect(panel.getByRole('button', { name: 'Count: 1' })).toBeVisible();
  await expect(panel.getByText('Mirror: 1')).toBeVisible();

  // Click again
  await panel.getByRole('button', { name: 'Count: 1' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 2' })).toBeVisible();
  await expect(panel.getByText('Mirror: 2')).toBeVisible();
});

test('shared state resets correctly', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_shared_state', SELECTORS.REACT_PANEL_VISIBLE);

  const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  // Increment then reset
  await panel.getByRole('button', { name: 'Count: 0' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 1' })).toBeVisible();

  await panel.getByRole('button', { name: 'Reset' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 0' })).toBeVisible();
  await expect(panel.getByText('Mirror: 0')).toBeVisible();
});
