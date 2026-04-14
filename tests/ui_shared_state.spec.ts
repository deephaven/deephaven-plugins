import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

// Tests must run serially within each browser project because they share
// global server-side state. Each test resets to a known state first to
// handle cross-browser interference from parallel projects.

test('shared state displays initial value', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_shared_state', SELECTORS.REACT_PANEL_VISIBLE);

  const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  // Reset to known state (other browser projects may have changed it)
  await panel.getByRole('button', { name: 'Reset' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 0' })).toBeVisible();
  await expect(panel.getByText('Mirror: 0')).toBeVisible();
});

test('shared state syncs when increment button is clicked', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_shared_state', SELECTORS.REACT_PANEL_VISIBLE);

  const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  // Reset to known state
  await panel.getByRole('button', { name: 'Reset' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 0' })).toBeVisible();

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

  // Reset to known state
  await panel.getByRole('button', { name: 'Reset' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 0' })).toBeVisible();

  // Increment then reset
  await panel.getByRole('button', { name: 'Count: 0' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 1' })).toBeVisible();

  await panel.getByRole('button', { name: 'Reset' }).click();
  await expect(panel.getByRole('button', { name: 'Count: 0' })).toBeVisible();
  await expect(panel.getByText('Mirror: 0')).toBeVisible();
});

test('shared state with callable initializer displays initial value', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_shared_state', SELECTORS.REACT_PANEL_VISIBLE);

  const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  // The callable initializer returns ["initial"], so text always starts with "initial"
  await expect(panel.getByText('List: initial')).toBeVisible();
});

test('shared state with callable initializer updates correctly', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_shared_state', SELECTORS.REACT_PANEL_VISIBLE);

  const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  // Get the current list text before clicking
  const listText = panel.getByText('List: ');
  const textBefore = await listText.textContent();

  // Click "Add item" to append to the list
  await panel.getByRole('button', { name: 'Add item' }).click();

  // Verify the list now has more content than before
  await expect(listText).not.toHaveText(textBefore!);
});
