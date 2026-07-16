import test, { type Locator, type Page, expect } from '@playwright/test';
import os from 'node:os';

export const SELECTORS = {
  REACT_PANEL: '.dh-react-panel',
  REACT_PANEL_VISIBLE: '.dh-react-panel:visible',
  WIDGET_LOADER_ELEMENT: '.dh-panel.widget-loader-deephaven\\.ui\\.Element',
  WIDGET_LOADER_ELEMENT_VISIBLE:
    '.dh-panel.widget-loader-deephaven\\.ui\\.Element:visible',
  // The console status-bar heap-usage indicator (bar width + "X.X GB" text).
  // Its value drifts run-to-run, so full-page screenshots must mask it.
  HEAP_USAGE: '.max-memory',
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
    // Wait for any loading progress bars to disappear
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
 * Waits for a Plotly chart's data to finish rendering before a screenshot.
 *
 * Plotly draws the axes immediately but streams the data in afterwards. The
 * loading spinner clears once the widget mounts, so a screenshot taken right
 * after `waitForLoad` can capture an *empty* plot (axes only, no data).
 * `toHaveScreenshot`'s auto-stabilization does not help here: an empty plot is
 * static, so two consecutive frames match and it locks onto the blank state.
 *
 * This checks Plotly's data model (`gd.data`) rather than the DOM, so it works
 * for both SVG traces and WebGL (`scattergl`) traces — the latter render to a
 * `<canvas>` and have no `.trace` element, which is the default render mode for
 * `dx.scatter`/`dx.line`. Charts with no plotted array data (e.g. indicators,
 * whose value is a scalar) never satisfy this and must not use it.
 *
 * @param page The page
 * @param plotlySelector Selector for the Plotly plot container
 */
export async function waitForPlotlyData(
  page: Page,
  plotlySelector = '.js-plotly-plot'
): Promise<void> {
  const plot = page.locator(plotlySelector).first();
  await plot.waitFor({ state: 'visible', timeout: 30000 });
  await expect
    .poll(
      async () =>
        plot.evaluate(el => {
          const { data } = el as unknown as { data?: unknown[] };
          if (!Array.isArray(data)) {
            return false;
          }
          // A trace column can arrive in any of Plotly's encodings: a plain
          // array (graph_objects / dx), a typed array, or the binary-encoded
          // { dtype, bdata } object that Plotly Express produces from numpy.
          const hasValues = (v: unknown): boolean => {
            if (v == null) return false;
            if (Array.isArray(v) || ArrayBuffer.isView(v)) {
              return (v as { length: number }).length > 0;
            }
            if (typeof v === 'object') {
              const { bdata } = v as { bdata?: unknown };
              return typeof bdata === 'string' && bdata.length > 0;
            }
            return false;
          };
          // A loaded chart has at least one trace carrying plotted values.
          return data.some(trace => {
            const t = trace as Record<string, unknown>;
            return ['x', 'y', 'z', 'open', 'close', 'values'].some(key =>
              hasValues(t[key])
            );
          });
        }),
      { timeout: 30000, message: 'Plotly chart never received data' }
    )
    .toBe(true);
}

/** Escapes a string so it can be embedded literally in a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Opens a panel by clicking on the Panels button and then the panel button
 * @param page The page
 * @param name The name of the panel
 * @param panelLocator The locator for the panel, passed to `page.locator`. When
 *   left as the default generic `.dh-panel`, the opened widget is instead
 *   verified by its Golden Layout tab title (see below).
 * @param awaitLoad If we should wait for the loading spinner to disappear
 */
export async function openPanel(
  page: Page,
  name: string,
  panelLocator = '.dh-panel',
  awaitLoad = true
): Promise<void> {
  await test.step(`Open panel (${name})`, async () => {
    // open app panels menu
    const appPanels = page.getByRole('button', {
      name: 'Panels',
      exact: true,
    });
    await expect(appPanels).toBeEnabled();

    // The generic '.dh-panel' selector also matches unrelated panels from the
    // server's default layout (Console, Command History, DEMO.md, etc.). Those
    // panels load asynchronously and race with opening our widget, so on slower
    // browsers (e.g. WebKit) they inflate the count and break a naive
    // toHaveCount(panelCount + 1) check. Only trust a panel count when the
    // caller supplied a widget-specific locator; otherwise verify the opened
    // widget by its Golden Layout tab title, which is unaffected by other panels.
    const useScopedCount = panelLocator !== '.dh-panel';

    // Count how many matching panels are open before opening a new one
    const panelCount = useScopedCount
      ? await page.locator(panelLocator).count()
      : 0;

    await appPanels.click();

    // search for the panel in list
    const search = page.getByRole('searchbox', {
      name: 'Find Table, Plot or Widget',
      exact: true,
    });
    await search.fill(name);

    // open panel
    const targetPanel = page.getByRole('button', { name, exact: true });
    await expect(targetPanel).toBeEnabled();
    await targetPanel.click();

    // reset mouse position to not cause unintended hover effects
    await page.mouse.move(0, 0);

    // check for panel to be loaded
    if (useScopedCount) {
      await expect(page.locator(panelLocator)).toHaveCount(panelCount + 1, {
        timeout: 30000,
      });
    } else {
      // The opened widget gets a Golden Layout tab titled with its exact name.
      // Allow surrounding whitespace in the title text but anchor the name so
      // e.g. `tvl_big_hist` does not also match `tvl_big_hist_count`.
      await expect(
        page.locator('.lm_title', {
          hasText: new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`),
        })
      ).toHaveCount(1, { timeout: 30000 });
    }
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

/**
 * Waits for a grid to actually render content before continuing.
 *
 * The grid draws to an HTML `<canvas>`, so the loading spinner disappearing
 * does not guarantee that any data has been painted. Taking a screenshot at
 * that point can capture a blank grid, which then gets saved as a "correct"
 * snapshot. This polls the canvas pixels until they are no longer uniform,
 * which indicates the grid has drawn its headers/rows/cells.
 * @param gridContainer Locator containing an iris-grid / grid-canvas element
 * @param timeout How long to wait for the grid to render, in ms
 */
export async function waitForGridRender(
  gridContainer: Locator,
  timeout = 30000
): Promise<void> {
  await test.step('Wait for grid to render', async () => {
    const canvas = gridContainer.locator('canvas.grid-canvas').first();
    await expect(canvas).toBeVisible();
    await expect
      .poll(
        async () =>
          canvas.evaluate((el: HTMLCanvasElement) => {
            const ctx = el.getContext('2d');
            if (ctx == null || el.width === 0 || el.height === 0) {
              return false;
            }
            const { data } = ctx.getImageData(0, 0, el.width, el.height);
            // A blank grid is a single uniform color. Consider the grid
            // rendered once we find any pixel that differs from the first.
            for (let i = 4; i < data.length; i += 4) {
              if (
                data[i] !== data[0] ||
                data[i + 1] !== data[1] ||
                data[i + 2] !== data[2] ||
                data[i + 3] !== data[3]
              ) {
                return true;
              }
            }
            return false;
          }),
        { timeout }
      )
      .toBe(true);
  });
}
