import test, { Page, expect } from '@playwright/test';

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
    ).not.toBeVisible();
  });
}

/**
 * Opens a panel by clicking on the Panels button and then the panel button
 * @param page The page
 * @param name The name of the panel
 */
export async function openPanel(page: Page, name: string) {
  await test.step(`Open panel (${name})`, async () => {
    const panelCount = await page.locator('.dh-panel').count();

    // open app panels menu
    const appPanels = page.getByRole('button', {
      name: 'Panels',
      exact: true,
    });
    await expect(appPanels).toBeEnabled();
    await appPanels.click();

    // open panel
    const targetPanel = page.getByRole('button', { name, exact: true });
    expect(targetPanel).toBeEnabled();
    await targetPanel.click();

    // check for panel to be loaded
    await expect(page.locator('.dh-panel')).toHaveCount(panelCount + 1);
    await expect(page.locator('.loading-spinner')).toHaveCount(0);
  });
}
