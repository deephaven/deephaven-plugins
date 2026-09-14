import { expect, test } from '@playwright/test';
import {
  SELECTORS,
  openPanel,
  gotoPage,
  clickGridRow,
  waitForGridRender,
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

      const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
      await waitForGridRender(locator);

      await expect(locator).toHaveScreenshot();
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

  // Wait for the grid to paint its data so the screenshot isn't of a blank grid
  await waitForGridRender(locator);

  await expect(locator).toHaveScreenshot();

  // Each toggle round-trips to the server, and the buttons are inside the
  // screenshot region. Wait for the button to relabel itself before shooting:
  // the label and the table's new props arrive in the same render, so a
  // relabelled button means the toggle landed. Without this, a screenshot can
  // stabilize on the pre-click frame -- harmless when comparing against a
  // baseline (the mismatch just retries) but silently baked in by
  // --update-snapshots, which has nothing to compare against.
  await locator.getByRole('button', { name: 'formatting' }).click();
  await expect(
    locator.getByRole('button', { name: 'Turn formatting on' })
  ).toBeVisible();
  await expect(locator).toHaveScreenshot();

  await locator.getByRole('button', { name: 'databars' }).click();
  await expect(
    locator.getByRole('button', { name: 'Turn databars on' })
  ).toBeVisible();
  await expect(locator).toHaveScreenshot();

  await locator.getByRole('button', { name: 'case' }).click();
  await expect(
    locator.getByRole('button', { name: 'Original case' })
  ).toBeVisible();
  await expect(locator).toHaveScreenshot();
});

test('UI table on_selection_change', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 't_selection', SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

  const locator = page.locator(
    `${SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE} .iris-grid`
  );

  await clickGridRow(locator, 3);
  await expect(page.getByText('Selection: CAT/PETX')).toBeVisible();

  await clickGridRow(locator, 0, { modifiers: ['ControlOrMeta'] });
  await expect(page.getByText('Selection: BIRD/TPET, CAT/PETX')).toBeVisible();

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

// DH-22976: Explicit controlled props re-apply when their values change
// programmatically. The quick-filter change exercises IrisGrid's
// `updateQuickFilters` path.
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

// DH-22976: Existing user-owned sorts and quick filters persist after refresh.
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
  await setGridQuickFilter(grid, 10, 'DOG');
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

// DH-22976: Controlled sorts and quick filters report user changes back to the
// server, and the round-tripped values become the new controlled values.
test('UI table controlled sorts and filters round-trip user changes', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    't_controlled_roundtrip',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
  const grid = locator.locator('.iris-grid');
  await expect(grid).toBeVisible();
  await expect(locator.getByText('Sorts: Size:ASC')).toBeVisible();
  await expect(locator.getByText('Filters: Sym=CAT')).toBeVisible();

  // Editing the `Sym` quick filter invokes `on_quick_filters_change`.
  await setGridQuickFilter(grid, 10, 'DOG');
  await waitForLoad(page);
  await expect(locator.getByText('Filters: Sym=DOG')).toBeVisible();

  // Sorting by clicking the `Sym` header invokes `on_sorts_change`.
  await clickGridColumnHeader(grid, 50);
  await waitForLoad(page);
  await expect(locator.getByText('Sorts: Sym:ASC')).toBeVisible();

  await expect(locator).toHaveScreenshot();
});

// DH-22976: `sorts` is controlled, `quick_filters` is not. A server update
// re-applies the sort but must leave the user's quick filter alone.
test('UI table controlled sorts with uncontrolled filters', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    't_sorts_controlled',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
  const grid = locator.locator('.iris-grid');
  await expect(grid).toBeVisible();

  // User owns the quick filter, so replace the initial `CAT` with `DOG`.
  await setGridQuickFilter(grid, 10, 'DOG');
  await waitForLoad(page);
  await expect(locator).toHaveScreenshot();

  // The server sets sorts to `Size:DESC` and quick filters to `Sym=BEAR`. Only
  // the sort applies; the filter stays on the user's `DOG`.
  await locator.getByRole('button', { name: 'Update sort and filter' }).click();
  await waitForLoad(page);
  await expect(locator).toHaveScreenshot();
});

// DH-22976: `quick_filters` is controlled, `sorts` is not. A server update
// re-applies the quick filter but must leave the user's sort alone.
test('UI table controlled filters with uncontrolled sorts', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    't_quick_filters_controlled',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );

  const locator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
  const grid = locator.locator('.iris-grid');
  await expect(grid).toBeVisible();

  // User owns the sort, so replace the initial `Size:ASC` with `Sym:ASC`.
  await clickGridColumnHeader(grid, 50);
  await waitForLoad(page);
  await expect(locator).toHaveScreenshot();

  // The server sets sorts to `Size:DESC` and quick filters to `Sym=BEAR`. Only
  // the filter applies; the sort stays on the user's `Sym:ASC`.
  await locator.getByRole('button', { name: 'Update sort and filter' }).click();
  await waitForLoad(page);
  await expect(locator).toHaveScreenshot();
});
