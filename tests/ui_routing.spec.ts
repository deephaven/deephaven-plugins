import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

test.describe('UI routing - use_path', () => {
  test('displays the current path', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_use_path', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('path=/')).toBeVisible();
  });
});

test.describe('UI routing - use_navigate', () => {
  test('navigates to a path when button is clicked', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_use_navigate', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('current_path=/')).toBeVisible();

    await panel.getByRole('button', { name: 'Go Dashboard' }).click();

    await expect(panel.getByText('current_path=/dashboard')).toBeVisible();
  });

  test('navigates with query params', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_use_navigate', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await panel.getByRole('button', { name: 'Go with query' }).click();

    await expect(panel.getByText('current_path=/page')).toBeVisible();
    await expect(page).toHaveURL(/tab=1/);
  });

  test('navigates with fragment only', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_use_navigate', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await panel.getByRole('button', { name: 'Go with fragment' }).click();

    // Path should be preserved
    await expect(panel.getByText('current_path=/')).toBeVisible();
    await expect(page).toHaveURL(/#section-2/);
  });

  test('push navigation creates history entry', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_use_navigate', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

    // Navigate with push (creates history entry)
    await panel.getByRole('button', { name: 'Go Settings (push)' }).click();
    await expect(panel.getByText('current_path=/settings')).toBeVisible();

    // Go back should return to previous page
    await page.goBack();
    await expect(panel.getByText('current_path=/')).toBeVisible();
  });
});

test.describe('UI routing - router', () => {
  test('renders index route at root path', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_router', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText('dashboard_home')).toBeVisible();
  });
});

test.describe('UI routing - url_components', () => {
  test('displays URL components', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'ui_url_components', SELECTORS.REACT_PANEL_VISIBLE);

    const panel = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
    await expect(panel.getByText(/scheme=/)).toBeVisible();
    await expect(panel.getByText(/netloc=/)).toBeVisible();
    await expect(panel.getByText(/path=/)).toBeVisible();
  });
});
