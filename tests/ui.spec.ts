import { expect, test } from '@playwright/test';
import {
  openPanel,
  gotoPage,
  SELECTORS,
  generateVarName,
  pasteInMonaco,
} from './utils';

test('UI loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_component', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

test('UI updates when interacting with it', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_component', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  (
    await panelLocator.getByRole('button', {
      name: 'You pressed me 0 times',
    })
  ).click();
  (
    await panelLocator.getByRole('button', {
      name: 'You pressed me 1 times',
    })
  ).click();
  await expect(
    panelLocator.getByRole('button', { name: 'You pressed me 2 times' })
  ).toBeVisible();
  await panelLocator.getByRole('textbox', { name: 'Greeting' }).fill('goodbye');
  await expect(panelLocator.getByText('You typed goodbye')).toBeVisible();
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

test('UI state resets when re-opening', async ({ page }) => {
  await gotoPage(page, '');

  // We need to assign the component to a variable name, interact with it, then re-run the snippet to re-open that variable
  const consoleInput = page.locator('.console-input');
  const varName = generateVarName();
  const command = `${varName} = ui_component`;
  await pasteInMonaco(consoleInput, command);
  await page.keyboard.press('Enter');

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  (
    await panelLocator.getByRole('button', {
      name: 'You pressed me 0 times',
    })
  ).click();
  await expect(
    panelLocator.getByRole('button', { name: 'You pressed me 1 times' })
  ).toBeVisible();
  await panelLocator.getByRole('textbox', { name: 'Greeting' }).fill('goodbye');
  await expect(panelLocator.getByText('You typed goodbye')).toBeVisible();

  // Click the button again to re-open the panel
  await page.getByRole('button', { name: varName }).click();

  // State should have reset, and we should still be able to interact with it
  (
    await panelLocator.getByRole('button', {
      name: 'You pressed me 0 times',
    })
  ).click();
  await expect(
    panelLocator.getByRole('button', { name: 'You pressed me 1 times' })
  ).toBeVisible();
  await panelLocator.getByRole('textbox', { name: 'Greeting' }).fill('goodbye');
  await expect(panelLocator.getByText('You typed goodbye')).toBeVisible();
});

test('boom component shows an error in a panel', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_boom', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toBeVisible();
  await expect(
    page
      .locator(SELECTORS.REACT_PANEL_VISIBLE)
      .getByText('Exception', { exact: true })
  ).toBeVisible();
  await expect(
    page.locator(SELECTORS.REACT_PANEL_VISIBLE).getByText('BOOM!')
  ).toBeVisible();
});

test('boom counter component shows error overlay after clicking the button twice', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_boom_counter', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);

  let btn = await panelLocator.getByRole('button', { name: 'Count is 0' });
  await expect(btn).toBeVisible();
  btn.click();

  btn = await panelLocator.getByRole('button', { name: 'Count is 1' });
  await expect(btn).toBeVisible();
  btn.click();

  await expect(
    panelLocator.getByText('ValueError', { exact: true })
  ).toBeVisible();
  await expect(panelLocator.getByText('BOOM! Value too big.')).toBeVisible();
});

test('Using keys for lists works', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_cells', SELECTORS.REACT_PANEL_VISIBLE);

  // setup cells
  await page.getByRole('button', { name: 'Add cell' }).click();
  await page.getByRole('button', { name: 'Add cell' }).click();
  await page.getByRole('textbox', { name: 'Cell 0' }).fill('a');
  await page.getByRole('textbox', { name: 'Cell 1' }).fill('b');
  await page.getByRole('textbox', { name: 'Cell 2' }).fill('c');
  await page.getByRole('button', { name: 'Delete cell' }).nth(1).click();

  await expect(page.getByRole('textbox', { name: 'Cell 0' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Cell 0' })).toHaveValue('a');
  await expect(page.getByRole('textbox', { name: 'Cell 1' })).not.toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Cell 2' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Cell 2' })).toHaveValue('c');
});

