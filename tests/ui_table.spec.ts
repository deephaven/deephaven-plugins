import { expect, test } from '@playwright/test';
import {
  SELECTORS,
  openPanel,
  gotoPage,
  clickGridRow,
  clickGridColumnHeader,
  setGridQuickFilter,
  waitForLoad,
} from './utils';

test.describe('UI table', () => {
  [
    't_alignment',
    't_background_color',
    't_color',
    't_color_column_source',
    't_priority',
    't_value_format',
    't_display_names',
    't_single_agg',
    't_bottom_agg',
    't_top_agg',
    't_databar_basic',
    't_databar_multi_cols',
    't_databar_full_options',
    't_databar_conditional',
    't_databar_priority',
    't_databar_mixed',
    't_databar_gradient',
    't_databar_text_color',
    't_databar_gradient_text_color',
    't_databar_pos_neg_text_color',
    't_heatmap_basic',
    't_heatmap_diverging',
    't_heatmap_multistop',
    't_heatmap_positioned_stops',
    't_heatmap_text_color',
    't_heatmap_both',
    't_heatmap_databar_overlay',
    't_heatmap_databar_mixed',
    't_programmatic_sort_asc',
    't_programmatic_sort_abs_desc',
    't_rollup_format',
  ].forEach(name => {
    test(name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, name, SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

      await expect(
        page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      ).toHaveScreenshot();
    });
  });
});

test('UI table responds to prop changes', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    'toggle_table',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

  await expect(locator).toHaveScreenshot();

  await locator.getByRole('button', { name: 'formatting' }).click();
  await expect(locator).toHaveScreenshot();
  await locator.getByRole('button', { name: 'databars' }).click();
  await expect(locator).toHaveScreenshot();
  await locator.getByRole('button', { name: 'case' }).click();
  await expect(locator).toHaveScreenshot();
});

test('UI table on_selection_change', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 't_selection', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

  const locator = page.locator(
    `${SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE} .iris-grid`
  );

  await clickGridRow(locator, 3);
  await expect(page.getByText('Selection: CAT/NYPE')).toBeVisible();

  await clickGridRow(locator, 0, { modifiers: ['ControlOrMeta'] });
  await expect(page.getByText('Selection: BIRD/TPET, CAT/NYPE')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByText('Selection: None')).toBeVisible();
});

test('UI table with rollup table', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 't_rollup', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
  await expect(locator.locator('.iris-grid')).toBeVisible();
});

test('UI table with tree table', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 't_tree', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
  await expect(locator.locator('.iris-grid')).toBeVisible();
});

// DH-22976: Server-owned `sorts`/`quick_filters` re-apply when their values
// change programmatically. The button updates both from the server, and the
// quick filter change exercises the new IrisGrid `updateQuickFilters` path.
test('UI table sorts and filters update programmatically', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    't_controlled',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
  await expect(locator.locator('.iris-grid')).toBeVisible();
  await expect(locator).toHaveScreenshot();

  await locator.getByRole('button', { name: 'Update sort and filter' }).click();
  await waitForLoad(page);
  await expect(locator).toHaveScreenshot();
});

// DH-22976: Sorts and quick filters the user changes in the UI are persisted and
// restored after a page refresh (user-owned state via `default_*`).
test('UI table user sorts and filters persist after refresh', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 't_default', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
  const grid = locator.locator('.iris-grid');
  await expect(grid).toBeVisible();

  // User changes the sort by clicking a column header and sets a quick filter.
  await clickGridColumnHeader(grid, 50);
  await waitForLoad(page);
  await setGridQuickFilter(grid, 50, 'DOG');
  await waitForLoad(page);
  await expect(locator).toHaveScreenshot();

  // Disable "Close Panels on Disconnect" so the layout is persisted on refresh.
  await page
    .getByRole('button', { name: 'More Actions...', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Close Panels on Disconnect', exact: true })
    .click();
  // Wait for the debounced setting to save before refreshing.
  await page.waitForTimeout(2000);

  await page.reload();
  await waitForLoad(page);

  // The user's sort and quick filter are restored from the persisted layout.
  await expect(locator).toHaveScreenshot();
});
