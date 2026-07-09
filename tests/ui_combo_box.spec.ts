import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test.describe('UI combo_box', () => {
  test('renders basic combo box', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'cb_basic', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    await expect(panel.getByText('Selected: None')).toBeVisible();
    await expect(panel).toHaveScreenshot();
  });

  test('renders controlled combo box with initial value', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'cb_controlled',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    await expect(panel.getByText('Selected: Option B')).toBeVisible();
  });

  test('selects an option', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'cb_basic', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

    // Click the combo box trigger button to open the dropdown
    await panel.getByRole('button', { name: 'Show suggestions' }).click();

    // Wait for the listbox to appear and select an option
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: 'Option A' }).click();

    // Verify the selection was applied
    await expect(panel.getByText('Selected: Option A')).toBeVisible();
  });
});
