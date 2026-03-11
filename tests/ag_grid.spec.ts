import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('AgGrid loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_random');
  await expect(page.locator('.ag-root')).toHaveScreenshot();
});

test('AgGrid with RollupTable loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_rollup');
  await expect(page.locator('.ag-root')).toHaveScreenshot();
});

test('Column headers match column names match exactly', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_foo_bar');
  await expect(page.locator('.ag-header-cell-text')).toHaveText([
    'Foo_Bar',
    'FooBar',
  ]);
});

test('Advanced filter with text equals', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_filter_test');

  await expect(page.locator('.ag-root')).toBeVisible();

  // Open advanced filter builder
  await page.locator('.ag-advanced-filter-header-button').click();
  await expect(page.locator('.ag-advanced-filter-builder')).toBeVisible();

  // Select Name column
  await page.locator('.ag-advanced-filter-builder-column-select').click();
  await page.locator('.ag-list-item').filter({ hasText: 'Name' }).click();

  // Select equals operator
  await page.locator('.ag-advanced-filter-builder-option-select').click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^equals$/i })
    .click();

  // Enter value
  await page
    .locator('.ag-advanced-filter-builder-value-1 input')
    .fill('Alice');

  // Apply filter
  await page.locator('button').filter({ hasText: 'Apply' }).click();

  await page.waitForTimeout(500);

  // Verify we have 50 rows (Alice appears at even indices: 0, 2, 4, ..., 98)
  const displayedRows = await page
    .locator('.ag-center-cols-container .ag-row')
    .count();
  expect(displayedRows).toBe(50);
});

test('Advanced filter with number range', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_filter_test');

  await expect(page.locator('.ag-root')).toBeVisible();

  // Open advanced filter builder
  await page.locator('.ag-advanced-filter-header-button').click();
  await expect(page.locator('.ag-advanced-filter-builder')).toBeVisible();

  // First condition: Age > 30
  await page.locator('.ag-advanced-filter-builder-column-select').click();
  await page.locator('.ag-list-item').filter({ hasText: 'Age' }).click();

  await page.locator('.ag-advanced-filter-builder-option-select').click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^greater than$/i })
    .click();

  await page.locator('.ag-advanced-filter-builder-value-1 input').fill('30');

  // Add second condition with AND
  await page
    .locator('button')
    .filter({ hasText: /^Add Condition$/i })
    .click();

  // Second condition: Age < 50
  await page
    .locator('.ag-advanced-filter-builder-item')
    .nth(1)
    .locator('.ag-advanced-filter-builder-column-select')
    .click();
  await page.locator('.ag-list-item').filter({ hasText: 'Age' }).click();

  await page
    .locator('.ag-advanced-filter-builder-item')
    .nth(1)
    .locator('.ag-advanced-filter-builder-option-select')
    .click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^less than$/i })
    .click();

  await page
    .locator('.ag-advanced-filter-builder-item')
    .nth(1)
    .locator('.ag-advanced-filter-builder-value-1 input')
    .fill('50');

  // Apply filter
  await page.locator('button').filter({ hasText: 'Apply' }).click();

  await page.waitForTimeout(500);

  // Verify we have filtered results (Age between 31 and 49 inclusive)
  const displayedRows = await page
    .locator('.ag-center-cols-container .ag-row')
    .count();
  expect(displayedRows).toBeGreaterThan(0);
  expect(displayedRows).toBeLessThan(100);
});

