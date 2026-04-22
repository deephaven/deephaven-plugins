import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test.describe('UI query params', () => {
  test('displays query params from URL', async ({ page }) => {
    await gotoPage(page, '?page=2&sort=asc');
    await openPanel(page, 'ui_query_params', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('page=2')).toBeVisible();
    await expect(panel.getByText('sort=asc')).toBeVisible();
  });

  test('displays no query params when URL has none', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_query_params', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('No query params')).toBeVisible();
  });

  test('reads a single query param', async ({ page }) => {
    await gotoPage(page, '?page=5');
    await openPanel(
      page,
      'ui_query_param_single',
      SELECTORS.REACT_PANEL_VISIBLE
    );

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('page=5')).toBeVisible();
  });

  test('single param shows None when absent', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_query_param_single',
      SELECTORS.REACT_PANEL_VISIBLE
    );

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('page=None')).toBeVisible();
  });

  test('set_query_param updates the URL', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_set_query_param', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('counter=0')).toBeVisible();

    await panel.getByRole('button', { name: 'Increment (current: 0)' }).click();

    // After clicking, the URL should be updated and the component re-rendered
    await expect(
      panel.getByRole('button', { name: 'Increment (current: 1)' })
    ).toBeVisible();
    await expect(panel.getByText('counter=1')).toBeVisible();

    // Verify the URL was updated
    await expect(page).toHaveURL(/counter=1/);
  });

  test('supports multi-value query params', async ({ page }) => {
    await gotoPage(page, '?tag=python&tag=java');
    await openPanel(page, 'ui_query_params', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('tag=python')).toBeVisible();
    await expect(panel.getByText('tag=java')).toBeVisible();
  });
});
