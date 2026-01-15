import { expect, test, Page } from '@playwright/test';
import { gotoPage, SELECTORS, waitForLoad } from './utils';

async function openThemeDemoPanel(page: Page): Promise<void> {
  const appPanels = page.getByRole('button', { name: 'Panels', exact: true });
  await expect(appPanels).toBeEnabled();
  await appPanels.click();

  const search = page.getByRole('searchbox', {
    name: 'Find Table, Plot or Widget',
    exact: true,
  });
  await search.fill('theme_demo');

  const targetPanel = page.getByRole('button', {
    name: 'theme_demo',
    exact: true,
  });
  await expect(targetPanel).toBeEnabled();
  await targetPanel.click();

  await page.mouse.move(0, 0);
  await expect(page.locator(SELECTORS.REACT_PANEL)).toHaveCount(4);
  await waitForLoad(page);
}

async function openSettingsAndGetThemes(page: Page): Promise<string[]> {
  // Open settings sidebar
  const settingsButton = page.getByLabel('User Settings');
  await settingsButton.click();

  // Expand theme section
  const settingsMenu = page.locator('.app-settings-menu');
  await expect(settingsMenu).toBeVisible();
  const themeSection = settingsMenu.getByRole('button', { name: /theme/i });
  await themeSection.click();

  // Open color scheme dropdown and get all theme names
  const colorSchemeDropdown = page.getByRole('button', {
    name: 'Pick a color scheme',
  });
  await expect(colorSchemeDropdown).toBeVisible();
  await colorSchemeDropdown.click();

  const popover = page.getByTestId('popover');
  await expect(popover).toBeVisible();
  const themeNames = await popover.getByRole('option').allTextContents();

  // Close dropdown
  await page.keyboard.press('Escape');

  return themeNames;
}

async function selectTheme(page: Page, themeName: string): Promise<void> {
  const colorSchemeDropdown = page.getByRole('button', {
    name: 'Pick a color scheme',
  });
  await colorSchemeDropdown.click();

  const popover = page.getByTestId('popover');
  await expect(popover).toBeVisible();

  const themeOption = popover.getByRole('option', { name: themeName });
  await themeOption.click();

  // Wait for theme to apply
  await page.waitForTimeout(2000);
}

async function closeSettings(page: Page): Promise<void> {
  const closeButton = page.getByLabel('Close', { exact: true });
  await closeButton.click();

  const settingsMenu = page.locator('.app-settings-menu');
  await expect(settingsMenu).not.toBeVisible();
}

async function openSettings(page: Page): Promise<void> {
  const settingsButton = page.getByLabel('User Settings');
  await settingsButton.click();

  const settingsMenu = page.locator('.app-settings-menu');
  await expect(settingsMenu).toBeVisible();
}

async function fillThemeName(page: Page, themeName: string): Promise<void> {
  const themeNameInput = page.getByLabel('Current Theme');
  await themeNameInput.clear();
  await themeNameInput.fill(themeName);
}

async function takeScreenshot(page: Page, themeName: string): Promise<void> {
  await waitForLoad(page);
  await page.waitForTimeout(500);
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot(`theme-${themeName}.png`);
}

test.describe('Theme switching', () => {
  let themeNames: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await gotoPage(page, '');
    themeNames = await openSettingsAndGetThemes(page);
    await context.close();
  });

  themeNames.forEach(themeName => {
    test(`Theme ${themeName} renders correctly`, async ({ page }) => {
      await gotoPage(page, '');
      await openThemeDemoPanel(page);
      await openSettings(page);
      await selectTheme(page, themeName);
      await closeSettings(page);
      await fillThemeName(page, themeName);
      await takeScreenshot(page, themeName);
    });
  });
});
