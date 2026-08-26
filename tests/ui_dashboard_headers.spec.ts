import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoPage, waitForLoad } from './utils';

/**
 * Opens a top-level dashboard widget from the Panels menu. Unlike `openPanel`,
 * a dashboard widget opens as its own dashboard tab rather than a single panel.
 * @param page The page
 * @param name The name of the dashboard variable
 */
async function openDashboard(page: Page, name: string): Promise<void> {
  await test.step(`Open dashboard (${name})`, async () => {
    const appPanels = page.getByRole('button', { name: 'Panels', exact: true });
    await expect(appPanels).toBeEnabled();
    await appPanels.click();

    const search = page.getByRole('searchbox', {
      name: 'Find Table, Plot or Widget',
      exact: true,
    });
    await search.fill(name);
    await page.getByRole('button', { name, exact: true }).click();

    // Reset mouse position to not cause unintended hover effects
    await page.mouse.move(0, 0);

    await waitForLoad(page);
  });
}

/**
 * Gets the golden-layout tab for the panel with the given title.
 * @param scope The page or locator to search within
 * @param title The panel title
 */
function panelTab(scope: Page | Locator, title: string): Locator {
  return scope.locator('.lm_tab', { hasText: title });
}

/**
 * Asserts the panel tab exists in the DOM but its header is not displayed.
 * @param scope The page or locator to search within
 * @param title The panel title
 */
async function expectHeaderHidden(
  scope: Page | Locator,
  title: string
): Promise<void> {
  const tab = panelTab(scope, title);
  await expect(tab).toHaveCount(1);
  await expect(tab).toBeHidden();
}

/**
 * Asserts the panel tab for the given title is displayed.
 * @param scope The page or locator to search within
 * @param title The panel title
 */
async function expectHeaderVisible(
  scope: Page | Locator,
  title: string
): Promise<void> {
  const tab = panelTab(scope, title);
  await expect(tab).toHaveCount(1);
  await expect(tab).toBeVisible();
}

test.describe('Dashboard headers', () => {
  test('shows panel headers by default', async ({ page }) => {
    await gotoPage(page, '');
    await openDashboard(page, 'ui_dashboard_headers_on');

    await expect(page.getByText('Content shown alpha')).toBeVisible();
    await expect(page.getByText('Content shown beta')).toBeVisible();

    await expectHeaderVisible(page, 'Shown Alpha');
    await expectHeaderVisible(page, 'Shown Beta');
  });

  test('hides panel headers when show_headers is False', async ({ page }) => {
    await gotoPage(page, '');
    await openDashboard(page, 'ui_dashboard_headers_off');

    await expect(page.getByText('Content hidden alpha')).toBeVisible();
    await expect(page.getByText('Content hidden beta')).toBeVisible();

    await expectHeaderHidden(page, 'Hidden Alpha');
    await expectHeaderHidden(page, 'Hidden Beta');
  });

  test('nested dashboard shows its headers inside a headerless dashboard', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openDashboard(page, 'ui_dashboard_headers_off_nested_on');

    const nested = page.locator('.dh-nested-dashboard');
    await expect(page.getByText('Content outer hidden')).toBeVisible();
    await expect(nested.getByText('Content inner shown')).toBeVisible();

    // The outer dashboard hides its headers, including the panel wrapping the
    // nested dashboard
    await expectHeaderHidden(page, 'Outer Hidden');
    await expectHeaderHidden(page, 'Wrapper Hidden');

    // The nested dashboard opts back in to headers
    await expectHeaderVisible(nested, 'Inner Shown');
  });

  test('nested dashboard hides its headers inside a dashboard with headers', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openDashboard(page, 'ui_dashboard_headers_on_nested_off');

    const nested = page.locator('.dh-nested-dashboard');
    await expect(page.getByText('Content outer shown')).toBeVisible();
    await expect(nested.getByText('Content inner hidden')).toBeVisible();

    await expectHeaderVisible(page, 'Outer Shown');
    await expectHeaderVisible(page, 'Wrapper Shown');

    await expectHeaderHidden(nested, 'Inner Hidden');
  });

  test('nested dashboard without show_headers defaults to showing headers', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openDashboard(page, 'ui_dashboard_headers_off_nested_default');

    const nested = page.locator('.dh-nested-dashboard');
    await expect(page.getByText('Content outer default')).toBeVisible();
    await expect(nested.getByText('Content inner default')).toBeVisible();

    await expectHeaderHidden(page, 'Outer Default');
    await expectHeaderHidden(page, 'Wrapper Default');

    await expectHeaderVisible(nested, 'Inner Default');
  });
});
