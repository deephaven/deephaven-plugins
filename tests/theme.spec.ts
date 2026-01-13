import { expect, test } from '@playwright/test';
import { gotoPage } from './utils';

/**
 * Helper function to select a theme and take a screenshot.
 * Extracted to avoid await-in-loop lint errors.
 */
async function selectThemeAndScreenshot(
  page: import('@playwright/test').Page,
  themeName: string,
  colorSchemeDropdown: import('@playwright/test').Locator
): Promise<void> {
  await colorSchemeDropdown.click();
  const themeOption = page.getByRole('option', { name: themeName });
  await themeOption.click();
  // Wait for theme to be applied
  await page.waitForTimeout(500);
  // Reset mouse position to avoid hover effects
  await page.mouse.move(0, 0);
  // Take a screenshot of the whole UI
  await expect(page).toHaveScreenshot(`theme-${themeName}.png`);
}

test.describe('Theme switching', () => {
  test('All themes render correctly', async ({ page }) => {
    await gotoPage(page, '');

    // Open settings sidebar using aria-label "User Settings"
    const settingsButton = page.getByLabel('User Settings');
    await settingsButton.click();

    // Find and click the theme section in app-settings-menu to expand it
    const settingsMenu = page.locator('.app-settings-menu');
    const themeSection = settingsMenu.getByRole('button', {
      name: /theme/i,
    });
    await themeSection.click();

    // Click the react-spectrum dropdown "Pick a color scheme"
    const colorSchemeDropdown = page.getByRole('button', {
      name: 'Pick a color scheme',
    });
    await colorSchemeDropdown.click();

    // Get all theme names at once using allTextContents()
    const themeNames = await page.getByRole('option').allTextContents();

    // Close the dropdown by pressing Escape
    await page.keyboard.press('Escape');

    // Test each theme sequentially using reduce to chain promises
    await themeNames.reduce(async (promise, themeName) => {
      await promise;
      await selectThemeAndScreenshot(page, themeName, colorSchemeDropdown);
    }, Promise.resolve() as Promise<void>);
  });
});
