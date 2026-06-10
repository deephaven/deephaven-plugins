import { expect, test, type Locator, type Page } from '@playwright/test';
import { openPanel, gotoPage, SELECTORS } from './utils';

/**
 * Performs a golden-layout tab drag by manually driving the mouse. A simple
 * `dragTo` does not work with golden-layout because it relies on a sequence of
 * mousedown/mousemove/mouseup events and a drag threshold before the drag proxy
 * is created.
 * @param page The page
 * @param tab The tab to drag
 * @param target The target point to drop the tab at
 */
async function dragTabToTarget(
  page: Page,
  tab: Locator,
  target: { x: number; y: number }
): Promise<void> {
  const box = await tab.boundingBox();
  if (box == null) {
    throw new Error('Could not get bounding box for tab to drag');
  }
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Exceed the drag threshold to start the golden-layout drag proxy
  await page.mouse.move(startX + 15, startY + 15, { steps: 5 });
  // Move towards the drop target
  await page.mouse.move(target.x, target.y, { steps: 20 });
  // Settle on the target so golden-layout registers the drop zone
  await page.mouse.move(target.x, target.y, { steps: 5 });
  await page.mouse.up();
}

test.describe('Buggy Drag Panel (DH-22743)', () => {
  test('dragged panel stays in place and updates after input change', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_buggy_drag_panel',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // The nested dashboard starts with the Input panel and the draggable panel
    // in a single stack.
    const dragTab = page.locator('.lm_tab', { hasText: 'Drag me: title' });
    await expect(dragTab).toHaveCount(1);
    await expect(
      outerPanel.getByText(
        'Drag this panel to a new stack, then change the value'
      )
    ).toBeVisible();

    // Drag the panel to the right edge of the nested dashboard to split it into
    // a new stack.
    const dashboardBox = await outerPanel.boundingBox();
    if (dashboardBox == null) {
      throw new Error('Could not get bounding box for the nested dashboard');
    }
    await dragTabToTarget(page, dragTab, {
      x: dashboardBox.x + dashboardBox.width * 0.85,
      y: dashboardBox.y + dashboardBox.height * 0.5,
    });

    // After the drag there should still be exactly one draggable panel (the bug
    // duplicates it, leaving a blank panel in the original location).
    await expect(
      page.locator('.lm_tab', { hasText: 'Drag me: title' })
    ).toHaveCount(1);
    await expect(
      outerPanel.getByText(
        'Drag this panel to a new stack, then change the value'
      )
    ).toBeVisible();

    // Record the location of the dragged panel so we can verify it does not move
    // back after the input changes.
    const draggedTab = page.locator('.lm_tab', { hasText: 'Drag me:' });
    const beforeBox = await draggedTab.boundingBox();
    if (beforeBox == null) {
      throw new Error('Could not get bounding box for the dragged tab');
    }

    // Change the value in the Input panel.
    const input = outerPanel.getByLabel('Title');
    await input.fill('updated');

    // The dragged panel title should update to reflect the new value...
    const updatedTab = page.locator('.lm_tab', { hasText: 'Drag me: updated' });
    await expect(updatedTab).toHaveCount(1);
    // ...and the panel content should still be visible (not blank).
    await expect(
      outerPanel.getByText(
        'Drag this panel to a new stack, then change the value'
      )
    ).toBeVisible();

    // ...and it should still be in the location it was dragged to.
    const afterBox = await updatedTab.boundingBox();
    if (afterBox == null) {
      throw new Error('Could not get bounding box for the updated tab');
    }
    expect(Math.abs(afterBox.x - beforeBox.x)).toBeLessThan(5);
    expect(Math.abs(afterBox.y - beforeBox.y)).toBeLessThan(5);
  });
});
