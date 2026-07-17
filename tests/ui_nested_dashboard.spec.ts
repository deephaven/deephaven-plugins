import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, waitForLoad, SELECTORS } from './utils';

test.describe('Nested Dashboards', () => {
  test('renders a dashboard inside a panel', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_nested_dashboard',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    // Get the outer panel (first match) for screenshots
    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // The nested dashboard should contain interior panels with content
    await expect(outerPanel.getByText('Content A')).toBeVisible();
    await expect(outerPanel.getByText('Content B')).toBeVisible();

    await expect(outerPanel).toHaveScreenshot();
  });

  test('nested dashboard panels can be interacted with', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_nested_dashboard_interactive',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();

    // Interact with a button inside the nested dashboard
    const button = outerPanel.getByRole('button', {
      name: 'Clicked 0 times',
    });
    await expect(button).toBeVisible();
    await button.click();
    await expect(
      outerPanel.getByRole('button', { name: 'Clicked 1 times' })
    ).toBeVisible();
  });

  test('deeply nested dashboards render correctly', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_deeply_nested_dashboard',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // Should see content from multiple levels of nesting
    await expect(outerPanel.getByText('Content Level 1')).toBeVisible();
    await expect(outerPanel.getByText('Content Level 2')).toBeVisible();
    await expect(outerPanel.getByText('Deepest Content')).toBeVisible();
  });

  // DH-22995: A dashboard whose only child is a non-panel element (auto-wrapped
  // in a panel). After disabling "Close Panels on Disconnect" to persist the
  // layout and refreshing the page, the panel reopens but its content renders
  // off-screen with an unnecessary scroll bar instead of being visible.
  test('dashboard content is visible after refresh with panels persisted', async ({
    page,
  }) => {
    await gotoPage(page, '');

    // Open the heading dashboard from the Panels menu
    const appPanels = page.getByRole('button', { name: 'Panels', exact: true });
    await expect(appPanels).toBeEnabled();
    await appPanels.click();

    const search = page.getByRole('searchbox', {
      name: 'Find Table, Plot or Widget',
      exact: true,
    });
    await search.fill('ui_heading_dashboard');
    await page
      .getByRole('button', { name: 'ui_heading_dashboard', exact: true })
      .click();

    // Reset mouse position to not cause unintended hover effects
    await page.mouse.move(0, 0);

    const heading = page.getByText('Reproducing DH-22995');

    // The dashboard content renders and is visible within the viewport
    await expect(heading).toBeVisible();
    await expect(heading).toBeInViewport({ ratio: 1.0 });

    // Disable "Close Panels on Disconnect" so the layout is persisted on refresh
    await page
      .getByRole('button', { name: 'More Actions...', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Close Panels on Disconnect', exact: true })
      .click();

    // Wait for debounce option to save the setting before refreshing the page
    await page.waitForTimeout(2000);

    // Refresh the page - the dashboard should be restored from the persisted layout
    await page.reload();
    await waitForLoad(page);

    // The heading is restored to the document and reported as visible...
    await expect(heading).toBeVisible();

    // ...but the bug causes it to render off-screen with an unnecessary scroll
    // bar, so it is not actually within the viewport. This is the failing step.
    await expect(heading).toBeInViewport({ ratio: 1.0 });
  });
});
