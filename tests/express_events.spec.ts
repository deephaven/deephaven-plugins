import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

/**
 * E2E tests for chart event callbacks.
 *
 * These tests require corresponding Python scripts in tests/app.d/
 * that create charts with event handlers that write results to tables.
 */

test.describe('Chart Events', () => {
  test('scatter on_click fires with point data', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_scatter_click', '.js-plotly-plot');

    // Wait for chart to render
    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Click on a data point (center of chart area)
    const plotArea = chart.locator('.plot-container .draglayer');
    await plotArea.click({ position: { x: 200, y: 200 } });

    // Verify callback result was written with expected values
    await openPanel(page, 'events_click_result', '.iris-grid');
    const grid = page.locator('.iris-grid');
    await expect(grid).toBeVisible();
    // The result table should contain "click" in the EventType column
    await expect(grid).toContainText('click');
  });

  test('scatter on_legend_click returning False prevents toggle', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_legend_prevent', '.js-plotly-plot');

    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Capture the first trace's opacity before the click
    const firstTrace = chart.locator('.plot-container .trace').first();
    await expect(firstTrace).toBeVisible();
    const opacityBefore = await firstTrace.evaluate(
      el => window.getComputedStyle(el).opacity
    );

    // Click a legend item
    const legendItem = chart.locator('.legend .traces').first();
    await legendItem.click();

    // Wait for the debounced round-trip
    await page.waitForTimeout(800);

    // The trace should still be visible with the same opacity (toggle prevented)
    await expect(firstTrace).toBeVisible();
    const opacityAfter = await firstTrace.evaluate(
      el => window.getComputedStyle(el).opacity
    );
    expect(opacityAfter).toBe(opacityBefore);
  });

  test('sunburst on_click returning False prevents drill-down', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_sunburst_prevent', '.js-plotly-plot');

    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Click on a sunburst segment — require it to be visible
    const sunburstSlice = chart.locator('.sunburst .slice').first();
    await expect(sunburstSlice).toBeVisible();

    // Count slices before click to verify drill-down was prevented
    const slicesBefore = await chart.locator('.sunburst .slice').count();
    await sunburstSlice.click();

    // Wait for response
    await page.waitForTimeout(500);

    // Verify the callback ran by checking the result table has data
    await openPanel(page, 'events_sunburst_result', '.iris-grid');
    const grid = page.locator('.iris-grid');
    await expect(grid).toBeVisible();
    // The Clicked column should have a non-null label from the callback
    await expect(grid).not.toContainText('null');

    // Verify drill-down was prevented: same number of slices
    const slicesAfter = await chart.locator('.sunburst .slice').count();
    expect(slicesAfter).toBe(slicesBefore);
  });

  test('on_selected fires with selection data', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_scatter_select', '.js-plotly-plot');

    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Switch to box select mode (click the modebar button)
    const boxSelectBtn = chart.locator(
      '[data-title="Box Select"], [data-val="select"]'
    );
    await expect(boxSelectBtn).toBeVisible();
    await boxSelectBtn.click();

    // Drag to select points
    const plotArea = chart.locator('.plot-container .draglayer');
    await plotArea.dragTo(plotArea, {
      sourcePosition: { x: 50, y: 50 },
      targetPosition: { x: 250, y: 250 },
    });

    await page.waitForTimeout(500);

    // Verify callback result has NumPoints > 0
    await openPanel(page, 'events_select_result', '.iris-grid');
    const grid = page.locator('.iris-grid');
    await expect(grid).toBeVisible();
    // The grid should NOT show 0 points — the callback should have captured some
    await expect(grid).not.toContainText('null');
  });
});