test('UI all components render 1', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_render_all1', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

test('UI all components render 2', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_render_all2', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

test('UI all components render 3', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_render_all3', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

test('UI markdown renders code correctly', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'markdown_code', SELECTORS.REACT_PANEL_VISIBLE);
  await expect(page.locator(SELECTORS.REACT_PANEL_VISIBLE)).toHaveScreenshot();
});

// Tests flex components render as expected
test.describe('UI flex components', () => {
  [
    { name: 'flex_0', traces: 0 },
    { name: 'flex_1', traces: 0 },
    { name: 'flex_2', traces: 0 },
    { name: 'flex_3', traces: 0 },
    { name: 'flex_4', traces: 0 },
    { name: 'flex_5', traces: 0 },
    { name: 'flex_6', traces: 0 },
    { name: 'flex_7', traces: 1 },
    { name: 'flex_8', traces: 1 },
    { name: 'flex_9', traces: 0 },
    { name: 'flex_10', traces: 0 },
    { name: 'flex_11', traces: 2 },
    { name: 'flex_12', traces: 2 },
    { name: 'flex_13', traces: 2 },
    { name: 'flex_14', traces: 0 },
    { name: 'flex_15', traces: 0 },
    { name: 'flex_16', traces: 0 },
    { name: 'flex_17', traces: 0 },
    { name: 'flex_18', traces: 0 },
    { name: 'flex_19', traces: 1 },
    { name: 'flex_20', traces: 1 },
    { name: 'flex_21', traces: 1 },
    { name: 'flex_22', traces: 0 },
    { name: 'flex_23', traces: 0 },
    { name: 'flex_24', traces: 0 },
  ].forEach(i => {
    test(i.name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, i.name, SELECTORS.REACT_PANEL_VISIBLE);

      // need to wait for plots to be loaded before taking screenshot
      // easiest way to check that is if the traces are present
      if (i.traces > 0) {
        await expect(
          await page.locator(SELECTORS.REACT_PANEL_VISIBLE).locator('.trace')
        ).toHaveCount(i.traces);
      }

      await expect(
        page.locator(SELECTORS.REACT_PANEL_VISIBLE)
      ).toHaveScreenshot();
    });
  });
});

// Tests grid components render as expected
test.describe('UI grid components', () => {
  [
    { name: 'grid_0', traces: 0 },
    { name: 'grid_1', traces: 0 },
    { name: 'grid_2', traces: 0 },
    { name: 'grid_3', traces: 0 },
    { name: 'grid_4', traces: 0 },
    { name: 'grid_5', traces: 0 },
    { name: 'grid_6', traces: 0 },
    { name: 'grid_7', traces: 1 },
    { name: 'grid_8', traces: 1 },
    { name: 'grid_9', traces: 0 },
    { name: 'grid_10', traces: 0 },
    { name: 'grid_11', traces: 2 },
    { name: 'grid_12', traces: 2 },
    { name: 'grid_13', traces: 2 },
    { name: 'grid_14', traces: 0 },
    { name: 'grid_15', traces: 0 },
    { name: 'grid_16', traces: 0 },
    { name: 'grid_17', traces: 0 },
    { name: 'grid_18', traces: 0 },
    { name: 'grid_19', traces: 1 },
    { name: 'grid_20', traces: 1 },
    { name: 'grid_21', traces: 1 },
    { name: 'grid_22', traces: 0 },
    { name: 'grid_23', traces: 0 },
    { name: 'grid_24', traces: 0 },
  ].forEach(i => {
    test(i.name, async ({ page }) => {
      await gotoPage(page, '');
      await openPanel(page, i.name, SELECTORS.REACT_PANEL_VISIBLE);

      // need to wait for plots to be loaded before taking screenshot
      // easiest way to check that is if the traces are present
      if (i.traces > 0) {
        await expect(
          await page.locator(SELECTORS.REACT_PANEL_VISIBLE).locator('.trace')
        ).toHaveCount(i.traces);
      }

      await expect(
        page.locator(SELECTORS.REACT_PANEL_VISIBLE)
      ).toHaveScreenshot();
    });
  });
});
