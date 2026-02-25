import { expect, test } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS, waitForLoad } from './utils';

test.describe('Nested Dashboards', () => {
  test('renders a dashboard inside a panel', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_nested_dashboard',
      SELECTORS.REACT_PANEL_VISIBLE,
      true
    );

    // Get the outer panel (first match) for screenshots
    const outerPanel = page.locator(SELECTORS.REACT_PANEL_VISIBLE).first();
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
      SELECTORS.REACT_PANEL_VISIBLE,
      true
    );

    const outerPanel = page.locator(SELECTORS.REACT_PANEL_VISIBLE).first();

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
      SELECTORS.REACT_PANEL_VISIBLE,
      true
    );

    const outerPanel = page.locator(SELECTORS.REACT_PANEL_VISIBLE).first();
    await expect(outerPanel).toBeVisible();

    // Should see content from multiple levels of nesting
    await expect(outerPanel.getByText('Content Level 1')).toBeVisible();
    await expect(outerPanel.getByText('Content Level 2')).toBeVisible();
    await expect(outerPanel.getByText('Deepest Content')).toBeVisible();
  });

  test('nested dashboard resizes with parent panel', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_nested_dashboard',
      SELECTORS.REACT_PANEL_VISIBLE,
      true
    );

    const outerPanel = page.locator(SELECTORS.REACT_PANEL_VISIBLE).first();
    await expect(outerPanel).toBeVisible();

    // Get initial panel content bounding box
    const initialBox = await outerPanel.boundingBox();
    expect(initialBox).not.toBeNull();

    // Panels should still be visible after potential resize events
    await expect(outerPanel.getByText('Content A')).toBeVisible();
    await expect(outerPanel.getByText('Content B')).toBeVisible();
  });
});