test('Advanced filter with nested conditions', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_filter_test');

  await expect(page.locator('.ag-root')).toBeVisible();

  // Open advanced filter builder
  await page.locator('.ag-advanced-filter-header-button').click();
  await expect(page.locator('.ag-advanced-filter-builder')).toBeVisible();

  // Create a condition group (OR)
  await page
    .locator('button')
    .filter({ hasText: /^Add Condition Group$/i })
    .click();

  // Change operator to OR
  await page
    .locator('.ag-advanced-filter-builder-item-condition')
    .first()
    .locator('.ag-advanced-filter-builder-join-operator-select')
    .click();
  await page.locator('.ag-list-item').filter({ hasText: 'OR' }).click();

  // First condition in group: Name = Alice
  await page
    .locator('.ag-advanced-filter-builder-item-condition')
    .first()
    .locator('.ag-advanced-filter-builder-column-select')
    .click();
  await page.locator('.ag-list-item').filter({ hasText: 'Name' }).click();

  await page
    .locator('.ag-advanced-filter-builder-item-condition')
    .first()
    .locator('.ag-advanced-filter-builder-option-select')
    .click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^equals$/i })
    .click();

  await page
    .locator('.ag-advanced-filter-builder-item-condition')
    .first()
    .locator('.ag-advanced-filter-builder-value-1 input')
    .fill('Alice');

  // Add second condition to the group
  await page
    .locator('.ag-advanced-filter-builder-item-tree')
    .first()
    .locator('button')
    .filter({ hasText: /^Add Condition$/i })
    .click();

  // Second condition: Name = Bob
  const secondCondition = page
    .locator('.ag-advanced-filter-builder-item-condition')
    .nth(1);
  await secondCondition
    .locator('.ag-advanced-filter-builder-column-select')
    .click();
  await page.locator('.ag-list-item').filter({ hasText: 'Name' }).click();

  await secondCondition
    .locator('.ag-advanced-filter-builder-option-select')
    .click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^equals$/i })
    .click();

  await secondCondition
    .locator('.ag-advanced-filter-builder-value-1 input')
    .fill('Bob');

  // Add top-level condition with AND: Score > 50
  await page
    .locator('.ag-advanced-filter-builder')
    .locator('button')
    .filter({ hasText: /^Add Condition$/i })
    .first()
    .click();

  const topCondition = page
    .locator('.ag-advanced-filter-builder > .ag-advanced-filter-builder-list > .ag-advanced-filter-builder-item')
    .last();
  await topCondition
    .locator('.ag-advanced-filter-builder-column-select')
    .click();
  await page.locator('.ag-list-item').filter({ hasText: 'Score' }).click();

  await topCondition
    .locator('.ag-advanced-filter-builder-option-select')
    .click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^greater than$/i })
    .click();

  await topCondition
    .locator('.ag-advanced-filter-builder-value-1 input')
    .fill('50');

  // Apply filter
  await page.locator('button').filter({ hasText: 'Apply' }).click();

  await page.waitForTimeout(500);

  // Verify we have filtered results
  const displayedRows = await page
    .locator('.ag-center-cols-container .ag-row')
    .count();
  expect(displayedRows).toBeGreaterThan(0);
  expect(displayedRows).toBeLessThan(100);
});

test('Advanced filter combined with regular filter', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ag_filter_test');

  await expect(page.locator('.ag-root')).toBeVisible();

  // First apply regular filter on Score column
  await page
    .locator('.ag-header-cell')
    .filter({ hasText: 'Score' })
    .locator('.ag-header-cell-menu-button')
    .click();

  await page.locator('.ag-menu-option').filter({ hasText: 'Filter' }).click();

  await page.locator('.ag-filter-select').click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^greater than$/i })
    .click();

  await page.locator('.ag-filter input[type="text"]').fill('25');
  await page.locator('button').filter({ hasText: /^Apply$/i }).click();

  // Now add advanced filter: Name = 'Alice'
  await page.locator('.ag-advanced-filter-header-button').click();
  await expect(page.locator('.ag-advanced-filter-builder')).toBeVisible();

  await page.locator('.ag-advanced-filter-builder-column-select').click();
  await page.locator('.ag-list-item').filter({ hasText: 'Name' }).click();

  await page.locator('.ag-advanced-filter-builder-option-select').click();
  await page
    .locator('.ag-list-item')
    .filter({ hasText: /^equals$/i })
    .click();

  await page
    .locator('.ag-advanced-filter-builder-value-1 input')
    .fill('Alice');

  await page.locator('button').filter({ hasText: 'Apply' }).click();

  await page.waitForTimeout(500);

  // Verify we have filtered results (combination of both filters)
  const displayedRows = await page
    .locator('.ag-center-cols-container .ag-row')
    .count();
  expect(displayedRows).toBeGreaterThan(0);
  expect(displayedRows).toBeLessThan(50); // Should be more restrictive than either filter alone
});
