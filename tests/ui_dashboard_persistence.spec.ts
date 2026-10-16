import {
  expect,
  test,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';
import {
  openPanel,
  gotoPage,
  waitForLoad,
  SELECTORS,
  generateVarName,
  pasteInMonaco,
} from './utils';

/**
 * Runs a command in the console.
 * @param page The page
 * @param command The command to run
 */
async function runInConsole(page: Page, command: string): Promise<void> {
  await test.step('Run command in console', async () => {
    await pasteInMonaco(page.locator('.console-input'), command);
    await page.keyboard.press('Enter');
  });
}

/**
 * Disables "Close Panels on Disconnect" so the layout (and the widget session)
 * is persisted across a page refresh, and waits for the setting/layout to be saved.
 * @param page The page
 */
async function persistLayout(page: Page): Promise<void> {
  await test.step('Persist layout', async () => {
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
  });
}

/**
 * Persists the layout, then reloads the page.
 * @param page The page
 */
async function persistLayoutAndReload(page: Page): Promise<void> {
  await persistLayout(page);
  await test.step('Reload', async () => {
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

  // Saved state must not be restored into a component whose code changed, e.g. a
  // value that is now used as a different type. A sibling whose code didn't change
  // keeps its state, which it wouldn't if the bad state broke the whole render.
  test('state of a component whose code changed is discarded on refresh', async ({
    page,
  }) => {
    await gotoPage(page, '');

    // Unique names, since browsers run in parallel against the same server
    const varName = generateVarName();
    const unchanged = `${varName}_unchanged`;
    const changed = `${varName}_changed`;

    await runInConsole(
      page,
      `from deephaven import ui

@ui.component
def ${unchanged}():
    text, set_text = ui.use_state("Unchanged default")
    return ui.text_field(label="Unchanged", value=text, on_change=set_text)

@ui.component
def ${changed}():
    greeting, set_greeting = ui.use_state("Hello")
    count, set_count = ui.use_state(42)
    return ui.flex(
        ui.text_field(label="Greeting", value=greeting, on_change=set_greeting),
        ui.number_field(label="Count", value=count, on_change=set_count),
    )

@ui.component
def ${varName}_parent():
    return ui.flex(${unchanged}(), ${changed}(), direction="column")

${varName} = ${varName}_parent()`
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE).first();
    await expect(panel.getByLabel('Count', { exact: true })).toBeVisible();
    await panel.getByLabel('Unchanged').fill('Kept');
    await panel.getByLabel('Greeting').fill('Hi');
    await expect(panel.getByLabel('Unchanged')).toHaveValue('Kept');
    await expect(panel.getByLabel('Greeting')).toHaveValue('Hi');

    // Redefine only the changed component, so its saved `count` (an int) would break `.upper()`
    await runInConsole(
      page,
      `@ui.component
def ${changed}():
    greeting, set_greeting = ui.use_state("Goodbye")
    shout, set_shout = ui.use_state("Foo")
    return ui.flex(
        ui.text_field(label="Greeting", value=greeting, on_change=set_greeting),
        ui.text_field(label="Shout", value=shout.upper(), on_change=set_shout),
    )`
    );

    await persistLayoutAndReload(page);

    const restoredPanel = page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .first();
    await expect(restoredPanel.getByLabel('Shout')).toHaveValue('FOO');
    await expect(restoredPanel.getByLabel('Greeting')).toHaveValue('Goodbye');
    await expect(restoredPanel.getByLabel('Unchanged')).toHaveValue('Kept');
  });

  // Panel count: the widget's saved state decides how many panels it renders
  // after a refresh, so the refreshed document can have more or fewer panels
  // than the saved layout.
  test.describe('panel count changes across a refresh', () => {
    function panelTab(scope: Locator, title: string): Locator {
      return scope.locator('.lm_tab', {
        hasText: new RegExp(`^\\s*${title}\\s*$`),
      });
    }

    /**
     * Opens the panel count widget, saves a new panel count, and refreshes.
     * @param page The page
     * @param count The panel count to save
     * @returns The restored widget panel
     */
    async function refreshWithPanelCount(
      page: Page,
      count: number
    ): Promise<Locator> {
      await gotoPage(page, '');
      await openPanel(
        page,
        'ui_persist_panel_count',
        SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE,
        true
      );
      const outerPanel = page
        .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
        .first();
      await expect(panelTab(outerPanel, 'Panel 3')).toHaveCount(1);

      await panelTab(outerPanel, 'Panel Count').click();
      const countField = outerPanel.getByLabel('Panel Count', { exact: true });
      await countField.fill(String(count));
      await countField.press('Enter');
      await expect(countField).toHaveValue(String(count));

      await persistLayoutAndReload(page);

      const restoredPanel = page
        .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
        .first();
      await expect(restoredPanel).toBeVisible();
      return restoredPanel;
    }

    test('fewer panels removes the extra saved panel', async ({ page }) => {
      const restoredPanel = await refreshWithPanelCount(page, 2);

      await expect(panelTab(restoredPanel, 'Panel 1')).toHaveCount(1);
      await expect(panelTab(restoredPanel, 'Panel 2')).toHaveCount(1);
      await expect(panelTab(restoredPanel, 'Panel 3')).toHaveCount(0);
      await expect(restoredPanel.locator('.ui-portal-panel:empty')).toHaveCount(
        0
      );
    });

    test('more panels opens the new panel', async ({ page }) => {
      const restoredPanel = await refreshWithPanelCount(page, 4);

      await expect(panelTab(restoredPanel, 'Panel 4')).toHaveCount(1);
      await panelTab(restoredPanel, 'Panel 4').click();
      await expect(restoredPanel.getByText('Panel 4 content')).toBeVisible();
    });
  });

  // The code behind a persisted widget changes while the page is away (e.g. a
  // query restart with new code). Another session re-assigns the variable, then
  // the original page refreshes into its persisted layout. Each panel must be
  // matched to its saved panel by `key`, not by render order.
  test.describe('keyed panels across code changes', () => {
    function escapeRegExp(value: string): string {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function panelTab(scope: Locator | Page, title: string): Locator {
      return scope.locator('.lm_tab', {
        hasText: new RegExp(`^\\s*${escapeRegExp(title)}\\s*$`),
      });
    }

    /** The stack in `scope` containing the tab with `title`. */
    function panelStack(scope: Locator, title: string): Locator {
      return scope
        .locator('.lm_stack')
        .filter({ has: panelTab(scope.page(), title) });
    }

    /** Python for a panel whose heading matches its title. */
    function keyedPanel(title: string, key = title): string {
      return `ui.panel(ui.heading("${title}"), title="${title}", key="${key}")`;
    }

    /** Python for a stack of keyed panels. */
    function stack(...titles: string[]): string {
      return `ui.stack(${titles.map(title => keyedPanel(title)).join(', ')})`;
    }

    /** Python for a keyed stack of keyed panels. */
    function keyedStack(key: string, ...titles: string[]): string {
      return `ui.stack(${titles
        .map(title => keyedPanel(title))
        .join(', ')}, key="${key}")`;
    }

    function widgetCode(varName: string, layout: string): string {
      return `from deephaven import ui

${varName} = ui.panel(ui.dashboard(${layout}), title="${varName}")`;
    }

    /**
     * Asserts the nested dashboard has exactly one tab for each title, and that
     * each tab shows the content belonging to that title.
     * @param scope The widget panel containing the nested dashboard
     * @param titles The expected panel titles
     */
    async function expectPanels(
      scope: Locator,
      titles: string[]
    ): Promise<void> {
      await expect(scope.locator('.lm_tab')).toHaveCount(titles.length);
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < titles.length; i += 1) {
        const title = titles[i];
        const tab = panelTab(scope, title);
        await expect(tab).toHaveCount(1);
        await tab.click();
        await expect(panelStack(scope, title).getByRole('heading')).toHaveText(
          title
        );
      }
      /* eslint-enable no-await-in-loop */
      await expect(scope.locator('.ui-portal-panel:empty')).toHaveCount(0);
    }

    /**
     * Opens a widget with the `before` layout, persists the layout, re-assigns
     * the widget with the `after` layout from another session, then refreshes.
     * @returns The restored widget panel
     */
    async function changeCodeAndRefresh({
      page,
      browser,
      before,
      beforeTitles,
      after,
      afterTitles,
      rearrange,
    }: {
      page: Page;
      browser: Browser;
      before: string;
      beforeTitles: string[];
      after: string;
      afterTitles: string[];
      rearrange?: (outerPanel: Locator) => Promise<void>;
    }): Promise<Locator> {
      const varName = generateVarName();
      await gotoPage(page, '');
      await runInConsole(page, widgetCode(varName, before));

      const outerPanel = page
        .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
        .first();
      await expectPanels(outerPanel, beforeTitles);
      await rearrange?.(outerPanel);
      await persistLayout(page);

      await test.step('Change the code from another session', async () => {
        // Firefox occasionally pastes stale clipboard contents in a second context
        await expect(async () => {
          const otherContext = await browser.newContext();
          try {
            const otherPage = await otherContext.newPage();
            await gotoPage(otherPage, page.url());
            await runInConsole(otherPage, widgetCode(varName, after));
            await expect(
              otherPage
                .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
                .first()
                .locator('.lm_tab')
            ).toHaveCount(afterTitles.length);
          } finally {
            await otherContext.close();
          }
        }).toPass();
      });

      await test.step('Reload', async () => {
        await page.reload();
        await waitForLoad(page);
      });

      const restoredPanel = page
        .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
        .first();
      await expect(restoredPanel).toBeVisible();
      return restoredPanel;
    }

    const STACK_CASES: { name: string; before: string[]; after: string[] }[] = [
      {
        name: 'inserting a panel at the start',
        before: ['P1', 'P2', 'P3'],
        after: ['P0', 'P1', 'P2', 'P3'],
      },
      {
        name: 'inserting a panel in the middle',
        before: ['P1', 'P2', 'P3'],
        after: ['P1', 'Q1.5', 'P2', 'P3'],
      },
      {
        name: 'appending a panel',
        before: ['P1', 'P2', 'P3'],
        after: ['P1', 'P2', 'P3', 'P4'],
      },
      {
        name: 'removing the first panel',
        before: ['P1', 'P2', 'P3'],
        after: ['P2', 'P3'],
      },
      {
        name: 'removing a middle panel',
        before: ['P1', 'P2', 'P3'],
        after: ['P1', 'P3'],
      },
      {
        name: 'removing the last panel',
        before: ['P1', 'P2', 'P3'],
        after: ['P1', 'P2'],
      },
      {
        name: 'reordering panels',
        before: ['P1', 'P2', 'P3'],
        after: ['P3', 'P1', 'P2'],
      },
    ];

    STACK_CASES.forEach(({ name, before, after }) => {
      test(name, async ({ page, browser }) => {
        const restoredPanel = await changeCodeAndRefresh({
          page,
          browser,
          before: stack(...before),
          beforeTitles: before,
          after: stack(...after),
          afterTitles: after,
        });
        await expectPanels(restoredPanel, after);
      });
    });

    test('moving a panel to another stack in a row', async ({
      page,
      browser,
    }) => {
      const restoredPanel = await changeCodeAndRefresh({
        page,
        browser,
        before: `ui.row(${stack('P1', 'P2')}, ${stack('P3')})`,
        beforeTitles: ['P1', 'P2', 'P3'],
        after: `ui.row(${stack('P1')}, ${stack('P2', 'P3')})`,
        afterTitles: ['P1', 'P2', 'P3'],
      });
      await expectPanels(restoredPanel, ['P1', 'P2', 'P3']);

      // Unkeyed stacks aren't part of the panel key, so P2 keeps its saved spot
      await expect(panelTab(panelStack(restoredPanel, 'P1'), 'P2')).toHaveCount(
        1
      );
    });

    test('moving a panel to another keyed stack in a row', async ({
      page,
      browser,
    }) => {
      const restoredPanel = await changeCodeAndRefresh({
        page,
        browser,
        before: `ui.row(${keyedStack('a', 'P1', 'P2')}, ${keyedStack(
          'b',
          'P3'
        )})`,
        beforeTitles: ['P1', 'P2', 'P3'],
        after: `ui.row(${keyedStack('a', 'P1')}, ${keyedStack(
          'b',
          'P2',
          'P3'
        )})`,
        afterTitles: ['P1', 'P2', 'P3'],
      });
      await expectPanels(restoredPanel, ['P1', 'P2', 'P3']);
    });

    test('changing a row to a column', async ({ page, browser }) => {
      const restoredPanel = await changeCodeAndRefresh({
        page,
        browser,
        before: `ui.row(${stack('P1')}, ${stack('P2')})`,
        beforeTitles: ['P1', 'P2'],
        after: `ui.column(${stack('P1')}, ${stack('P2')}, ${stack('P3')})`,
        afterTitles: ['P1', 'P2', 'P3'],
      });
      await expectPanels(restoredPanel, ['P1', 'P2', 'P3']);
    });

    test('the same key in differently keyed stacks does not conflict', async ({
      page,
      browser,
    }) => {
      const left = keyedPanel('Left', 'K');
      const right = keyedPanel('Right', 'K');
      const rightStack = `ui.stack(${right}, key="right")`;
      const restoredPanel = await changeCodeAndRefresh({
        page,
        browser,
        before: `ui.row(ui.stack(${left}, key="left"), ${rightStack})`,
        beforeTitles: ['Left', 'Right'],
        after: `ui.row(ui.stack(${keyedPanel(
          'Left New',
          'K0'
        )}, ${left}, key="left"), ${rightStack})`,
        afterTitles: ['Left New', 'Left', 'Right'],
      });
      await expectPanels(restoredPanel, ['Left New', 'Left', 'Right']);
    });

    test('a moved panel stays in place when a panel is inserted before it', async ({
      page,
      browser,
    }) => {
      const moved: { box?: { x: number; y: number } | null } = {};
      const restoredPanel = await changeCodeAndRefresh({
        page,
        browser,
        before: stack('P1', 'P2', 'P3'),
        beforeTitles: ['P1', 'P2', 'P3'],
        after: stack('P1', 'Q1.5', 'P2', 'P3'),
        afterTitles: ['P1', 'Q1.5', 'P2', 'P3'],
        rearrange: async outerPanel => {
          // Drag P2 to the right edge to split it into its own stack
          const dashboardBox = await outerPanel.boundingBox();
          if (dashboardBox == null) {
            throw new Error('Could not get bounding box for the dashboard');
          }
          await dragTabToTarget(page, panelTab(outerPanel, 'P2'), {
            x: dashboardBox.x + dashboardBox.width * 0.85,
            y: dashboardBox.y + dashboardBox.height * 0.5,
          });
          await expect(outerPanel.locator('.lm_stack')).toHaveCount(2);
          moved.box = await panelTab(outerPanel, 'P2').boundingBox();
        },
      });

      await expectPanels(restoredPanel, ['P1', 'Q1.5', 'P2', 'P3']);

      // P2 is still on its own where it was dropped, apart from P1 and P3
      await expect(restoredPanel.locator('.lm_stack')).toHaveCount(2);
      const p2Stack = panelStack(restoredPanel, 'P2');
      await expect(p2Stack.locator('.lm_tab')).toHaveCount(1);
      const p1Stack = panelStack(restoredPanel, 'P1');
      await expect(panelTab(p1Stack, 'P3')).toHaveCount(1);

      const afterBox = await panelTab(restoredPanel, 'P2').boundingBox();
      if (moved.box == null || afterBox == null) {
        throw new Error('Could not get bounding box for the P2 tab');
      }
      expect(Math.abs(afterBox.x - moved.box.x)).toBeLessThan(10);
      expect(Math.abs(afterBox.y - moved.box.y)).toBeLessThan(10);
    });
  });
});
