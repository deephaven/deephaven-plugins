import { expect, test, type Page } from '@playwright/test';
import {
  gotoPage,
  generateVarName,
  pasteInMonaco,
  waitForLoad,
  persistLayoutAndReload,
  reloadPage,
  addCustomColumnToActiveTable,
  expectActiveTableColumns,
} from './utils';

/**
 * DH-23775: panels restored from a saved layout that the reloaded document no
 * longer renders must be removed, without disturbing the panels it still owns.
 *
 * Each test builds its own widget from the factories in
 * `tests/app.d/ui_orphan_panels.py` with a per-test `cfg` dict. Mutating `cfg`
 * from the console does not re-render the open widget, so the first render
 * after a reload sees a different document than the one the layout was saved
 * with.
 */

type Factory = 'orphan_nested' | 'orphan_deep';

/**
 * Runs a single line of Python in the console and waits for it to finish.
 * @param page The page
 * @param code Python statements to run, separated by `;`
 */
async function runInConsole(page: Page, code: string): Promise<void> {
  const marker = generateVarName('done');
  // Split the marker so the echoed command doesn't satisfy the wait below
  const [head, tail] = [marker.slice(0, 4), marker.slice(4)];
  await pasteInMonaco(
    page.locator('.console-input'),
    `${code}; print("${head}" + "${tail}")`
  );
  await page.keyboard.press('Enter');
  await expect(page.getByText(marker, { exact: true })).toHaveCount(1);
}

/**
 * Creates a widget from a fixture factory and waits for its controls panel.
 * @param page The page
 * @param factory Fixture factory to call
 * @param cfg Initial fixture config
 * @returns Name of the Python `cfg` variable, for later mutation
 */
async function createWidget(
  page: Page,
  factory: Factory,
  cfg: Record<string, unknown>
): Promise<string> {
  const cfgName = generateVarName('cfg');
  await runInConsole(
    page,
    `${cfgName} = ${JSON.stringify(cfg)
      .replace(/true/g, 'True')
      .replace(/false/g, 'False')}; ${generateVarName(
      'w'
    )} = ${factory}(${cfgName})`
  );
  const label = (cfg.label as string | undefined) ?? 'Orphan';
  await expect(panelTab(page, `${label} Controls`)).toHaveCount(1, {
    timeout: 30000,
  });
  await waitForLoad(page);
  return cfgName;
}

/**
 * Updates the fixture config without re-rendering the widget.
 * @param page The page
 * @param cfgName Name of the Python `cfg` variable
 * @param updates Keys and Python literal values to set
 */
async function updateCfg(
  page: Page,
  cfgName: string,
  updates: Record<string, string>
): Promise<void> {
  const statements = Object.entries(updates)
    .map(([key, value]) => `${cfgName}["${key}"] = ${value}`)
    .join('; ');
  await runInConsole(page, statements);
}

function panelTab(page: Page, title: string) {
  return page.locator('.lm_tab', {
    hasText: new RegExp(`^\\s*${title}\\s*$`),
  });
}

async function showPanel(page: Page, title: string): Promise<void> {
  await panelTab(page, title).click();
}

async function selectTab(
  page: Page,
  panelTitle: string,
  tab: string
): Promise<void> {
  await showPanel(page, panelTitle);
  await page.locator('[role="tab"]:visible', { hasText: tab }).click();
}

/**
 * Asserts which numbered panels exist, that none of them is blank, and that no
 * empty containers were left behind.
 * @param page The page
 * @param expected Panel numbers that should exist
 * @param absent Panel numbers that should not exist
 * @param label Fixture label
 */
