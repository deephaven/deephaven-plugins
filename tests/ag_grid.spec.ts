import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('AgGrid loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_random');
  const agRoot = page.locator('.ag-root');
  // Wait for rows to render so the screenshot isn't of an empty grid
  await expect(
    agRoot.locator('.ag-center-cols-container .ag-row').first()
  ).toBeVisible();
  await expect(agRoot).toHaveScreenshot();
});

test('AgGrid with RollupTable loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_rollup');
  const agRoot = page.locator('.ag-root');
  // Wait for rows to render so the screenshot isn't of an empty grid
  await expect(
    agRoot.locator('.ag-center-cols-container .ag-row').first()
  ).toBeVisible();
  await expect(agRoot).toHaveScreenshot();
});

test('Column headers match column names match exactly', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_foo_bar');
  await expect(page.locator('.ag-header-cell-text')).toHaveText([
    'Foo_Bar',
    'FooBar',
  ]);
});

test('Grid restores rows after clearing a filter that returned zero rows', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_random');

  const agRoot = page.locator('.ag-root');
  await expect(agRoot).toBeVisible();

  // Wait for rows to load
  const rows = agRoot.locator('.ag-center-cols-container .ag-row');
  await expect(rows.first()).toBeVisible();
  const initialRowCount = await rows.count();
  expect(initialRowCount).toBeGreaterThan(0);

  // Open the filter popup on the X column by clicking its filter icon
  const xHeader = agRoot.locator('.ag-header-cell').first();
  await xHeader.locator('.ag-header-cell-filter-button').click();

  // Change the filter type dropdown from "Equals" to "Greater than"
  const filterPopup = page.locator('.ag-filter');
  await expect(filterPopup).toBeVisible();
  await filterPopup.locator('.ag-filter-select').click();
  await page.getByRole('option', { name: 'Greater than', exact: true }).click();

  // Type a value that matches zero rows (X only goes up to 99)
  const filterInput = filterPopup.getByLabel('Filter Value');
  await filterInput.fill('99999');

  // Click Apply
  await filterPopup.getByRole('button', { name: 'Apply' }).click();

  // Wait for the grid to show no rows
  await expect(rows).toHaveCount(0, { timeout: 5000 });

  // Re-open the filter popup and click Reset to clear the filter
  await xHeader.locator('.ag-header-cell-filter-button').click();
  await expect(filterPopup).toBeVisible();
  await filterPopup.getByRole('button', { name: 'Reset' }).click();

  // Rows should be restored
  await expect(rows.first()).toBeVisible({ timeout: 5000 });
  const restoredRowCount = await rows.count();
  expect(restoredRowCount).toBeGreaterThan(0);
});

test('Text filters are case-insensitive by default', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_mixed_case');

  const agRoot = page.locator('.ag-root');
  await expect(agRoot).toBeVisible();

  // Wait for all 5 rows to load
  const rows = agRoot.locator('.ag-center-cols-container .ag-row');
  await expect(rows).toHaveCount(5);

  // Open the filter popup on the Fruit column
  const fruitHeader = agRoot.locator('.ag-header-cell').first();
  await fruitHeader.locator('.ag-header-cell-filter-button').click();

  const filterPopup = page.locator('.ag-filter');
  await expect(filterPopup).toBeVisible();

  // Select the "Equals" filter type
  await filterPopup.locator('.ag-filter-select').click();
  await page.getByRole('option', { name: 'Equals', exact: true }).click();

  // Filter for "apple" and apply - should match "Apple", "apple", and "APPLE"
  const filterInput = filterPopup.getByLabel('Filter Value');
  await filterInput.fill('apple');
  await filterPopup.getByRole('button', { name: 'Apply' }).click();
  await expect(rows).toHaveCount(3, { timeout: 5000 });

  // Change to a "Starts with" filter - should match "Banana" and "banana"
  await fruitHeader.locator('.ag-header-cell-filter-button').click();
  await expect(filterPopup).toBeVisible();
  // Once a filter is applied, AG Grid shows an extra condition row, so target the first one
  await filterPopup.locator('.ag-filter-select').first().click();
  await page.getByRole('option', { name: 'Begins with', exact: true }).click();
  await filterInput.first().fill('ban');
  await filterPopup.getByRole('button', { name: 'Apply' }).click();
  await expect(rows).toHaveCount(2, { timeout: 5000 });
});

test('Text filters are case-sensitive when caseSensitive is set in column_defs', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_case_sensitive');

  const agRoot = page.locator('.ag-root');
  await expect(agRoot).toBeVisible();

  // Wait for all 5 rows to load
  const rows = agRoot.locator('.ag-center-cols-container .ag-row');
  await expect(rows).toHaveCount(5);

  // Open the filter popup on the Fruit column
  const fruitHeader = agRoot.locator('.ag-header-cell').first();
  await fruitHeader.locator('.ag-header-cell-filter-button').click();

  const filterPopup = page.locator('.ag-filter');
  await expect(filterPopup).toBeVisible();

  // Select the "Equals" filter type
  await filterPopup.locator('.ag-filter-select').click();
  await page.getByRole('option', { name: 'Equals', exact: true }).click();

  // Filter for "apple" and apply - should only match the lowercase "apple"
  const filterInput = filterPopup.getByLabel('Filter Value');
  await filterInput.fill('apple');
  await filterPopup.getByRole('button', { name: 'Apply' }).click();
  await expect(rows).toHaveCount(1, { timeout: 5000 });

  // Change to a "Begins with" filter - should only match the lowercase "banana"
  await fruitHeader.locator('.ag-header-cell-filter-button').click();
  await expect(filterPopup).toBeVisible();
  // Once a filter is applied, AG Grid shows an extra condition row, so target the first one
  await filterPopup.locator('.ag-filter-select').first().click();
  await page.getByRole('option', { name: 'Begins with', exact: true }).click();
  await filterInput.first().fill('ban');
  await filterPopup.getByRole('button', { name: 'Apply' }).click();
  await expect(rows).toHaveCount(1, { timeout: 5000 });
});
