import test, { Locator, Page, expect } from '@playwright/test';
import os from 'node:os';

export const SELECTORS = {
  REACT_PANEL: '.dh-react-panel',
  REACT_PANEL_VISIBLE: '.dh-react-panel:visible',
  REACT_PANEL_OVERLAY: '.dh-react-panel-overlay',
};

const ROW_HEIGHT = 19;
const COLUMN_HEADER_HEIGHT = 30;

/**
 * Goes to a page and waits for the progress bar to disappear
 * @param page The page
 * @param url The URL to navigate to
 * @param options Options for navigation
 */
export async function gotoPage(
  page: Page,
  url: string,
  options?: {
    referer?: string;
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  }
): Promise<void> {
  await test.step(`Go to page (${url})`, async () => {
    await page.goto(url, options);
    await expect(
      page.getByRole('progressbar', { name: 'Loading...', exact: true })
    ).toHaveCount(0);
  });
}

/**
 * Waits for all loading spinners to disappear
 * @param page The page
 */
export async function waitForLoad(page: Page): Promise<void> {
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
}

/**
 * Opens a panel by clicking on the Panels button and then the panel button
 * @param page The page
 * @param name The name of the panel
 * @param panelLocator The locator for the panel, passed to `page.locator`
 * @param awaitLoad If we should wait for the loading spinner to disappear
 */
export async function openPanel(
  page: Page,
  name: string,
  panelLocator = '.dh-panel',
  awaitLoad = true
): Promise<void> {
  await test.step(`Open panel (${name})`, async () => {
    const panelCount = await page.locator(panelLocator).count();

    // open app panels menu
    const appPanels = page.getByRole('button', {
      name: 'Panels',
      exact: true,
    });
    await expect(appPanels).toBeEnabled();
    await appPanels.click();

    // search for the panel in list
    const search = page.getByRole('searchbox', {
      name: 'Find Table, Plot or Widget',
      exact: true,
    });
    await search.fill(name);

    // open panel
    const targetPanel = page.getByRole('button', { name, exact: true });
    expect(targetPanel).toBeEnabled();
    await targetPanel.click();

    // reset mouse position to not cause unintended hover effects
    await page.mouse.move(0, 0);

    // check for panel to be loaded
    await expect(page.locator(panelLocator)).toHaveCount(panelCount + 1);
    if (awaitLoad) {
      await waitForLoad(page);
    }
  });
}

/**
 * Generate a unique Id
 * @param length Length to give id
 * @returns A unique valid id
 */
export function generateId(length = 21): string {
  let id = '';
  for (let i = 0; i < length; i += 1) {
    id += Math.random().toString(36).substr(2, 1);
  }
  return id;
}

/**
 * Generate a unique python variable name
 * @param prefix Prefix to give the variable name
 * @returns A unique string that is a valid python variable name
 */
export function generateVarName(prefix = 'v'): string {
  // Don't allow a `-` in variable names
  let id: string;
  do {
    id = generateId();
  } while (id.includes('-'));
  return `${prefix}_${id}`;
}

/**
 * Pastes text into a monaco input. The input will have focus after pasting.
 * @param locator Locator to use for monaco editor
 * @param text Text to be pasted
 */
export async function pasteInMonaco(
  locator: Locator,
  text: string
): Promise<void> {
  const page = locator.page();
  const isMac = os.platform() === 'darwin';
  const modifier = isMac ? 'Meta' : 'Control';

  // Create a hidden textarea with the contents to paste
  const inputId = await page.evaluate(async evalText => {
    const tempInput = document.createElement('textarea');
    tempInput.id = 'super-secret-temp-input-id';
    tempInput.value = evalText;
    tempInput.style.width = '0';
    tempInput.style.height = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    return tempInput.id;
  }, text);

  // Copy the contents of the textarea which was selected above
  await page.keyboard.press(`${modifier}+C`);

  // Remove the textarea
  await page.evaluate(id => {
    document.getElementById(id)?.remove();
  }, inputId);

  // Focus monaco
  await locator.click();

  const browserName = locator.page().context().browser()?.browserType().name();
  if (browserName !== 'firefox') {
    // Chromium on mac and webkit on any OS don't seem to paste w/ the keyboard shortcut
    await locator.locator('textarea').evaluate(async (element, evalText) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', evalText);
      const clipboardEvent = new ClipboardEvent('paste', {
        clipboardData,
      });
      element.dispatchEvent(clipboardEvent);
    }, text);
  } else {
    await page.keyboard.press(`${modifier}+V`);
  }

  if (text.length > 0) {
    // Sanity check the paste happened
    await expect(locator.locator('textarea')).not.toBeEmpty();
  }
}

/**
 * Clicks the specified row for the grid.
 * Clicks in the first column of the row as column width is variable.
 * Assumes there is only one level of column headers (i.e., no column groups).
 * @param gridContainer The Playwright Locator of the grid container
 * @param row The row index to click
 * @param clickOptions The Locator click options such as modifies to use
 */
export async function clickGridRow(
  gridContainer: Locator,
  row: number,
  clickOptions?: Parameters<Locator['click']>[0]
): Promise<void> {
  const x = 1;
  const y = COLUMN_HEADER_HEIGHT + (row + 0.5) * ROW_HEIGHT;
  await gridContainer.click({
    ...clickOptions,
    position: { x, y },
  });
}
