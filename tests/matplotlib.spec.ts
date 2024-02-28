import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

test('Matplotlib loads', async ({ page }) => {
  await gotoPage(page, '');
  await openPanel(page, 'matplotlib_fig', '.matplotlib-view');
  await expect(
    page.getByRole('img', { name: 'Matplotlib render' })
  ).toHaveScreenshot('matplotlib_plot.png');
});
