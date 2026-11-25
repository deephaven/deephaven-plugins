import { expect, test } from '@playwright/test';
import { gotoPage, openPanel, SELECTORS } from './utils';

test('closing the page during a render cleans up the component', async ({
  page,
  browser,
  browserName,
}, testInfo) => {
  // The slow render blocks every deephaven.ui render on the server, so only run it once
  test.skip(browserName !== 'chromium', 'Server-side behaviour');

  // Server-side state is keyed by run so it isn't shared with other tests
  const runId = `${testInfo.project.name}-${Date.now()}`;

  await gotoPage(page, `?run=${runId}`);
  await openPanel(
    page,
    'ui_render_cleanup',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );

  // The slow render starts right after the first render, close the page while it's running
  await expect(
    page
      .locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE)
      .getByText('Waiting for slow render')
  ).toBeVisible();
  await page.close();

  // Check from a separate context, so it doesn't restore the closed page's layout
  const statusContext = await browser.newContext();
  try {
    const statusPage = await statusContext.newPage();
    await gotoPage(statusPage, `?run=${runId}`);
    await openPanel(
      statusPage,
      'ui_render_cleanup_status',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
    );
    const status = statusPage.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    await expect(status.getByText('Slow render started: True')).toBeVisible();
    await expect(status.getByText('Unmount count: 1')).toBeVisible();
    // Updates queued before the page closed must not run on the unmounted component
    await expect(status.getByText('Updates after unmount: 0')).toBeVisible();

    // The table listener should be removed, so the call count stops changing
    const listenerCalls = status.getByText(/^Listener calls: \d+$/);
    const callsAfterUnmount = await listenerCalls.textContent();
    await statusPage.waitForTimeout(2000);
    await expect(listenerCalls).toHaveText(callsAfterUnmount ?? '');
  } finally {
    await statusContext.close();
  }
});
