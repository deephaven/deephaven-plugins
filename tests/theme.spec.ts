import { expect, test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { SELECTORS, waitForLoad } from './utils';

// Parse theme names directly from theme-pack source
// Can't just import due to vite ?inline statements
function getThemeNames(): string[] {
  const themePackIndex = path.join(
    __dirname,
    '../plugins/theme-pack/src/js/src/index.ts'
  );
  const content = fs.readFileSync(themePackIndex, 'utf-8');

  // Extract theme names from the source using regex
  // Handle single-quoted and double-quoted strings separately
  // (double-quoted may contain single quotes like "SynthWave '84")
  const singleQuoteRegex = /name:\s*'([^']+)'/g;
  const doubleQuoteRegex = /name:\s*"([^"]+)"/g;

  const singleMatches = Array.from(
    content.matchAll(singleQuoteRegex),
    m => m[1]
  );
  const doubleMatches = Array.from(
    content.matchAll(doubleQuoteRegex),
    m => m[1]
  );

  const names = [...singleMatches, ...doubleMatches].filter(
    name => name !== 'theme-pack'
  );

  return names;
}

async function fillThemeName(page: Page, themeName: string): Promise<void> {
  const themeNameInput = page.getByLabel('Current Theme');
  await themeNameInput.clear();
  await themeNameInput.fill(themeName);
}

async function takeScreenshot(page: Page, themeName: string): Promise<void> {
  await waitForLoad(page);
  await page.mouse.move(-1, -1); // Move mouse out of the way for screenshot
  await expect(page).toHaveScreenshot(`theme-${themeName}.png`);
}

// Read theme names at module level for parallel test creation
const themeNames = getThemeNames();

test.describe('Theme switching', () => {
  // eslint-disable-next-line no-restricted-syntax
  for (const themeName of themeNames) {
    test(`Theme: ${themeName}`, async ({ page }) => {
      // weird that we require ' do be encoded, but encodeURIComponent doesn't do it
      const encodedTheme = encodeURIComponent(themeName);
      // theme expects a themeKey, which is in the format "pluginName_themeName" url-encoded.
      // for docker builds the pluginName is the full js package name with scope
      await page.goto(
        `/iframe/widget/?name=theme_demo&theme=@deephaven/js-plugin-theme-pack_${encodedTheme}`
      );

      await expect(page.locator(SELECTORS.REACT_PANEL)).toHaveCount(4, {
        timeout: 30000,
      });
      await waitForLoad(page);
      await fillThemeName(page, themeName);
      await takeScreenshot(page, themeName);
    });
  }
});