async function expectPanels(
  page: Page,
  expected: number[],
  absent: number[],
  label = 'Orphan'
): Promise<void> {
  await expect(panelTab(page, `${label} Controls`)).toHaveCount(1);
  for (let i = 0; i < expected.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await expect(panelTab(page, `${label} Panel ${expected[i]}`)).toHaveCount(
      1
    );
  }
  for (let i = 0; i < absent.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await expect(panelTab(page, `${label} Panel ${absent[i]}`)).toHaveCount(0);
  }
  await expect(page.locator('.ui-portal-panel:empty')).toHaveCount(0);
  await expect(
    page.locator('.lm_stack').filter({ hasNot: page.locator('.lm_tab') })
  ).toHaveCount(0);
}

async function expectTabContent(
  page: Page,
  panelTitle: string,
  content: string
): Promise<void> {
  await showPanel(page, panelTitle);
  await expect(page.getByText(content, { exact: true })).toBeVisible();
}

test.describe('Orphan panel reconciliation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '');
  });

  test('restored panels survive an unchanged reload', async ({ page }) => {
    await createWidget(page, 'orphan_nested', { count: 3 });
    await expectPanels(page, [1, 2, 3], []);

    await persistLayoutAndReload(page);

    await expectPanels(page, [1, 2, 3], []);
    await expectTabContent(page, 'Orphan Panel 3', 'Orphan panel 3 first tab');
  });

  test('reload with fewer panels removes only the surplus panel', async ({
    page,
  }) => {
    const cfg = await createWidget(page, 'orphan_nested', { count: 3 });
    await selectTab(page, 'Orphan Panel 1', 'Tab Two');
    await updateCfg(page, cfg, { count: '2' });

    await persistLayoutAndReload(page);

    await expectPanels(page, [1, 2], [3]);
    await expectTabContent(page, 'Orphan Panel 1', 'Orphan panel 1 second tab');

    // Re-render the document after reconciliation; nothing else is removed
    await showPanel(page, 'Orphan Controls');
    await page.getByRole('button', { name: 'Clicked 0 times' }).click();
    await page.getByRole('button', { name: 'Clicked 1 times' }).click();
    await expect(
      page.getByRole('button', { name: 'Clicked 2 times' })
    ).toBeVisible();
    await expectPanels(page, [1, 2], [3]);

    await reloadPage(page);

    await expectPanels(page, [1, 2], [3]);
    await expectTabContent(page, 'Orphan Panel 1', 'Orphan panel 1 second tab');
  });

  test('reload with more panels opens the new panel', async ({ page }) => {
    const cfg = await createWidget(page, 'orphan_nested', { count: 2 });
    await selectTab(page, 'Orphan Panel 2', 'Tab Three');
    await updateCfg(page, cfg, { count: '3' });

    await persistLayoutAndReload(page);

    await expectPanels(page, [1, 2, 3], []);
    await expectTabContent(page, 'Orphan Panel 2', 'Orphan panel 2 third tab');
    await expectTabContent(page, 'Orphan Panel 3', 'Orphan panel 3 first tab');
  });

  test('saved state survives a reload where the panel cannot republish it', async ({
    page,
  }) => {
    const cfg = await createWidget(page, 'orphan_nested', {
      count: 1,
      show_table: true,
    });
    await showPanel(page, 'Table Panel');
    await waitForLoad(page);
    await addCustomColumnToActiveTable(page, 'a * 2', 'Doubled');

    // The table, the only owner of the panel's saved state, is not rendered
    await updateCfg(page, cfg, { show_table: 'False' });
    await persistLayoutAndReload(page);
    await expectTabContent(page, 'Table Panel', 'Table hidden');

    await updateCfg(page, cfg, { show_table: 'True' });
    await reloadPage(page);

    await showPanel(page, 'Table Panel');
    await waitForLoad(page);
    await expectActiveTableColumns(page, 'Doubled');
  });

  test('orphan alone in its stack leaves no empty stack', async ({ page }) => {
    const cfg = await createWidget(page, 'orphan_nested', {
      count: 3,
      layout: 'split',
    });
    await updateCfg(page, cfg, { count: '2' });

    await persistLayoutAndReload(page);

    await expectPanels(page, [1, 2], [3]);
  });

  test('a panel added after cleanup does not inherit the orphan state', async ({
    page,
  }) => {
    const cfg = await createWidget(page, 'orphan_nested', { count: 3 });
    await selectTab(page, 'Orphan Panel 3', 'Tab Three');
    await updateCfg(page, cfg, { count: '2' });

    await persistLayoutAndReload(page);
    await expectPanels(page, [1, 2], [3]);

    await showPanel(page, 'Orphan Controls');
    await page.getByRole('button', { name: 'Add panel' }).click();

    await expect(panelTab(page, 'Orphan Panel 3')).toHaveCount(1);
    await expectTabContent(page, 'Orphan Panel 3', 'Orphan panel 3 first tab');
  });

  test('load error and retry only removes the surplus panel once ready', async ({
    page,
  }) => {
    const cfg = await createWidget(page, 'orphan_nested', { count: 3 });
    await selectTab(page, 'Orphan Panel 1', 'Tab Two');
    await updateCfg(page, cfg, { count: '2', fail: 'True' });

    await persistLayoutAndReload(page);
    await expect(page.getByText('Orphan fixture failure')).toHaveCount(1, {
      timeout: 30000,
    });

    await updateCfg(page, cfg, { fail: 'False' });
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await waitForLoad(page);

    await expectPanels(page, [1, 2], [3]);
    await expectTabContent(page, 'Orphan Panel 1', 'Orphan panel 1 second tab');

    await reloadPage(page);

    await expectPanels(page, [1, 2], [3]);
    await expectTabContent(page, 'Orphan Panel 1', 'Orphan panel 1 second tab');
  });

  test('cleanup in one widget leaves another widget untouched', async ({
    page,
  }) => {
    const alpha = await createWidget(page, 'orphan_nested', {
      count: 3,
      label: 'Alpha',
    });
    await createWidget(page, 'orphan_nested', { count: 3, label: 'Beta' });
    await updateCfg(page, alpha, { count: '2' });

    await persistLayoutAndReload(page);

    await expectPanels(page, [1, 2], [3], 'Alpha');
    await expectPanels(page, [1, 2, 3], [], 'Beta');
  });

  test('inner dashboard cleanup leaves the outer dashboard untouched', async ({
    page,
  }) => {
    const cfg = await createWidget(page, 'orphan_deep', { count: 3 });
    await updateCfg(page, cfg, { count: '2' });

    await persistLayoutAndReload(page);

    await expectPanels(page, [1, 2], [3]);
    await expect(panelTab(page, 'Outer Keep')).toHaveCount(1);
    await expect(panelTab(page, 'Inner Host')).toHaveCount(1);
    await expect(page.getByText('Outer keep content')).toBeVisible();
  });

  test('backend state survives cleanup and later panel changes', async ({
    page,
  }) => {
    const cfg = await createWidget(page, 'orphan_nested', { count: 3 });
    await showPanel(page, 'Orphan Controls');
    await page.getByRole('button', { name: 'Clicked 0 times' }).click();
    await page.getByRole('button', { name: 'Clicked 1 times' }).click();
    await expect(
      page.getByRole('button', { name: 'Clicked 2 times' })
    ).toBeVisible();
    await updateCfg(page, cfg, { count: '2' });

    await persistLayoutAndReload(page);

    await expectPanels(page, [1, 2], [3]);
    await showPanel(page, 'Orphan Controls');
    await page.getByRole('button', { name: 'Clicked 2 times' }).click();
    // Opening a panel persists the panel list; it must not replay older state
    await page.getByRole('button', { name: 'Add panel' }).click();
    await expect(panelTab(page, 'Orphan Panel 3')).toHaveCount(1);

    await reloadPage(page);

    await showPanel(page, 'Orphan Controls');
    await expect(
      page.getByRole('button', { name: 'Clicked 3 times' })
    ).toBeVisible();
    await expectPanels(page, [1, 2, 3], []);
  });
});
