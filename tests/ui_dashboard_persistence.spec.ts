import { expect, test, type Locator, type Page } from '@playwright/test';
import { openPanel, gotoPage, waitForLoad, SELECTORS } from './utils';

/**
 * Disables "Close Panels on Disconnect" so the layout (and the widget session)
 * is persisted across a page refresh, waits for the setting/layout to be saved,
 * then reloads the page.
 * @param page The page
 */
async function persistLayoutAndReload(page: Page): Promise<void> {
  await test.step('Persist layout and reload', async () => {
    // Reset mouse position to not cause unintended hover effects
    await page.mouse.move(0, 0);

    await page
      .getByRole('button', { name: 'More Actions...', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Close Panels on Disconnect', exact: true })
      .click();

    // Wait for the debounced layout/settings to be saved before refreshing
    await page.waitForTimeout(2000);

    await page.reload();
    await waitForLoad(page);
  });
}

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

/**
 * Selects an option from a `ui.picker`.
 * @param page The page
 * @param scope The locator to scope the picker search to
 * @param label The label of the picker
 * @param option The option to select
 */
async function selectPickerOption(
  page: Page,
  scope: Locator,
  label: string,
  option: string
): Promise<void> {
  await scope.getByRole('button', { name: new RegExp(label) }).click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await listbox.getByRole('option', { name: option, exact: true }).click();
}

/**
 * Closes the currently open iris-grid Table Options sidebar. Any of the sidebar
 * pages' close buttons dismiss the whole menu, and the sidebar is unmounted once
 * closed.
 * @param page The page
 */
async function closeTableSidebar(page: Page): Promise<void> {
  await page
    .locator('.table-sidebar')
    .getByRole('button', { name: 'Close', exact: true })
    .last()
    .click();
  await expect(page.locator('.table-sidebar')).toHaveCount(0);
}

/**
 * Adds a custom column to the currently active ui.table via the Table Options
 * sidebar, confirms it was applied, and leaves the sidebar closed.
 * @param page The page
 * @param formula The column formula to enter
 * @param name The name to give the custom column
 */
async function addCustomColumnToActiveTable(
  page: Page,
  formula: string,
  name: string
): Promise<void> {
  await page.getByRole('button', { name: 'Table Options' }).click();
  await page.getByTestId('menu-item-Custom Columns').click();

  // Enter the formula first, then the name: the builder resets the name field
  // shortly after it mounts, so setting the name last ensures it sticks
  const formulaEditor = page
    .locator('.custom-column-input-container .monaco-editor')
    .first();
  await formulaEditor.click();
  await page.keyboard.type(formula);
  await expect(formulaEditor.locator('textarea')).toHaveValue(formula);

  const columnNameInput = page.getByRole('textbox', { name: 'Column Name' });
  await columnNameInput.fill(name);
  await expect(columnNameInput).toHaveValue(name);

  await page.getByRole('button', { name: 'Save Column', exact: true }).click();
  // Give the custom column time to be applied to the table
  await page.waitForTimeout(1500);

  // Navigate back to the Table Options menu and confirm the column was applied
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByTestId('menu-item-Organize Columns').click();
  await expect(page.locator('.visibility-ordering-builder')).toContainText(
    name
  );
  await closeTableSidebar(page);
}

/**
 * Opens Organize Columns for the currently active ui.table and asserts the
 * `present` column is listed and (optionally) the `absent` column is not, then
 * closes the sidebar. Assumes the sidebar starts closed.
 * @param page The page
 * @param present A column name expected to be present
 * @param absent A column name expected to be absent
 */
async function expectActiveTableColumns(
  page: Page,
  present: string,
  absent?: string
): Promise<void> {
  await page.getByRole('button', { name: 'Table Options' }).click();
  await page.getByTestId('menu-item-Organize Columns').click();
  const builder = page.locator('.visibility-ordering-builder');
  await expect(builder).toContainText(present);
  if (absent != null) {
    await expect(builder).not.toContainText(absent);
  }
  await closeTableSidebar(page);
}

test.describe('Dashboard persistence', () => {
  // Input persistence: text fields and pickers should keep their values after a
  // refresh when the layout is persisted.
  test('input values persist across a refresh', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_persist_inputs',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE).first();
    await expect(panel).toBeVisible();

    // Change all inputs away from their default (empty/unselected) values
    await panel.getByLabel('Name').fill('Alice');
    await panel.getByLabel('Amount').fill('42');
    await selectPickerOption(page, panel, 'Color', 'Green');
    await selectPickerOption(page, panel, 'Fruit', 'Banana');

    // Sanity check the values were applied before the refresh
    await expect(panel.getByLabel('Name')).toHaveValue('Alice');
    await expect(panel.getByLabel('Amount')).toHaveValue('42');
    await expect(panel.getByRole('button', { name: /Color/ })).toContainText(
      'Green'
    );
    await expect(panel.getByRole('button', { name: /Fruit/ })).toContainText(
      'Banana'
    );

    await persistLayoutAndReload(page);

    // The panel should be restored with all of its input values intact
    const restoredPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(restoredPanel).toBeVisible();

    await expect(restoredPanel.getByLabel('Name')).toHaveValue('Alice');
    await expect(restoredPanel.getByLabel('Amount')).toHaveValue('42');
    await expect(
      restoredPanel.getByRole('button', { name: /Color/ })
    ).toContainText('Green');
    await expect(
      restoredPanel.getByRole('button', { name: /Fruit/ })
    ).toContainText('Banana');
  });

  // Panel move persistence: a panel that is dragged into its own stack should
  // stay in that location after a refresh.
  test('moved panel stays in place across a refresh', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_persist_move_panel',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // The nested dashboard starts with both panels in a single stack
    await expect(outerPanel.locator('.lm_stack')).toHaveCount(1);

    // Drag "Move Panel B" to the right edge of the nested dashboard to split it
    // into its own stack
    const dragTab = outerPanel.locator('.lm_tab', { hasText: 'Move Panel B' });
    const dashboardBox = await outerPanel.boundingBox();
    if (dashboardBox == null) {
      throw new Error('Could not get bounding box for the nested dashboard');
    }
    await dragTabToTarget(page, dragTab, {
      x: dashboardBox.x + dashboardBox.width * 0.85,
      y: dashboardBox.y + dashboardBox.height * 0.5,
    });

    // After the drag the panels should be in two separate stacks
    await expect(outerPanel.locator('.lm_stack')).toHaveCount(2);

    // Record the location of the dragged panel so we can verify it does not move
    // after the refresh
    const beforeBox = await outerPanel
      .locator('.lm_tab', { hasText: 'Move Panel B' })
      .boundingBox();
    if (beforeBox == null) {
      throw new Error('Could not get bounding box for the dragged tab');
    }

    await persistLayoutAndReload(page);

    const restoredPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(restoredPanel).toBeVisible();

    // The panels should still be in two separate stacks after the refresh...
    await expect(restoredPanel.locator('.lm_stack')).toHaveCount(2);

    // ...and the dragged panel should be in the same location it was dropped
    const afterBox = await restoredPanel
      .locator('.lm_tab', { hasText: 'Move Panel B' })
      .boundingBox();
    if (afterBox == null) {
      throw new Error('Could not get bounding box for the restored tab');
    }
    expect(Math.abs(afterBox.x - beforeBox.x)).toBeLessThan(10);
    expect(Math.abs(afterBox.y - beforeBox.y)).toBeLessThan(10);
  });

  // Active panel in a stack: with multiple panels stacked together, the active
  // tab should persist across a refresh.
  test('active tab in a stack persists across a refresh', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_persist_stack',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // Activate the middle panel in the stack (distinguishes from a layout that
    // defaults to the first or last tab)
    await outerPanel.locator('.lm_tab', { hasText: 'Stack Panel 2' }).click();
    await expect(outerPanel.getByText('Content Two')).toBeVisible();
    await expect(outerPanel.locator('.lm_tab.lm_active')).toContainText(
      'Stack Panel 2'
    );

    await persistLayoutAndReload(page);

    const restoredPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(restoredPanel).toBeVisible();

    // The middle panel should still be the active tab after the refresh
    await expect(restoredPanel.locator('.lm_tab.lm_active')).toContainText(
      'Stack Panel 2'
    );
    await expect(restoredPanel.getByText('Content Two')).toBeVisible();
  });

  // Active tab in a ui.tabs component should persist across a refresh.
  test('active tab in ui.tabs persists across a refresh', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_persist_tabs',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // Switch to the third tab
    await outerPanel.getByRole('tab', { name: 'Tab Three' }).first().click();
    await expect(
      outerPanel.getByText('This is the content of the third tab.')
    ).toBeVisible();
    await expect(
      outerPanel.getByRole('tab', { name: 'Tab Three' }).first()
    ).toHaveAttribute('aria-selected', 'true');

    await persistLayoutAndReload(page);

    const restoredPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(restoredPanel).toBeVisible();

    // The third tab should still be selected after the refresh
    await expect(
      restoredPanel.getByRole('tab', { name: 'Tab Three' }).first()
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      restoredPanel.getByText('This is the content of the third tab.')
    ).toBeVisible();
  });

  // ui.table persistence: custom columns added to both tables in the stack
  // through the UI should each persist across a refresh.
  test('custom columns on both ui.tables in a stack persist across a refresh', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'ui_persist_table_columns',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
      true
    );

    const outerPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(outerPanel).toBeVisible();

    // Add a custom column to "Table One" (columns a, b)
    await outerPanel.locator('.lm_tab', { hasText: 'Table One' }).click();
    await waitForLoad(page);
    await addCustomColumnToActiveTable(page, 'a * 2', 'Doubled');

    // Add a different custom column to "Table Two" (columns c, d)
    await outerPanel.locator('.lm_tab', { hasText: 'Table Two' }).click();
    await waitForLoad(page);
    await addCustomColumnToActiveTable(page, 'c * 3', 'Tripled');

    await persistLayoutAndReload(page);

    const restoredPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(restoredPanel).toBeVisible();

    // Each table should keep its own custom column after the refresh (and not
    // pick up the other table's column)
    await restoredPanel.locator('.lm_tab', { hasText: 'Table One' }).click();
    await waitForLoad(page);
    await expectActiveTableColumns(page, 'Doubled', 'Tripled');

    await restoredPanel.locator('.lm_tab', { hasText: 'Table Two' }).click();
    await waitForLoad(page);
    await expectActiveTableColumns(page, 'Tripled', 'Doubled');
  });
});
